import type { ColKey, Tache } from "./types";

export const INITIAL_WIDTHS: Record<ColKey, number> = {
  id: 180,
  reception: 120,
  motif: 160,
  voie: 160,
  par: 100,
  statut: 140,
  observation: 360,
  priorite: 100,
  actions: 180,
};

export const MIN_WIDTHS: Record<ColKey, number> = {
  id: 120,
  reception: 110,
  motif: 120,
  voie: 120,
  par: 90,
  statut: 120,
  observation: 240,
  priorite: 90,
  actions: 150,
};

export const statutOrder: Tache["statut"][] = [
  "À traiter",
  "En traitement",
  "En suspens",
  "Validé",
  "Refusé",
];

export const prioriteOrder: Tache["priorite"][] = ["Haute", "Basse"];
