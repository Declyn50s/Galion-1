// src/features/tenant/TenantProfilePage.tsx
import React from "react";
import { useParams } from "react-router-dom";

import HeaderBar from "@/features/user-profile/components/HeaderBar";
import InteractionBar from "@/features/user-profile/components/InteractionBar";
import IncomeCard from "@/features/user-profile/components/IncomeCard/IncomeCard";
import PersonalInfoCard from "@/features/user-profile/components/PersonalInfoCard";
import HouseholdCard from "@/features/user-profile/components/Household/HouseholdCard";
import HouseholdCounters from "@/features/user-profile/components/HouseholdCounters/HouseholdCounters";
import DocumentManager from "@/features/user-profile/components/DocumentManager/DocumentManager";
import InteractionTimeline from "@/features/user-profile/components/InteractionTimeline/InteractionTimeline";
import QuickNavSticky, {
  QuickNavIcons,
} from "@/features/user-profile/components/QuickNavSticky/QuickNavSticky";

import { useUserProfileState } from "@/features/user-profile/hooks/useUserProfileState";
import { InteractionDialog } from "@/components/InteractionDialog";

// LLM / immeubles subventionnés
import { isAdresseInImmeubles } from "@/data/immeubles";

// ─────────────────────────────────────────────────────────
// helpers (alignés sur la page demandeur)
const normalizeRole = (s?: string) =>
  (s || "")
    .toLowerCase()
    .replace(/-/g, "–")
    .replace(/\s*–\s*/g, " – ")
    .trim();

// reconstruit une “ligne adresse” exploitable par isAdresseInImmeubles
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
// ─────────────────────────────────────────────────────────

const TenantProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const state = useUserProfileState(userId);

  const household = state.userProfile.household ?? [];

  // détection LLM (locataire subventionné)
  const adresseProfil = addressLineFromProfile(state.userProfile);
  const isSubsidized = React.useMemo(
    () => (adresseProfil ? isAdresseInImmeubles(adresseProfil) : false),
    [adresseProfil]
  );

  // Totaux revenus (utile si tu veux en faire quelque chose)
  const [rduTotal, setRduTotal] = React.useState<number>(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <HeaderBar
          isApplicant={state.userProfile.isApplicant}
          isTenant={isSubsidized}
          onSave={state.savePersonalInfo}
          onAttestation={() => console.log("Attestation locataire")}
          onCopyAddress={state.copyAddressInfo}
          applicantTo={`/users/${encodeURIComponent(userId ?? "")}`} // ⇠ retour vue Demandeur
          // pas besoin de tenantTo ici (on est déjà sur la vue Locataire)
        />

        {/* ⬇️ Bloc guichet / téléphone / etc. — tout en haut */}
        <InteractionBar onClick={state.handleInteractionClick} />

        {/* ====== Layout avec sidebar sticky ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sticky nav à gauche */}
          <div className="hidden lg:block lg:col-span-3">
            <QuickNavSticky
              size="tight"
              offsetTop={80}
              items={[
                { id: "section-household-info", label: "Ménage (compteurs)", icon: QuickNavIcons.menage },
                { id: "section-info", label: "Informations", icon: QuickNavIcons.info },
                { id: "section-household-manage", label: "Ménage", icon: QuickNavIcons.menage },
                { id: "section-interactions", label: "Interactions", icon: QuickNavIcons.timeline }, // timeline uniquement
                { id: "section-lastcheck", label: "Dernier contrôle", icon: QuickNavIcons.timeline },
                { id: "section-lease", label: "Bail", icon: QuickNavIcons.docs },
                { id: "section-income", label: "Revenu", icon: QuickNavIcons.revenus },
                { id: "section-docs", label: "Documents", icon: QuickNavIcons.docs },
                { id: "section-supplement", label: "Supplément loyer", icon: QuickNavIcons.props },
                { id: "section-suppression", label: "Suppression des aides", icon: QuickNavIcons.props },
                { id: "section-echeancier", label: "Échéancier cellules logement", icon: QuickNavIcons.timeline },
                { id: "section-history", label: "Historique", icon: QuickNavIcons.timeline }, // placeholder
                { id: "section-session", label: "Séances", icon: QuickNavIcons.timeline },
              ]}
            />
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-9 space-y-6">
            {/* 1) 👪 Ménage (compteurs) */}
            <section id="section-household-info">
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

            {/* 2) Informations personnelles */}
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

            {/* 3) Ménage (gestion) */}
            <section id="section-household-manage">
              <HouseholdCard
                household={household}
                onRemove={state.removeHouseholdMember}
                onSwap={state.swapWithPersonalInfo}
                onQuickAdd={state.addHouseholdMemberQuick}
                onUpdate={state.updateHouseholdMember}
              />
            </section>

            {/* 4) Interactions — timeline uniquement (le bandeau est en haut) */}
            <section id="section-interactions">
              <InteractionTimeline />
            </section>

            {/* 5) Dernier contrôle (placeholder) */}
            <section id="section-lastcheck">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Dernier contrôle — à intégrer (date, résultat, pièces vérifiées, remarques).
              </div>
            </section>

            {/* 6) Bail (placeholder) */}
            <section id="section-lease">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Bail — à intégrer (n° bail, adresse LLM, loyer, charges, début/fin).
              </div>
            </section>

            {/* 7) Revenu */}
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

            {/* 8) Documents */}
            <section id="section-docs">
              <DocumentManager userId={userId} defaultAuthor="DBO" />
            </section>

            {/* 9) Supplément loyer (placeholder) */}
            <section id="section-supplement">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Supplément loyer — à intégrer (calculs, échéances, décisions).
              </div>
            </section>

            {/* 10) Suppression des aides (placeholder) */}
            <section id="section-suppression">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Suppression des aides — à intégrer (motifs, dates, notifications).
              </div>
            </section>

            {/* 11) Échéancier cellules logement (placeholder) */}
            <section id="section-echeancier">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Échéancier cellules logement — à intégrer.
              </div>
            </section>

            {/* 12) Historique (placeholder conservé) */}
            <section id="section-history">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Historique — à intégrer (journal global spécifique locataire).
              </div>
            </section>

            {/* 13) Séances (placeholder) */}
            <section id="section-session">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Séances — à intégrer (réunions, décisions liées au dossier locataire).
              </div>
            </section>
          </div>
        </div>
      </div>

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

export default TenantProfilePage;
