// src/features/user-profile/components/IncomeCard/utils.ts

// ───────────────────────────────────────────────────────────
// Colonnes barème (métadonnées d'affichage)
export const BAREME_COLUMNS = [
  { id: 1, label: "1 à 2 personnes ou groupe", info: "0 enfant" },
  { id: 2, label: "avec 1 enfant", info: "1 enfant" },
  { id: 3, label: "avec 2 enfants", info: "2 enfants" },
  { id: 4, label: "avec 3 enfants", info: "3 enfants" },
  { id: 5, label: "avec 4 enfants ou +", info: "≥ 4 enfants" },
] as const;

// ───────────────────────────────────────────────────────────
// Normalisation & rôles

export const normalize = (s?: string) =>
  (s ?? "")
    .toLowerCase()
    .replace(/[–—-]/g, " ")          // tirets → espaces
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // enlève accents
    .replace(/\s+/g, " ")
    .trim();

/** Retourne un id canonique unique pour toutes les variantes */
export const canonicalizeRole = (raw?: string):
  | "conjoint"
  | "enfant"
  | "enfant garde alternée"
  | "enfant droit de visite"
  | "autre" => {
  const r = normalize(raw);

  if (r.startsWith("conjoint")) return "conjoint";

  // DV : tolère "droit de visite", "en droit visite", "droit-visite", "(dv)", etc.
  const looksDV =
    r.startsWith("enfant") &&
    ((r.includes("droit") && r.includes("visite")) || /\bdv\b/.test(r));
  if (looksDV) return "enfant droit de visite";

  const looksGA =
    r.startsWith("enfant") &&
    (r.includes("garde alternee") || r.includes("garde alternée"));
  if (looksGA) return "enfant garde alternée";

  if (r.startsWith("enfant")) return "enfant";

  return "autre";
};

/** DV = rôle canonique "enfant droit de visite" */
export const isDV = (val?: string): boolean =>
  canonicalizeRole(val) === "enfant droit de visite";

/**
 * Enfant “compté” pour la colonne du barème :
 *  - "enfant" ✅
 *  - "enfant garde alternée" ✅
 *  - "enfant droit de visite" ❌ (jamais compté)
 *
 * NB: on canonicalise à partir de rawRole si dispo, sinon à partir de `role`.
 */
export const isChildCounted = (role: unknown, rawRole?: string): boolean => {
  const source = rawRole ?? String(role ?? "");
  const canon = canonicalizeRole(source);
  return canon === "enfant" || canon === "enfant garde alternée";
};

// ───────────────────────────────────────────────────────────
// Ages & permis

const toDate = (s?: string) => {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export const yearsDiff = (iso?: string) => {
  const d = toDate(iso);
  if (!d) return 0;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const md = today.getMonth() - d.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < d.getDate())) age--;
  return age;
};

export const isPermitValid = (
  nationality?: string,
  permit?: string,
  expiry?: string
) => {
  const nat = (nationality ?? "").trim().toLowerCase();
  const p = (permit ?? "").trim();

  if (nat === "suisse" || p === "Citoyen") return true;
  if (p === "Permis C") return true;

  if (p === "Permis B" || p === "Permis F") {
    const d = toDate(expiry);
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
  }
  return false;
};
