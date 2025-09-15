//src/components/interaction/journal.ts
import * as people from "@/data/peopleClient";
import { isAdresseInImmeubles } from "@/data/immeubles";
import { INTERACTION_TYPES, InteractionFormData } from "@/types/interaction";
import { useJournalStore } from "@/features/journal/store";

export type JournalUtilisateur = {
  titre: "M." | "Mme" | string;
  nom: string;
  prenom: string;
  dateNaissance: string; // ISO YYYY-MM-DD
  adresse: string;
  npa: string;
  ville: string;
  nbPers: number;
  nbEnf: number;
};

export type JournalTache = {
  id: string;
  dossier: string;
  nss: string;
  reception: string; // ISO YYYY-MM-DD
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
  utilisateurs: JournalUtilisateur[];
  observationTags?: Array<"Refus" | "Incomplet" | "Dérogation">;
};

export const makeJournalId = () =>
  `T-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const toISO = (s?: string) => {
  if (!s) return "";
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
};

export const motifFromSubject = (
  subject: string
): JournalTache["motif"] => {
  const s = (subject || "").toLowerCase();
  if (s.includes("contrôle")) return "Contrôle";
  if (s.includes("résiliation")) return "Résiliation";
  if (s.includes("inscription")) return "Inscription";
  if (s.includes("renouvel")) return "Renouvellement";
  if (s.includes("préfecture")) return "Préfecture";
  if (s.includes("gérance")) return "Gérance";
  return "Mise à jour";
};

export const voieFromType = (
  t: keyof typeof INTERACTION_TYPES
): JournalTache["voie"] => {
  switch (t) {
    case "guichet":
      return "Guichet";
    case "courrier":
      return "Courrier";
    case "email":
      return "Email";
    case "jaxform":
      return "Jaxform";
    default:
      return "Guichet";
  }
};

export async function publishToJournal(params: {
  formData: InteractionFormData;
  selectedType: keyof typeof INTERACTION_TYPES;
  relatedUsers?: JournalUtilisateur[];
  dossierId?: string;
  nss?: string;
  agentName?: string;
  isLLM?: boolean;
}): Promise<JournalTache> {
  const {
    formData,
    selectedType,
    relatedUsers = [],
    dossierId = "DOS-AUTO",
    nss = "",
    agentName = "Agent",
    isLLM,
  } = params;

  const base: Omit<JournalTache, "utilisateurs" | "llm"> = {
    id: makeJournalId(),
    dossier: dossierId,
    nss,
    reception: todayISO(),
    motif: motifFromSubject(formData.subject || formData.customSubject || ""),
    voie: voieFromType(selectedType),
    par: agentName,
    observation:
      (formData.observations || "").trim() ||
      (formData.comment || "").trim() ||
      "",
    statut: "À traiter",
    priorite: formData.isAlert ? "Haute" : "Basse",
  };

  // utilisateurs
  let users = relatedUsers ?? [];
  if ((!users || users.length === 0) && nss) {
    const row = await people.getByNSS(nss);
    if (row) users = [people.toJournalUtilisateur(row)];
  }
  const usersISO = (users ?? []).map((u) => ({
    ...u,
    dateNaissance: toISO(u.dateNaissance),
  }));

  // LLM auto si pas précisé
  const autoLLM = usersISO.some((u) =>
    isAdresseInImmeubles([u.adresse, u.npa, u.ville].filter(Boolean).join(" "))
  );
  const llmFlag = typeof isLLM === "boolean" ? isLLM : autoLLM;

  const finalEntry: JournalTache = {
    ...base,
    utilisateurs: usersISO,
    llm: llmFlag,
    observationTags: [...(formData.observationTags ?? [])],
  };

  // MAJ store + event
  try {
    useJournalStore.getState().addTask(finalEntry as any);
  } catch (e) {
    console.warn("[publishToJournal] addTask error:", e);
  }

  window.dispatchEvent(new CustomEvent("journal:add", { detail: finalEntry }));
  return finalEntry;
}
