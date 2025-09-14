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

// Types minimalistes — garde les tiens si tu en as déjà
export type PeopleRecord = {
  id: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  adresse?: string;
  postalCode?: string;
  city?: string;
  socialSecurityNumber?: string;
  isApplicant?: boolean;
  registrationDate?: string;
  llmHint?: boolean;
  // ... tout autre champ de ta fiche
};

// ==== stockage mock: adapte à ta stack (localStorage, Zustand, API, etc.)
let _peopleCache: PeopleRecord[] = []; // si tu as déjà un cache, réutilise-le

function loadAll(): PeopleRecord[] {
  // remplace par ta source réelle
  return _peopleCache;
}
function saveAll(arr: PeopleRecord[]) {
  _peopleCache = arr;
}

export function findByNSS(nss?: string) {
  const nn = (nss || "").replace(/\s+/g, "");
  if (!nn) return undefined;
  return loadAll().find((p) => (p.socialSecurityNumber || "").replace(/\s+/g, "") === nn);
}

export function findByIdentity(lastName?: string, firstName?: string, birthDate?: string) {
  const ln = (lastName || "").trim().toUpperCase();
  const fn = (firstName || "").trim().toUpperCase();
  const bd = (birthDate || "").slice(0, 10);
  if (!ln || !fn || !bd) return undefined;
  return loadAll().find(
    (p) =>
      (p.lastName || "").toUpperCase() === ln &&
      (p.firstName || "").toUpperCase() === fn &&
      (p.birthDate || "").slice(0, 10) === bd
  );
}

export function upsertApplicantFromJournal(args: {
  nss?: string;
  dossier?: string;
  processedAtISO: string;
  profilePatch: Partial<PeopleRecord>;
}) {
  const all = loadAll();
  const principal = {
    lastName: args.profilePatch.lastName,
    firstName: args.profilePatch.firstName,
    birthDate: args.profilePatch.birthDate,
  };

  let existing =
    findByNSS(args.nss) ||
    findByIdentity(principal.lastName, principal.firstName, principal.birthDate);

  if (existing) {
    const next: PeopleRecord = {
      ...existing,
      ...args.profilePatch,
      isApplicant: true,
      // ne remplace registrationDate que si absente
      registrationDate: existing.registrationDate || args.processedAtISO,
    };
    const idx = all.findIndex((p) => p.id === existing!.id);
    all[idx] = next;
    saveAll(all);
    return { userId: existing.id, created: false };
  }

  const id = crypto.randomUUID();
  const created: PeopleRecord = {
    id,
    ...args.profilePatch,
    isApplicant: true,
    registrationDate: args.processedAtISO,
  };
  saveAll([...all, created]);
  return { userId: id, created: true };
}
