// src/features/user-profile/UserProfilePage.tsx
import React from "react"
import { useParams } from "react-router-dom"

import HeaderBar from "./components/HeaderBar"
import InteractionBar from "./components/InteractionBar"
import DatesCard from "./components/DatesCard"
import IncomeCard from "./components/IncomeCard/IncomeCard"
import PersonalInfoCard from "./components/PersonalInfoCard"
import HouseholdCard from "./components/Household/HouseholdCard"
import { useUserProfileState } from "./hooks/useUserProfileState"
import { InteractionDialog } from "@/components/InteractionDialog"
import DocumentManager from "./components/DocumentManager/DocumentManager"
import InteractionTimeline from "./components/InteractionTimeline/InteractionTimeline"
import HousingProposals from "./components/HousingProposals/HousingProposals"
import HouseholdCounters from "./components/HouseholdCounters/HouseholdCounters"
import QuickNavSticky, { QuickNavIcons } from "./components/QuickNavSticky/QuickNavSticky"

// 🔹 Barème
import { computeBareme, columnFromChildrenCount } from "@/lib/bareme"

// ────────────────────────────────────────────────────────────────────────────────
// Helpers “comptés” (mêmes règles que HouseholdCounters)
const toDate = (s?: string) => {
  if (!s) return undefined
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? undefined : d
}

const isPermitValid = (nationality?: string, permit?: string, expiry?: string) => {
  const nat = (nationality ?? "").trim().toLowerCase()
  const p = (permit ?? "").trim()
  if (nat === "suisse" || p === "Citoyen" || p === "Permis C") return true
  if (p === "Permis B" || p === "Permis F") {
    const d = toDate(expiry)
    if (!d) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d >= today
  }
  return false
}

const yearsDiff = (iso?: string) => {
  const d = toDate(iso)
  if (!d) return 0
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const md = today.getMonth() - d.getMonth()
  if (md < 0 || (md === 0 && today.getDate() < d.getDate())) age--
  return age
}
// ────────────────────────────────────────────────────────────────────────────────

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const state = useUserProfileState(userId)

  // 🔸 RDU ménage récupéré depuis IncomeCard
  const [rduTotal, setRduTotal] = React.useState<number>(0)

  // 🔸 Nombre d’enfants “comptés” (permis valide + <18 ans) : on inclut la personne principale + ménage
  const minorsCount = React.useMemo(() => {
    const all = [
      {
        birthDate: state.userProfile.birthDate,
        nationality: state.userProfile.nationality,
        residencePermit: state.userProfile.residencePermit,
        permitExpiryDate: state.userProfile.permitExpiryDate,
      },
      ...(state.userProfile.household ?? []),
    ]
    return all.reduce((acc, m: any) => {
      if (!isPermitValid(m.nationality, m.residencePermit, m.permitExpiryDate)) return acc
      return acc + (yearsDiff(m.birthDate) < 18 ? 1 : 0)
    }, 0)
  }, [state.userProfile.birthDate, state.userProfile.nationality, state.userProfile.residencePermit, state.userProfile.permitExpiryDate, state.userProfile.household])

  // 🔸 Colonne barème depuis le nombre d’enfants comptés
  const baremeCol = React.useMemo(() => columnFromChildrenCount(minorsCount), [minorsCount])

  // 🔸 Min rent depuis le barème (bas de la bande)
  const minRent = React.useMemo(() => {
    const hit = computeBareme(rduTotal, baremeCol)
    return hit?.rentRange?.[0] // ex: 690
  }, [rduTotal, baremeCol])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <HeaderBar
          isApplicant={state.userProfile.isApplicant}
          isTenant={state.userProfile.isTenant}
          onSave={state.savePersonalInfo}
          onAttestation={() => console.log("Attestation click")}
          onCopyAddress={state.copyAddressInfo}
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
                { id: "section-counters-dates", label: "Ménage & Dates", icon: QuickNavIcons.menage },
                { id: "section-info", label: "Informations", icon: QuickNavIcons.info },
                { id: "section-household", label: "Ménage", icon: QuickNavIcons.menage },
                { id: "section-income", label: "Revenus", icon: QuickNavIcons.revenus },
                { id: "section-timeline", label: "Interactions", icon: QuickNavIcons.timeline },
                { id: "section-docs", label: "Documents", icon: QuickNavIcons.docs },
                { id: "section-proposals", label: "Propositions", icon: QuickNavIcons.props },
                { id: "section-history", label: "Historique", icon: QuickNavIcons.timeline },
                { id: "section-session", label: "Séance", icon: QuickNavIcons.timeline },
              ]}
            />
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-9 space-y-6">
            {/* 1) Comptage du ménage & Dates */}
            <section id="section-counters-dates">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-full">
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
                    household={state.userProfile.household}
                  />
                </div>

                <div className="h-full">
                  <DatesCard
  registrationDate={state.userProfile.registrationDate}
  lastCertificateDate={state.userProfile.lastCertificateDate}
  deadline={state.userProfile.deadline}
  maxRooms={state.userProfile.maxRooms}
  minRent={minRent}                // ← calculé ailleurs depuis computeBareme(rduTotal, col).rentRange.min
  countedMinors={minorsCount}      // ← ton compteur d’enfants “comptés”
  rduForBareme={rduTotal}          // ← pour afficher la ligne de barème (optionnel)
  onChange={state.updateProfile}
/>

                </div>
              </div>
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

            {/* 3) Ménage */}
            <section id="section-household">
              <div className="grid grid-cols-1 gap-4">
                <HouseholdCard
                  household={state.userProfile.household}
                  onRemove={state.removeHouseholdMember}
                  onSwap={state.swapWithPersonalInfo}
                  onQuickAdd={state.addHouseholdMemberQuick}
                  onUpdate={state.updateHouseholdMember}
                  onLookupByNSS={state.lookupPersonByNSS}
                />
              </div>
            </section>

            {/* 4) Revenus */}
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
                  ...(state.userProfile.household ?? []).map((m: any) => ({
                    id: m.id,
                    role: m.role === "Conjoint" ? "conjoint" : m.role === "Enfant" ? "enfant" : "autre",
                    name: m.name,
                    birthDate: m.birthDate,
                    nationality: m.nationality,
                    residencePermit: m.residencePermit,
                    permitExpiryDate: m.permitExpiryDate,
                  })),
                ]}
                countMode="counted"
                onTotalsChange={({ totalRDUHousehold }) => setRduTotal(totalRDUHousehold)}
              />
            </section>

            {/* 5) Historique des interactions */}
            <section id="section-timeline">
              <InteractionTimeline />
            </section>

            {/* 6) Documents */}
            <section id="section-docs">
              <DocumentManager userId={userId} defaultAuthor="DBO" />
            </section>

            {/* 7) Propositions de logement */}
            <section id="section-proposals">
              <HousingProposals
                densityDefault="compact"
                onOpenLogementsLibres={() => console.log("🔍 Ouverture logements libres (démo)")}
              />
            </section>

            {/* 8) Historique (placeholder) */}
            <section id="section-history">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Historique global — à intégrer (journal/audit spécifique usager).
              </div>
            </section>

            {/* 9) Séances */}
            <section id="section-session">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Séance global — à intégrer (journal/audit spécifique usager).
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
            console.log("Interaction saved:", data)
          }}
        />
      )}
    </div>
  )
}

export default UserProfilePage
