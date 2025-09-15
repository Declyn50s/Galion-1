// src/features/user-profile/components/TreatmentModeBar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

type Statut = "À traiter" | "En traitement" | "En suspens" | "Refusé" | "Validé";

type Props = {
  visible?: boolean;
  taskId?: string;
  currentStatus?: Statut;
  backTo?: string;
  hasUnsavedChanges?: boolean;
  onPatchStatus: (patch: Partial<{
    statut: Statut;
    observation: string;
    observationTags: ("Refus" | "Incomplet" | "Dérogation")[];
  }>) => void;
  onRemove: () => void;
  onValidateSave: () => void;
  onLogInteraction?: (comment: string) => void;
};

// ✅ LISTE CORRIGÉE DES CASES À COCHER
const MISSING_DOCS: { id: string; label: string }[] = [
    { id: "preinscription_signee", label: "Formulaire de préinscription dûment rempli et signé" },

// Identité & permis
{ id: "identite_complete", label: "Pièce d'identité" },
{ id: "permis_non_valide", label: "Permis B/C/F valide" },

// Travail & revenus
{ id: "contrat_travail", label: "Contrat de travail" },
{ id: "fiches_salaire_6", label: "6 dernières fiches de salaire" },
{ id: "certificats_salaire_3y", label: "Certificats de salaire des 3 dernières années" },
{ id: "bilan_fiduciaire_3y", label: "Bilans fiduciaires des 3 dernières années" },
{ id: "bail_commercial", label: "Bail commercial" },

// Prestations sociales & assurances
{ id: "pc_famille_decision", label: "Décision récente PC Famille" },
{ id: "pc_decision", label: "Décision récente de prestation complémentaire" },
{ id: "ai_decision_degre", label: "Décision récente AI mentionnant le degré d’invalidité" },
{ id: "avs_decision", label: "Décision récente AVS" },
{ id: "deuxieme_pilier_decision", label: "2ᵉ pilier → décision/attestation de rente (y compris attestation fiscale)" },
{ id: "ri_budgets_3", label: "3 derniers budgets mensuels du RI" },
{ id: "evam_budgets_3", label: "3 derniers budgets mensuels de l’EVAM" },
{ id: "chomage_dernier_decompte", label: "Dernier décompte de chômage" },
{ id: "rente_pont_decision", label: "Décision de rente-pont" },

// Famille & obligations légales
{ id: "jugement_officiel", label: "Jugement officiel (divorce, séparation ou mesures provisoires ratifiées)" },
{ id: "pension_convention_ratifiée", label: "Convention alimentaire ratifiée par une instance officielle" },

// Études & formation
{ id: "attestation_etudes", label: "Attestation d’études" },
{ id: "bourse_avis_octroi", label: "Avis d’octroi de bourse" },
{ id: "apprentissage_contrat_decompte", label: "Contrat d’apprentissage + dernier décompte de salaire" },

// Autres
{ id: "autres_revenus_justificatifs", label: "Autres revenus → tout justificatif pertinent" },
{ id: "taxation_impots_complete", label: "Dernière décision de taxation des impôts (document complet)" },
{ id: "viawork_contrat_lausanne", label: "Contrat de travail à Lausanne (si conditions via travail)" },
{ id: "grossesse_certificat", label: "Certificat de grossesse" },
{ id: "bail_loyer", label: "Bail à loyer" },
];

// Motifs de refus (groupés pour l'UI)
const REFUS_MOTIFS = {
  generaux: [
    "Durée de résidence à Lausanne insuffisante (moins de 3 ans, sans interruption)",
    "Employeur principal hors commune de Lausanne (et/ou durée d’activité à Lausanne insuffisante)",
    "Revenus trop élevés",
    "Permis de séjour non valable ou en cours de renouvellement (sans justificatif suffisant)",
    "Colocation (hors couple)",
    "Autre(s)",
  ],
  etudiants: [
    "Nationalité / permis non admissible (ni Suisse, ni permis B, C ou F)",
    "Ne suit pas une formation à Lausanne ou dans une commune de Lausanne Région",
    "Absence de bourse d’études et activité lucrative accessoire < CHF 6’000.–/an",
    "Revenus mensuels de l’étudiant·e > CHF 1’500.–/mois",
    "Absence de motif impérieux (p. ex. domicile trop éloigné du lieu d’études, loyer actuel trop élevé, bail résilié, etc.)",
  ],
} as const;

// Liste à plat pratique pour la valeur par défaut / vérifs
const REFUS_MOTIFS_ALL: string[] = [
  ...REFUS_MOTIFS.generaux,
  ...REFUS_MOTIFS.etudiants,
];


const TreatmentModeBar: React.FC<Props> = ({
  visible,
  taskId,
  currentStatus,
  backTo = "/journal",
  hasUnsavedChanges = false,
  onPatchStatus,
  onRemove,
  onValidateSave,
  onLogInteraction,
}) => {
  const navigate = useNavigate();

  // Modaux
  const [openSuspens, setOpenSuspens] = React.useState(false);
  const [openRefus, setOpenRefus] = React.useState(false);
  const [openValider, setOpenValider] = React.useState(false);

  // Suspens: docs cochés
  const [missingDocs, setMissingDocs] = React.useState<string[]>([]);
  const toggleDoc = (id: string) =>
    setMissingDocs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

// État “Refus”
const [refusMotif, setRefusMotif] = React.useState<string>(REFUS_MOTIFS.generaux[0]);
const [refusDetails, setRefusDetails] = React.useState("");


  if (!visible) return null;

  /* --------- Actions --------- */

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const ok = confirm(
        "Des modifications non enregistrées seront perdues. Continuer et revenir au journal ?"
      );
      if (!ok) return;
    }
    onPatchStatus({ statut: "À traiter" });
    navigate(backTo);
  };

  const handleConfirmSuspens = () => {
    const labels = MISSING_DOCS.filter((d) => missingDocs.includes(d.id)).map((d) => d.label);
    const comment =
      labels.length > 0
        ? `En suspens — : ${labels.join(", ")}`
        : "En suspens — (liste vide)";
    onPatchStatus({
      statut: "En suspens",
      observation: comment,
      observationTags: ["Incomplet"],
    });
    onLogInteraction?.(comment);
    setOpenSuspens(false);
  };

  const handleConfirmRefus = () => {
    const comment =
      "Refus — " + refusMotif + (refusDetails.trim() ? ` — ${refusDetails.trim()}` : "");
    onPatchStatus({
      statut: "Refusé",
      observation: comment,
      observationTags: ["Refus"],
    });
    onLogInteraction?.(comment);
    setOpenRefus(false);
    navigate(backTo);
  };

  const handleConfirmValider = () => {
    onValidateSave();
    const comment = "Attestation envoyée";
    onPatchStatus({
      statut: "Validé",
      observation: comment,
      observationTags: [],
    });
    onLogInteraction?.(comment);
    setOpenValider(false);
    navigate(backTo);
  };

  const handleRemove = () => {
    const ok = confirm("Supprimer cette entrée du journal ?");
    if (!ok) return;
    onRemove();
    navigate(backTo);
  };

  /* --------- UI --------- */
  return (
    <div className="sticky top-16 z-40 rounded-md border bg-white p-3 shadow flex items-center gap-3">
      <div className="text-sm">
        <span className="font-semibold">Mode traitement</span>
        {taskId && (
          <span className="ml-2 text-gray-500">
            (ID: <span className="font-mono">{taskId}</span>, statut actuel :{" "}
            <span className="font-semibold">{currentStatus ?? "?"}</span>)
          </span>
        )}
      </div>

      <div className="ml-auto flex flex-wrap gap-2">
        <button className="rounded border px-3 py-1 text-sm hover:bg-gray-50" onClick={handleBack}>
          Retour journal
        </button>
        <button
          className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          onClick={() => setOpenSuspens(true)}
        >
          En suspens
        </button>
        <button
          className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          onClick={() => setOpenRefus(true)}
        >
          Refuser
        </button>
        <button
          className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          onClick={() => setOpenValider(true)}
        >
          Valider
        </button>
        <button
          className="rounded border border-red-300 text-red-600 px-3 py-1 text-sm hover:bg-red-50"
          onClick={handleRemove}
        >
          Supprimer du journal
        </button>
      </div>

      {/* ── Modal EN SUSPENS ── */}
      {openSuspens && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30"
          onClick={() => setOpenSuspens(false)}
        >
          <div
            className="w-full max-w-2xl rounded-md bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-2">Documents manquants</div>
            <p className="text-sm text-gray-600 mb-3">
              Coche les justificatifs absents (ils seront enregistrés dans l’observation et une
              interaction sera créée).
            </p>
            <div className="max-h-[45vh] overflow-auto border rounded p-3 space-y-2">
              {MISSING_DOCS.map((d) => (
                <label key={d.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={missingDocs.includes(d.id)}
                    onChange={() => toggleDoc(d.id)}
                  />
                  <span>{d.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-3 py-1 text-sm" onClick={() => setOpenSuspens(false)}>
                Annuler
              </button>
              <button
                className="rounded bg-gray-900 text-white px-3 py-1 text-sm"
                onClick={handleConfirmSuspens}
              >
                Confirmer “En suspens”
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal REFUS ── */}
      {openRefus && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30"
          onClick={() => setOpenRefus(false)}
        >
          <div
            className="w-full max-w-lg rounded-md bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-2">Motif du refus</div>
            <div className="space-y-2">
              <select
  value={refusMotif}
  onChange={(e) => setRefusMotif(e.target.value)}
  className="w-full rounded border p-2 text-sm"
>
  <optgroup label="Motifs généraux">
    {REFUS_MOTIFS.generaux.map((m) => (
      <option key={m} value={m}>{m}</option>
    ))}
  </optgroup>
  <optgroup label="Motifs spécifiques (formation/étudiants)">
    {REFUS_MOTIFS.etudiants.map((m) => (
      <option key={m} value={m}>{m}</option>
    ))}
  </optgroup>
</select>

              <textarea
  placeholder={
    refusMotif === "Autre(s)"
      ? "Précise le motif…"
      : "Détails (optionnel)…"
  }
  value={refusDetails}
  onChange={(e) => setRefusDetails(e.target.value)}
  className="w-full rounded border p-2 text-sm min-h-[90px]"
/>

            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-3 py-1 text-sm" onClick={() => setOpenRefus(false)}>
                Annuler
              </button>
              <button
                className="rounded bg-gray-900 text-white px-3 py-1 text-sm"
                onClick={handleConfirmRefus}
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal VALIDER ── */}
      {openValider && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30"
          onClick={() => setOpenValider(false)}
        >
          <div
            className="w-full max-w-md rounded-md bg-white p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-2">Valider le dossier</div>
            <p className="text-sm text-gray-600">
              Confirmer la validation ? Les informations courantes seront enregistrées.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-3 py-1 text-sm" onClick={() => setOpenValider(false)}>
                Annuler
              </button>
              <button
                className="rounded bg-gray-900 text-white px-3 py-1 text-sm"
                onClick={handleConfirmValider}
              >
                Valider et enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentModeBar;
