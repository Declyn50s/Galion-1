// src/pages/housing/lup/CatBadge.tsx
import React from "react";
import { CATEGORIES } from "./constants";
import { classNames } from "./classNames";

const palette: Record<string, string> = {
LLM: "bg-slate-100 text-slate-800",
LLM_VDL: "bg-slate-100 text-slate-800",
LADA: "bg-rose-100 text-rose-800",
LLA: "bg-amber-100 text-amber-800",
LLA_VDL: "bg-amber-100 text-amber-800",
LS: "bg-fuchsia-100 text-fuchsia-800",
LE: "bg-cyan-100 text-cyan-800",
LE_VDL: "bg-cyan-100 text-cyan-800",
};

export const CatBadge: React.FC<{ cat: string }> = ({ cat }) => (
<span className={classNames("px-2 py-1 text-xs rounded-full font-medium", palette[cat] || "bg-gray-100")}>
{(CATEGORIES as any).find((c: any) => c.key === cat)?.label || cat}
</span>
);