import React from "react";
import { ChevronDown, ChevronRight, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tache } from "@/features/journal/store";
import {
  fmt,
  initials3,
  statutBadgeClass,
  tagBadgeClass,
  priorityDot,
  byOldest,
} from "../helpers";

/* ---------- Types tri ---------- */
export type SortKey = "id" | "reception" | "statut" | "priorite";
export type SortDir = "asc" | "desc";

/* ---------- Largeurs colonnes ---------- */
const INITIAL_WIDTHS = {
  id: 180,
  reception: 120,
  motif: 160,
  voie: 160,
  par: 100,
  statut: 140,
  observation: 360,
  priorite: 100,
  actions: 180,
};

/* ---------- Props ---------- */
type Props = {
  results?: Tache[];
  openRows: Record<string, boolean>;
  setOpenRows: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  showAllPersons: boolean;

  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;

  onTreat?: (t: Tache) => void;
  onConsult?: (t: Tache) => void;
};

/* ---------- <th> triable ---------- */
function ThResizable({
  label,
  sortActive,
  sortDir,
  onSort,
}: {
  label: string;
  sortActive?: boolean;
  sortDir?: "asc" | "desc";
  onSort?: () => void;
}) {
  return (
    <th className="p-0 relative select-none group border-transparent">
      <div className="p-3 flex items-center gap-1 uppercase text-xs text-gray-600 dark:text-gray-400">
        {onSort ? (
          <button
            type="button"
            onClick={onSort}
            aria-sort={
              sortActive ? (sortDir === "asc" ? "ascending" : "descending") : "none"
            }
            className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-200"
          >
            {label}
            <ArrowUpDown
              className={`h-3.5 w-3.5 ${sortActive ? "opacity-100" : "opacity-40"}`}
            />
          </button>
        ) : (
          <span>{label}</span>
        )}
      </div>
    </th>
  );
}

/* ---------- Composant ---------- */
const DesktopTable: React.FC<Props> = ({
  results = [],
  openRows,
  setOpenRows,
  showAllPersons,
  sortKey,
  sortDir,
  onToggleSort,
  onTreat = () => {},
  onConsult = () => {},
}) => {
  const toggleRow = (id: string) =>
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));
  const isRowOpen = (id: string) => showAllPersons || !!openRows[id];

  return (
    <Card className="hidden md:block">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm text-left">
            <colgroup>
              <col style={{ width: INITIAL_WIDTHS.id }} />
              <col style={{ width: INITIAL_WIDTHS.reception }} />
              <col style={{ width: INITIAL_WIDTHS.voie }} />
              <col style={{ width: INITIAL_WIDTHS.motif }} />
              <col style={{ width: INITIAL_WIDTHS.par }} />
              <col style={{ width: INITIAL_WIDTHS.statut }} />
              <col style={{ width: INITIAL_WIDTHS.observation }} />
              <col style={{ width: INITIAL_WIDTHS.priorite }} />
              <col style={{ width: INITIAL_WIDTHS.actions }} />
            </colgroup>

            <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-neutral-900 uppercase text-xs text-gray-600 dark:text-gray-400">
              <tr>
                <ThResizable
                  label="ID"
                  sortActive={sortKey === "id"}
                  sortDir={sortDir}
                  onSort={() => onToggleSort("id")}
                />
                <ThResizable
                  label="Réception"
                  sortActive={sortKey === "reception"}
                  sortDir={sortDir}
                  onSort={() => onToggleSort("reception")}
                />
                <ThResizable label="Voie" />
                <ThResizable label="Motif" />
                <ThResizable label="Par" />
                <ThResizable
                  label="Statut"
                  sortActive={sortKey === "statut"}
                  sortDir={sortDir}
                  onSort={() => onToggleSort("statut")}
                />
                <ThResizable label="Observation" />
                <ThResizable
                  label="📊"
                  sortActive={sortKey === "priorite"}
                  sortDir={sortDir}
                  onSort={() => onToggleSort("priorite")}
                />
                <ThResizable label="Actions" />
              </tr>
            </thead>

            <tbody>
              {results.map((t) => (
                <React.Fragment key={t.id}>
                  <tr
                    className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 transition-colors"
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleRow(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleRow(t.id);
                      }
                    }}
                    aria-expanded={isRowOpen(t.id)}
                  >
                    <td className="p-3 align-top max-w-0">
                      <div className="flex items-center gap-2 truncate">
                        {isRowOpen(t.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="underline truncate">{t.id}</span>
                        {t.llm && (
                          <span
                            className="ml-1 inline-block h-3 w-3 rounded-full bg-green-500"
                            aria-label="LLM actif"
                            title="LLM activé"
                          />
                        )}
                      </div>
                    </td>
                    <td className="p-3 align-top">{fmt(t.reception)}</td>
                    <td className="p-3 align-top">{t.voie}</td>
                    <td className="p-3 align-top">{t.motif}</td>
                    <td className="p-3 align-top">{initials3(t.par)}</td>
                    <td className="p-3 align-top">
                      <Badge className={statutBadgeClass(t.statut)}>{t.statut}</Badge>
                    </td>
                    <td className="p-3 align-top max-w-[36ch]">
                      <div className="truncate" title={t.observation}>
                        {t.observation}
                      </div>
                      {!!t.observationTags?.length && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {t.observationTags.map((tag) => (
                            <Badge key={tag} className={tagBadgeClass(tag)}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3 align-top">
                      <span
                        className={`inline-block h-3 w-3 rounded-full ${priorityDot(
                          t.priorite
                        )}`}
                        aria-label={`Priorité ${t.priorite}`}
                      />
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex gap-3">
                        {(() => {
                          // ✅ Actions autorisées par statut
                          if (t.statut === "Validé") return ["🔄", "🔍"] as const;
                          // Pour "En traitement" on laisse ✏️ (Traiter) et 🔍 (Consulter)
                          if (t.statut === "En traitement")
                            return ["✏️", "🔍"] as const;
                          // Sinon (À traiter, En suspens, Refusé) : ✏️ et ↪️ + 🔍 si besoin
                          return ["✏️", "↪️", "🔍"] as const;
                        })().map((a) => (
                          <button
                            key={a}
                            className="underline text-gray-900 dark:text-gray-100 hover:opacity-90"
                            title={
                              a === "🔍"
                                ? "Consulter"
                                : a === "🔄"
                                ? "Reprendre"
                                : a === "✏️"
                                ? "Traiter"
                                : a === "↪️"
                                ? "Transférer"
                                : ""
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              if (a === "✏️") onTreat(t);
                              else if (a === "🔍") onConsult(t);
                              else console.log(a, t.id);
                            }}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>

                  {isRowOpen(t.id) && (
                    <tr className="bg-gray-50 dark:bg-white/5">
                      <td colSpan={9} className="p-3">
                        <ul className="italic text-sm space-y-1">
                          {[...(t.utilisateurs ?? [])]
                            .sort(byOldest)
                            .map((u, idx) => (
                              <li key={idx}>
                                {`${u.titre} ${u.nom.toUpperCase()} ${u.prenom}, né(e) le ${fmt(
                                  u.dateNaissance
                                )}, ${u.adresse}, ${u.npa} ${u.ville}, ${u.nbPers} pers., ${
                                  u.nbEnf
                                } enf.`}
                              </li>
                            ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {results.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="p-8 text-center text-sm text-gray-600 dark:text-gray-400"
                  >
                    Aucun résultat. Ajuste les filtres ou vide la recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DesktopTable;
