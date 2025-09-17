// src/pages/housing/lup/StatutBadge.tsx
import React from "react";
import { STATUTS } from "./constants";
import { classNames } from "./classNames";


export const StatutBadge: React.FC<{ statut: string }> = ({ statut }) => {
const meta = (STATUTS as any).find((s: any) => s.key === statut) || (STATUTS as any)[0];
return <span className={classNames("px-2 py-1 text-xs rounded-full", (meta as any).color)}>{statut}</span>;
};