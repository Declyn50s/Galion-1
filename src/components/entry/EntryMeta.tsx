//src/components/entry/EntryMeta.tsx
import React from "react";
import type { Tache } from "./types";

type Props = {
  reception: string;
  setReception: (v: string) => void;
  voie: Tache["voie"];
  setVoie: (v: Tache["voie"]) => void;
  motif: Tache["motif"];
  setMotif: (v: Tache["motif"]) => void;
  prioritaire: boolean;
  setPrioritaire: (v: boolean) => void;
};

const EntryMeta: React.FC<Props> = ({ reception, setReception, voie, setVoie, motif, setMotif, prioritaire, setPrioritaire }) => (
  <div className="grid md:grid-cols-4 gap-2">
    <div>
      <label className="text-xs text-gray-600 dark:text-gray-400">Réception</label>
      <input type="date" className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm" value={reception} onChange={(e) => setReception(e.target.value)} />
    </div>
    <div>
      <label className="text-xs text-gray-600 dark:text-gray-400">Voie</label>
      <select className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm" value={voie} onChange={(e) => setVoie(e.target.value as Tache["voie"])}>
        {["🏢 Guichet", "📮 Courrier", "📧 Email", "💻 Jaxform"].map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label className="text-xs text-gray-600 dark:text-gray-400">Motif</label>
      <select className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm" value={motif} onChange={(e) => setMotif(e.target.value as Tache["motif"])}>
        {["📝 Inscription", "🔄 Renouvellement", "✏️ Mise à jour", "🔍 Contrôle", "❌ Résiliation", "⚖️ Préfecture", "🏠 Gérance"].map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
    <div className="flex items-end">
      <label className="inline-flex items-center gap-2 text-lg" title="Priorité">
        <input type="checkbox" className="h-4 w-4" checked={prioritaire} onChange={(e) => setPrioritaire(e.target.checked)} />
        ❗
      </label>
    </div>
  </div>
);

export default EntryMeta;
