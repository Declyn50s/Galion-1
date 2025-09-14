import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { fmt } from "../helpers"; // ← export nommé

type Props = {
  resultsCount: number;

  optionsReception: string[];
  optionsPar: string[];

  filtreReception: string;
  setFiltreReception: (v: string) => void;

  filtreVoie: string;
  setFiltreVoie: (v: string) => void;

  filtreMotif: string;
  setFiltreMotif: (v: string) => void;

  filtrePar: string;
  setFiltrePar: (v: string) => void;

  filtreStatut: string;
  setFiltreStatut: (v: string) => void;

  filtrePriorite: string;
  setFiltrePriorite: (v: string) => void;

  searchRaw: string;
  setSearchRaw: (v: string) => void;

  showAllPersons: boolean;
  setShowAllPersons: React.Dispatch<React.SetStateAction<boolean>>;
};

/* Petit wrapper d'UI pour les filtres avec bouton "effacer" */
const FilterWrap: React.FC<{
  label: string;
  active: boolean;
  onClear?: () => void;
  children: React.ReactNode;
}> = ({ label, active, onClear, children }) => (
  <div className="relative">
    <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
      {label}
    </label>
    {children}
    {active && (
      <button
        type="button"
        onClick={onClear}
        className="absolute right-2 top-[34px] -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        aria-label={`Effacer filtre ${label}`}
      >
        ×
      </button>
    )}
  </div>
);

const FiltersBar: React.FC<Props> = ({
  resultsCount,

  optionsReception,
  optionsPar,

  filtreReception,
  setFiltreReception,

  filtreVoie,
  setFiltreVoie,

  filtreMotif,
  setFiltreMotif,

  filtrePar,
  setFiltrePar,

  filtreStatut,
  setFiltreStatut,

  filtrePriorite,
  setFiltrePriorite,

  searchRaw,
  setSearchRaw,

  showAllPersons,
  setShowAllPersons,
}) => {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          <FilterWrap
            label="Réception"
            active={!!filtreReception}
            onClear={() => setFiltreReception("")}
          >
            <select
              className="w-full h-10 rounded border border-gray-300 bg-white dark:bg-neutral-900 p-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
              value={filtreReception}
              onChange={(e) => setFiltreReception(e.target.value)}
            >
              <option value="">Toutes</option>
              {optionsReception.map((iso) => (
                <option key={iso} value={iso}>
                  {fmt(iso)}
                </option>
              ))}
            </select>
          </FilterWrap>

          <FilterWrap
            label="Voie"
            active={filtreVoie !== "Tous"}
            onClear={() => setFiltreVoie("Tous")}
          >
            <select
              className="w-full h-10 rounded border border-gray-300 bg-white dark:bg-neutral-900 p-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
              value={filtreVoie}
              onChange={(e) => setFiltreVoie(e.target.value)}
            >
              {["Tous", "Guichet", "Courrier", "Email", "Jaxform"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </FilterWrap>

          <FilterWrap
            label="Motif"
            active={filtreMotif !== "Tous"}
            onClear={() => setFiltreMotif("Tous")}
          >
            <select
              className="w-full h-10 rounded border border-gray-300 bg-white dark:bg-neutral-900 p-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
              value={filtreMotif}
              onChange={(e) => setFiltreMotif(e.target.value)}
            >
              {[
                "Tous",
                "Inscription",
                "Renouvellement",
                "Mise à jour",
                "Contrôle",
                "Résiliation",
                "Préfecture",
                "Gérance",
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </FilterWrap>

          <FilterWrap
            label="Par"
            active={filtrePar !== "Tous"}
            onClear={() => setFiltrePar("Tous")}
          >
            <select
              className="w-full h-10 rounded border border-gray-300 bg-white dark:bg-neutral-900 p-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
              value={filtrePar}
              onChange={(e) => setFiltrePar(e.target.value)}
            >
              <option value="Tous">Tous</option>
              {optionsPar.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FilterWrap>

          <FilterWrap
            label="Statut"
            active={filtreStatut !== "Tous"}
            onClear={() => setFiltreStatut("Tous")}
          >
            <select
              className="w-full h-10 rounded border border-gray-300 bg-white dark:bg-neutral-900 p-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              {[
                "Tous",
                "À traiter",
                "En traitement",
                "En suspens",
                "Validé",
                "Refusé",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FilterWrap>

          <FilterWrap
            label="Priorité"
            active={filtrePriorite !== "Toutes"}
            onClear={() => setFiltrePriorite("Toutes")}
          >
            <select
              className="w-full h-10 rounded border p-2"
              value={filtrePriorite}
              onChange={(e) => setFiltrePriorite(e.target.value)}
            >
              {["Toutes", "Haute", "Basse"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FilterWrap>

          {/* Recherche + bouton "Afficher personnes" */}
          <div className="sm:col-span-7">
            <div className="flex items-center gap-3">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchRaw}
                  onChange={(e) => setSearchRaw(e.target.value)}
                  placeholder="Rechercher (ID, Nom, Prénom, NSS, N° de dossier, Date de naissance, Observation)"
                  className="w-full h-10 rounded border border-gray-300 bg-white dark:bg-neutral-900 p-2 pl-9 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                  aria-label="Recherche globale"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAllPersons((s) => !s)}
                className="h-10 whitespace-nowrap rounded border border-gray-300 bg-white dark:bg-neutral-900 px-3 text-sm hover:bg-gray-50 dark:hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                title={
                  showAllPersons
                    ? "Masquer les personnes de tous les dossiers"
                    : "Afficher les personnes de tous les dossiers"
                }
              >
                {showAllPersons ? "Masquer personnes" : "Afficher personnes"}
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {resultsCount} résultat{resultsCount > 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FiltersBar;
