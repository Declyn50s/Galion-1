//src/pages/housing/lup/TableHeaderCell.tsx
import React from "react";

export const TableHeaderCell: React.FC<{ label: string; sortKey: string; sort: { key: string; dir: "asc" | "desc" } | null; setSort: any; width?: number }> = ({ label, sortKey, sort, setSort, width }) => {
const isActive = (sort?.key === sortKey);
const dir = isActive ? (sort!.dir === "asc" ? "↑" : "↓") : "";
return (
<th style={{ width }} className="sticky top-0 bg-white z-10 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b cursor-pointer select-none"
onClick={() => setSort((s: any) => ({ key: sortKey, dir: isActive && s.dir === "asc" ? "desc" : "asc" }))}>
<div className="px-3 py-2 flex items-center gap-2">
<span>{label}</span>
<span className="text-gray-400">{dir}</span>
</div>
</th>
);
};