// src/lib/roles.ts
export type CanonicalRole =
  | "conjoint"
  | "enfant"
  | "enfant garde alternée"
  | "enfant droit de visite"
  | "autre";

export type DisplayRole =
  | "Conjoint"
  | "Enfant à charge"
  | "Enfant – garde alternée"
  | "Enfant – droit de visite"
  | "Autre";

export const normalize = (s?: string) =>
  (s ?? "")
    .toLowerCase()
    .replace(/[–—-]/g, " ")          // tirets → espaces
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // supprime accents
    .replace(/\s+/g, " ")
    .trim();

/** Retourne un id canonique unique pour toutes les variantes */
export const canonicalizeRole = (raw?: string): CanonicalRole => {
  const r = normalize(raw);

  if (r.startsWith("conjoint")) return "conjoint";

  // toutes les variantes DV : "droit de visite", "en droit visite", "droit-visite", "(dv)", …
  const isDV =
    r.startsWith("enfant") &&
    ((r.includes("droit") && r.includes("visite")) || /\bdv\b/.test(r));
  if (isDV) return "enfant droit de visite";

  const isGA =
    r.startsWith("enfant") &&
    (r.includes("garde alternee") || r.includes("garde alternée"));
  if (isGA) return "enfant garde alternée";

  if (r.startsWith("enfant")) return "enfant";

  return "autre";
};

export const toDisplayRole = (canonical?: string): DisplayRole => {
  const c = canonicalizeRole(canonical);
  if (c === "conjoint") return "Conjoint";
  if (c === "enfant") return "Enfant à charge";
  if (c === "enfant garde alternée") return "Enfant – garde alternée";
  if (c === "enfant droit de visite") return "Enfant – droit de visite";
  return "Autre";
};

export const ROLE_OPTIONS = [
  { value: "conjoint", label: "Conjoint·e" },
  { value: "enfant", label: "Enfant" },
  { value: "enfant droit de visite", label: "Enfant (droit de visite)" },
  { value: "enfant garde alternée", label: "Enfant (garde alternée)" },
  { value: "autre", label: "Autre" },
] as const;
