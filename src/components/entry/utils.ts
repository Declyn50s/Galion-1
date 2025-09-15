//src/components/entry/utils.ts
export const todayISO = () => new Date().toISOString().slice(0, 10);

export const normalizeNss = (n: string) => (n || "").replace(/[^\d]/g, "");
export const isLikelyNSS = (s: string) => normalizeNss(s).length >= 11;

export function normalizeIsoDate(s: string): string {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function normalizeTitre(t: string): "M." | "Mme" {
  const raw = (t || "").toLowerCase();
  if (/[♀]|(^|\b)(f|fem|femme|female|mme|madame|mrs|ms)(\b|\.|$)/i.test(raw)) return "Mme";
  if (/[♂]|(^|\b)(m(?!me)\b|mr|homme|male|monsieur)(\b|\.|$)/i.test(raw)) return "M.";
  return raw.trim().startsWith("f") ? "Mme" : "M.";
}

import type { Utilisateur } from "./types";
export function ensureValidUser(u: Partial<Utilisateur>): Utilisateur {
  return {
    titre: normalizeTitre(u.titre || "M."),
    nom: u.nom || "",
    prenom: u.prenom || "",
    dateNaissance: normalizeIsoDate(u.dateNaissance || "2000-01-01") || "2000-01-01",
    adresse: u.adresse || "",
    npa: u.npa || "",
    ville: u.ville || "",
    nbPers: Number.isFinite(u.nbPers as any) ? (u.nbPers as number) : 1,
    nbEnf: Number.isFinite(u.nbEnf as any) ? (u.nbEnf as number) : 0,
  };
}

export const ageFromISO = (iso: string): number => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
};

/** "Nom Prénom JJ.MM.AAAA" (ou YYYY-MM-DD) → {nom, prenom, dob} */
export function parseNameDob(input: string): { nom: string; prenom: string; dob: string } | null {
  const s = input.trim();
  if (!s) return null;
  const tokens = s.split(/\s+/);
  const last = tokens[tokens.length - 1] || "";
  const dateIso = normalizeIsoDate(last);
  if (!dateIso) return null;
  const nameTokens = tokens.slice(0, -1);
  if (nameTokens.length < 1) return null;
  const nom = (nameTokens[0] || "").toUpperCase();
  const prenom = (nameTokens.slice(1).join(" ") || "").replace(/\s+/g, " ");
  return { nom, prenom, dob: dateIso };
}
