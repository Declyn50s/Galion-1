// src/pages/housing/lup/MiniMap.tsx
import React from "react";
import { MapPin } from "lucide-react";
import { classNames } from "./classNames";

export const MiniMap: React.FC<{ rows: any[]; onSelect: (r: any) => void; selectedId?: string }> = ({ rows, onSelect, selectedId }) => {
return (
<div className="relative w-full h-full rounded-2xl border bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
<svg className="absolute inset-0 w-full h-full opacity-40" aria-hidden>
<defs>
<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
<path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="1" />
</pattern>
</defs>
<rect width="100%" height="100%" fill="url(#grid)" />
</svg>
{rows.map((r) => (
<button
key={r.id}
onClick={() => onSelect(r)}
className={classNames("absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1", selectedId === r.id ? "z-20" : "z-10")}
style={{ left: `${r.coords?.x ?? 50}%`, top: `${r.coords?.y ?? 50}%` }}
title={`${r.intitule} — ${r.nb}`}
>
<MapPin className={classNames("h-5 w-5 drop-shadow", selectedId === r.id ? "text-rose-600" : "text-slate-600")} />
<span className="bg-white/90 backdrop-blur px-2 py-0.5 rounded-md text-[10px] border shadow">{r.nb}</span>
</button>
))}
</div>
);
};