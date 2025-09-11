// src/features/interactions/store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Types d'interaction (reprend ton 1er snippet) */
export type InteractionTypeKey =
  | "telephone" | "guichet" | "courrier" | "mail"
  | "attestation" | "conformite" | "relance" | "note";

/** Fichiers attachés (reprend ton 2e snippet) */
export type InteractionFile = {
  name: string;
  url?: string;
  size?: number;
  type?: string;
};

/** Type unifié qui couvre les 2 codes */
export type Interaction = {
  // de base
  id: string;
  userId: string;
  type: InteractionTypeKey;
  channel?: string;
  author?: string;

  createdAt: string; // ISO
  updatedAt?: string; // ajouté dans le 2e code

  subject?: string;
  message?: string;
  observations?: string;

  // tags « génériques » du 1er code
  tags?: string[];

  // drapeau alerte + métadonnées
  isAlert?: boolean;
  meta?: Record<string, any>;

  // options / tags « métier » du 2e code
  commentOptions?: string[];  // ex: ["dossier", "complément", ...]
  observationTags?: string[]; // ex: ["Refus", "Incomplet", ...]
  files?: InteractionFile[];
};

/**
 * Payload d'ajout : on autorise d’omettre id / createdAt / updatedAt,
 * on les génère nous-mêmes. (userId + type doivent exister.)
 */
export type AddPayload =
  Omit<Interaction, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  };

type State = {
  interactions: Interaction[];
  /** Ajoute et retourne l'id créé */
  addInteraction: (p: AddPayload) => string;
  /** Patch partiel + mise à jour du updatedAt */
  updateInteraction: (id: string, patch: Partial<Interaction>) => void;
  removeInteraction: (id: string) => void;
  /** Récupérer par user */
  getByUser: (userId: string) => Interaction[];
  /** Reset total (utile pour tests) */
  reset: () => void;
};

function genId(): string {
  try {
    // crypto peut être absent en environnements SSR/tests
    // @ts-ignore
    if (globalThis?.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {}
  return Math.random().toString(36).slice(2);
}

export const useInteractionsStore = create<State>()(
  persist(
    (set, get) => ({
      interactions: [],

      addInteraction: (p) => {
        if (!p.userId) throw new Error("userId est obligatoire");
        if (!p.type) throw new Error("type est obligatoire");

        const id = p.id ?? genId();
        const createdAt = p.createdAt ?? new Date().toISOString();
        const updatedAt = p.updatedAt ?? new Date().toISOString();

        const entry: Interaction = {
          id,
          createdAt,
          updatedAt,
          ...p,
        };

        set((s) => ({ interactions: [entry, ...s.interactions] }));
        return id;
      },

      updateInteraction: (id, patch) =>
        set((s) => ({
          interactions: s.interactions.map((it) =>
            it.id === id
              ? { ...it, ...patch, updatedAt: new Date().toISOString() }
              : it
          ),
        })),

      removeInteraction: (id) =>
        set((s) => ({
          interactions: s.interactions.filter((it) => it.id !== id),
        })),

      getByUser: (userId) => get().interactions.filter((it) => it.userId === userId),

      reset: () => set({ interactions: [] }),
    }),
    {
      name: "interactions-store", // clé localStorage
      storage: createJSONStorage(() => localStorage),
      // Si tu avais l'ancien store "interactions", ajoute ici une migration si besoin.
      // migrate: (persisted, version) => persisted,
    }
  )
);