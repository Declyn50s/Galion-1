export interface Interaction {
  id: string;
  type:
    | "guichet"
    | "telephone"
    | "courrier"
    | "email"
    | "jaxform"
    | "commentaire";
  subject: string;
  customSubject?: string;

  /** Texte principal (commentaire) */
  comment: string;

  /** Tags “collaborateurs/mentions” */
  tags: string[];

  /** Texte d’observation */
  observations: string;

  /** Badge alerte */
  isAlert: boolean;

  /** ✅ OPTIONS de commentaire cochées (dossier, docs listés, …) */
  commentOptions?: string[];

  /** ✅ TAGS d’observation (Refus, Incomplet, Dérogation) */
  observationTags?: string[];

  createdAt: string;
  updatedAt: string;
}

export interface InteractionFormData {
  subject: string;
  customSubject?: string;
  comment: string;
  tags: string[];
  observations: string;
  isAlert: boolean;

  /** ✅ Ajoutés pour persister l’UI */
  commentOptions?: string[];
  observationTags?: string[];
}

export const PREDEFINED_SUBJECTS = [
  "inscription",
  "renouvellement",
  "mise à jour",
  "contrôle",
  "résiliation",
  "rendez-vous",
  "gérance",
  "autres",
];

export const INTERACTION_TYPES = {
  guichet: { label: "Guichet", icon: "Building", color: "blue" },
  telephone: { label: "Téléphone", icon: "Phone", color: "green" },
  courrier: { label: "Courrier", icon: "Mail", color: "purple" },
  email: { label: "E-mail", icon: "Mail", color: "orange" },
  jaxform: { label: "Jaxform", icon: "FileCheck", color: "indigo" },
  commentaire: { label: "Commentaire", icon: "MessageSquare", color: "yellow" },
} as const;

// Mock API (facultatif – inchangé sauf prise en compte des nouveaux champs)
export const mockAPI = {
  create: async (
    data: InteractionFormData & { type: string }
  ): Promise<Interaction> => {
    await new Promise((r) => setTimeout(r, 300));
    const now = new Date().toISOString();
    const interaction: Interaction = {
      id: Date.now().toString(),
      type: data.type as Interaction["type"],
      subject: data.subject,
      customSubject: data.customSubject,
      comment: data.comment,
      tags: data.tags,
      observations: data.observations,
      isAlert: data.isAlert,
      commentOptions: data.commentOptions ?? [],
      observationTags: data.observationTags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    return interaction;
  },

  update: async (
    id: string,
    data: Partial<InteractionFormData>
  ): Promise<Interaction> => {
    await new Promise((r) => setTimeout(r, 200));
    const now = new Date().toISOString();
    // ⚠️ C’est un mock : renvoie un objet “complet” simplifié
    const interaction: Interaction = {
      id,
      type: "guichet",
      subject: data.subject || "",
      customSubject: data.customSubject,
      comment: data.comment || "",
      tags: data.tags || [],
      observations: data.observations || "",
      isAlert: !!data.isAlert,
      commentOptions: data.commentOptions ?? [],
      observationTags: data.observationTags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    return interaction;
  },
};
