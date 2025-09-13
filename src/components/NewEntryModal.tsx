// src/components/NewEntryModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Loader2,
  Search as SearchIcon,
  Save,
  UploadCloud,
} from "lucide-react";

/*-----------Helper--------------------- */

const todayISO = () => new Date().toISOString().slice(0, 10);

function resetAll() {
  setNss("");
  setSearching(false);
  setReception(todayISO());
  setVoie("Guichet");
  setMotif("Inscription");
  setPrioritaire(false);
  setPeople([]); // vide le ménage
  setAddr({ adresse: "", npa: "", ville: "" });
  setObservation("");
  setAttachments([]);
  setDragOver(false);
  setError(null);
}

/* ---------------- Types alignés avec Journal.tsx ---------------- */
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
  voie: "Guichet" | "Courrier" | "Email" | "Jaxform" | "Collaborateur";
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

/* ---------------- Utils ---------------- */
type PeopleJsonRecord = { nss: string } & Utilisateur;
type PeopleJson = PeopleJsonRecord[] | { people: PeopleJsonRecord[] };

function normalizeNss(n: string) {
  return (n || "").replace(/[^\d]/g, "");
}
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
  // symboles/abréviations fréquents
  if (/[♀]|(^|\b)(f|fem|femme|female|mme|madame|mrs|ms)(\b|\.|$)/i.test(raw))
    return "Mme";
  if (/[♂]|(^|\b)(m(?!me)\b|mr|homme|male|monsieur)(\b|\.|$)/i.test(raw))
    return "M.";
  // fallback selon première lettre
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
function ageFromISO(iso: string): number {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

/* ---------------- Mocks compatibles (si besoin) ---------------- */
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

/* ---------------- Composant ---------------- */
export default function NewEntryModal({
  open,
  onOpenChange,
  searchUserByNSS,
  saveEntry,
  agentInitials,
  onSaved,
}: NewEntryModalProps) {
  // NSS
  const [nss, setNss] = useState("");
  const [searching, setSearching] = useState(false);

  // Métadonnées
  const [reception, setReception] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [voie, setVoie] = useState<Tache["voie"]>("Guichet");
  const [motif, setMotif] = useState<Tache["motif"]>("Inscription");
  const [prioritaire, setPrioritaire] = useState(false);

  // Ménage (personnes UI = adultes + enfants, mais seuls les adultes seront publiés)
  const [people, setPeople] = useState<Utilisateur[]>([]);
  const minorsCount = useMemo(
    () =>
      people.reduce(
        (n, p) => n + (ageFromISO(p.dateNaissance) < 18 ? 1 : 0),
        0
      ),
    [people]
  );
  const totalHousehold = people.length; // adultes + enfants (pour le résumé et nbPers publié)

  // Adresse ménage (après personnes)
  const [addr, setAddr] = useState({ adresse: "", npa: "", ville: "" });

  // Observation + tags (mots bruts)
  const TAGS = ["Refus", "Incomplet", "Dérogation"] as const;
  const [observation, setObservation] = useState("");

  // Fichiers
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // État
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSearching(false);
    setError(null);
  }, [open]);

  const isNssValid = useMemo(() => normalizeNss(nss).length >= 11, [nss]);

  // --- Recherche & ajout (append + dédoublonnage par Nom|Prénom|Naissance) ---
  async function addFromNSS() {
    if (!isNssValid || searching) return;
    try {
      setSearching(true);
      const found = await searchUserByNSS(nss);
      if (found.length === 0) return;
      setPeople((prev) => mergePeople(prev, found));
      // Init adresse ménage si vide
      if (!addr.adresse && !addr.npa && !addr.ville) {
        const f = found[0];
        setAddr({
          adresse: f.adresse || "",
          npa: f.npa || "",
          ville: f.ville || "",
        });
      }
    } catch {
      setError("Recherche NSS impossible.");
    } finally {
      setSearching(false);
    }
  }

  function mergePeople(prev: Utilisateur[], next: Utilisateur[]) {
    const byKey = new Map<string, Utilisateur>();
    const all = [...prev, ...next.map((n) => ensureValidUser(n))];
    for (const u of all) byKey.set(personKey(u), ensureValidUser(u));
    return Array.from(byKey.values());
  }
  function personKey(u: Partial<Utilisateur>): string {
    const nom = (u.nom || "").trim().toUpperCase();
    const prenom = (u.prenom || "").trim().toUpperCase();
    const dob = normalizeIsoDate(u.dateNaissance || "");
    return `${nom}|${prenom}|${dob}`;
  }

  // --- Ajouts rapides (placés en bas de la liste) ---
  function addBlankAdult() {
    setPeople((prev) => [
      ...prev,
      ensureValidUser({ titre: "M.", dateNaissance: "1990-01-01" }),
    ]);
  }
  function addMinorChild() {
    setPeople((prev) => [
      ...prev,
      ensureValidUser({ titre: "M.", dateNaissance: "2012-01-01" }),
    ]); // <18
  }
  function addAdultChild() {
    setPeople((prev) => [
      ...prev,
      ensureValidUser({ titre: "M.", dateNaissance: "2000-01-01" }),
    ]); // >=18
  }

  // --- Edition / suppression ---
  function updatePerson(i: number, patch: Partial<Utilisateur>) {
    setPeople((prev) =>
      prev.map((p, idx) =>
        idx === i ? ensureValidUser({ ...p, ...patch }) : p
      )
    );
  }
  function removePerson(i: number) {
    setPeople((prev) => prev.filter((_, idx) => idx !== i));
  }

  // --- Tags → ajout/ retrait de mot brut dans la note ---
  function onTagToggle(tag: string) {
    const has = observation.toLowerCase().includes(tag.toLowerCase());
    if (has) {
      const re = new RegExp(`\\b${tag}\\b`, "gi");
      const next = observation
        .replace(re, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      setObservation(next);
    } else {
      setObservation((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  }

  // --- Fichiers ---
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

  // --- Publication ---
  const formValid =
    isNssValid && reception && voie && motif && totalHousehold > 0;

  async function publish() {
    if (!formValid) return;
    setError(null);
    setSaving(true);
    try {
      const adults = people.filter((p) => ageFromISO(p.dateNaissance) >= 18);

      // Propager adresse ménage + compteurs aux ADULTES UNIQUEMENT
      const utilisateursPublies = adults.map((p) => ({
        ...p,
        titre: normalizeTitre(p.titre || "M."),
        adresse: addr.adresse || "",
        npa: addr.npa || "",
        ville: addr.ville || "",
        nbPers: totalHousehold, // adultes + enfants
        nbEnf: minorsCount, // seulement enfants
        dateNaissance:
          normalizeIsoDate(p.dateNaissance || "2000-01-01") || "2000-01-01",
      }));

      const t = await saveEntry({
        nss,
        reception,
        motif,
        voie,
        par: agentInitials,
        observation: observation.trim(),
        statut: "À traiter",
        prioritaire,
        utilisateurs: utilisateursPublies, // <<< enfants exclus
        attachments,
      });

      onSaved(t);
      onOpenChange(false);
    } catch {
      setError("Échec de la publication.");
    } finally {
      setSaving(false);
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
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative w-full max-w-2xl rounded-xl bg-white dark:bg-neutral-900 shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2
            id="new-entry-title"
            className="text-base md:text-lg font-semibold"
          >
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

        {/* Body scrollable */}
        <div className="px-4 pt-3 pb-4 overflow-y-auto flex-1 space-y-4">
          {/* NSS (➕) */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 grid md:grid-cols-3 gap-2 items-end">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">
                NSS (recherche)
              </label>
              <div className="relative">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  value={nss}
                  onChange={(e) => setNss(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addFromNSS()}
                  placeholder="756.1234.5678.97"
                  className="w-full h-9 pl-8 rounded border border-gray-300 bg-white dark:bg-neutral-900 px-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 md:justify-end">
              {/* Bouton NSS = emoji ➕ seul */}
              <button
                type="button"
                onClick={addFromNSS}
                disabled={!isNssValid || searching}
                className="h-9 w-9 mt-5 md:mt-0 rounded border text-lg flex items-center justify-center disabled:opacity-50"
                title={!isNssValid ? "NSS invalide" : "Ajouter depuis NSS"}
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "➕"
                )}
              </button>
            </div>
          </div>

          {/* Liste personnes */}
          <div className="space-y-2">
            {people.length === 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Aucun membre. Rechercher un NSS (➕) ou ajouter manuellement en
                bas.
              </div>
            )}
            {people.map((p, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 grid md:grid-cols-5 gap-2"
              >
                <select
                  className="border px-2 h-9 rounded text-sm"
                  value={p.titre}
                  onChange={(e) =>
                    updatePerson(i, { titre: e.target.value as "M." | "Mme" })
                  }
                  aria-label="Sexe"
                >
                  <option value="M.">♂️ M</option>
                  <option value="Mme">♀️ F</option>
                </select>
                <input
                  className="border px-2 h-9 rounded text-sm"
                  placeholder="Nom"
                  value={p.nom}
                  onChange={(e) => updatePerson(i, { nom: e.target.value })}
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
                  onChange={(e) =>
                    updatePerson(i, { dateNaissance: e.target.value })
                  }
                  title="YYYY-MM-DD"
                />
                <div className="flex items-center justify-end">
                  <button
                    className="text-lg"
                    onClick={() => removePerson(i)}
                    title="Supprimer"
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}

            {/* Boutons d'ajout sous la liste */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={addBlankAdult}
                className="h-9 rounded border px-2 text-sm"
              >
                + Personne
              </button>
              <button
                type="button"
                onClick={addMinorChild}
                className="h-9 rounded border px-2 text-sm"
                title="Ajouter enfant mineur"
              >
                + Enfant (−18)
              </button>
              <button
                type="button"
                onClick={addAdultChild}
                className="h-9 rounded border px-2 text-sm"
                title="Ajouter enfant majeur"
              >
                + Enfant (+18)
              </button>
            </div>
          </div>

          {/* Adresse du ménage (APRÈS les personnes) */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 grid md:grid-cols-3 gap-2">
            <div className="md:col-span-3">
              <label className="text-xs text-gray-600 dark:text-gray-400">
                Adresse du ménage
              </label>
              <input
                className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
                placeholder="Rue, n°"
                value={addr.adresse}
                onChange={(e) =>
                  setAddr((p) => ({ ...p, adresse: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">
                NPA
              </label>
              <input
                className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
                placeholder="1000"
                value={addr.npa}
                onChange={(e) =>
                  setAddr((p) => ({ ...p, npa: e.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">
                Ville
              </label>
              <input
                className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
                placeholder="Lausanne"
                value={addr.ville}
                onChange={(e) =>
                  setAddr((p) => ({ ...p, ville: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Métadonnées + priorité (❗) */}
          <div className="grid md:grid-cols-4 gap-2">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">
                Réception
              </label>
              <input
                type="date"
                className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
                value={reception}
                onChange={(e) => setReception(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">
                Voie
              </label>
              <select
                className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
                value={voie}
                onChange={(e) => setVoie(e.target.value as Tache["voie"])}
              >
                {[
                  "Guichet",
                  "Courrier",
                  "Email",
                  "Jaxform",
                  "Collaborateur",
                ].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">
                Motif
              </label>
              <select
                className="w-full h-9 border rounded px-2 bg-white dark:bg-neutral-900 text-sm"
                value={motif}
                onChange={(e) => setMotif(e.target.value as Tache["motif"])}
              >
                {[
                  "Inscription",
                  "Renouvellement",
                  "Mise à jour",
                  "Contrôle",
                  "Résiliation",
                  "Préfecture",
                  "Gérance",
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label
                className="inline-flex items-center gap-2 text-lg"
                title="Priorité"
              >
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

          {/* Tags + Observation */}
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Tags rapides
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {TAGS.map((tag) => {
                const active = observation
                  .toLowerCase()
                  .includes(tag.toLowerCase());
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onTagToggle(tag)}
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
            <label className="text-xs text-gray-600 dark:text-gray-400">
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

        {/* Footer avec résumé unique */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <b>Résumé :</b> {totalHousehold} pers. • {minorsCount} enfant
            {minorsCount > 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="h-9 px-3 rounded border text-sm"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </button>
            <button
              className="h-9 px-4 rounded bg-gray-900 text-white text-sm disabled:opacity-50 inline-flex items-center gap-2"
              disabled={!formValid || saving}
              onClick={publish}
              title={
                !formValid
                  ? "Compléter NSS et ajouter au moins 1 personne"
                  : "Publier"
              }
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}{" "}
              Publier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
