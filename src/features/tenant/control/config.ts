// CAP par régime, seuils, libellés, modèles courrier
// src/features/tenant/control/config.ts
import type { Law, Decision } from "./types";

/** Libellés (UI) des régimes légaux. */
export const LAW_LABELS: Record<Law, string> = {
  RC: "Anciennes lois (RC 47/53/65)",
  "LC.53": "LC.53",
  "LC.65": "LC.65",
  "LC.75": "LC.75",
  "LC.2007": "LC.2007",
  UNKNOWN: "Régime inconnu",
};

/** Fréquences de contrôle (en années). 
 *  Règle: on applique la plus stricte (min) entre communal et régime.
 */
export const CONTROL_FREQUENCY_YEARS = {
  withAS: 2, // Immeubles avec abaissement supplémentaire
  defaultByLaw: <Record<Law, number>>{
    RC: 4,
    "LC.53": 4, // inclus dans RCOL
    "LC.65": 4, // inclus dans RCOL
    "LC.75": 4, // RCOL
    "LC.2007": 1, // RRCOLM
    UNKNOWN: 3, // fallback
  },
  communal: 1, // Règlement communal = 1/an (mais min 1/3 ans)
  communalMinimum: 3, // borne supérieure pour tolérer les cas où 3 ans suffit
};

/** Seuils RTE */
export const RTE_THRESHOLDS = {
  LT20: 20, // < 20% = palier bas
};

/** Suppléments (pour RC) et barèmes usuels exprimés en pourcentage du loyer net. */
export const SUPPLEMENT_RATES = {
  RC_SON_SIMPLE: 0.20,
  RC_SON_NOTOIRE: 0.20,
  RC_RTE: 0.50,
};

/** Tolérances/Exceptions (points de pourcentage) */
export const EXCEPTIONS = {
  DM4_CONCIERGE_PCT_TOLERANCE: 40, // points de % soustraits au dépassement RTE
  DM5_NOTE:
    "DM5 : AVS seul en 3 pièces après décès/départ du conjoint — maintien possible (neutralise la résiliation SON).",
};

/** Décodage “famille” depuis la base brute (optionnel si déjà géré côté page). */
export function familyFromBase(base?: string | null): Law {
  const b = String(base || "").toUpperCase();
  if (b.includes("LC.2007")) return "LC.2007";
  if (b.includes("LC.75")) return "LC.75";
  if (b.includes("RC.") || b.includes("RC ")) return "RC";
  if (b.includes("LC.53")) return "LC.53";
  if (b.includes("LC.65")) return "LC.65";
  return "UNKNOWN";
}

/** Choix de la fréquence à appliquer.
 *  hasAS=true → 2 ans, sinon fréquence du régime,
 *  puis on contraint par le communal (min=1 an) sans dépasser le “minimum communal” de 3 ans si besoin.
 */
export function controlFrequencyYears(law: Law, hasAS: boolean): number {
  if (hasAS) return CONTROL_FREQUENCY_YEARS.withAS;
  const regime = CONTROL_FREQUENCY_YEARS.defaultByLaw[law] ?? CONTROL_FREQUENCY_YEARS.defaultByLaw.UNKNOWN;
  // Applique la contrainte communale (1 an), mais garde une soupape "minimum" à 3 ans si la pratique locale la tolère
  const bounded = Math.min(regime, CONTROL_FREQUENCY_YEARS.communal);
  return Math.min(Math.max(bounded, 1), CONTROL_FREQUENCY_YEARS.communal); // ici = 1 an
}

/* =========================
 *   COURRIERS / TEMPLATES
 * ========================= */

export type LetterTemplateId =
  | "CONSERVATION"
  | "SUPPLEMENT"
  | "SUPPRESSION_AIDES"
  | "RESILIATION"
  | "CONVOCATION"
  | "PROLONGATION_1"
  | "PROLONGATION_2"
  | "NOTIFICATION_GERANCE";

type Template = { subject: string; body: string };

export const LETTER_TEMPLATES: Record<LetterTemplateId, Template> = {
  CONSERVATION: {
    subject: "Décision – Maintien du logement",
    body: `
Madame, Monsieur,

Suite au contrôle du {{date_controle}}, nous vous informons que votre situation est **conforme** aux exigences en vigueur ({{regime}}).
Aucune mesure n'est prise. Votre logement est **maintenu**.

Référence dossier : {{ref}}
Adresse : {{adresse_complete}}

Nous vous prions d’agréer, Madame, Monsieur, nos salutations distinguées.

Office du contrôle des logements
    `.trim(),
  },

  SUPPLEMENT: {
    subject: "Décision – Supplément de loyer",
    body: `
Madame, Monsieur,

Suite au contrôle du {{date_controle}}, et au regard de votre situation ({{motif}}) sous le régime {{regime}},
nous vous informons qu’un **supplément de loyer** de **{{supplement_pct}}%** du loyer net est appliqué dès le {{date_effet}}.

Détails:
• Loyer net: CHF {{loyer_net}}
• Supplément: CHF {{montant_supplement}} ({{supplement_pct}}%)
• Motif: {{motif_detail}}

Référence dossier : {{ref}}
Adresse : {{adresse_complete}}

Vous pouvez, le cas échéant, faire valoir vos observations par écrit dans un délai de {{delai_observations}} jours.

Veuillez agréer, Madame, Monsieur, nos salutations distinguées.

Office du contrôle des logements
    `.trim(),
  },

  SUPPRESSION_AIDES: {
    subject: "Décision – Suppression des aides",
    body: `
Madame, Monsieur,

Suite au contrôle du {{date_controle}} et au regard de votre situation ({{motif}}) sous le régime {{regime}},
les **aides** communales/cantonales sont **supprimées** {{modalite_suppression}} à compter du {{date_effet}}.

Détails:
• RDU ménage: CHF {{rdu}}
• CAP barème: CHF {{cap}}
• Dépassement: {{rte_pct}}%

Référence dossier : {{ref}}
Adresse : {{adresse_complete}}

Vous pouvez déposer un recours dans les formes et délais légaux.

Veuillez agréer, Madame, Monsieur, nos salutations distinguées.

Office du contrôle des logements
    `.trim(),
  },

  RESILIATION: {
    subject: "Décision – Résiliation du bail",
    body: `
Madame, Monsieur,

Nous vous informons qu’au terme de la procédure de contrôle du {{date_controle}}, votre bail est **résilié** pour le motif suivant : {{motif_detail}}.
Régime applicable : {{regime}}.

La gérance est simultanément informée. La libération des locaux est fixée au {{date_sortie}}.
En cas de difficultés, vous pouvez solliciter une **prolongation** dans les limites légales (1ère par convention avec la gérance, 2ème et dernière devant la préfecture).

Référence dossier : {{ref}}
Adresse : {{adresse_complete}}

Veuillez agréer, Madame, Monsieur, nos salutations distinguées.

Office du contrôle des logements
    `.trim(),
  },

  CONVOCATION: {
    subject: "Convocation – Révision du dossier locataire",
    body: `
Madame, Monsieur,

Nous vous prions de bien vouloir vous présenter le {{date_rendezvous}} à {{heure_rendezvous}} ({{lieu}})
pour entretien dans le cadre de la **révision** de votre dossier ({{regime}}).

Documents à apporter : pièces d’identité, bail, justificatifs de revenus et charges, attestations diverses.

Référence dossier : {{ref}}
Adresse : {{adresse_complete}}

Avec nos salutations distinguées.

Office du contrôle des logements
    `.trim(),
  },

  PROLONGATION_1: {
    subject: "Prolongation – 1ère prolongation conventionnelle",
    body: `
Madame, Monsieur,

Suite à la résiliation de votre bail, une **1ère prolongation** est accordée par **convention** avec la gérance jusqu’au {{date_echeance}},
selon les conditions convenues.

Référence dossier : {{ref}}
Adresse : {{adresse_complete}}

Veuillez agréer, Madame, Monsieur, nos salutations distinguées.

Office du contrôle des logements
    `.trim(),
  },

  PROLONGATION_2: {
    subject: "Prolongation – 2ème et dernière prolongation (préfecture)",
    body: `
Madame, Monsieur,

Conformément à la procédure, une **2ème et dernière prolongation** a été sollicitée auprès de la **préfecture**.
Vous serez convoqué(e) et informé(e) des suites.

Référence dossier : {{ref}}
Adresse : {{adresse_complete}}

Veuillez agréer, Madame, Monsieur, nos salutations distinguées.

Office du contrôle des logements
    `.trim(),
  },

  NOTIFICATION_GERANCE: {
    subject: "Notification à la gérance – Décision de contrôle",
    body: `
Madame, Monsieur,

Nous vous informons de la décision prise pour le locataire {{nom_prenom}} (ref {{ref}}), adresse {{adresse_complete}} :
**{{decision_label}}** (motif : {{motif_detail}}), effet au {{date_effet}}.

Nous restons à disposition pour coordination.

Office du contrôle des logements
    `.trim(),
  },
};

/** Rendu simple des templates par remplacement {{var}}. */
export function renderTemplate(
  tpl: Template,
  data: Record<string, string | number | undefined | null>
): { subject: string; body: string } {
  const replace = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (_, k) => {
      const v = data[k];
      return v == null ? "" : String(v);
    });

  return {
    subject: replace(tpl.subject),
    body: replace(tpl.body),
  };
}

/** Petit helper pour obtenir l'intitulé d'une décision (pour courrier / timeline). */
export function decisionLabel(d: Decision): string {
  switch (d.kind) {
    case "CONSERVATION":
      return "Maintien du logement";
    case "SUPPLEMENT":
      return `Supplément de loyer${d.percent ? ` (${Math.round(d.percent * 100)}%)` : ""}`;
    case "SUPPRESSION_AIDES":
      return `Suppression des aides (${d.scope})`;
    case "RESILIATION":
      return "Résiliation du bail";
    default:
      return "Décision";
  }
}
