// badge "Prochain contrôle: 12.2026 (en retard/ok)"
// src/features/tenant/components/FrequencyBadge.tsx
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, AlertTriangle, CheckCircle2, Info } from "lucide-react";

type LawKind = "LC.75" | "LC.2007" | "RC" | "UNKNOWN";

export type FrequencyBadgeProps = {
  law: LawKind;
  /** Immeuble avec abaissement supplémentaire (AS) → cible tous les 2 ans */
  hasAS?: boolean;
  /** Date du dernier contrôle (ISO string ou Date). Si omis, on affiche seulement la cible. */
  lastControlDate?: string | Date | null;
  /** Délai d’alerte en jours avant l’échéance (par défaut 60). */
  alertDays?: number;
  className?: string;
};

/** Fréquences “cible” par loi (d’après le cahier des charges) :
 *  - LC.2007 (RRCOLM) : 1 an
 *  - Anciennes lois (RC) & LC.75 (RCOL) : 4 ans
 *  - AS : 2 ans (règle métier transversale)
 *
 *  Note: le Règlement communal indique “1 fois/an (min. 1/3 ans)”.
 *  Ici on n’impose pas 1/an; on l’indique seulement dans l’infobulle.
 */
function targetYearsFromLaw(law: LawKind): number | null {
  if (law === "LC.2007") return 1;
  if (law === "LC.75" || law === "RC") return 4;
  return null;
}

/** Combine loi + AS pour retourner une cible finale “compréhensible”.
 *  On prend la plus fréquente entre la loi et l’AS (le plus petit nombre d’années).
 *  Si loi inconnue : on retient 2 ans si AS, sinon null.
 */
function recommendedYears(law: LawKind, hasAS?: boolean): number | null {
  const byLaw = targetYearsFromLaw(law);
  const asYears = hasAS ? 2 : null;

  if (byLaw == null && asYears == null) return null;
  if (byLaw == null) return asYears!;
  if (asYears == null) return byLaw;
  return Math.min(byLaw, asYears);
}

function parseDate(d?: string | Date | null): Date | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  // Arrondi au jour près
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / MS);
}

function formatPeriodFR(years: number): string {
  if (years === 1) return "annuel";
  return `tous les ${years} ans`;
}

export default function FrequencyBadge({
  law,
  hasAS = false,
  lastControlDate,
  alertDays = 60,
  className = "",
}: FrequencyBadgeProps) {
  const years = recommendedYears(law, hasAS);
  const last = parseDate(lastControlDate);
  const today = new Date();

  // Calcul de l’échéance
  const dueDate = years && last ? addYears(last, years) : null;
  const daysToDue = dueDate ? daysBetween(today, dueDate) : null;

  // État visuel
  let variantClass = "bg-slate-100 text-slate-800 border-slate-200";
  let Icon: React.ElementType = Info;
  let statusLabel = "";

  if (dueDate) {
    if (daysToDue! < 0) {
      // En retard
      variantClass = "bg-red-100 text-red-800 border-red-200";
      Icon = AlertTriangle;
      statusLabel = `En retard de ${Math.abs(daysToDue!)} j`;
    } else if (daysToDue! <= alertDays) {
      // Bientôt dû
      variantClass = "bg-amber-100 text-amber-800 border-amber-200";
      Icon = CalendarClock;
      statusLabel = `Échéance dans ${daysToDue} j`;
    } else {
      // OK
      variantClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
      Icon = CheckCircle2;
      statusLabel = `Prochain contrôle dans ${daysToDue} j`;
    }
  } else {
    // Pas de date connue : on montre la cible
    variantClass = "bg-slate-100 text-slate-800 border-slate-200";
    Icon = Info;
    statusLabel = years ? `Cible ${formatPeriodFR(years)}` : "Fréquence non définie";
  }

  const lawLabel =
    law === "LC.2007" ? "LC.2007"
    : law === "LC.75" ? "LC.75"
    : law === "RC" ? "Anciennes lois"
    : "Régime inconnu";

  const title = [
    `Régime : ${lawLabel}`,
    hasAS ? "Immeuble avec AS : cible 2 ans" : null,
    years ? `Cible retenue : ${formatPeriodFR(years)}` : "Cible retenue : inconnue",
    "Règlement communal : objectif 1/an, exigence min. 1/3 ans",
    last ? `Dernier contrôle : ${last.toLocaleDateString("fr-CH")}` : "Dernier contrôle : inconnu",
    dueDate ? `Prochaine échéance : ${dueDate.toLocaleDateString("fr-CH")}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <Badge
      variant="outline"
      title={title}
      className={`inline-flex items-center gap-1.5 border ${variantClass} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Contrôle&nbsp;:</span>
      <span className="font-medium">
        {years ? formatPeriodFR(years) : "à définir"}
      </span>
      {statusLabel && <span className="pl-1 text-xs opacity-80">— {statusLabel}</span>}
    </Badge>
  );
}
