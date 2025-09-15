//src/components/entry/EntryFooter.tsx
import React from "react";

type Props = {
  total: number;
  adults: number;
  majors: number;
  minors: number;
  address?: string;
  npa?: string;
  city?: string;
  onCancel: () => void;
  onPublish: () => void;
  disabled: boolean;
};

const EntryFooter: React.FC<Props> = ({ total, adults, majors, minors, address, npa, city, onCancel, onPublish, disabled }) => (
  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
    <div className="text-xs text-gray-600 dark:text-gray-400">
      <b>Résumé :</b> {total} pers. • {adults} adultes • {majors} enfants majeurs • {minors} enfants mineurs
      {address || npa || city ? (
        <> • {address}, {npa} {city}</>
      ) : null}
    </div>
    <div className="flex items-center gap-2">
      <button className="h-9 px-3 rounded border text-sm" onClick={onCancel}>
        Annuler
      </button>
      <button
        className="h-9 px-4 rounded bg-gray-900 text-white text-sm disabled:opacity-50 inline-flex items-center gap-2"
        disabled={disabled}
        onClick={onPublish}
        title={disabled ? "Ajouter au moins un adulte et compléter Réception/Voie/Motif" : "Publier"}
      >
        Publier
      </button>
    </div>
  </div>
);

export default EntryFooter;
