// src/features/user-profile/UserProfilePage.tsx
import React from "react";
import { useParams } from "react-router-dom";

import HeaderBar from "./components/HeaderBar";
import InteractionBar from "./components/InteractionBar";
import DatesCard from "./components/DatesCard";
import IncomeCard from "./components/IncomeCard/IncomeCard";
import PersonalInfoCard from "./components/PersonalInfoCard";
import HouseholdCard from "./components/Household/HouseholdCard";
import { useUserProfileState } from "./hooks/useUserProfileState";
import { InteractionDialog } from "@/components/InteractionDialog";
import DocumentManager from "./components/DocumentManager/DocumentManager";
import InteractionTimeline from "./components/InteractionTimeline/InteractionTimeline";
import HousingProposals from "./components/HousingProposals/HousingProposals";
import HouseholdCounters from "./components/HouseholdCounters/HouseholdCounters";
import QuickNavSticky, {
  QuickNavIcons,
} from "./components/QuickNavSticky/QuickNavSticky";
import AttestationDialog from "@/features/attestation/AttestationDialog";

// LLM / immeubles subventionnés
import { isAdresseInImmeubles } from "@/data/immeubles";

// Barème
import { rentLimitFromIncome, BaremeColumn } from "@/lib/bareme";

// ────────────────────────────────────────────────────────────────────────────────
// Helpers
const toDate = (s?: string) => {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const isPermitValid = (
  nationality?: string,
  permit?: string,
  expiry?: string
) => {
  const nat = (nationality ?? "").trim().toLowerCase();
  const p = (permit ?? "").trim().toLowerCase();

  if (nat === "suisse") return true;
  const isCitizen = p === "citoyen" || p === "citizen";
  const isC = p === "permis c" || p === "c";
  const isB = p === "permis b" || p === "b";
  const isF = p === "permis f" || p === "f";

  if (isCitizen || isC) return true;
  if (isB || isF) {
    const d = toDate(expiry);
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
  }
  return false;
};

const yearsDiff = (iso?: string) => {
  const d = toDate(iso);
  if (!d) return 0;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const md = today.getMonth() - d.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < d.getDate())) age--;
  return age;
};

const normalizeRole = (s?: string) =>
  (s || "")
    .toLowerCase()
    .replace(/-/g, "–")
    .replace(/\s*–\s*/g, " – ")
    .trim();

const isVisitingChildRole = (role?: string) => {
  const r = normalizeRole(role);
  return /^enfant\b/.test(r) && /\bvisite\b/.test(r);
};

// Reconstruit une “ligne adresse” exploitable par isAdresseInImmeubles
function addressLineFromProfile(p: any): string {
  const direct =
    p.adresse ?? p.address ?? p.addressLine ?? p.addressLine1 ?? "";
  if (direct && direct.trim()) return direct.trim();

  const parts = [
    [p.street, p.streetNumber].filter(Boolean).join(" ").trim(),
    p.addressComplement ?? p.complement ?? "",
  ].filter((x: string) => x && x.trim().length > 0);

  return parts.join(" ").trim();
}

// Données pour l’attestation (pré-remplissage)
function buildAttestationDataFromProfile(p: any): Record<string, string> {
  return {
    NOM: String(p.lastName || "").toUpperCase(),
    PRENOM: p.firstName || "",
    CIVILITE: p.gender === "Féminin" ? "Madame" : "Monsieur",
    ADRESSE_L1:
      p.adresse ??
      p.address ??
      [p.street, p.streetNumber].filter(Boolean).join(" "),
    ADRESSE_L2: p.addressComplement ?? p.complement ?? "",
    NPA: p.postalCode || "",
    VILLE: p.city || "Lausanne",
    NSS: p.socialSecurityNumber || "",
    TELEPHONE: p.phone || "",
    EMAIL: p.email || "",
    NATIONALITE: p.nationality || "",
    PERMIS: p.residencePermit || "",
    ETAT_CIVIL: p.maritalStatus || "",
    DATE_NAISS: p.birthDate
      ? new Date(p.birthDate).toLocaleDateString("fr-CH")
      : "",
    VIA: p.lausanneStatus || "",
    VIA_DATE: p.lausanneStatusDate
      ? new Date(p.lausanneStatusDate).toLocaleDateString("fr-CH")
      : "",
    NB_MINEURS: String(
      (p.household || []).filter((m: any) => yearsDiff(m.birthDate) < 18).length
    ),
  };
}
// ────────────────────────────────────────────────────────────────────────────────

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const state = useUserProfileState(userId);

  // RDU ménage récupéré depuis IncomeCard
  const [rduTotal, setRduTotal] = React.useState<number>(0);

  // Attestation (dialog)
  const [attOpen, setAttOpen] = React.useState(false);

  const household = state.userProfile.household ?? [];

  // Enfants en droit de visite (mineurs). NB: pas de condition de permis pour le bonus.
  const visitingChildrenCount = React.useMemo(() => {
    return household.reduce((acc: number, m: any) => {
      return (
        acc +
        (isVisitingChildRole(m.role) && yearsDiff(m.birthDate) < 18 ? 1 : 0)
      );
    }, 0);
  }, [household]);

  // Enfants “comptés” (enfant / enfant à charge / garde alternée) : mineurs + permis valide
  const minorsCount = React.useMemo(() => {
    return household.reduce((acc: number, m: any) => {
      const r = normalizeRole(m.role);
      const isCountedRole =
        r === "enfant" ||
        r === "enfant à charge" ||
        r === "enfant – garde alternée";
      if (!isCountedRole) return acc;
      if (!isPermitValid(m.nationality, m.residencePermit, m.permitExpiryDate))
        return acc;
      return acc + (yearsDiff(m.birthDate) < 18 ? 1 : 0);
    }, 0);
  }, [household]);

  // Colonne de base
  const baseCol = React.useMemo<number>(() => {
    const n = Math.max(0, Math.floor(minorsCount));
    return n === 0 ? 1 : Math.min(n, 4) + 1;
  }, [minorsCount]);

  // Bonus DV : +1 si ≥2 enfants en droit de visite (borné à 5)
  const finalCol = React.useMemo<BaremeColumn>(() => {
    const bonus = visitingChildrenCount >= 2 ? 1 : 0;
    return Math.min(baseCol + bonus, 5) as BaremeColumn;
  }, [baseCol, visitingChildrenCount]);

  // Loyer min (limite barème) d’après le RDU total et la colonne finale
  const minRent = React.useMemo(() => {
    if (!rduTotal || rduTotal <= 0) return undefined;
    return rentLimitFromIncome(rduTotal, finalCol);
  }, [rduTotal, finalCol]);

  // Détection LLM (immeuble subventionné) pour badge & navigation
  const adresseProfil = addressLineFromProfile(state.userProfile);
  const isSubsidized = React.useMemo(
    () => (adresseProfil ? isAdresseInImmeubles(adresseProfil) : false),
    [adresseProfil]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <HeaderBar
          isApplicant={!!state.userProfile.isApplicant}
          isTenant={isSubsidized}
          onSave={state.savePersonalInfo}
          onCopyAddress={state.copyAddressInfo}
          onAction={() => setAttOpen(true)} // ← ouvre l’attestation
          applicantTo={`/users/${encodeURIComponent(userId ?? "")}`}
          tenantTo={
            isSubsidized
              ? `/tenants/${encodeURIComponent(userId ?? "")}`
              : undefined
          }
        />

        <InteractionBar onClick={state.handleInteractionClick} />

        {/* ====== Layout avec sidebar sticky ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sticky nav à gauche */}
          <div className="hidden lg:block lg:col-span-3">
            <QuickNavSticky
              size="tight"
              offsetTop={80}
              items={[
                {
                  id: "section-counters",
                  label: "En bref",
                  icon: QuickNavIcons.menage,
                },
                {
                  id: "section-dates",
                  label: "Dates",
                  icon: QuickNavIcons.timeline,
                },
                {
                  id: "section-info",
                  label: "Informations",
                  icon: QuickNavIcons.info,
                },
                {
                  id: "section-household",
                  label: "Ménage",
                  icon: QuickNavIcons.menage,
                },
                {
                  id: "section-income",
                  label: "Revenus",
                  icon: QuickNavIcons.revenus,
                },
                {
                  id: "section-timeline",
                  label: "Interactions",
                  icon: QuickNavIcons.timeline,
                },
                {
                  id: "section-docs",
                  label: "Documents",
                  icon: QuickNavIcons.docs,
                },
                {
                  id: "section-proposals",
                  label: "Propositions",
                  icon: QuickNavIcons.props,
                },
                {
                  id: "section-history",
                  label: "Historique",
                  icon: QuickNavIcons.timeline,
                },
                {
                  id: "section-session",
                  label: "Séance",
                  icon: QuickNavIcons.timeline,
                },
              ]}
            />
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-9 space-y-6">
            {/* 1) 👪 Ménage (compteurs) — plein largeur, en premier */}
            <section id="section-counters">
              <HouseholdCounters
                className="h-full"
                density="tight"
                main={{
                  birthDate: state.userProfile.birthDate,
                  role: state.userProfile.maritalStatus,
                  nationality: state.userProfile.nationality,
                  residencePermit: state.userProfile.residencePermit,
                  permitExpiryDate: state.userProfile.permitExpiryDate,
                }}
                household={household}
              />
            </section>

            {/* 2) 📅 Dates — plein largeur, en second */}
            <section id="section-dates">
              <DatesCard
  registrationDate={state.userProfile.registrationDate}
  lastCertificateDate={state.userProfile.lastCertificateDate}
  deadline={state.userProfile.deadline}
  maxRooms={state.userProfile.maxRooms}
  minRent={minRent}
  countedMinors={minorsCount}
  baremeColumn={finalCol}
  rduForBareme={rduTotal}
  applicantAgeYears={yearsDiff(state.userProfile.birthDate)}   // ← ICI l’âge
  annualIncomeCHF={rduTotal}                                   // ← ICI le revenu annuel
  onChange={state.updateProfile}
/>

            </section>

            {/* 3) Informations personnelles */}
            <section id="section-info">
              <PersonalInfoCard
                userProfile={state.userProfile}
                isEditing={state.isEditingPersonalInfo}
                isSwapping={state.isSwapping}
                statuses={state.getCurrentPersonStatuses()}
                onEdit={() => state.setIsEditingPersonalInfo(true)}
                onCancel={() => state.setIsEditingPersonalInfo(false)}
                onSave={state.savePersonalInfo}
                onCopyAddress={state.copyAddressInfo}
                updateProfile={state.updateProfile}
                setStatuses={state.setCurrentPersonStatuses}
              />
            </section>

            {/* 4) Ménage */}
            <section id="section-household">
              <div className="grid grid-cols-1 gap-4">
                <HouseholdCard
                  household={household}
                  onRemove={state.removeHouseholdMember}
                  onSwap={state.swapWithPersonalInfo}
                  onQuickAdd={state.addHouseholdMemberQuick}
                  onUpdate={state.updateHouseholdMember}
                />
              </div>
            </section>

            {/* 5) Revenus */}
            <section id="section-income">
              <IncomeCard
                people={[
                  {
                    id: "main",
                    role: "demandeur",
                    name: `${state.userProfile.firstName} ${state.userProfile.lastName}`,
                    birthDate: state.userProfile.birthDate,
                    nationality: state.userProfile.nationality,
                    residencePermit: state.userProfile.residencePermit,
                    permitExpiryDate: state.userProfile.permitExpiryDate,
                  },
                  ...household.map((m: any) => {
                    const r = normalizeRole(m.role);
                    const role =
                      r === "conjoint"
                        ? "conjoint"
                        : r.startsWith("enfant")
                        ? "enfant"
                        : "autre";
                    return {
                      id: m.id,
                      role,
                      name: m.name,
                      birthDate: m.birthDate,
                      nationality: m.nationality,
                      residencePermit: m.residencePermit,
                      permitExpiryDate: m.permitExpiryDate,
                    };
                  }),
                ]}
                countMode="counted"
                onTotalsChange={({ totalRDUHousehold }) =>
                  setRduTotal(totalRDUHousehold)
                }
              />
            </section>

            {/* 6) Historique des interactions */}
            <section id="section-timeline">
              <InteractionTimeline />
            </section>

            {/* 7) Documents */}
            <section id="section-docs">
              <DocumentManager userId={userId} defaultAuthor="DBO" />
            </section>

            {/* 8) Propositions de logement */}
            <section id="section-proposals">
              <HousingProposals
                densityDefault="compact"
                onOpenLogementsLibres={() =>
                  console.log("🔍 Ouverture logements libres (démo)")
                }
              />
            </section>

            {/* 9) Historique (placeholder) */}
            <section id="section-history">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Historique global — à intégrer (journal/audit spécifique
                usager).
              </div>
            </section>

            {/* 10) Séances */}
            <section id="section-session">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Séance global — à intégrer (journal/audit spécifique usager).
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Dialog d’attestation (éditable + export .docx) */}
      <AttestationDialog
        isOpen={attOpen}
        onOpenChange={setAttOpen}
        templateUrl="/templates/attestation.docx"
        initialData={buildAttestationDataFromProfile(state.userProfile)}
        fileName={`Attestation_${(state.userProfile.lastName ?? "DOC")
          .toString()
          .toUpperCase()}.docx`}
      />

      {state.dialogOpen.type && (
        <InteractionDialog
          isOpen={state.dialogOpen.isOpen}
          onClose={state.handleDialogClose}
          initialType={state.dialogOpen.type}
          onSave={(data) => {
            console.log("Interaction saved:", data);
          }}
        />
      )}
    </div>
  );
};

export default UserProfilePage;
