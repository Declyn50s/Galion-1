// src/features/tenant/components/lease/utils.ts
import { IMMEUBLES, stripDiacritics } from "@/data/immeubles";
import type {
  LawBase,
  LawGroup,
  RuleOutcome,
  Exceptions,
  AidState,
  TerminationReason,
} from "./types";

/* ---------- format / parse ---------- */
export const CHF = (n?: number) =>
  `CHF ${Intl.NumberFormat("fr-CH", { maximumFractionDigits: 0 }).format(n ?? 0)}`;

export const parseNumber = (v: string) => {
  const n = Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
};
export const numberOr = (v?: number, def = 0) =>
  typeof v === "number" && !Number.isNaN(v) ? v : def;

/* ---------- adresse helpers ---------- */
const U = (s: string) =>
  stripDiacritics(String(s ?? ""))
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

const TYPES = new Set([
  "AVENUE","AV","AV.","RUE","R","R.","ROUTE","RTE","RT.",
  "CHEMIN","CH","CH.","BOULEVARD","BD","PLACE","PL","IMPASSE","IMP",
  "ALLEE","ALL","ALL.","QUAI","PROMENADE","PROM","CITE","CTE",
]);
const ARTICLES = new Set(["DE","DU","DES","LA","LE","L'","D'"]);

export function streetCore(input: string): string {
  const s = U(input).replace(/[,.;]/g, " ");
  const parts = s.split(/\s+/).filter(Boolean);
  const kept = parts.filter((w) => !TYPES.has(w) && !ARTICLES.has(w) && !/^\d+[A-Z]*$/.test(w));
  return kept.join(" ").replace(/\s+/g, " ").trim();
}
export function firstHouseNumber(input: string): number | null {
  const m = U(input).match(/(\d{1,5})/);
  return m ? parseInt(m[1], 10) : null;
}
type Range = [number, number];
function rangesFromAdresse(adr: string): Range[] {
  let s = U(adr);
  s = s.replace(/(\d+)A(\d+)/g, "$1-$2");
  s = s.replace(/[:/+,]/g, " ");
  s = s.replace(/(\d+)[A-Z]+/g, "$1");
  s = s.replace(/[^0-9\- ]+/g, " ").replace(/\s+/g, " ").trim();

  const ranges: Range[] = [];
  for (const tok of s.split(" ")) {
    if (!tok) continue;
    if (/^\d+$/.test(tok)) {
      const n = parseInt(tok, 10);
      ranges.push([n, n]);
    } else if (/^\d+\-\d+$/.test(tok)) {
      let [a, b] = tok.split("-").map((x) => parseInt(x, 10));
      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        if (a > b) [a, b] = [b, a];
        ranges.push([a, b]);
      }
    }
  }
  ranges.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const merged: Range[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (!last) merged.push([...r] as Range);
    else if (r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r] as Range);
  }
  return merged;
}

export function guessBaseFromImmeubles(userAdresse: string): LawBase | null {
  const core = streetCore(userAdresse);
  if (!core) return null;
  const n = firstHouseNumber(userAdresse);

  const rows = IMMEUBLES.filter((r) => streetCore(r.adresse) === core);
  if (rows.length === 0) return null;

  if (n == null) return rows[0].base as LawBase;
  for (const r of rows) {
    const ranges = rangesFromAdresse(r.adresse);
    if (ranges.some(([a, b]) => n >= a && n <= b)) return r.base as LawBase;
  }
  return rows[0].base as LawBase;
}

export function lawGroupFromBase(base?: string | null): LawGroup {
  const b = String(base || "").toUpperCase();
  if (!b) return "UNKNOWN";
  if (b.startsWith("RC.")) return "RC";
  if (b === "LC.53") return "LC.53";
  if (b === "LC.65") return "LC.65";
  if (b === "LC.75") return "LC.75";
  if (b === "LC.2007") return "LC.2007";
  return "UNKNOWN";
}

/* ---------- règles métier (outcome) ---------- */
export function computeRules(params: {
  lawGroup: LawGroup;
  reason?: TerminationReason;
  overrunPercent?: number;
  sonIsNotoire?: boolean;
  exceptions?: Exceptions;
}): RuleOutcome {
  const { lawGroup, reason, overrunPercent = 0, sonIsNotoire, exceptions } = params;

  const OUT: RuleOutcome = {
    resiliation: false,
    supplementPercent: undefined,
    supplementNote: undefined,
    supplementIsQuarterly: true,
    aides: {
      cantonales: { etat: "non-applicable" },
      communales: { etat: "non-applicable" },
      AS: { etat: "non-applicable" },
    },
    notes: [],
  };

  const isRC = lawGroup === "RC" || lawGroup === "LC.53" || lawGroup === "LC.65";
  const isLC75 = lawGroup === "LC.75";
  const isLC2007 = lawGroup === "LC.2007";

  const conciergeTol40 = !!exceptions?.conciergePro60;

  if (reason === "DIF") {
    OUT.notes.push("DIF : manquement au devoir d’information (décision au cas par cas).");
    return OUT;
  }

  const isSON = reason === "SOS_SIMPLE" || reason === "SON_NOTOIRE" || sonIsNotoire;
  const notoire = reason === "SON_NOTOIRE" || !!sonIsNotoire;

  if (isSON) {
    if (isRC) {
      OUT.aides = {
        cantonales: { etat: "non-applicable" },
        communales: { etat: "non-applicable" },
        AS: { etat: "non-applicable" },
      };
      OUT.supplementPercent = 20;
      OUT.supplementNote = "Supplément 20% du loyer net (trimestriel)";
      if (notoire) OUT.resiliation = true;
      OUT.notes.push("Anciennes lois : SON notoire = résiliation (+20%).");
    } else if (isLC2007) {
      if (notoire) {
        OUT.resiliation = true;
        OUT.aides = {
          cantonales: { etat: "supprimée", delaiMois: 6 },
          communales: { etat: "supprimée", delaiMois: 6 },
          AS: { etat: "supprimée", delaiMois: 1 },
        };
        OUT.notes.push("LC.2007 : SON notoire → résiliation + suppression aides (6m / AS immédiate).");
      } else {
        OUT.aides = {
          cantonales: { etat: "maintenue" },
          communales: { etat: "maintenue" },
          AS: { etat: "maintenue" },
        };
        OUT.notes.push("LC.2007 : SOS simple → aides maintenues.");
      }
    } else if (isLC75) {
      if (notoire) OUT.resiliation = true;
      OUT.aides = {
        cantonales: { etat: "supprimée" },
        communales: { etat: "supprimée" },
        AS: { etat: notoire ? "supprimée" : "maintenue" },
      };
      OUT.notes.push(`LC.75 : SON ${notoire ? "notoire → résiliation + suppression aides" : "simple → suppression aides"}.`);
    }
    OUT.notes.push("AS : voir barème; cas particuliers selon directives.");
    return OUT;
  }

  if (reason === "RTE") {
    const dep = overrunPercent;
    const seuil = conciergeTol40 ? 40 : 20;
    const depGT = dep > seuil;

    if (isRC) {
      if (dep > 20) {
        OUT.resiliation = true;
        OUT.supplementPercent = 50;
        OUT.supplementNote = "Supplément 50% du loyer net (trimestriel) + résiliation";
        OUT.notes.push("RC : >20% → +50% net + résiliation.");
      } else if (dep > 0) {
        OUT.supplementPercent = 50;
        OUT.supplementNote = "Supplément 50% du loyer net (trimestriel)";
        OUT.notes.push("RC : ≤20% → +50% net.");
      }
    } else if (isLC75) {
      if (depGT) {
        OUT.resiliation = true;
        OUT.aides = {
          cantonales: { etat: "supprimée" },
          communales: { etat: "supprimée" },
          AS: { etat: "supprimée" },
        };
        OUT.notes.push(`LC.75 : >${seuil}% → suppression aides + résiliation.`);
      } else if (dep > 0) {
        OUT.aides = {
          cantonales: { etat: "partielle" },
          communales: { etat: "partielle" },
          AS: { etat: "maintenue" },
        };
        OUT.notes.push("LC.75 : ≤20% → suppression partielle/totale progressive; AS maintenue.");
      }
    } else if (isLC2007) {
      if (depGT) {
        OUT.resiliation = true;
        OUT.aides = {
          cantonales: { etat: "supprimée", delaiMois: 6 },
          communales: { etat: "supprimée", delaiMois: 6 },
          AS: { etat: "supprimée", delaiMois: 1 },
        };
        OUT.notes.push(`LC.2007 : >${seuil}% → sup. C/C après 6m + AS immédiate + résiliation.`);
      } else if (dep > 0) {
        OUT.aides = {
          cantonales: { etat: "maintenue" },
          communales: { etat: "maintenue" },
          AS: { etat: "maintenue" },
        };
        OUT.notes.push("LC.2007 : ≤20% → aides maintenues.");
      }
    }

    OUT.notes.push("Art. 25 RCOL : pas de perception si supplément annuel < CHF 120.–.");
    return OUT;
  }

  OUT.notes.push("Motif 'Autre' : évaluer manuellement.");
  return OUT;
}
