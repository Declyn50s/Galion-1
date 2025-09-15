import React from "react";

type Props = {
  observation: string;
  setObservation: (v: string) => void;
  collabInput: string;
  setCollabInput: (v: string) => void;
  collabTags: string[];
  addCollabTag: () => void;
  removeCollabTag: (tag: string) => void;
};

const QUICK_TAGS = ["Refus", "Incomplet", "Dérogation"] as const;

const EntryTagsAndCollabs: React.FC<Props> = ({
  observation,
  setObservation,
  collabInput,
  setCollabInput,
  collabTags,
  addCollabTag,
  removeCollabTag,
}) => {
  const onQuickTagToggle = (tag: string) => {
    const has = observation.toLowerCase().includes(tag.toLowerCase());
    if (has) {
      const re = new RegExp(`\\b${tag}\\b`, "gi");
      const next = observation.replace(re, "").replace(/\s{2,}/g, " ").trim();
      setObservation(next);
    } else {
      setObservation((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  return (
    <div>
      {/* Observation d'abord */}
      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Observation</label>
      <textarea
        className="w-full border rounded p-2 min-h-20 bg-white dark:bg-neutral-900 text-sm"
        value={observation}
        onChange={(e) => setObservation(e.target.value)}
        placeholder="Ex. Incomplet pièces manquantes, Dérogation accordée, Refus client..."
      />

      {/* Tags rapides */}
      <div className="mt-3">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tags rapides</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {QUICK_TAGS.map((tag) => {
            const active = observation.toLowerCase().includes(tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onQuickTagToggle(tag)}
                className={`px-2 py-1 rounded text-xs border transition ${
                  active
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white dark:bg-neutral-900 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
                aria-pressed={active}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collaborateurs à notifier */}
      <div className="mt-3">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Collaborateurs à notifier (tags)</div>
        <div className="flex gap-2">
          <input
            className="flex-1 h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
            placeholder="@initiales ou nom"
            value={collabInput}
            onChange={(e) => setCollabInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCollabTag()}
          />
          <button
            type="button"
            className="h-9 px-3 rounded border text-sm"
            onClick={addCollabTag}
            disabled={!collabInput.trim()}
          >
            Ajouter
          </button>
        </div>
        {collabTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {collabTags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs"
              >
                {t}
                <button
                  type="button"
                  className="text-red-600"
                  onClick={() => removeCollabTag(t)}
                  title="Retirer"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntryTagsAndCollabs;
