// src/features/journal/store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/* ================== Types ================== */
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
  id: string; // ex: T-2025-0001
  dossier: string; // ex: DOS-87412
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
  voie: "Guichet" | "Courrier" | "Email" | "Jaxform" | "Collaborateur";
  par: string;
  observation: string;
  statut: "À traiter" | "En traitement" | "En suspens" | "Validé" | "Refusé";
  priorite: "Haute" | "Basse";
  llm: boolean;
  utilisateurs: Utilisateur[];
};

/* ================== Données de démo (mêmes que Journal.tsx) ================== */
const SAMPLE: Tache[] = [
  {
    id: "T-2025-0001",
    dossier: "DOS-87412",
    nss: "756.1234.5678.97",
    reception: "2025-06-03",
    motif: "Inscription",
    voie: "Guichet",
    par: "Alice Bernard",
    observation: "Demande prioritaire",
    statut: "À traiter",
    priorite: "Haute",
    llm: true,
    utilisateurs: [
      {
        titre: "Mme",
        nom: "Durand",
        prenom: "Claire",
        dateNaissance: "1994-09-12",
        adresse: "Rue des Lilas 12",
        npa: "1000",
        ville: "Lausanne",
        nbPers: 2,
        nbEnf: 1,
      },
      {
        titre: "M.",
        nom: "Durand",
        prenom: "Paul",
        dateNaissance: "1990-01-03",
        adresse: "Rue des Lilas 12",
        npa: "1000",
        ville: "Lausanne",
        nbPers: 2,
        nbEnf: 1,
      },
    ],
  },
  {
    id: "T-2025-0015",
    dossier: "DOS-91022",
    nss: "756.9999.0000.18",
    reception: "2025-07-18",
    motif: "Mise à jour",
    voie: "Email",
    par: "Derval Botuna",
    observation: "",
    statut: "En traitement",
    priorite: "Basse",
    llm: false,
    utilisateurs: [
      {
        titre: "M.",
        nom: "Martin",
        prenom: "Jean",
        dateNaissance: "1988-05-22",
        adresse: "Av. du Rhône 24",
        npa: "1200",
        ville: "Genève",
        nbPers: 1,
        nbEnf: 0,
      },
    ],
  },
  {
    id: "T-2025-0032",
    dossier: "DOS-99310",
    nss: "756.1111.2222.33",
    reception: "2025-05-09",
    motif: "Contrôle",
    voie: "Courrier",
    par: "Chloé Dupuis",
    observation: "à envoyer par mail",
    statut: "En suspens",
    priorite: "Basse",
    llm: true,
    utilisateurs: [
      {
        titre: "M.",
        nom: "Leroy",
        prenom: "Alex",
        dateNaissance: "2001-11-02",
        adresse: "Chemin Vert 5",
        npa: "1020",
        ville: "Renens",
        nbPers: 3,
        nbEnf: 2,
      },
      {
        titre: "M.",
        nom: "Leroy",
        prenom: "Marc",
        dateNaissance: "1979-03-14",
        adresse: "Chemin Vert 5",
        npa: "1020",
        ville: "Renens",
        nbPers: 3,
        nbEnf: 2,
      },
      {
        titre: "Mme",
        nom: "Leroy",
        prenom: "Nina",
        dateNaissance: "1982-08-30",
        adresse: "Chemin Vert 5",
        npa: "1020",
        ville: "Renens",
        nbPers: 3,
        nbEnf: 2,
      },
    ],
  },
  {
    id: "T-2025-0040",
    dossier: "DOS-10001",
    nss: "756.5555.4444.22",
    reception: "2025-08-05",
    motif: "Renouvellement",
    voie: "Jaxform",
    par: "Alice Bernard",
    observation: " ",
    statut: "Validé",
    priorite: "Basse",
    llm: true,
    utilisateurs: [
      {
        titre: "M.",
        nom: "Nguyen",
        prenom: "Bao",
        dateNaissance: "1999-12-01",
        adresse: "Rue du Lac 2",
        npa: "1007",
        ville: "Lausanne",
        nbPers: 1,
        nbEnf: 0,
      },
    ],
  },
];

/* ================== Store ================== */
type State = {
  tasks: Tache[];
  addTask: (t: Tache) => void; // upsert par id
  addTasks: (many: Tache[]) => void; // bulk
  updateTask: (id: string, patch: Partial<Tache>) => void;
  removeTask: (id: string) => void;
  reset: () => void;
};

export const useJournalStore = create<State>()(
  persist(
    (set, get) => ({
      tasks: SAMPLE, // données de démo (écrasées par localStorage ensuite)

      addTask: (t) =>
        set((s) => {
          const i = s.tasks.findIndex((x) => x.id === t.id);
          if (i >= 0) {
            const copy = [...s.tasks];
            copy[i] = { ...copy[i], ...t };
            return { tasks: copy };
          }
          return { tasks: [t, ...s.tasks] };
        }),

      addTasks: (many) =>
        set((s) => {
          const map = new Map<string, Tache>(s.tasks.map((x) => [x.id, x]));
          for (const t of many)
            map.set(t.id, { ...(map.get(t.id) || t), ...t });
          return {
            tasks: Array.from(map.values()).sort((a, b) =>
              a.id < b.id ? 1 : -1
            ),
          };
        }),

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),

      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) })),

      reset: () => set({ tasks: [] }),
    }),
    {
      name: "journal-store",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

/** Export par défaut (pour compat éventuelle) */
export default useJournalStore;
