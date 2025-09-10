// src/features/interactions/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type InteractionTypeKey =
  | "telephone" | "guichet" | "courrier" | "mail"
  | "attestation" | "conformite" | "relance" | "note";

export type StoreInteraction = {
  id: string;
  userId: string;
  type: InteractionTypeKey;
  channel?: string;
  author?: string;
  createdAt: string; // ISO
  subject?: string;
  message?: string;
  observations?: string;
  tags?: string[];
  isAlert?: boolean;
  meta?: Record<string, any>;
};

type AddPayload = Omit<StoreInteraction, "id" | "createdAt"> & {
  createdAt?: string;
};

type State = {
  interactions: StoreInteraction[];
  addInteraction: (p: AddPayload) => string;
  updateInteraction: (id: string, patch: Partial<StoreInteraction>) => void;
  removeInteraction: (id: string) => void;
};

export const useInteractionsStore = create<State>()(
  persist(
    (set) => ({
      interactions: [],
      addInteraction: (p) => {
        const id =
          (globalThis.crypto && "randomUUID" in globalThis.crypto
            ? (globalThis.crypto as any).randomUUID()
            : Math.random().toString(36).slice(2)) as string;

        const createdAt = p.createdAt ?? new Date().toISOString();

        const entry: StoreInteraction = {
          id,
          createdAt,
          ...p,
        };

        set((s) => ({ interactions: [entry, ...s.interactions] }));
        return id;
      },
      updateInteraction: (id, patch) =>
        set((s) => ({
          interactions: s.interactions.map((i) =>
            i.id === id ? { ...i, ...patch } : i
          ),
        })),
      removeInteraction: (id) =>
        set((s) => ({
          interactions: s.interactions.filter((i) => i.id !== id),
        })),
    }),
    { name: "interactions" }
  )
);
