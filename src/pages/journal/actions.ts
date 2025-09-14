// src/pages/journal/actions.ts
import type { Tache } from "@/features/journal/store";

export type PersonRecord = {
  id: string;
  isApplicant: boolean;
  registrationDate: string; // ISO YYYY-MM-DD
  firstName: string;
  lastName: string;
  gender?: "Féminin" | "Masculin" | string;
  adresse?: string;
  address?: string;
  addressComplement?: string;
  postalCode?: string;
  city?: string;
  socialSecurityNumber?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  residencePermit?: string;
  permitExpiryDate?: string;
  birthDate?: string;
  household?: any[];
};

const LS_KEY = "demo.people";

function readPeople(): PersonRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as PersonRecord[]) : [];
  } catch {
    return [];
  }
}
function writePeople(arr: PersonRecord[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch {}
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function titleToGender(titre?: string): "Féminin" | "Masculin" | string {
  if (!titre) return "";
  const s = titre.toLowerCase();
  if (s.includes("mme")) return "Féminin";
  if (s.includes("m.")) return "Masculin";
  return titre;
}
function makeUserId(t: Tache): string {
  const u = t.utilisateurs?.[0];
  const n = (t.nss || "").replace(/\D+/g, "");
  if (n) return `USR-${n}`;
  const nom = (u?.nom || "").normalize("NFD").replace(/[^\p{L}]+/gu, "");
  const prenom = (u?.prenom || "")
    .normalize("NFD")
    .replace(/[^\p{L}]+/gu, "");
  return `USR-${(nom + prenom || t.id).toUpperCase()}`;
}

// 🔸 Exporté pour réutilisation si besoin
export function buildPersonFromTask(
  t: Tache,
  treatmentDate = new Date()
): PersonRecord {
  const u = t.utilisateurs?.[0];
  const id = makeUserId(t);
  const ligneAdresse = [u?.adresse, u?.npa, u?.ville].filter(Boolean).join(" ");

  return {
    id,
    isApplicant: true,
    registrationDate: toISODate(treatmentDate),
    firstName: u?.prenom || "",
    lastName: (u?.nom || "").toUpperCase(),
    gender: titleToGender(u?.titre),
    adresse: u?.adresse || ligneAdresse,
    address: u?.adresse || ligneAdresse,
    postalCode: u?.npa || "",
    city: u?.ville || "",
    socialSecurityNumber: t.nss || "",
    birthDate: u?.dateNaissance || "",
    household: [],
  };
}

function upsertPerson(next: PersonRecord): { userId: string; created: boolean } {
  const people = readPeople();
  const byNssIdx =
    next.socialSecurityNumber && next.socialSecurityNumber.trim()
      ? people.findIndex(
          (p) =>
            (p.socialSecurityNumber || "").replace(/\D+/g, "") ===
            next.socialSecurityNumber!.replace(/\D+/g, "")
        )
      : -1;
  const byIdIdx = people.findIndex((p) => p.id === next.id);
  const idx = byNssIdx >= 0 ? byNssIdx : byIdIdx;

  if (idx >= 0) {
    const prev = people[idx];
    people[idx] = {
      ...prev,
      ...next,
      firstName: next.firstName || prev.firstName,
      lastName: next.lastName || prev.lastName,
      address: next.address || prev.address,
      adresse: next.adresse || prev.adresse,
      postalCode: next.postalCode || prev.postalCode,
      city: next.city || prev.city,
      socialSecurityNumber:
        next.socialSecurityNumber || prev.socialSecurityNumber,
    };
    writePeople(people);
    return { userId: people[idx].id, created: false };
  }

  people.push(next);
  writePeople(people);
  return { userId: next.id, created: true };
}

export async function traiterTache(
  t: Tache,
  opts?: { now?: Date }
): Promise<{ userId: string; created: boolean }> {
  if (!t || !t.utilisateurs || t.utilisateurs.length === 0) {
    throw new Error("Tâche invalide : aucun utilisateur rattaché.");
  }
  const now = opts?.now ?? new Date();
  const person = buildPersonFromTask(t, now);
  const res = upsertPerson(person);
  return res;
}
