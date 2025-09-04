// src/features/tenant/components/DernierControleMinimal.tsx
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import FrequencyBadge from "@/features/tenant/components/FrequencyBadge";

type Law = "1975" | "ANCIENNES" | "2007";
type Reason = "CONFORME" | "SON" | "SUR" | "RTE" | "DIF"; // + DIF (Devoir d'information)
type ProlongationType = "CONVENTION" | "AUDIENCE";

export const REASONS: Record<Reason, string> = {
  CONFORME: "Conforme",
  SON: "Sous-occupation notoire (SON)",
  SUR: "Sur-occupation du logement (SUR)",
  RTE: "Revenus trop élevés (RTE)",
  DIF: "Devoir d'information (DIF)",
};

export const PROLONGATION_TYPES: Record<ProlongationType, string> = {
  CONVENTION: "Convention",
  AUDIENCE: "Audience",
};

export type DernierControleProps = {
  dateControle: string; // ISO YYYY-MM-DD (requis)
  agent?: string; // peut être vide
  law: Law; // requis
  bareme?: string; // peut être vide
  reason: Reason; // requis

  // Bloc résiliation (tous optionnels)
  resiliationDate?: string;
  resiliationPar?: string;
  resiliationRaison?: string;
  avisDepotDate?: string;
  quitteLeDate?: string;
  prolongations?: Array<{ id: string; date?: string; type: ProlongationType }>;

  className?: string;
};

function safeTrim(v?: string): string {
  return (v ?? "").trim();
}

function hasAnyResiliationData(p: DernierControleProps): boolean {
  const hasBasics =
    !!safeTrim(p.resiliationDate) ||
    !!safeTrim(p.resiliationPar) ||
    !!safeTrim(p.resiliationRaison) ||
    !!safeTrim(p.avisDepotDate) ||
    !!safeTrim(p.quitteLeDate);

  const hasProls = Array.isArray(p.prolongations) && p.prolongations.length > 0;
  return hasBasics || hasProls;
}

function formatMainLine(p: DernierControleProps): string {
  const agent = safeTrim(p.agent) || "–";
  const bareme = safeTrim(p.bareme) || "–";
  const reasonLabel = REASONS[p.reason] ?? p.reason;

  // Format exact :
  // Date du contrôle: <date> - Par: <agent|–> - Loi: <loi> - Barème: <barème|–> - Constat: <libellé reason>
  return `Date du contrôle: ${p.dateControle} - Par: ${agent} - Loi: ${p.law} - Barème: ${bareme} - Constat: ${reasonLabel}`;
}

function formatResiliationLine(p: DernierControleProps): string | null {
  if (!hasAnyResiliationData(p)) return null;

  const segments: string[] = [];

  const d = safeTrim(p.resiliationDate);
  const par = safeTrim(p.resiliationPar);
  const raison = safeTrim(p.resiliationRaison);
  const avis = safeTrim(p.avisDepotDate);
  const quitte = safeTrim(p.quitteLeDate);

  if (d) segments.push(`Date de résiliation: ${d}`);
  if (par) segments.push(`Par: ${par}`);
  if (raison) segments.push(`Raison: ${raison}`);
  if (avis) segments.push(`Avis dépôt requête: ${avis}`);
  if (quitte) segments.push(`Quitte le: ${quitte}`);

  if (Array.isArray(p.prolongations)) {
    p.prolongations.forEach((pr, idx) => {
      const num = idx + 1;
      const parts: string[] = [`Prolongation ${num}`];
      if (safeTrim(pr.date)) parts.push(safeTrim(pr.date));
      parts.push(`Type: ${PROLONGATION_TYPES[pr.type] ?? pr.type}`);
      segments.push(parts.join(" - "));
    });
  }

  return `Résiliation : ${segments.join(" - ")}`;
}

const DernierControleMinimal: React.FC<DernierControleProps> = (props) => {
  const main = React.useMemo(() => formatMainLine(props), [props]);
  const resi = React.useMemo(() => formatResiliationLine(props), [props]);

  return (
    <Card className={props.className}>
      <CardContent className="p-4 space-y-1">
        <div className="text-sm text-slate-800">{main}</div>
        {resi && <div className="text-sm text-slate-700">{resi}</div>}
      </CardContent>
    </Card>
  );
};

export default DernierControleMinimal;

/* ─────────────────────────────────────────────────────────
   Smoke tests (console)
   ───────────────────────────────────────────────────────── */
export function runDernierControleMinimalSmoke() {
  const log = console.log;

  // T1 – Principale (agent/bareme vides)
  const t1 = formatMainLine({
    dateControle: "2025-09-03",
    agent: "",
    law: "2007",
    bareme: "",
    reason: "CONFORME",
  });
  log("T1:", t1);

  // T2 – Résiliation masquée
  const t2 = formatResiliationLine({
    dateControle: "2025-09-03",
    agent: "A",
    law: "2007",
    bareme: "B1",
    reason: "CONFORME",
  });
  log("T2:", t2 ?? "(pas de ligne Résiliation)");

  // T3 – Résiliation partielle
  const t3 = formatResiliationLine({
    dateControle: "2025-09-03",
    agent: "A",
    law: "2007",
    bareme: "B1",
    reason: "CONFORME",
    resiliationDate: "2025-11-01",
  });
  log("T3:", t3);

  // T4 – Résiliation complète + prolongations
  const t4 = formatResiliationLine({
    dateControle: "2025-09-03",
    agent: "A",
    law: "2007",
    bareme: "B1",
    reason: "CONFORME",
    resiliationDate: "2025-11-01",
    resiliationPar: "Service X",
    avisDepotDate: "2025-11-10",
    quitteLeDate: "2025-12-31",
    prolongations: [
      { id: "1", date: "2026-01-15", type: "CONVENTION" },
      { id: "2", date: "2026-03-01", type: "AUDIENCE" },
    ],
  });
  log("T4:", t4);

  // T5 – Mapping reason (RTE)
  const t5 = formatMainLine({
    dateControle: "2025-09-03",
    agent: "Agent Z",
    law: "1975",
    bareme: "B2",
    reason: "RTE",
  });
  log("T5:", t5);

  // T6 – Mapping reason (DIF)
  const t6 = formatMainLine({
    dateControle: "2025-09-03",
    agent: "Agent Z",
    law: "ANCIENNES",
    bareme: "B3",
    reason: "DIF",
  });
  log("T6:", t6);
}

<FrequencyBadge
  law={law}                 // "LC.75" | "LC.2007" | "RC" | "UNKNOWN"
  hasAS={/* bool selon l'immeuble */}
  lastControlDate={/* ISO string ou Date, ex. "2023-06-21" */}
/>