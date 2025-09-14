import React from "react";
import type { Tache } from "@/features/journal/store";
import { Badge } from "@/components/ui/badge";
import { statutBadgeClass, fmt, initials3, tagBadgeClass } from "../helpers";

type Props = {
  results?: Tache[];
  openRows: Record<string, boolean>;
  setOpenRows: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  showAllPersons: boolean;
  onTreat?: (t: Tache) => void;
  onConsult?: (t: Tache) => void;
};

const MobileCards: React.FC<Props> = ({
  results = [],
  openRows,
  setOpenRows,
  showAllPersons,
  onTreat = () => {},
  onConsult = () => {},
}) => {
  const toggle = (id: string) =>
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));
  const isOpen = (id: string) => showAllPersons || !!openRows[id];

  return (
    <div className="space-y-3">
      {results.map((t) => (
        <div key={t.id} className="rounded border p-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="font-mono text-sm">{t.id}</div>
            <Badge className={statutBadgeClass(t.statut)}>{t.statut}</Badge>
          </div>

          <div className="mt-2 text-sm text-gray-700">
            <div>Réception : {fmt(t.reception)}</div>
            <div>Voie : {t.voie}</div>
            <div>Motif : {t.motif}</div>
            <div>Par : {initials3(t.par)}</div>
          </div>

          {t.observation && (
            <div className="mt-2 text-sm text-gray-700">{t.observation}</div>
          )}

          {!!t.observationTags?.length && (
            <div className="mt-1 flex flex-wrap gap-1">
              {t.observationTags.map((tag) => (
                <Badge key={tag} className={tagBadgeClass(tag)}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {isOpen(t.id) && t.utilisateurs?.length ? (
            <div className="mt-2 text-xs italic text-gray-600 space-y-1">
              {t.utilisateurs.map((u, i) => (
                <div key={i}>
                  {`${u.titre} ${u.nom.toUpperCase()} ${u.prenom}, né(e) le ${fmt(
                    u.dateNaissance
                  )}, ${u.adresse}, ${u.npa} ${u.ville}`}
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex gap-3">
            {(() => {
              if (t.statut === "Validé") return ["🔄", "🔍"] as const;
              if (t.statut === "En traitement") return ["✏️", "🔍"] as const;
              return ["✏️", "↪️", "🔍"] as const;
            })().map((a) => (
              <button
                key={a}
                className="underline text-sm"
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
                onClick={() => {
                  if (a === "✏️") onTreat(t);
                  else if (a === "🔍") onConsult(t);
                  else console.log(a, t.id);
                }}
              >
                {a}
              </button>
            ))}
            <button
              className="ml-auto text-xs text-gray-600 underline"
              onClick={() => toggle(t.id)}
            >
              {isOpen(t.id) ? "Masquer" : "Voir personnes"}
            </button>
          </div>
        </div>
      ))}

      {results.length === 0 && (
        <div className="text-center text-sm text-gray-600">
          Aucun résultat. Ajuste les filtres ou vide la recherche.
        </div>
      )}
    </div>
  );
};

export default MobileCards;
