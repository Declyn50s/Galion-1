//src/components/entry/EntryAddressForm.tsx
import React from "react";

type Props = {
  adresse: string;
  npa: string;
  ville: string;
  onChange: (patch: Partial<{ adresse: string; npa: string; ville: string }>) => void;
};

const EntryAddressForm: React.FC<Props> = ({ adresse, npa, ville, onChange }) => (
  <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 grid md:grid-cols-3 gap-2">
    <div className="md:col-span-3">
      <label className="text-xs text-gray-600 dark:text-gray-400">Adresse du ménage</label>
      <input
        className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
        placeholder="Rue, n°"
        value={adresse}
        onChange={(e) => onChange({ adresse: e.target.value })}
      />
    </div>
    <div>
      <label className="text-xs text-gray-600 dark:text-gray-400">NPA</label>
      <input
        className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
        placeholder="1000"
        value={npa}
        onChange={(e) => onChange({ npa: e.target.value })}
      />
    </div>
    <div className="md:col-span-2">
      <label className="text-xs text-gray-600 dark:text-gray-400">Ville</label>
      <input
        className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
        placeholder="Lausanne"
        value={ville}
        onChange={(e) => onChange({ ville: e.target.value })}
      />
    </div>
  </div>
);

export default EntryAddressForm;
