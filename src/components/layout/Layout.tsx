import React, { useEffect, useMemo, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SearchResult } from "@/types/search";
import { navigationSections } from "@/types/navigation";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { isAdresseInImmeubles } from "@/data/immeubles";

// --- helpers slug/display ---
function slugToDisplayName(id?: string) {
  if (!id) return "";
  const s = decodeURIComponent(id);
  const parts = s.split("-").filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[0]?.toUpperCase?.() ?? parts[0];
    const first =
      parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : "";
    return `${last} ${first}`.trim();
  }
  return s;
}

function makeUserId(p: {
  nom: string;
  prenom: string;
  dateNaissance: string;
}) {
  const slug = `${p.nom}-${p.prenom}-${p.dateNaissance}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-\.]/g, "");
  return slug;
}

export const Layout: React.FC = () => {
  const location = useLocation();

  // aplatis navigation
  const allItems = useMemo(() => navigationSections.flatMap((s) => s.items), []);

  // item actif
  const activeItem = useMemo(() => {
    const pathname = location.pathname;
    const sorted = [...allItems].sort((a, b) => b.path.length - a.path.length);
    return sorted.find(
      (i) => pathname === i.path || pathname.startsWith(i.path + "/")
    );
  }, [location.pathname, allItems]);

  const handleSearchResultSelect = (result: SearchResult) => {
    console.log("Selected search result:", result);
  };

  const getPageTitle = (): string => activeItem?.label || "Page non trouvée";

  const getPageDescription = (): string => {
    const descriptions: Record<string, string> = {
      dashboard: "Vue d'ensemble de l'activité et des indicateurs clés",
      tasks: "Gestion des tâches et suivi des actions à effectuer",
      users: "Gestion des usagers et de leurs dossiers",
      journal: "Historique des actions et événements",
      housing: "Gestion du parc de logements disponibles",
      leases: "Gestion des contrats de bail et locations",
      calendar: "Planification et suivi des rendez-vous",
      reports: "Analyses et rapports statistiques",
      settings: "Configuration système et gestion des utilisateurs",
      session: "Gestion des séances et décisions",
      tenants: "Gestion des dossiers locataires",
    };
    return descriptions[activeItem?.id ?? ""] || "Section non configurée";
  };

  // contexte usager courant
  const isUserView = location.pathname.startsWith("/users/");
  const isTenantView = location.pathname.startsWith("/tenants/");
  const userId = useMemo(() => {
    const segs = location.pathname.split("/").filter(Boolean);
    return segs.length >= 2 ? segs[1] : undefined;
  }, [location.pathname]);
  const displayName = slugToDisplayName(userId);

  // --- Garde-fous d’affichage Locataire : on ne montre le lien “Locataire”
  //     que si la personne est réellement locataire (immeuble LLM).
  const [canShowTenant, setCanShowTenant] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    // On ne calcule que sur les vues /users/:id ou /tenants/:id
    if (!(isUserView || isTenantView) || !userId) {
      if (mounted) setCanShowTenant(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/people.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Array<any> = await res.json();

        // retrouve l’entrée par le même slug que UsersPage
        const match = data.find((p) => makeUserId(p) === userId);
        if (!match) {
          if (mounted) setCanShowTenant(false);
          return;
        }
        const llm = isAdresseInImmeubles(match.adresse);
        if (mounted) setCanShowTenant(!!llm);
      } catch (e) {
        if (mounted) setCanShowTenant(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isUserView, isTenantView, userId]);

  // sous-rubriques (exemples)
  const subHousingMap: Record<string, string> = {
    lup: "LUP",
    "llm-vacant": "Liste des LLM vacants",
    gerances: "Liste des gérances",
    immeubles: "Liste des immeubles",
  };
  const subSessionMap: Record<string, string> = {
    equipe: "Séance d'équipe",
    recours: "Recours / réclamation",
    derogation: "Dérogation",
  };
  const seg2 = location.pathname.split("/")[2];
  const subCrumb =
    location.pathname.startsWith("/housing")
      ? subHousingMap[seg2]
      : location.pathname.startsWith("/session")
      ? subSessionMap[seg2]
      : undefined;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <Header onSearchResultSelect={handleSearchResultSelect} />

      <div className="ml-64 pt-16">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-[calc(100vh-4rem)]">
          {/* Header de contenu */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {getPageTitle()}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {getPageDescription()}
                </p>
              </div>
            </div>
          </div>

          {/* Fil d’Ariane */}
          <div className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-6 py-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {getPageTitle()}
              </span>

              {(isUserView || isTenantView) && userId && (
                <>
                  <span className="mx-1">›</span>
                  {/* Demandeur : toujours navigable */}
                  <Link
                    to={`/users/${encodeURIComponent(userId)}`}
                    className={`hover:underline ${
                      isUserView ? "font-semibold text-slate-900 dark:text-slate-100" : ""
                    }`}
                  >
                    Demandeur
                  </Link>

                  {/* Locataire : UNIQUEMENT si la personne est locataire (LLM) */}
                  {canShowTenant && (
                    <>
                      <span className="mx-1">|</span>
                      <Link
                        to={`/tenants/${encodeURIComponent(userId)}`}
                        className={`hover:underline ${
                          isTenantView ? "font-semibold text-slate-900 dark:text-slate-100" : ""
                        }`}
                      >
                        Locataire
                      </Link>
                    </>
                  )}

                  {displayName && (
                    <>
                      <span className="mx-1">›</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {displayName}
                      </span>
                    </>
                  )}
                </>
              )}

              {subCrumb && (
                <>
                  <span className="mx-1">›</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {subCrumb}
                  </span>
                </>
              )}
            </div>
          </div>

          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>

      <Toaster />
    </div>
  );
};
