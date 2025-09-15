//src/components/entry/mocks.ts
import type { SaveEntryPayload, Tache, Utilisateur } from "./types";
import { ensureValidUser, normalizeNss, normalizeIsoDate } from "./utils";

type PeopleJsonRecord = { nss: string } & Utilisateur;
type PeopleJson = PeopleJsonRecord[] | { people: PeopleJsonRecord[] };

export async function mockSearchUserByNSS(nss: string): Promise<Utilisateur[]> {
  try {
    const res = await fetch("/people.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json: PeopleJson = await res.json();
    const list: PeopleJsonRecord[] = Array.isArray(json) ? json : json?.people ?? [];
    const target = normalizeNss(nss);
    const matches = list.filter((p) => normalizeNss(p.nss) === target);
    return matches.map(({ nss: _omit, ...u }) => ensureValidUser(u));
  } catch (e) {
    console.error("people.json read error:", e);
    return [];
  }
}

export async function mockSaveEntry(payload: SaveEntryPayload): Promise<Tache> {
  await new Promise((r) => setTimeout(r, 250));
  const now = new Date();
  const id = `T-${now.getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
  const dossier = `DOS-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;
  return {
    id,
    dossier: payload.dossier ?? dossier,
    nss: payload.nss,
    reception: payload.reception,
    motif: payload.motif,
    voie: payload.voie,
    par: payload.par,
    observation: payload.observation || "",
    statut: payload.statut,
    priorite: payload.prioritaire ? "Haute" : "Basse",
    llm: false,
    utilisateurs: payload.utilisateurs.map((u) => ({
      ...u,
      dateNaissance: normalizeIsoDate(u.dateNaissance),
    })),
  };
}
