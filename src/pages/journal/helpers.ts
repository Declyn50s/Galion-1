// src/pages/journal/helpers.ts
import { parseISO, format } from "date-fns";

/* ---------- Types util ---------- */
export type Statut =
  | "À traiter"
  | "En traitement"
  | "En suspens"
  | "Validé"
  | "Refusé";

export type Priorite = "Haute" | "Basse";

export type ObservationTag = "Refus" | "Incomplet" | "Dérogation";

export type UtilisateurLike = {
  dateNaissance?: string;
  nom: string;
  prenom: string;
};

/* ---------- Format/tri personnes ---------- */
export const fmt = (iso?: string | null) => {
  if (!iso) return "—";
  const d = parseISO(String(iso));
  if (isNaN(d.getTime())) return "—";
  return format(d, "dd.MM.yyyy");
};

export const initials3 = (fullName: string) => {
  const s = fullName.normalize("NFD").replace(/[^\p{L}]+/gu, "");
  return s.slice(0, 3).toUpperCase();
};

export const dobKey = (iso?: string) => {
  if (!iso) return Number.MAX_SAFE_INTEGER;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return Number.MAX_SAFE_INTEGER;
  return Number(iso.replace(/-/g, ""));
};

export const byOldest = (a: UtilisateurLike, b: UtilisateurLike) => {
  const ka = dobKey(a.dateNaissance);
  const kb = dobKey(b.dateNaissance);
  if (ka !== kb) return ka - kb;
  const nomCmp = a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });
  if (nomCmp) return nomCmp;
  return a.prenom.localeCompare(b.prenom, "fr", { sensitivity: "base" });
};

/* ---------- Styles badges/points ---------- */
export const statutBadgeClass = (s: Statut) => {
  const base = "px-2 py-0.5 rounded text-xs font-medium transition-colors";
  switch (s) {
    case "À traiter":
      return `${base} bg-amber-400 text-black dark:bg-amber-500`;
    case "En traitement":
      return `${base} bg-blue-600 text-white`;
    case "En suspens":
      return `${base} bg-gray-500 text-white dark:bg-gray-600`;
    case "Validé":
      return `${base} bg-emerald-600 text-white`;
    case "Refusé":
      return `${base} bg-red-600 text-white`;
  }
};

export const tagBadgeClass = (tag: ObservationTag | string) => {
  const base = "px-1.5 py-0.5 rounded text-[10px] font-medium";
  switch (tag) {
    case "Refus":
      return `${base} bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200`;
    case "Incomplet":
      return `${base} bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200`;
    case "Dérogation":
      return `${base} bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200`;
    default:
      return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-200`;
  }
};

export const priorityDot = (p: Priorite) => {
  switch (p) {
    case "Haute":
      return "bg-red-600";
    default:
      return "";
  }
};

/* ---------- (Optionnel) Ordres tri ---------- */
export const statutOrder: Statut[] = [
  "À traiter",
  "En traitement",
  "En suspens",
  "Validé",
  "Refusé",
];

export const prioriteOrder: Priorite[] = ["Haute", "Basse"];
