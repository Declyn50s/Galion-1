// calcul prochaine date de contrôle
// src/features/tenant/control/schedule.ts
import type { Law } from "./types";

export function controlFrequencyYears(law: Law, hasAS: boolean): number {
  if (hasAS) return 2;
  if (law === "LC.2007") return 1;
  if (law === "RC" || law === "LC.53" || law === "LC.65" || law === "LC.75") return 4;
  return 3; // fallback règlement communal (mini)
}

export function nextControlDate(last: Date | null, years: number): Date {
  const base = last ?? new Date();
  return new Date(base.getFullYear() + years, base.getMonth(), base.getDate());
}
