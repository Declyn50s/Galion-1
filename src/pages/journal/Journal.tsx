// src/pages/journal/Journal.tsx
import React, { useEffect, useMemo, useState, useTransition } from "react";
import { LogIn, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

import NewEntryModal, {
  mockSaveEntry,
  mockSearchUserByNSS,
} from "@/components/NewEntryModal";

import { useJournalStore, type Tache } from "@/features/journal/store";

import FiltersBar from "./components/FiltersBar";
import DesktopTable from "./components/DesktopTable";
import MobileCards from "./components/MobileCards";
import { fmt, initials3, statutBadgeClass, tagBadgeClass } from "./helpers";
import { traiterTache } from "./actions";

/* ---------------- Types tri ---------------- */
export type SortKey = "id" | "reception" | "statut" | "priorite";
export type SortDir = "asc" | "desc";

/* ---------------- Changelog ---------------- */
type ChangeItem = {
  field: string;
  before: any;
  after: any;
};
type ChangeEntry = {
  at: string; // ISO
  items: ChangeItem[];
};
type ChangeLog = Record<string, ChangeEntry[]>; // key = taskId

const statutOrder: Tache["statut"][] = [
  "À traiter",
  "En traitement",
  "En suspens",
  "Validé",
  "Refusé",
];
const prioriteOrder: Tache["priorite"][] = ["Haute", "Basse"];

/* ======================= Modale “Consulter” ======================= */
function ConsultModal({
  open,
  onClose,
  task,
  changes = [],
}: {
  open: boolean;
  onClose: () => void;
  task?: Tache | null;
  changes?: ChangeEntry[];
}) {
  if (!open || !task) return null;
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-medium">
            Consulter — <span className="font-mono">{task.id}</span>
          </div>
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* État courant */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statutBadgeClass(task.statut)}>{task.statut}</Badge>
                <span className="text-sm text-gray-600">
                  Réception: {fmt(task.reception)} • Par: {initials3(task.par)}
                </span>
              </div>
              <div className="text-sm text-gray-800">
                <div>Voie : {task.voie}</div>
                <div>Motif : {task.motif}</div>
                {task.observation && (
                  <div className="mt-1">
                    <span className="text-gray-500 mr-1">Observation :</span>
                    {task.observation}
                  </div>
                )}
                {!!task.observationTags?.length && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {task.observationTags.map((tag) => (
                      <Badge key={tag} className={tagBadgeClass(tag)}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {!!task.utilisateurs?.length && (
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  {task.utilisateurs.map((u, i) => (
                    <div key={i}>
                      {`${u.titre} ${u.nom.toUpperCase()} ${u.prenom}, né(e) le ${fmt(
                        u.dateNaissance
                      )}, ${u.adresse}, ${u.npa} ${u.ville}`}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historique des modifications */}
          <Card>
            <CardContent className="p-4">
              <div className="font-medium mb-2">Historique des modifications</div>
              {changes.length === 0 ? (
                <div className="text-sm text-gray-500">Aucune modification enregistrée pour cette entrée.</div>
              ) : (
                <div className="space-y-3">
                  {[...changes]
                    .sort((a, b) => a.at.localeCompare(b.at))
                    .map((entry, idx) => (
                      <div key={idx} className="rounded border p-2 text-sm">
                        <div className="text-gray-500 mb-1">
                          {new Date(entry.at).toLocaleString("fr-CH")}
                        </div>
                        <ul className="space-y-1">
                          {entry.items.map((it, i2) => (
                            <li key={i2}>
                              <span className="font-mono">{it.field}</span>{" "}
                              : <span className="line-through text-gray-500">{String(it.before ?? "—")}</span>{" "}
                              → <span className="font-medium">{String(it.after ?? "—")}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="px-4 py-3 border-t flex justify-end">
          <button className="rounded border px-3 py-1 text-sm hover:bg-gray-50" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================= Page Journal ======================= */
const JournalPage: React.FC = () => {
  const navigate = useNavigate();

  /* ---------------- Store ---------------- */
  const tasks = useJournalStore((s) => s.tasks);

  /* ---------------- UI state ---------------- */
  const [openNew, setOpenNew] = useState(false);

  // Filtres
  const [filtreReception, setFiltreReception] = useState<string>("");
  const [filtreVoie, setFiltreVoie] = useState<string>("Tous");
  const [filtreMotif, setFiltreMotif] = useState<string>("Tous");
  const [filtrePar, setFiltrePar] = useState<string>("Tous");
  const [filtreStatut, setFiltreStatut] = useState<string>("Tous");
  const [filtrePriorite, setFiltrePriorite] = useState<string>("Toutes");

  // Recherche (debounced)
  const [searchRaw, setSearchRaw] = useState("");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Ouverture des lignes (table + mobile)
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  const [showAllPersons, setShowAllPersons] = useState(false);

  // Tri
  const [sortKey, setSortKey] = useState<SortKey>("reception");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Consult modal
  const [consultTaskId, setConsultTaskId] = useState<string | null>(null);
  const consultTask = useMemo(
    () => tasks.find((t) => t.id === consultTaskId) || null,
    [tasks, consultTaskId]
  );

  // ChangeLog local par taskId
  const [changeLog, setChangeLog] = useState<ChangeLog>({});

  /* ---------------- Debounce recherche ---------------- */
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      startTransition(() => setSearch(searchRaw));
      const timer = setTimeout(() => setShowSkeleton(true), 200);
      Promise.resolve().then(() => {
        const elapsed = performance.now() - start;
        if (elapsed < 200) {
          clearTimeout(timer);
          setShowSkeleton(false);
        }
      });
    }, 300);
    return () => clearTimeout(t);
  }, [searchRaw, startTransition]);

  /* ---------------- Écoute des publications/patch/suppressions ---------------- */
  useEffect(() => {
    const onAdd = (e: Event) => {
      const { detail } = e as CustomEvent<Tache>;
      const t = detail as Tache;
      const addTask = (useJournalStore.getState() as any).addTask;
      if (typeof addTask === "function") addTask(t);
      setOpenRows((prev) => ({ ...prev, [t.id]: true }));
      // On peut créer une entrée "création"
      setChangeLog((prev) => ({
        ...prev,
        [t.id]: [
          ...(prev[t.id] ?? []),
          { at: new Date().toISOString(), items: [{ field: "création", before: "", after: "ajoutée" }] },
        ],
      }));
    };

    const onPatch = (e: Event) => {
      const { id, patch } = (e as CustomEvent<{ id: string; patch: Partial<Tache> }>).detail;

      // 1) Capturer valeurs "before"
      const st: any = useJournalStore.getState();
      const beforeTask: Tache | undefined = (st.tasks ?? []).find((tt: Tache) => tt.id === id);

      // 2) Appliquer patch via store (avec fallback)
      if (typeof st.patchTask === "function") {
        st.patchTask(id, patch);
      } else if (typeof st.updateTask === "function") {
        st.updateTask(id, patch);
      } else if (typeof st.setTasks === "function") {
        const next = (st.tasks ?? []).map((t: Tache) => (t.id === id ? { ...t, ...patch } : t));
        st.setTasks(next);
      }

      // 3) Logger le diff
      if (beforeTask) {
        const items: ChangeItem[] = Object.keys(patch).map((k) => {
          const key = k as keyof Tache;
          return {
            field: key as string,
            before: (beforeTask as any)[key],
            after: (patch as any)[key],
          };
        });
        setChangeLog((prev) => ({
          ...prev,
          [id]: [...(prev[id] ?? []), { at: new Date().toISOString(), items }],
        }));
      }
    };

    const onRemove = (e: Event) => {
      const { id } = (e as CustomEvent<{ id: string }>).detail;
      const st: any = useJournalStore.getState();
      if (typeof st.removeTask === "function") {
        st.removeTask(id);
      } else if (typeof st.setTasks === "function") {
        const next = (st.tasks ?? []).filter((t: Tache) => t.id !== id);
        st.setTasks(next);
      }
      setChangeLog((prev) => ({
        ...prev,
        [id]: [...(prev[id] ?? []), { at: new Date().toISOString(), items: [{ field: "suppression", before: "", after: "supprimée" }] }],
      }));
    };

    window.addEventListener("journal:add", onAdd as EventListener);
    window.addEventListener("journal:patch", onPatch as EventListener);
    window.addEventListener("journal:remove", onRemove as EventListener);
    return () => {
      window.removeEventListener("journal:add", onAdd as EventListener);
      window.removeEventListener("journal:patch", onPatch as EventListener);
      window.removeEventListener("journal:remove", onRemove as EventListener);
    };
  }, []);

  /* ---------------- Options dynamiques ---------------- */
  const optionsReception = useMemo(() => {
    const set = new Set(tasks.map((d) => d.reception));
    return Array.from(set).sort((a, b) => (a < b ? -1 : 1));
  }, [tasks]);

  const optionsPar = useMemo(() => {
    const set = new Set(tasks.map((d) => initials3(d.par)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  /* ---------------- Filtrage + recherche ---------------- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filtreReception && t.reception !== filtreReception) return false;
      if (filtreVoie !== "Tous" && t.voie !== filtreVoie) return false;
      if (filtreMotif !== "Tous" && t.motif !== filtreMotif) return false;
      if (filtrePar !== "Tous" && initials3(t.par) !== filtrePar) return false;
      if (filtreStatut !== "Tous" && t.statut !== filtreStatut) return false;
      if (filtrePriorite !== "Toutes" && t.priorite !== (filtrePriorite as any)) return false;

      if (!q) return true;
      const hay = [
        t.id,
        t.dossier,
        t.nss,
        t.observation,
        ...(t.observationTags ?? []),
        ...t.utilisateurs.map((u) => `${u.nom} ${u.prenom} ${fmt(u.dateNaissance)}`),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [
    search,
    filtreReception,
    filtreVoie,
    filtreMotif,
    filtrePar,
    filtreStatut,
    filtrePriorite,
    tasks,
  ]);

  /* ---------------- Tri ---------------- */
  const results = useMemo(() => {
    const arr = [...filtered];
    const factor = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "id":
          return factor * a.id.localeCompare(b.id);
        case "reception":
          return factor * a.reception.localeCompare(b.reception);
        case "statut":
          return factor * (statutOrder.indexOf(a.statut) - statutOrder.indexOf(b.statut));
        case "priorite":
          return factor * (prioriteOrder.indexOf(a.priorite) - prioriteOrder.indexOf(b.priorite));
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const onToggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  /* ---------------- Actions ---------------- */
  const onTreat = async (t: Tache) => {
    try {
      await traiterTache(t, {
        navigate,
        setOpenForId: (id: string) => setOpenRows((prev) => ({ ...prev, [id]: true })),
      });
    } catch (e) {
      console.error("❌ Échec du traitement:", e);
      alert("Le traitement a échoué. Voir la console.");
    }
  };

  const onConsult = (t: Tache) => {
    setConsultTaskId(t.id);
  };

  /* ---------------- Rendu ---------------- */
  return (
    <div className="max-w-[1280px] mx-auto p-6 space-y-4">
      {/* CTA principal */}
      <div className="flex justify-center">
        <button
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-white shadow hover:scale-[1.01] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
          aria-label="Créer une nouvelle entrée"
          onClick={() => setOpenNew(true)}
        >
          <LogIn className="h-4 w-4" /> Entrée
        </button>
      </div>

      {/* Filtres + recherche */}
      <Card>
        <CardContent className="p-4">
          <FiltersBar
            resultsCount={results.length}
            searchRaw={searchRaw}
            setSearchRaw={setSearchRaw}
            showAllPersons={showAllPersons}
            setShowAllPersons={setShowAllPersons}
            filtreReception={filtreReception}
            setFiltreReception={setFiltreReception}
            filtreVoie={filtreVoie}
            setFiltreVoie={setFiltreVoie}
            filtreMotif={filtreMotif}
            setFiltreMotif={setFiltreMotif}
            filtrePar={filtrePar}
            setFiltrePar={setFiltrePar}
            filtreStatut={filtreStatut}
            setFiltreStatut={setFiltreStatut}
            filtrePriorite={filtrePriorite}
            setFiltrePriorite={setFiltrePriorite}
            optionsReception={optionsReception}
            optionsPar={optionsPar}
          />
        </CardContent>
      </Card>

      {/* Loader si calcul long */}
      {isPending && showSkeleton && (
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-1/3 bg-gray-200 rounded" />
          <div className="h-24 w-full bg-gray-200 rounded" />
        </div>
      )}

      {/* Table desktop */}
      <DesktopTable
        results={results}
        openRows={openRows}
        setOpenRows={setOpenRows}
        showAllPersons={showAllPersons}
        sortKey={sortKey}
        sortDir={sortDir}
        onToggleSort={onToggleSort}
        onTreat={onTreat}
        onConsult={onConsult} // ✅ branchement
      />

      {/* Mobile cards */}
      <div className="md:hidden">
        <MobileCards
          results={results}
          openRows={openRows}
          setOpenRows={setOpenRows}
          showAllPersons={showAllPersons}
          onTreat={onTreat}
          onConsult={onConsult} // ✅ branchement
        />
      </div>

      {/* Modale Nouvelle entrée (publication via onSaved) */}
      <NewEntryModal
        open={openNew}
        onOpenChange={setOpenNew}
        searchUserByNSS={mockSearchUserByNSS}
        saveEntry={mockSaveEntry}
        agentInitials="DBO"
        onSaved={(tache) => {
          const addTask = (useJournalStore.getState() as any).addTask;
          if (typeof addTask === "function") {
            addTask(tache);
          }
          setOpenRows((prev) => ({ ...prev, [tache.id]: true }));
        }}
      />

      {/* 🔍 Modale Consulter */}
      <ConsultModal
        open={!!consultTaskId}
        onClose={() => setConsultTaskId(null)}
        task={consultTask || undefined}
        changes={consultTaskId ? changeLog[consultTaskId] ?? [] : []}
      />
    </div>
  );
};

export default JournalPage;
