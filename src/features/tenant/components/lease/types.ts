// src/features/tenant/components/lease/types.ts
export type LawBase = "LC.53" | "LC.65" | "LC.75" | "LC.2007" | "RC.47" | "RC.53" | "RC.65";
export type LawGroup = "RC" | "LC.53" | "LC.65" | "LC.75" | "LC.2007" | "UNKNOWN";

export type TerminationReason =
  | "SON_NOTOIRE"
  | "SOS_SIMPLE"
  | "RTE"
  | "DIF"
  | "SUR_OCCUPATION"
  | "AUTRE";

export type ProlongationType = "AUCUNE" | "CONVENTION" | "AUDIENCE";

export type AidState = "maintenue" | "partielle" | "supprimée" | "non-applicable";

export type RuleOutcome = {
  resiliation: boolean;
  supplementPercent?: number;
  supplementNote?: string;
  supplementIsQuarterly?: boolean;
  aides: {
    cantonales: { etat: AidState; delaiMois?: number };
    communales: { etat: AidState; delaiMois?: number };
    AS: { etat: AidState; delaiMois?: number };
  };
  notes: string[];
};

export type Exceptions = {
  conciergePro60?: boolean;
  avsSeul3Pieces?: boolean;
};

export type LeaseValue = {
  startDate?: string;
  endDate?: string;
  legalBase?: LawBase;
  lpg?: boolean;
  building?: string | number;
  address?: string;
  entry?: string | number;
  aptNumber?: string | number;
  floor?: string;
  rooms?: number;

  rentNetMonthly?: number;
  rentLoweredMonthly?: number;
  chargesMonthly?: number;

  suppressionAidCanton?: number;
  suppressionAidCommune?: number;
  communityRent?: number;
  federalAidRent?: number;
  bailSupplement?: number;
  bailRentAlone?: number;

  terminationDate?: string;
  terminationReason?: TerminationReason;
  prolongationType?: ProlongationType;
  terminationEffective?: boolean;
  terminationProlongationEnd?: string;

  overrunPercent?: number;
  newSupplement?: number;

  as1p?: [number, number, number, number];

  conciergePro60?: boolean;
  avsSeul3Pieces?: boolean;

  agency?: {
    name?: string;
    phone?: string;
    address?: string;
    npa?: string;
    city?: string;
    email?: string;
  };

  // rétrocompat
  terminationVisa?: "Ordinaire" | "Extraordinaire" | "Pour sous-occupation" | "Autre";
};

export type LeaseCardCommonProps = {
  value?: LeaseValue;
  onChange?: (next: LeaseValue) => void;
  className?: string;
};

export type OnClicks = {
  onModifyDates?: () => void;
  onModifyRent?: () => void;
  onTerminateLease?: () => void;
};
