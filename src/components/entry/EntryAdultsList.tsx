//src/components/entry/EntryAdultsList.tsx
import React from "react";
import type { UIUser } from "./types";
import { normalizeIsoDate } from "./utils";

type Props = {
  people: UIUser[];
  onUpdate: (index: number, patch: Partial<UIUser>) => void;
  onRemove: (index: number) => void;
};

const EntryAdultsList: React.FC<Props> = ({ people, onUpdate, onRemove }) => {
  if (people.length === 0) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Aucun adulte. Utilise la barre ci-dessus pour rechercher/ajouter.
      </div>
    );
  }

  return (
    <>
      {people.map((p, i) => (
        <div key={`${p.nom}|${p.prenom}|${p.dateNaissance}`} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 grid md:grid-cols-6 gap-2 items-center">
          <select
            className="border px-2 h-9 rounded text-sm"
            value={p.titre}
            onChange={(e) => onUpdate(i, { titre: e.target.value as "M." | "Mme" })}
            aria-label="Sexe"
          >
            <option value="M.">♂️ M</option>
            <option value="Mme">♀️ F</option>
          </select>

          <input
            className="border px-2 h-9 rounded text-sm"
            placeholder="NOM"
            value={p.nom}
            onChange={(e) => onUpdate(i, { nom: e.target.value.toUpperCase() })}
          />
          <input
            className="border px-2 h-9 rounded text-sm"
            placeholder="Prénom"
            value={p.prenom}
            onChange={(e) => onUpdate(i, { prenom: e.target.value })}
          />
          <input
            type="date"
            className="border px-2 h-9 rounded text-sm"
            value={p.dateNaissance}
            onChange={(e) => onUpdate(i, { dateNaissance: normalizeIsoDate(e.target.value) })}
            title="YYYY-MM-DD"
          />
          <input
            className="border px-2 h-9 rounded text-sm"
            placeholder="Email (optionnel)"
            value={p.email || ""}
            onChange={(e) => onUpdate(i, { email: e.target.value })}
          />
          <label className="inline-flex items-center gap-2 justify-center">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!p.curateur}
              onChange={(e) => onUpdate(i, { curateur: e.target.checked })}
            />
            <span className="text-xs">Curateur</span>
          </label>

          <div className="md:col-span-6 flex justify-end">
            <button className="text-lg" onClick={() => onRemove(i)} title="Supprimer">
              ❌
            </button>
          </div>
        </div>
      ))}
    </>
  );
};

export default EntryAdultsList;
