import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import type { NewEntryModalProps, UIUser, Utilisateur } from "./types";
import { ageFromISO, ensureValidUser, isLikelyNSS, normalizeNss, parseNameDob, todayISO } from "./utils";

import EntrySearchBar from "./EntrySearchBar";
import EntryResultsList from "./EntryResultsList";
import EntryMinimalForm from "./EntryMinimalForm";
import EntryAdultsList from "./EntryAdultsList";
import EntryChildrenControls from "./EntryChildrenControls";
import EntryAddressForm from "./EntryAddressForm";
import EntryMeta from "./EntryMeta";
import EntryTagsAndCollabs from "./EntryTagsAndCollabs";
import EntryAttachments from "./EntryAttachments";
import EntryFooter from "./EntryFooter";

const MAX_ADULTS = 2;

const uiKey = (u: Partial<UIUser>) =>
  `${(u.nom || "").trim().toUpperCase()}|${(u.prenom || "")
    .trim()
    .toUpperCase()}|${u.dateNaissance || ""}`;

const sortByAgeDesc = (list: UIUser[]) =>
  [...list].sort((a, b) => new Date(a.dateNaissance).getTime() - new Date(b.dateNaissance).getTime()); // plus âgé d’abord

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

const NewEntryModal: React.FC<NewEntryModalProps> = ({
  open,
  onOpenChange,
  searchUserByNSS,
  saveEntry,
  agentInitials,
  onSaved,
}) => {
  // --------- Barre de recherche unique ----------
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [searchResults, setSearchResults] = useState<Utilisateur[]>([]);

  // --------- Métadonnées ----------
  const [reception, setReception] = useState<string>(todayISO());
  const [voie, setVoie] = useState<"Guichet" | "Courrier" | "Email" | "Jaxform" | "Collaborateur">("Guichet");
  const [motif, setMotif] = useState<"Inscription" | "Renouvellement" | "Mise à jour" | "Contrôle" | "Résiliation" | "Préfecture" | "Gérance">("Inscription");
  const [prioritaire, setPrioritaire] = useState(false);

  // --------- Ménage (adultes) ----------
  const [people, setPeople] = useState<UIUser[]>([]);
  const adultsCount = useMemo(() => people.reduce((n, p) => n + (ageFromISO(p.dateNaissance) >= 18 ? 1 : 0), 0), [people]);

  // --------- Enfants (compteurs) ----------
  const [childMinors, setChildMinors] = useState(0);
  const [childMajors, setChildMajors] = useState(0);
  const totalHousehold = adultsCount + childMinors + childMajors;

  // --------- Adresse ----------
  const [addr, setAddr] = useState({ adresse: "", npa: "", ville: "" });

  // --------- Obs + collaborateurs ----------
  const [observation, setObservation] = useState("");
  const [collabInput, setCollabInput] = useState("");
  const [collabTags, setCollabTags] = useState<string[]>([]);

  // --------- Fichiers ----------
  const [attachments, setAttachments] = useState<File[]>([]);

  // --------- Erreurs ----------
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // reset à l'ouverture
    setQuery("");
    setSearching(false);
    setSearchAttempted(false);
    setSearchResults([]);
    setReception(todayISO());
    setVoie("Guichet");
    setMotif("Inscription");
    setPrioritaire(false);
    setPeople([]);
    setChildMinors(0);
    setChildMajors(0);
    setAddr({ adresse: "", npa: "", ville: "" });
    setObservation("");
    setCollabInput("");
    setCollabTags([]);
    setAttachments([]);
    setError(null);
  }, [open]);

  // ---------- Ajout adulte ----------
  function addUIUser(u: Partial<UIUser>) {
    const next = mergePeople(people, [u as UIUser]);
    const nextAdults = next.filter((p) => ageFromISO(p.dateNaissance) >= 18);
    if (nextAdults.length > MAX_ADULTS) {
      setError(`Maximum ${MAX_ADULTS} adultes autorisés.`);
      return;
    }
    setPeople(next);
  }

  // ---------- Update / remove ----------
  function updatePerson(i: number, patch: Partial<UIUser>) {
    setPeople((prev) => {
      const next = prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p));
      return sortByAgeDesc(next);
    });
  }
  function removePerson(i: number) {
    setPeople((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ---------- Recherche / Ajout ----------
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
      } catch {
        setError("Recherche NSS impossible.");
      } finally {
        setSearching(false);
      }
      return;
    }
    // cas "Nom Prénom Date" : on affichera le form minimal prérempli (voir plus bas)
  }

  const parsedMinimal = useMemo(() => parseNameDob(query || ""), [query]);

  // ---------- Compteurs enfants ----------
  const addMinor = () => setChildMinors((n) => n + 1);
  const removeMinor = () => setChildMinors((n) => Math.max(0, n - 1));
  const addMajor = () => setChildMajors((n) => n + 1);
  const removeMajor = () => setChildMajors((n) => Math.max(0, n - 1));

  // ---------- Collaborateurs ----------
  const addCollabTag = () => {
    const t = (collabInput || "").trim();
    if (!t) return;
    const formatted = t.startsWith("@") ? t : `@${t}`;
    if (!collabTags.includes(formatted)) {
      setCollabTags((prev) => [...prev, formatted]);
    }
    setCollabInput("");
  };
  const removeCollabTag = (tag: string) => setCollabTags((prev) => prev.filter((t) => t !== tag));

  // ---------- Fichiers ----------
  function onFilesSelected(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files);
    const ok = arr.filter((f) => f.size <= 10 * 1024 * 1024 && /(\.pdf|\.png|\.jpg|\.jpeg|\.docx)$/i.test(f.name));
    setAttachments((prev) => [...prev, ...ok]);
  }

  // ---------- Validation ----------
  const formValid = reception && voie && motif && adultsCount > 0;

  // ---------- Publication ----------
  async function publish() {
    if (!formValid) return;
    setError(null);
    try {
      const utilisateursPublies: Utilisateur[] = people.map((p) => ({
        ...ensureValidUser(p),
        adresse: addr.adresse || "",
        npa: addr.npa || "",
        ville: addr.ville || "",
        nbPers: totalHousehold,
        nbEnf: childMinors,
      }));

      const collabNote = collabTags.length > 0 ? ` [${collabTags.join(", ")}]` : "";
      const fullObservation = `${(observation || "").trim()}${collabNote}`.trim();

      const t = await saveEntry({
        nss: isLikelyNSS(query) ? normalizeNss(query) : "",
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
    } catch {
      setError("Échec de la publication.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="new-entry-title">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-3xl rounded-xl bg-white dark:bg-neutral-900 shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 id="new-entry-title" className="text-base md:text-lg font-semibold">Nouvelle entrée</h2>
          <button className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/10" onClick={() => onOpenChange(false)} aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pt-3 pb-4 overflow-y-auto flex-1 space-y-4">
          <EntrySearchBar query={query} setQuery={setQuery} onSearchOrAdd={onSearchOrAdd} searching={searching} />

          {/* Résultats NSS */}
          <EntryResultsList
            visible={searchAttempted && isLikelyNSS(query) && searchResults.length > 0}
            results={searchResults}
            onPick={(p) => {
              if (adultsCount >= MAX_ADULTS) return setError(`Maximum ${MAX_ADULTS} adultes autorisés.`);
              addUIUser({ ...p, nss: normalizeNss(query) });
              if (!addr.adresse && !addr.npa && !addr.ville) setAddr({ adresse: p.adresse, npa: p.npa, ville: p.ville });
            }}
          />

          {/* Saisie minimale */}
          {((searchAttempted && isLikelyNSS(query) && searchResults.length === 0) || (!!parsedMinimal && !isLikelyNSS(query))) && (
            <EntryMinimalForm
              defaultNom={parsedMinimal?.nom}
              defaultPrenom={parsedMinimal?.prenom}
              defaultDob={parsedMinimal?.dob}
              onAdd={(u) => {
                if (adultsCount >= MAX_ADULTS) return setError(`Maximum ${MAX_ADULTS} adultes autorisés.`);
                addUIUser(u);
              }}
            />
          )}

          {/* Ménage: résumé + enfants */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ménage — <b>{totalHousehold}</b> pers. • <b>{adultsCount}</b> adultes • <b>{childMajors}</b> enfants majeurs • <b>{childMinors}</b> enfants mineurs
              </div>
              <EntryChildrenControls minors={childMinors} majors={childMajors} addMinor={addMinor} removeMinor={removeMinor} addMajor={addMajor} removeMajor={removeMajor} />
            </div>

            <EntryAdultsList people={people} onUpdate={updatePerson} onRemove={removePerson} />
          </div>

          <EntryAddressForm
            adresse={addr.adresse}
            npa={addr.npa}
            ville={addr.ville}
            onChange={(patch) => setAddr((p) => ({ ...p, ...patch }))}
          />

          <EntryMeta
            reception={reception}
            setReception={setReception}
            voie={voie}
            setVoie={setVoie}
            motif={motif}
            setMotif={setMotif}
            prioritaire={prioritaire}
            setPrioritaire={setPrioritaire}
          />

          <EntryTagsAndCollabs
            observation={observation}
            setObservation={setObservation}
            collabInput={collabInput}
            setCollabInput={setCollabInput}
            collabTags={collabTags}
            addCollabTag={addCollabTag}
            removeCollabTag={removeCollabTag}
          />

          <EntryAttachments onFilesSelected={onFilesSelected} />

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <EntryFooter
          total={totalHousehold}
          adults={adultsCount}
          majors={childMajors}
          minors={childMinors}
          address={addr.adresse}
          npa={addr.npa}
          city={addr.ville}
          onCancel={() => onOpenChange(false)}
          onPublish={publish}
          disabled={!formValid}
        />
      </motion.div>
    </div>
  );
};

export default NewEntryModal;
