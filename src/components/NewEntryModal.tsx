// src/components/NewEntryModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Loader2,
  Search as SearchIcon,
  Save,
  UploadCloud,
  UserPlus,
  UserMinus,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ================== Types alignés avec Journal.tsx ================== */
export type Utilisateur = {
  titre: "M." | "Mme" | string;
  nom: string;
  prenom: string;
  dateNaissance: string; // ISO yyyy-MM-dd
  adresse: string;
  npa: string;
  ville: string;
  nbPers: number;
  nbEnf: number;
};

export type Tache = {
  id: string;
  dossier: string;
  nss: string;
  reception: string; // ISO yyyy-MM-dd
  motif:
    | "Inscription"
    | "Renouvellement"
    | "Mise à jour"
    | "Contrôle"
    | "Résiliation"
    | "Préfecture"
    | "Gérance";
  voie: "Guichet" | "Courrier" | "Email" | "Jaxform";
  par: string;
  observation: string;
  statut: "À traiter" | "En traitement" | "En suspens" | "Validé" | "Refusé";
  priorite: "Haute" | "Basse";
  llm: boolean;
  utilisateurs: Utilisateur[];
};

export type SaveEntryPayload = {
  nss: string;
  dossier?: string;
  reception: string;
  motif: Tache["motif"];
  voie: Tache["voie"];
  par: string;
  observation?: string;
  statut: Tache["statut"]; // forcé à "À traiter"
  prioritaire: boolean;
  utilisateurs: Utilisateur[];
  attachments?: File[];
};

export type NewEntryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchUserByNSS: (nss: string) => Promise<Utilisateur[]>;
  saveEntry: (payload: SaveEntryPayload) => Promise<Tache>;
  agentInitials: string;
  onSaved: (t: Tache) => void;
};

/* ================== Utils ================== */
type PeopleJsonRecord = { nss: string } & Utilisateur;
type PeopleJson = PeopleJsonRecord[] | { people: PeopleJsonRecord[] };

const todayISO = () => new Date().toISOString().slice(0, 10);
const normalizeNss = (n: string) => (n || "").replace(/[^\d]/g, "");
const isLikelyNSS = (s: string) => normalizeNss(s).length >= 11;

function normalizeIsoDate(s: string): string {
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
function normalizeTitre(t: string): "M." | "Mme" {
  const raw = (t || "").toLowerCase();
  if (/[♀]|(^|\b)(f|fem|femme|female|mme|madame|mrs|ms)(\b|\.|$)/i.test(raw))
    return "Mme";
  if (/[♂]|(^|\b)(m(?!me)\b|mr|homme|male|monsieur)(\b|\.|$)/i.test(raw))
    return "M.";
  return raw.trim().startsWith("f") ? "Mme" : "M.";
}
function ensureValidUser(u: Partial<Utilisateur>): Utilisateur {
  return {
    titre: normalizeTitre(u.titre || "M."),
    nom: u.nom || "",
    prenom: u.prenom || "",
    dateNaissance:
      normalizeIsoDate(u.dateNaissance || "2000-01-01") || "2000-01-01",
    adresse: u.adresse || "",
    npa: u.npa || "",
    ville: u.ville || "",
    nbPers: Number.isFinite(u.nbPers as any) ? (u.nbPers as number) : 1,
    nbEnf: Number.isFinite(u.nbEnf as any) ? (u.nbEnf as number) : 0,
  };
}
const ageFromISO = (iso: string): number => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
};

/** Parsage "Nom Prénom JJ.MM.AAAA" (ou YYYY-MM-DD). */
function parseNameDob(input: string): { nom: string; prenom: string; dob: string } | null {
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

/* ================== Exports mocks (compat Journal.tsx) ================== */
export async function mockSearchUserByNSS(nss: string): Promise<Utilisateur[]> {
  try {
    const res = await fetch("/people.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json: PeopleJson = await res.json();
    const list: PeopleJsonRecord[] = Array.isArray(json)
      ? json
      : json?.people ?? [];
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
  const id = `T-${now.getFullYear()}-${String(
    Math.floor(Math.random() * 10000)
  ).padStart(4, "0")}`;
  const dossier = `DOS-${String(Math.floor(Math.random() * 99999)).padStart(
    5,
    "0"
  )}`;
  return {
    id,
    dossier: payload.dossier ?? dossier,
    nss: payload.nss,
    reception: payload.reception,
    motif: payload.motif,
    voie: payload.voie,
    par: payload.par,
    observation: payload.observation || "",
    statut: payload.statut, // "À traiter"
    priorite: payload.prioritaire ? "Haute" : "Basse",
    llm: false,
    utilisateurs: payload.utilisateurs,
  };
}

/* ================== Composant ================== */
/** Personne en UI (adulte uniquement ici) */
type UIUser = Utilisateur & {
  email?: string;
  curateur?: boolean;
  nss?: string;
};
const uiKey = (u: Partial<UIUser>) =>
  `${(u.nom || "").trim().toUpperCase()}|${(u.prenom || "")
    .trim()
    .toUpperCase()}|${normalizeIsoDate(u.dateNaissance || "")}`;

export default function NewEntryModal({
  open,
  onOpenChange,
  searchUserByNSS,
  saveEntry,
  agentInitials,
  onSaved,
}: NewEntryModalProps) {
  /* ---------- Barre de recherche unique ---------- */
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [searchResults, setSearchResults] = useState<Utilisateur[]>([]);

  /* ---------- Métadonnées ---------- */
  const [reception, setReception] = useState<string>(todayISO());
  const [voie, setVoie] = useState<Tache["voie"]>("Guichet");
  const [motif, setMotif] = useState<Tache["motif"]>("Inscription");
  const [prioritaire, setPrioritaire] = useState(false);

  /* ---------- Ménage ---------- */
  const [people, setPeople] = useState<UIUser[]>([]); // ADULTES uniquement
  const adultsCount = useMemo(
    () => people.reduce((n, p) => n + (ageFromISO(p.dateNaissance) >= 18 ? 1 : 0), 0),
    [people]
  );

  // Nouveaux compteurs “enfants” (pas de fiches, juste des nombres)
  const [childMinors, setChildMinors] = useState(0);
  const [childMajors, setChildMajors] = useState(0);

  const totalHousehold = adultsCount + childMinors + childMajors;

  /* ---------- Adresse ménage ---------- */
  const [addr, setAddr] = useState({ adresse: "", npa: "", ville: "" });

  /* ---------- Observation + tags ---------- */
  const QUICK_TAGS = ["Refus", "Incomplet", "Dérogation"] as const;
  const [observation, setObservation] = useState("");

  // Collaborateurs à notifier (@tag)
  const [collabInput, setCollabInput] = useState("");
  const [collabTags, setCollabTags] = useState<string[]>([]);

  /* ---------- Fichiers ---------- */
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------- Erreurs ---------- */
  const [error, setError] = useState<string | null>(null);

  /* ---------- Effet reset à l’ouverture ---------- */
  useEffect(() => {
    if (!open) return;
    resetAll();
  }, [open]);

  /* ---------- Helpers ménage ---------- */
  function sortByAgeDesc(list: UIUser[]) {
    return [...list].sort(
      (a, b) =>
        new Date(a.dateNaissance).getTime() - new Date(b.dateNaissance).getTime()
    ); // plus âgé d’abord
  }

  function mergePeople(prev: UIUser[], next: (UIUser | Utilisateur)[]) {
    const byKey = new Map<string, UIUser>();
    const all: UIUser[] = [
      ...prev,
      ...next.map((n) => ({
        ...ensureValidUser(n as any),
        email: (n as any).email || "",
        curateur: !!(n as any).curateur,
        nss: (n as any).nss || undefined,
      })),
    ];
    for (const u of all) byKey.set(uiKey(u), { ...u });
    return sortByAgeDesc(Array.from(byKey.values()));
  }

  function addUIUser(u: Partial<UIUser>) {
    const base = ensureValidUser(u);
    const enriched: UIUser = {
      ...base,
      email: u.email || "",
      curateur: !!u.curateur,
      nss: u.nss,
    };
    setPeople((prev) => mergePeople(prev, [enriched]));
  }

  function updatePerson(i: number, patch: Partial<UIUser>) {
    setPeople((prev) => {
      const next = prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p));
      return sortByAgeDesc(next);
    });
  }

  function removePerson(i: number) {
    setPeople((prev) => prev.filter((_, idx) => idx !== i));
  }

  /* ---------- Barre unique : rechercher/ajouter ---------- */
  async function onSearchOrAdd() {
    setError(null);
    setSearchAttempted(true);
    setSearchResults([]);

    if (!query.trim()) return;

    if (isLikelyNSS(query)) {
      try {
        setSearching(true);
        const found = await searchUserByNSS(query);
        setSearchResults(found);
        // Si trouvé: afficher “Reprendre”
        // Si non trouvé: proposer saisie minimale
      } catch {
        setError("Recherche NSS impossible.");
      } finally {
        setSearching(false);
      }
      return;
    }

    // Cas Nom Prénom Date -> la saisie minimale s’affiche en-dessous (préremplie)
  }

  /* ---------- Ajouts/Retraits rapides d’enfants (compteurs) ---------- */
  const addMinor = () => setChildMinors((n) => n + 1);
  const removeMinor = () => setChildMinors((n) => Math.max(0, n - 1));
  const addMajorChild = () => setChildMajors((n) => n + 1);
  const removeMajorChild = () => setChildMajors((n) => Math.max(0, n - 1));

  /* ---------- Tags rapides et collaborateurs ---------- */
  function onQuickTagToggle(tag: string) {
    const has = observation.toLowerCase().includes(tag.toLowerCase());
    if (has) {
      const re = new RegExp(`\\b${tag}\\b`, "gi");
      const next = observation.replace(re, "").replace(/\s{2,}/g, " ").trim();
      setObservation(next);
    } else {
      setObservation((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  }

  function addCollabTag() {
    const t = (collabInput || "").trim();
    if (!t) return;
    const formatted = t.startsWith("@") ? t : `@${t}`;
    if (!collabTags.includes(formatted)) {
      setCollabTags((prev) => [...prev, formatted]);
    }
    setCollabInput("");
  }
  function removeCollabTag(tag: string) {
    setCollabTags((prev) => prev.filter((t) => t !== tag));
  }

  function onFilesSelected(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    const ok = arr.filter(
      (f) =>
        f.size <= 10 * 1024 * 1024 &&
        /(\.pdf|\.png|\.jpg|\.jpeg|\.docx)$/i.test(f.name)
    );
    setAttachments((prev) => [...prev, ...ok]);
  }

  function resetAll() {
    setQuery("");
    setSearching(false);
    setSearchAttempted(false);
    setSearchResults([]);
    setReception(todayISO());
    setVoie("Guichet");
    setMotif("Inscription");
    setPrioritaire(false);
    setPeople([]); // adultes seulement
    setChildMinors(0);
    setChildMajors(0);
    setAddr({ adresse: "", npa: "", ville: "" });
    setObservation("");
    setCollabInput("");
    setCollabTags([]);
    setAttachments([]);
    setDragOver(false);
    setError(null);
  }

  /* ---------- Form minimal auto-prérempli à partir de la query ---------- */
  const parsedMinimal = useMemo(() => parseNameDob(query || ""), [query]);

  /* ---------- Validation de publication ---------- */
  const formValid = reception && voie && motif && adultsCount > 0; // au moins 1 adulte

  /* ---------- Publication ---------- */
  async function publish() {
    if (!formValid) return;
    setError(null);
    try {
      // Adultes publiés
      const utilisateursPublies: Utilisateur[] = people.map((p) => ({
        ...ensureValidUser(p),
        adresse: addr.adresse || "",
        npa: addr.npa || "",
        ville: addr.ville || "",
        nbPers: totalHousehold, // adultes + enfants (mineurs + majeurs)
        nbEnf: childMinors, // mineurs uniquement
      }));

      // Injecter les @collab dans l’observation
      const collabNote =
        collabTags.length > 0 ? ` [${collabTags.join(", ")}]` : "";
      const fullObservation = `${(observation || "").trim()}${collabNote}`.trim();

      const t = await saveEntry({
        nss: isLikelyNSS(query) ? query : "",
        reception,
        motif,
        voie,
        par: agentInitials,
        observation: fullObservation,
        statut: "À traiter",
        prioritaire,
        utilisateurs: utilisateursPublies,
        attachments,
      });

      onSaved(t);
      onOpenChange(false);
      resetAll();
    } catch {
      setError("Échec de la publication.");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-entry-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-3xl rounded-xl bg-white dark:bg-neutral-900 shadow-xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 id="new-entry-title" className="text-base md:text-lg font-semibold">
            Nouvelle entrée
          </h2>
          <button
            className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => onOpenChange(false)}
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pt-3 pb-4 overflow-y-auto flex-1 space-y-4">
          {/* Barre unique : NSS ou "Nom Prénom JJ.MM.AAAA" */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
            <label className="text-xs text-gray-600 dark:text-gray-400">
              NSS ou “Nom Prénom JJ.MM.AAAA”
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearchOrAdd()}
                  placeholder={`756.1234.5678.97  ou  MARTIN Sophie 01.01.1990`}
                  className="w-full h-9 pl-8 rounded border border-gray-300 bg-white dark:bg-neutral-900 px-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={onSearchOrAdd}
                disabled={searching || !query.trim()}
                className="h-9 px-3 rounded bg-gray-900 text-white text-sm inline-flex items-center gap-2 disabled:opacity-50"
                title="Rechercher / Ajouter"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                Rechercher
              </button>
            </div>

            {/* Résultats NSS trouvés */}
            <AnimatePresence initial={false}>
              {searchAttempted && isLikelyNSS(query) && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 rounded-md border p-3 bg-slate-50 dark:bg-neutral-800"
                >
                  <div className="text-xs font-medium mb-2">Personnes trouvées :</div>
                  <div className="space-y-2">
                    {searchResults.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 bg-white dark:bg-neutral-900 rounded border px-2 py-2"
                      >
                        <div className="text-sm">
                          <span className="font-medium">{p.nom.toUpperCase()} {p.prenom}</span>{" "}
                          — {p.dateNaissance} • {p.adresse}, {p.npa} {p.ville}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            addUIUser({ ...p, nss: normalizeNss(query) });
                            // Pré-remplir adresse ménage si vide
                            if (!addr.adresse && !addr.npa && !addr.ville) {
                              setAddr({ adresse: p.adresse, npa: p.npa, ville: p.ville });
                            }
                          }}
                          className="h-8 px-2 rounded border text-xs"
                        >
                          Reprendre
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Saisie minimale si non trouvé ou cas “Nom Prénom Date” */}
            {(searchAttempted && isLikelyNSS(query) && searchResults.length === 0) ||
            (!!parsedMinimal && !isLikelyNSS(query)) ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-md border p-3 bg-slate-50 dark:bg-neutral-800"
              >
                <div className="text-xs font-medium mb-2">Saisie minimale (adulte)</div>
                <div className="grid md:grid-cols-6 gap-2">
                  <select
                    className="border px-2 h-9 rounded text-sm"
                    defaultValue="M."
                    id="min-titre"
                  >
                    <option value="M.">♂️ M</option>
                    <option value="Mme">♀️ F</option>
                  </select>
                  <input
                    id="min-nom"
                    className="border px-2 h-9 rounded text-sm md:col-span-2"
                    placeholder="NOM"
                    defaultValue={parsedMinimal?.nom || ""}
                  />
                  <input
                    id="min-prenom"
                    className="border px-2 h-9 rounded text-sm md:col-span-2"
                    placeholder="Prénom"
                    defaultValue={parsedMinimal?.prenom || ""}
                  />
                  <input
                    id="min-dob"
                    type="date"
                    className="border px-2 h-9 rounded text-sm"
                    defaultValue={parsedMinimal?.dob || ""}
                    title="YYYY-MM-DD"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-2 mt-2 items-center">
                  <input
                    id="min-email"
                    className="border px-2 h-9 rounded text-sm md:col-span-2"
                    placeholder="Email (optionnel)"
                  />
                  <label
                    htmlFor="min-curateur"
                    className="inline-flex items-center gap-2 text-sm px-2"
                  >
                    <input id="min-curateur" type="checkbox" className="h-4 w-4" />
                    <ShieldCheck className="h-4 w-4" /> Curateur
                  </label>
                </div>

                <div className="mt-2">
                  <button
                    type="button"
                    className="h-8 px-3 rounded border text-sm"
                    onClick={() => {
                      const titre = (document.getElementById("min-titre") as HTMLSelectElement)
                        ?.value as "M." | "Mme";
                      const nom = (document.getElementById("min-nom") as HTMLInputElement)?.value || "";
                      const prenom =
                        (document.getElementById("min-prenom") as HTMLInputElement)?.value || "";
                      const dob = normalizeIsoDate(
                        (document.getElementById("min-dob") as HTMLInputElement)?.value || ""
                      );
                      const email =
                        (document.getElementById("min-email") as HTMLInputElement)?.value || "";
                      const curateur = !!(document.getElementById("min-curateur") as HTMLInputElement)
                        ?.checked;

                      if (!nom || !prenom || !dob) {
                        setError("Compléter NOM, Prénom et Date de naissance.");
                        return;
                      }
                      addUIUser({ titre, nom, prenom, dateNaissance: dob, email, curateur });
                    }}
                  >
                    Ajouter
                  </button>
                </div>
              </motion.div>
            ) : null}
          </div>

          {/* Liste des adultes + actions rapides enfants */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ménage — <b>{totalHousehold}</b> pers. • <b>{adultsCount}</b> adultes •{" "}
                <b>{childMajors}</b> enfants majeurs • <b>{childMinors}</b> enfants mineurs
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addMinor}
                  className="h-8 px-2 rounded border text-xs inline-flex items-center gap-1"
                  title="Ajouter enfant mineur"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Enfant (−18)
                </button>
                <button
                  type="button"
                  onClick={removeMinor}
                  className="h-8 px-2 rounded border text-xs inline-flex items-center gap-1"
                  title="Retirer enfant mineur"
                >
                  <UserMinus className="h-3.5 w-3.5" /> Enfant (−18)
                </button>
                <button
                  type="button"
                  onClick={addMajorChild}
                  className="h-8 px-2 rounded border text-xs inline-flex items-center gap-1"
                  title="Ajouter enfant majeur"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Enfant (+18)
                </button>
                <button
                  type="button"
                  onClick={removeMajorChild}
                  className="h-8 px-2 rounded border text-xs inline-flex items-center gap-1"
                  title="Retirer enfant majeur"
                >
                  <UserMinus className="h-3.5 w-3.5" /> Enfant (+18)
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {people.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  Aucun adulte. Utilise la barre ci-dessus pour rechercher/ajouter.
                </motion.div>
              )}

              {people.map((p, i) => (
                <motion.div
                  key={uiKey(p)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 grid md:grid-cols-6 gap-2 items-center"
                >
                  <select
                    className="border px-2 h-9 rounded text-sm"
                    value={p.titre}
                    onChange={(e) => updatePerson(i, { titre: e.target.value as "M." | "Mme" })}
                    aria-label="Sexe"
                  >
                    <option value="M.">♂️ M</option>
                    <option value="Mme">♀️ F</option>
                  </select>

                  <input
                    className="border px-2 h-9 rounded text-sm"
                    placeholder="NOM"
                    value={p.nom}
                    onChange={(e) => updatePerson(i, { nom: e.target.value.toUpperCase() })}
                  />
                  <input
                    className="border px-2 h-9 rounded text-sm"
                    placeholder="Prénom"
                    value={p.prenom}
                    onChange={(e) => updatePerson(i, { prenom: e.target.value })}
                  />
                  <input
                    type="date"
                    className="border px-2 h-9 rounded text-sm"
                    value={p.dateNaissance}
                    onChange={(e) => updatePerson(i, { dateNaissance: normalizeIsoDate(e.target.value) })}
                    title="YYYY-MM-DD"
                  />
                  <input
                    className="border px-2 h-9 rounded text-sm"
                    placeholder="Email (optionnel)"
                    value={p.email || ""}
                    onChange={(e) => updatePerson(i, { email: e.target.value })}
                  />
                  <label className="inline-flex items-center gap-2 justify-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={!!p.curateur}
                      onChange={(e) => updatePerson(i, { curateur: e.target.checked })}
                    />
                    <span className="text-xs inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Curateur
                    </span>
                  </label>

                  <div className="md:col-span-6 flex justify-end">
                    <button
                      className="text-lg"
                      onClick={() => removePerson(i)}
                      title="Supprimer"
                    >
                      ❌
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Adresse du ménage */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 grid md:grid-cols-3 gap-2">
            <div className="md:col-span-3">
              <label className="text-xs text-gray-600 dark:text-gray-400">Adresse du ménage</label>
              <input
                className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
                placeholder="Rue, n°"
                value={addr.adresse}
                onChange={(e) => setAddr((p) => ({ ...p, adresse: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">NPA</label>
              <input
                className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
                placeholder="1000"
                value={addr.npa}
                onChange={(e) => setAddr((p) => ({ ...p, npa: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">Ville</label>
              <input
                className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
                placeholder="Lausanne"
                value={addr.ville}
                onChange={(e) => setAddr((p) => ({ ...p, ville: e.target.value }))}
              />
            </div>
          </div>

          {/* Métadonnées + priorité */}
          <div className="grid md:grid-cols-4 gap-2">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Réception</label>
              <input
                type="date"
                className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
                value={reception}
                onChange={(e) => setReception(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Voie</label>
              <select
                className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
                value={voie}
                onChange={(e) => setVoie(e.target.value as Tache["voie"])}
              >
                {["🏢 Guichet", "📮 Courrier", "📧 Email", "💻 Jaxform"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Motif</label>
              <select
                className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
                value={motif}
                onChange={(e) => setMotif(e.target.value as Tache["motif"])}
              >
                {[
                  "📝 Inscription",
                  "🔄 Renouvellement",
                  "✏️ Mise à jour",
                  "🔍 Contrôle",
                  "❌ Résiliation",
                  "⚖️ Préfecture",
                  "🏠 Gérance",
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-lg" title="Priorité">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={prioritaire}
                  onChange={(e) => setPrioritaire(e.target.checked)}
                />
                ❗
              </label>
            </div>
          </div>

          {/* Tags rapides + Observation */}
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tags rapides</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_TAGS.map((tag) => {
                const active = observation.toLowerCase().includes(tag.toLowerCase());
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onQuickTagToggle(tag)}
                    className={`px-2 py-1 rounded text-xs border transition ${
                      active
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white dark:bg-neutral-900 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                    aria-pressed={active}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Collaborateurs à notifier */}
            <div className="mt-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Collaborateurs à notifier (tags)
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
                  placeholder="@initiales ou nom"
                  value={collabInput}
                  onChange={(e) => setCollabInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCollabTag()}
                />
                <button
                  type="button"
                  className="h-9 px-3 rounded border text-sm"
                  onClick={addCollabTag}
                  disabled={!collabInput.trim()}
                >
                  Ajouter
                </button>
              </div>
              {collabTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {collabTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs"
                    >
                      {t}
                      <button
                        type="button"
                        className="text-red-600"
                        onClick={() => removeCollabTag(t)}
                        title="Retirer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <label className="text-xs text-gray-600 dark:text-gray-400 mt-3 block">
              Observation
            </label>
            <textarea
              className="w-full border rounded p-2 min-h-20 bg-white dark:bg-neutral-900 text-sm"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex. Incomplet pièces manquantes, Dérogation accordée, Refus client..."
            />
          </div>

          {/* Pièces jointes */}
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Pièces jointes
            </label>
            <div
              className={`mt-2 rounded border-2 border-dashed p-4 text-sm cursor-pointer select-none ${
                dragOver
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                onFilesSelected(e.dataTransfer.files);
              }}
              role="button"
              aria-label="Déposer des fichiers ici ou cliquer pour sélectionner"
            >
              <div className="flex items-center justify-center gap-2">
                <UploadCloud className="h-5 w-5" />
                <span>
                  Glisser-déposer, ou <span className="underline">cliquer</span>
                </span>
              </div>
              <div className="mt-1 text-[11px] text-gray-500">
                PDF, PNG/JPG, DOCX • 10 Mo max/fichier
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={(e) => onFilesSelected(e.target.files)}
                aria-hidden
              />
            </div>
          </div>

          {/* Erreurs */}
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        {/* Footer avec résumé + actions */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <b>Résumé :</b> {totalHousehold} pers. • {adultsCount} adultes • {childMajors} enfants
            majeurs • {childMinors} enfants mineurs
            {addr.adresse || addr.npa || addr.ville ? (
              <>
                {" "}
                • {addr.adresse}, {addr.npa} {addr.ville}
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 px-3 rounded border text-sm" onClick={() => onOpenChange(false)}>
              Annuler
            </button>
            <button
              className="h-9 px-4 rounded bg-gray-900 text-white text-sm disabled:opacity-50 inline-flex items-center gap-2"
              disabled={!formValid}
              onClick={publish}
              title={!formValid ? "Ajouter au moins un adulte et compléter Réception/Voie/Motif" : "Publier"}
            >
              <Save className="h-4 w-4" /> Publier
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
