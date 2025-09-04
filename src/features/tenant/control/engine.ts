 // règles SON/RTE/DIF + fréquences + décisions
 // src/features/tenant/control/engine.ts
import type { ControlInput, ControlResult, Decision, Law, SON, RTE } from "./types";

export function classifySON(rooms?: number, adults = 0, minors = 0): SON {
  if (!rooms || rooms <= 0) return "none";
  const units = adults + Math.ceil((minors || 0) / 2);
  const diff = rooms - units;
  if (diff >= 2) return "notoire";
  if (diff === 1) return "simple";
  return "none";
}

export function classifyRTE(rdu?: number, cap?: number, dm4?: boolean): { rte: RTE; percent?: number } {
  if (rdu == null || cap == null) return { rte: "unknown" };
  let percent = (rdu - cap) / cap * 100;
  if (dm4) percent = Math.max(percent - 40, 0); // tolérance 40% DM4
  if (percent <= 0) return { rte: "none", percent: 0 };
  if (percent < 20) return { rte: "lt20", percent };
  return { rte: "gte20", percent };
}

export function decisionsFromRules(law: Law, son: SON, rte: RTE, opts: { dm5?: boolean } = {}): Decision[] {
  const out: Decision[] = [];

  // SON
  if (son === "simple") {
    if (law === "RC") out.push({ kind: "SUPPLEMENT", percent: 20 });
    else if (law === "LC.75") out.push({ kind: "SUPPRESSION_AIDES", scope: "totale" });
    else if (law === "LC.2007") out.push({ kind: "CONSERVATION" });
  } else if (son === "notoire") {
    if (law === "RC") { out.push({ kind: "RESILIATION" }, { kind: "SUPPLEMENT", percent: 20 }); }
    else if (law === "LC.75") { out.push({ kind: "RESILIATION" }, { kind: "SUPPRESSION_AIDES", scope: "totale" }); }
    else if (law === "LC.2007") { out.push({ kind: "RESILIATION" }, { kind: "SUPPRESSION_AIDES", scope: "totale" }); }
  }

  // RTE
  if (rte === "lt20") {
    if (law === "RC") out.push({ kind: "SUPPLEMENT", percent: 50 });
    else if (law === "LC.75") out.push({ kind: "SUPPRESSION_AIDES", scope: "partielle" });
    else if (law === "LC.2007") out.push({ kind: "CONSERVATION" });
  } else if (rte === "gte20") {
    if (law === "RC") out.push({ kind: "SUPPLEMENT", percent: 50 }, { kind: "RESILIATION" });
    else if (law === "LC.75") out.push({ kind: "SUPPRESSION_AIDES", scope: "totale" }, { kind: "RESILIATION" });
    else if (law === "LC.2007") out.push({ kind: "SUPPRESSION_AIDES", scope: "totale" }, { kind: "RESILIATION" });
  }

  // DM5 peut neutraliser une résiliation SON (cas spécifique)
  if (opts.dm5) {
    return out.filter(d => d.kind !== "RESILIATION");
  }
  return out.length ? out : [{ kind: "CONSERVATION" }];
}

export function runControl(input: ControlInput): ControlResult {
  const son = classifySON(input.rooms, input.adults, input.minors);
  const { rte, percent } = classifyRTE(input.rduTotal, input.cap, input.exceptions?.dm4Concierge);
  const recommended = decisionsFromRules(input.law, son, rte, { dm5: input.exceptions?.dm5AVSSeul3p });
  const notes: string[] = [];
  if (!input.rooms) notes.push("Nombre de pièces inconnu.");
  if (rte === "unknown") notes.push("Cap RTE inconnu (renseigner barème).");
  return { son, rte, dif: false, percentOverCap: percent, notes, recommended };
}
