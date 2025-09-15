//src/components/entry/EntrySearchBar.tsx
import React from "react";
import { Loader2, Search as SearchIcon } from "lucide-react";

type Props = {
  query: string;
  setQuery: (v: string) => void;
  onSearchOrAdd: () => void;
  searching: boolean;
};

const EntrySearchBar: React.FC<Props> = ({ query, setQuery, onSearchOrAdd, searching }) => {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
      <label className="text-xs text-gray-600 dark:text-gray-400">
        NSS ou “Nom Prénom JJ.MM.AAAA”
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchOrAdd()}
            placeholder={`756.1234.5678.97  ou  MARTIN Sophie 01.01.1990`}
            className="w-full h-9 pl-8 rounded border border-gray-300 bg-white dark:bg-neutral-900 px-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onSearchOrAdd}
          disabled={searching || !query.trim()}
          className="h-9 px-3 rounded bg-gray-900 text-white text-sm inline-flex items-center gap-2 disabled:opacity-50"
          title="Rechercher / Ajouter"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
          Rechercher
        </button>
      </div>
    </div>
  );
};

export default EntrySearchBar;
