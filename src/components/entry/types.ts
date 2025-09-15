//src/components/entry/types.ts
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
  statut: Tache["statut"]; // "À traiter"
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

/** Adulte affiché dans l’UI */
export type UIUser = Utilisateur & {
  email?: string;
  curateur?: boolean;
  nss?: string;
};
