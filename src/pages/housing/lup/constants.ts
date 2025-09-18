// src/pages/housing/lup/constants.ts
export const CATEGORIES = [
  { key: "LLM", label: "LLM" },
  { key: "LLM_VDL", label: "LLM VdL" },
  { key: "LADA", label: "LADA" },
  { key: "LLA", label: "LLA" },
  { key: "LLA_VDL", label: "LLA VdL (LLR)" },
  { key: "LS", label: "LS" },
  { key: "LE", label: "LE" },
  { key: "LE_VDL", label: "LE VdL" },
] as const;

export const BASES = ["L47","L53","L65","L74","L75","L2007","LA","LP","LM","—"] as const;

export const STATUTS = [
  { key: "Actif", color: "bg-emerald-100 text-emerald-700" },
  { key: "Retiré-temporaire", color: "bg-amber-100 text-amber-700" },
  { key: "Retiré-définitif", color: "bg-rose-100 text-rose-700" },
  { key: "A venir", color: "bg-sky-100 text-sky-700" },
  { key: "En projet", color: "bg-indigo-100 text-indigo-700" },
] as const;
