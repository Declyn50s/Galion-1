//src/components/entry/EntryResultsList.tsx
import React from "react";
import type { Utilisateur } from "./types";

type Props = {
  visible: boolean;
  results: Utilisateur[];
  onPick: (u: Utilisateur) => void;
};

const EntryResultsList: React.FC<Props> = ({ visible, results, onPick }) => {
  if (!visible || results.length === 0) return null;
  return (
    <div className="mt-3 rounded-md border p-3 bg-slate-50 dark:bg-neutral-800">
      <div className="text-xs font-medium mb-2">Personnes trouvées :</div>
      <div className="space-y-2">
        {results.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-2 bg-white dark:bg-neutral-900 rounded border px-2 py-2"
          >
            <div className="text-sm">
              <span className="font-medium">
                {p.nom.toUpperCase()} {p.prenom}
              </span>{" "}
              — {p.dateNaissance} • {p.adresse}, {p.npa} {p.ville}
            </div>
            <button
              type="button"
              onClick={() => onPick(p)}
              className="h-8 px-2 rounded border text-xs"
            >
              Reprendre
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EntryResultsList;
