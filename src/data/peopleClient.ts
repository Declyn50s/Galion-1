// src/data/peopleClient.ts
export type PersonRow = {
  nss?: string;
  genre: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  adresse: string;
  complement?: string;
  npa: string;
  ville: string;
  statut?: string;
};

export type JournalUtilisateur = {
  titre: "M." | "Mme" | string;
  nom: string;
  prenom: string;
  dateNaissance: string; // ISO
  adresse: string;
  npa: string;
  ville: string;
  nbPers: number;
  nbEnf: number;
};

// utils
const strip = (s: string) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const ddmmyyyy_to_iso = (s?: string) => {
  if (!s) return "";
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
};

const normalizeDate = (s?: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? "")) ? String(s) : ddmmyyyy_to_iso(s);

const normNSS = (s?: string) => String(s ?? "").replace(/\D/g, "");

const keyNameDob = (nom: string, prenom: string, dateNaissance: string) =>
  `${strip(nom)}|${strip(prenom)}|${normalizeDate(dateNaissance)}`;

const titreFromGenre = (genre?: string): "M." | "Mme" | string => {
  const g = String(genre ?? "").toLowerCase();
  if (g.includes("f") || g.includes("♀")) return "Mme";
  if (g.includes("m") || g.includes("♂")) return "M.";
  return genre || "";
};

// cache
const DATA_URL = "/people.json";
let loaded = false;
let loadPromise: Promise<void> | null = null;

let rows: PersonRow[] = [];
let byNSS = new Map<string, PersonRow>();
let byNameDob = new Map<string, PersonRow[]>();

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) {
      loadPromise = null;
      throw new Error(
        `peopleClient: échec de chargement ${DATA_URL} (${res.status})`
      );
    }
    const json = (await res.json()) as PersonRow[];
    rows = Array.isArray(json) ? json : [];

    byNSS = new Map();
    byNameDob = new Map();

    for (const r of rows) {
      if (r.nss) byNSS.set(normNSS(r.nss), r);
      const k = keyNameDob(r.nom, r.prenom, r.dateNaissance);
      const arr = byNameDob.get(k);
      if (arr) arr.push(r);
      else byNameDob.set(k, [r]);
    }

    loaded = true;
    loadPromise = null;
  })();

  return loadPromise;
}

// API
export async function getByNSS(nss?: string): Promise<PersonRow | undefined> {
  if (!nss) return undefined;
  await ensureLoaded();
  return byNSS.get(normNSS(nss));
}

export async function findByNameDob(
  nom: string,
  prenom: string,
  dateNaissance: string
): Promise<PersonRow[]> {
  await ensureLoaded();
  return byNameDob.get(keyNameDob(nom, prenom, dateNaissance)) ?? [];
}

export function toJournalUtilisateur(p: PersonRow): JournalUtilisateur {
  return {
    titre: titreFromGenre(p.genre),
    nom: p.nom || "",
    prenom: p.prenom || "",
    dateNaissance: normalizeDate(p.dateNaissance),
    adresse: [p.adresse, p.complement].filter(Boolean).join(", "),
    npa: p.npa || "",
    ville: p.ville || "",
    nbPers: 1,
    nbEnf: 0,
  };
}

// helpers dev (optionnels)
export function clearCache() {
  loaded = false;
  loadPromise = null;
  rows = [];
  byNSS.clear();
  byNameDob.clear();
}
export async function prewarm() {
  await ensureLoaded();
}
