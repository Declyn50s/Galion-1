export type Utilisateur = {
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

export type Tache = {
  id: string;
  dossier: string;
  nss: string;
  reception: string; // ISO
  voie: "Guichet" | "Courrier" | "Email" | "Jaxform" | "Collaborateur";
  motif:
    | "Inscription"
    | "Renouvellement"
    | "Mise à jour"
    | "Contrôle"
    | "Résiliation"
    | "Préfecture"
    | "Gérance";
  par: string;
  observation: string;
  statut: "À traiter" | "En traitement" | "En suspens" | "Validé" | "Refusé";
  priorite: "Haute" | "Basse";
  llm: boolean;
  utilisateurs: Utilisateur[];
  observationTags?: Array<"Refus" | "Incomplet" | "Dérogation">;
};

export type SortKey = "id" | "reception" | "statut" | "priorite";
export type SortDir = "asc" | "desc";

export type ColKey =
  | "id"
  | "reception"
  | "motif"
  | "voie"
  | "par"
  | "statut"
  | "observation"
  | "priorite"
  | "actions";
