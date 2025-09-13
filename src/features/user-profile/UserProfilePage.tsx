// src/features/user-profile/UserProfilePage.tsx
import React from "react";
import { useParams } from "react-router-dom";
import { useJournalStore } from "@/features/journal/store";
import HeaderBar from "./components/HeaderBar";
import InteractionBar from "./components/InteractionBar";
import DatesCard from "./components/DatesCard";
import IncomeCard from "./components/IncomeCard/IncomeCard";
import PersonalInfoCard from "./components/PersonalInfoCard";
import HouseholdCard from "./components/Household/HouseholdCard";
import { useUserProfileState } from "./hooks/useUserProfileState";
import InteractionDialog from "@/components/InteractionDialog"; // ✅ import par défaut
import DocumentManager from "./components/DocumentManager/DocumentManager";
import InteractionTimeline from "./components/InteractionTimeline/InteractionTimeline";
import HousingProposals from "./components/HousingProposals/HousingProposals";
import HouseholdCounters from "./components/HouseholdCounters/HouseholdCounters";
import QuickNavSticky from "@/features/user-profile/components/QuickNavSticky/QuickNavSticky";
import AttestationDialog from "@/features/attestation/AttestationDialog";
import { canonicalizeRole } from "@/lib/roles";
import { useInteractionsStore } from "@/features/interactions/store";

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

// DV = uniquement "enfant droit de visite" (via rôle canonique)
const isVisitingChildRole = (role?: string) =>
  canonicalizeRole(role) === "enfant droit de visite";

// Enfant “compté” (barème) = "enfant" ou "enfant garde alternée", JAMAIS DV
const isCountedChildRole = (role?: string) => {
  const c = canonicalizeRole(role);
  return c === "enfant" || c === "enfant garde alternée";
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

  // Enfants en droit de visite (mineurs) — PAS comptés pour la base
  const visitingChildrenCount = React.useMemo(() => {
    return (household ?? []).reduce((acc: number, m: any) => {
      return (
        acc +
        (isVisitingChildRole(m.role) && yearsDiff(m.birthDate) < 18 ? 1 : 0)
      );
    }, 0);
  }, [household]);

  // Enfants “comptés” (barème) = enfant / à charge / garde alternée, permis valide, < 18 ans, hors DV
  const minorsCount = React.useMemo(() => {
    return (household ?? []).reduce((acc: number, m: any) => {
      if (!isCountedChildRole(m.role)) return acc;
      if (!isPermitValid(m.nationality, m.residencePermit, m.permitExpiryDate))
        return acc;
      return acc + (yearsDiff(m.birthDate) < 18 ? 1 : 0);
    }, 0);
  }, [household]);

  // Adultes pour distinguer personne seule vs couple (on exclut seulement DV)
  const adultsCount = React.useMemo(() => {
    const hasBirth = !!state.userProfile.birthDate;
    let a = hasBirth
      ? yearsDiff(state.userProfile.birthDate) >= 18
        ? 1
        : 0
      : 1;
    for (const m of household) {
      if (isVisitingChildRole(m.role)) continue;
      if (yearsDiff(m.birthDate) >= 18) a += 1;
    }
    return a;
  }, [state.userProfile.birthDate, household]);

  type JournalUtilisateur = {
    titre: "M." | "Mme" | string;
    nom: string;
    prenom: string;
    dateNaissance: string;
    adresse: string;
    npa: string;
    ville: string;
    nbPers: number;
    nbEnf: number;
  };

  function toJournalUserFromProfile(p: any): people.JournalUtilisateur {
    return {
      titre: p.gender === "Féminin" ? "Mme" : "M.",
      nom: String(p.lastName || p.nom || "").toUpperCase(),
      prenom: p.firstName || p.prenom || "",
      dateNaissance: (p.birthDate || p.dateNaissance || "").slice(0, 10), // ISO déjà ?
      adresse: [p.adresse || p.address, p.addressComplement || p.complement]
        .filter(Boolean)
        .join(", "),
      npa: p.postalCode || p.npa || "",
      ville: p.city || p.ville || "",
      nbPers: 1,
      nbEnf: 0,
    };
  }

  // Colonne de base selon nb de mineurs “comptés”
  const baseCol = React.useMemo<number>(() => {
    const n = Math.max(0, Math.floor(minorsCount)); // 0 enfant → Col.1 ; 1 → Col.2 ; …
    return n === 0 ? 1 : Math.min(n, 4) + 1;
  }, [minorsCount]);

  // Colonne finale = colonne de base (DV n'influe PAS la colonne)
  const finalCol = React.useMemo<BaremeColumn>(() => {
    return baseCol as BaremeColumn;
  }, [baseCol]);

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

  // Wrapper sûr pour DatesCard (évite "onChange is not a function")
  const handleDatesChange = React.useCallback(
    (field: string, value: any) => {
      state.updateProfile(field, value);
    },
    [state]
  );

  // Petite normalisation (affichage IncomeCard)
  const normalizeRole = (s?: string) =>
    (s || "")
      .toLowerCase()
      .replace(/-/g, "–")
      .replace(/\s*–\s*/g, " – ")
      .trim();

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
          {/* Contenu principal */}
          <div className="lg:col-span-9 space-y-6">
            {/* 1) 👪 Ménage (compteurs) */}
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

            {/* 2) 📅 Dates */}
            <section id="section-dates">
              <DatesCard
                registrationDate={state.userProfile.registrationDate}
                lastCertificateDate={state.userProfile.lastCertificateDate}
                deadline={state.userProfile.deadline}
                maxRooms={state.userProfile.maxRooms}
                minRent={minRent}
                /* Comptages pour la pré-sélection (règle ménage) */
                adultsCount={adultsCount}
                countedMinors={minorsCount}
                visitingChildrenCount={visitingChildrenCount}
                /* Barème / revenu */
                baremeColumn={finalCol}
                rduForBareme={rduTotal}
                /* Interdiction 1,5p si âge ≥ 25 ou revenu > 1’500/mois */
                applicantAgeYears={yearsDiff(state.userProfile.birthDate)}
                annualIncomeCHF={rduTotal}
                onChange={handleDatesChange}
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
                    const c = canonicalizeRole(m.role);
                    const role =
                      c === "conjoint"
                        ? "conjoint"
                        : c.startsWith("enfant")
                        ? "enfant"
                        : "autre";
                    return {
                      id: m.id,
                      role, // rôle “coarse” attendu par IncomeCard (demandeur/conjoint/enfant/autre)
                      rawRole: m.role, // rôle brut pour détecter DV / GA correctement
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
          {/* Sticky nav à gauche */}
          <div className="hidden lg:block lg:col-span-3">
            <QuickNavSticky
              size="tight"
              offsetTop={80}
              items={[
                {
                  id: "section-counters",
                  label: "👪 En bref",
                },
                {
                  id: "section-dates",
                  label: "📅 Dates",
                },
                {
                  id: "section-info",
                  label: "👤 Informations",
                },
                {
                  id: "section-household",
                  label: "👪 Ménage",
                },
                {
                  id: "section-income",
                  label: "💰 Revenus",
                },
                {
                  id: "section-timeline",
                  label: "💬 Interactions",
                },
                {
                  id: "section-docs",
                  label: "📁 Documents",
                },
                {
                  id: "section-proposals",
                  label: "🏠 Propositions",
                },
                {
                  id: "section-history",
                  label: "📜 Historique",
                },
                {
                  id: "section-session",
                  label: "🪑 Séance",
                },
              ]}
            />
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

      {/* InteractionDialog — publication dans le store Zustand */}
      {state.dialogOpen.type && (
        <InteractionDialog
          isOpen={state.dialogOpen.isOpen}
          onClose={state.handleDialogClose}
          initialType={state.dialogOpen.type as any}
          relatedUsers={[
            toJournalUserFromProfile(state.userProfile),
            ...household.map(toJournalUserFromProfile),
          ]}
          dossierId={state.dialogOpen.dossierId ?? "DOS-AUTO"}
          // ✅ une seule source NSS, avec fallback
          nss={
            state.dialogOpen.nss || state.userProfile.socialSecurityNumber || ""
          }
          agentName={state.currentUser?.fullName ?? "Agent"}
          isLLM={isSubsidized}
          onPublishedToJournal={(entry) => {
            // ➜ rend visible immédiatement dans /journal
            useJournalStore.getState().addTask(entry);

            // Optionnel : feedback dev
            console.log("Publié au Journal:", entry);
          }}
          onSave={(data) => {
            const addInteraction =
              useInteractionsStore.getState().addInteraction;
            addInteraction({
              userId: userId ?? "",
              id: crypto.randomUUID(),
              type: data.type ?? "commentaire",
              subject: data.subject || "",
              customSubject: data.customSubject || "",
              comment: (
                data.comment ||
                data.message ||
                data.meta?.comment ||
                ""
              ).trim(),
              tags: Array.isArray(data.tags) ? data.tags : [],
              observations: (
                data.observations ||
                data.meta?.observations ||
                ""
              ).trim(),
              isAlert: !!data.isAlert,
              commentOptions: Array.isArray(data.commentOptions)
                ? data.commentOptions
                : [],
              observationTags: Array.isArray(data.observationTags)
                ? data.observationTags
                : [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            state.handleDialogClose();
          }}
        />
      )}
    </div>
  );
};

export default UserProfilePage;
