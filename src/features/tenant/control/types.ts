// types forts du contrôle
// src/features/tenant/control/types.ts
export type Law = "RC" | "LC.53" | "LC.65" | "LC.75" | "LC.2007" | "UNKNOWN";
export type SON = "none" | "simple" | "notoire";
export type RTE = "none" | "lt20" | "gte20" | "unknown";
export type Motif = "CONFORME" | "SON_SIMPLE" | "SON_NOTOIRE" | "RTE_LT20" | "RTE_GTE20" | "DIF";
export type Decision =
  | { kind: "CONSERVATION" }
  | { kind: "SUPPLEMENT"; percent?: number }            // RC: 20% (SON simple), 50% (RTE), etc.
  | { kind: "SUPPRESSION_AIDES"; scope: "partielle" | "totale" }
  | { kind: "RESILIATION" };

export type ControlInput = {
  law: Law;
  rooms?: number;
  adults: number;
  minors: number;
  rduTotal?: number;
  cap?: number;
  exceptions?: { dm4Concierge?: boolean; dm5AVSSeul3p?: boolean };
};

export type ControlResult = {
  son: SON;
  rte: RTE;
  dif: boolean;
  percentOverCap?: number; // si cap connu
  notes: string[];
  recommended: Decision[];
};
