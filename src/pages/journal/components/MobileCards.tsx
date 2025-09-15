// src/pages/journal/components/MobileCards.tsx
import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
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

type Props = {
  results?: Tache[]; // peut être undefined
  openRows: Record<string, boolean>;
  setOpenRows: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  showAllPersons: boolean;

  // Actions
  onTreat?: (t: Tache) => void;
  onConsult?: (t: Tache) => void;
};

const MobileCards: React.FC<Props> = ({
  results = [], // fallback pour éviter .map sur undefined
  openRows,
  setOpenRows,
  showAllPersons,
  onTreat = () => {}, // no-op
  onConsult = () => {}, // no-op
}) => {
  const toggleRow = (id: string) =>
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const isRowOpen = (id: string) => showAllPersons || !!openRows[id];

  return (
    <div className="space-y-3">
      {results.map((t) => (
        <Card key={t.id} className="overflow-hidden">
          {/* Header cliquable pour plier/déplier */}
          <button
            type="button"
            className="w-full text-left px-3 py-2 flex items-center gap-2 border-b"
            onClick={() => toggleRow(t.id)}
            aria-expanded={isRowOpen(t.id)}
          >
            {isRowOpen(t.id) ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            <span className="font-mono underline">{t.id}</span>

            <span className="ml-auto inline-flex items-center gap-2">
              <Badge className={statutBadgeClass(t.statut)}>{t.statut}</Badge>
              <span
                className={`inline-block h-3 w-3 rounded-full ${priorityDot(
                  t.priorite
                )}`}
                aria-label={`Priorité ${t.priorite}`}
              />
            </span>
          </button>

          <CardContent className="p-3 space-y-3">
            {/* Ligne infos principales */}
            <div className="text-xs text-gray-600 dark:text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
              <span>
                <span className="font-medium">Réception :</span> {fmt(t.reception)}
              </span>
              <span>
                <span className="font-medium">Voie :</span> {t.voie}
              </span>
              <span>
                <span className="font-medium">Motif :</span> {t.motif}
              </span>
              <span>
                <span className="font-medium">Par :</span> {initials3(t.par)}
              </span>
            </div>

            {/* Observation + tags */}
            {(t.observation || (t.observationTags?.length ?? 0) > 0) && (
              <div className="space-y-1">
                {t.observation && (
                  <div className="text-sm">{t.observation}</div>
                )}
                {!!t.observationTags?.length && (
                  <div className="flex flex-wrap gap-1">
                    {t.observationTags.map((tag) => (
                      <Badge key={tag} className={tagBadgeClass(tag)}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                className="underline"
                title="Consulter"
                onClick={(e) => {
                  e.stopPropagation();
                  onConsult(t);
                }}
              >
                Consulter
              </button>
              <button
                className="underline"
                title="Traiter"
                onClick={(e) => {
                  e.stopPropagation();
                  onTreat(t);
                }}
              >
                Traiter
              </button>
            </div>

            {/* Détail personnes rattachées */}
            {isRowOpen(t.id) && (
              <div className="pt-2 border-t">
                <ul className="italic text-sm space-y-1">
                  {[...(t.utilisateurs ?? [])].sort(byOldest).map((u, idx) => (
                    <li key={idx}>
                      {`${u.titre} ${u.nom.toUpperCase()} ${u.prenom}, né(e) le ${fmt(
                        u.dateNaissance
                      )}, ${u.adresse}, ${u.npa} ${u.ville}, ${u.nbPers} pers., ${
                        u.nbEnf
                      } enf.`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {results.length === 0 && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 py-6">
          Aucun résultat. Ajuste les filtres ou vide la recherche.
        </div>
      )}
    </div>
  );
};

export default MobileCards;
