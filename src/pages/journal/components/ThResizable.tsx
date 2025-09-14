import React from "react";
import { ArrowUpDown } from "lucide-react";

export default function ThResizable({
  label,
  sortActive,
  sortDir,
  onSort,
  onResizeMouseDown,
}: {
  label: string;
  sortActive?: boolean;
  sortDir?: "asc" | "desc";
  onSort?: () => void;
  onResizeMouseDown: (e: React.MouseEvent) => void;
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
            <ArrowUpDown className={`h-3.5 w-3.5 ${sortActive ? "opacity-100" : "opacity-40"}`} />
          </button>
        ) : (
          <span>{label}</span>
        )}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Redimensionner colonne ${label}`}
        onMouseDown={onResizeMouseDown}
        className="absolute top-0 right-0 h-full w-2 cursor-col-resize group-hover:bg-gray-300/30"
        style={{ touchAction: "none" }}
      />
    </th>
  );
}
