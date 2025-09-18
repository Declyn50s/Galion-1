// src/features/tenant/TenantProfilePage.tsx
import React from "react";
import { useParams } from "react-router-dom";
import HeaderBar from "@/features/user-profile/components/HeaderBar";
import IncomeCard from "@/features/user-profile/components/IncomeCard/IncomeCard";
import PersonalInfoCard from "@/features/user-profile/components/PersonalInfoCard";
import HouseholdCard from "@/features/user-profile/components/Household/HouseholdCard";
import HouseholdCounters from "@/features/user-profile/components/HouseholdCounters/HouseholdCounters";
import DocumentManager from "@/features/user-profile/components/DocumentManager/DocumentManager";
import InteractionTimeline from "@/features/user-profile/components/InteractionTimeline/InteractionTimeline";
import InteractionBar from "@/features/user-profile/components/InteractionBar";
import { useJournalStore } from "@/features/journal/store";
import * as people from "@/data/peopleClient";
import LeaseCompact from "@/features/tenant/components/LeaseCompact";
import DernierControl, {
  type ControlEntry,
} from "@/features/tenant/components/DernierControl";
import ControlDialog from "@/features/tenant/components/Control/ControlDialog";
import DecisionForm from "@/features/tenant/components/Control/DecisionForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QuickNavSticky, {
} from "@/features/user-profile/components/QuickNavSticky/QuickNavSticky";
import { useUserProfileState } from "@/features/user-profile/hooks/useUserProfileState";
import InteractionDialog from "@/components/interaction";
import type { LeaseValue } from "@/features/tenant/components/lease/types";
import { useInteractionsStore } from "@/features/interactions/store";
import {
  isAdresseInImmeubles,
  IMMEUBLES,
  stripDiacritics,
} from "@/data/immeubles";
/* ─────────────────────────────────────────────────────────
   Helpers alignés
────────────────────────────────────────────────────────── */
// ⬇️ Colle ce helper à côté de tes autres helpers (même version que dans UserProfilePage)
function toJournalUserFromProfile(p: any): people.JournalUtilisateur {
  return {
    titre: p.gender === "Féminin" ? "Mme" : "M.",
    nom: String(p.lastName || p.nom || "").toUpperCase(),
    prenom: p.firstName || p.prenom || "",
    dateNaissance: (p.birthDate || p.dateNaissance || "").slice(0, 10),
    adresse: [p.adresse || p.address, p.addressComplement || p.complement]
      .filter(Boolean)
      .join(", "),
    npa: p.postalCode || p.npa || "",
    ville: p.city || p.ville || "",
    nbPers: 1,
    nbEnf: 0,
  };
}

const normalizeRole = (s?: string) =>
  (s || "")
    .toLowerCase()
    .replace(/-/g, "–")
    .replace(/\s*–\s*/g, " – ")
    .trim();
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
// très simple “core” de rue (sans accents/majuscules, sans chiffres)
function streetCoreLoose(s: string): string {
  return stripDiacritics(String(s || ""))
    .toUpperCase()
    .replace(/\d+/g, " ")
    .replace(/[,.;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
// essaie de déduire la base (LC.75 / RC.47 / LC.2007 …) depuis l’adresse
function guessBaseFromImmeubles(userAdresse: string): string | null {
  const core = streetCoreLoose(userAdresse);
  if (!core) return null;
  const row = IMMEUBLES.find((r) => {
    const rc = streetCoreLoose(r.adresse);
    return rc && core.includes(rc);
  });
  return row?.base ?? null;
}
type LawKind = "LC.75" | "LC.2007" | "RC" | "UNKNOWN";
// mappe la base en “famille de loi”
function lawFromBase(base?: string | null): LawKind {
  const b = String(base || "").toUpperCase();
  if (b.includes("LC.2007")) return "LC.2007";
  if (b.includes("LC.75")) return "LC.75";
  if (b.includes("RC.") || b.includes("RC ")) return "RC";
  return "UNKNOWN";
}
// Comptages occupation (exclut les enfants droit de visite)
function countAdultsMinorsOccupants(main: any, household: any[]) {
  const ALL = [{ ...main, role: "demandeur" }, ...(household ?? [])];

  const isVisitingChild = (role?: string) =>
    /^enfant\b/.test(normalizeRole(role)) &&
    /\bvisite\b/.test(normalizeRole(role));

  let adults = 0;
  let minors = 0;
  for (const p of ALL) {
    if (isVisitingChild(p.role)) continue;
    const dob = p.birthDate ? new Date(p.birthDate) : null;
    const age =
      dob && !Number.isNaN(dob.getTime())
        ? new Date().getFullYear() -
          dob.getFullYear() -
          (new Date().getMonth() < dob.getMonth() ||
          (new Date().getMonth() === dob.getMonth() &&
            new Date().getDate() < dob.getDate())
            ? 1
            : 0)
        : 99;
    if (age >= 18) adults++;
    else minors++;
  }
  return { adults, minors };
}

type ControlResult = {
  law: LawKind;
  rooms?: number;
  adults: number;
  minors: number;
  underOcc?: "none" | "simple" | "notoire";
  overOcc?: "none" | "sur";
  rte?: "unknown" | "none" | "lte20" | "gt20";
  cap?: number;
  percentOverCap?: number;
  notes: string[];
  actions: string[];
};
/* ─────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────── */
const TenantProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const state = useUserProfileState(userId);

  const household = state.userProfile.household ?? [];

  const adresseProfil = addressLineFromProfile(state.userProfile);
  const isSubsidized = React.useMemo(
    () => (adresseProfil ? isAdresseInImmeubles(adresseProfil) : false),
    [adresseProfil]
  );
  const base = React.useMemo(
    () => (adresseProfil ? guessBaseFromImmeubles(adresseProfil) : null),
    [adresseProfil]
  );
  const law = lawFromBase(base);

  // === Adresse → bail : rue + n° extraits depuis les infos perso ===
  const splitStreetAndNumber = React.useCallback((line?: string) => {
    if (!line) return { street: "", number: "" };
    const up = stripDiacritics(String(line)).toUpperCase();
    const m = up.match(/(\d{1,5})[A-Z]?/);
    const number = m ? m[1] : "";
    const before = m ? up.slice(0, m.index!).trim() : up;
    const street = streetCoreLoose(before);
    return { street, number };
  }, []);

  const { street: streetFromProfile, number: numberFromProfile } =
    React.useMemo(
      () => splitStreetAndNumber(adresseProfil),
      [adresseProfil, splitStreetAndNumber]
    );

  // État local du bail (éditable)
  const initialLease = React.useMemo<LeaseValue>(
    () => ({
      address: streetFromProfile, // ex: "BERNE"
      entry: numberFromProfile, // ex: "9"
      rooms: (state.userProfile as any).maxRooms,
      // IMPORTANT: le composant bail expose rentNetMonthly
      rentNetMonthly: (state.userProfile as any).rentNetMonthly ?? undefined,
    }),
    [streetFromProfile, numberFromProfile, state.userProfile]
  );

  const [lease, setLease] = React.useState<LeaseValue>(initialLease);

  // Sync auto tant que l'utilisateur n'a pas modifié l'adresse du bail
  const userEditedLeaseAddressRef = React.useRef(false);
  React.useEffect(() => {
    if (userEditedLeaseAddressRef.current) return;
    setLease((prev) => ({
      ...prev,
      address: streetFromProfile,
      entry: numberFromProfile,
    }));
  }, [streetFromProfile, numberFromProfile]);

  const handleLeaseChange = (next: LeaseValue) => {
    if (
      next.address !== lease.address ||
      String(next.entry ?? "") !== String(lease.entry ?? "")
    ) {
      userEditedLeaseAddressRef.current = true;
    }
    setLease(next);
  };

  const [rduTotal, setRduTotal] = React.useState<number>(0);

  const { adults, minors } = React.useMemo(
    () => countAdultsMinorsOccupants(state.userProfile, household),
    [state.userProfile, household]
  );

  // Exceptions toggles
  const [dm4Concierge, setDm4Concierge] = React.useState(false);
  const [dm5AVSSeul3p, setDm5AVSSeul3p] = React.useState(false);

  const [controlOpen, setControlOpen] = React.useState(false);
  const handleRunControl = () => setControlOpen(true);

  // Modale Décision (après contrôle)
  const [decisionOpen, setDecisionOpen] = React.useState(false);
  const [controlSnapshot, setControlSnapshot] =
    React.useState<ControlResult | null>(null);

  // Historique + pending
  const [controlsHistory, setControlsHistory] = React.useState<ControlEntry[]>(
    []
  );
  const [pendingControl, setPendingControl] =
    React.useState<ControlEntry | null>(null);

  /* ---------------- Interactions: publier depuis la modale ---------------- */
  const addInteraction = useInteractionsStore((s) => s.addInteraction);

  const normalizeInteractionType = (
    t: any
  ):
    | "guichet"
    | "telephone"
    | "courrier"
    | "email"
    | "jaxform"
    | "commentaire" => {
    switch (String(t)) {
      case "telephone":
      case "phone":
        return "telephone";
      case "courrier":
        return "courrier";
      case "email":
      case "mail":
        return "email";
      case "jaxform":
        return "jaxform";
      case "guichet":
        return "guichet";
      case "commentaire":
      case "comment":
      case "note":
      default:
        return "commentaire";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <HeaderBar
          isApplicant={!!state.userProfile.isApplicant}
          isTenant={isSubsidized}
          onSave={state.savePersonalInfo}
          onCopyAddress={state.copyAddressInfo}
          actionLabel="Contrôle"
          onAction={handleRunControl}
          applicantTo={`/users/${encodeURIComponent(userId ?? "")}`}
        />

        {/* Même pattern que UserProfilePage : InteractionBar sans wrapper */}
        <section id="section-guichet">
          <InteractionBar onClick={state.handleInteractionClick} />
        </section>

        {/* ====== Layout avec sidebar sticky ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
  onOpenHistory={() => {
    // TODO: route dédiée ou drawer
    // navigate(`/users/${userId}/household-history`);
  }}
/>

            </section>

            {/* 4) Interactions (timeline uniquement) */}
            <section id="section-interactions" className="space-y-3">
              <InteractionTimeline />
            </section>

            {/* 5) Dernier contrôle */}
            <section id="section-lastcheck">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                <DernierControl
                  law={law}
                  hasAS={true}
                  history={controlsHistory}
                  pending={pendingControl}
                  onCopyToHistory={(e) => {
                    setControlsHistory((prev) => [e, ...prev]);
                  }}
                  onOverwriteLast={(e) => {
                    setControlsHistory((prev) => {
                      const older = prev.length ? prev.slice(1) : [];
                      return [e, ...older];
                    });
                    setPendingControl(null);
                  }}
                />
              </div>
            </section>

            {/* 6) Bail */}
            <section id="section-lease">
              <LeaseCompact
                value={lease}
                onChange={handleLeaseChange}
                onModifyDates={() => console.log("Modifier dates bail")}
                onModifyRent={() =>
                  console.log("Modifier loyer / montant bail")
                }
                onTerminateLease={() => console.log("Résiliation du bail")}
              />
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
                tenantContext={{
                  enabled: true,
                  rentNetMonthly: lease?.rentNetMonthly ?? undefined, // loyer bail
                }}
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
                <br></br>
                Suppression des aides — à intégrer (motifs, dates,
                notifications).<br></br>
                Échéancier cellules logement — à intégrer.
              </div>
            </section>

            {/* 10) Historique */}
            <section id="section-history">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Historique — à intégrer (journal global spécifique locataire).
              </div>
            </section>

            {/* 11) Séances */}
            <section id="section-session">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Séances — à intégrer (réunions, décisions liées au dossier
                locataire).
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
                  id: "section-household-info",
                  label: "👪 En bref",
                },
                {
                  id: "section-info",
                  label: "👤 Informations",
                },
                {
                  id: "section-household-manage",
                  label: "👪 Ménage",
                },
                {
                  id: "section-interactions",
                  label: "💬 Interactions",
                },
                {
                  id: "section-lastcheck",
                  label: "🔍 Dernier contrôle",
                },
                {
                  id: "section-lease",
                  label: "📝 Bail",
                },
                {
                  id: "section-income",
                  label: "💰 Revenu",
                },
                {
                  id: "section-docs",
                  label: "📁 Documents",
                },
                {
                  id: "section-logement",
                  label: "🏠 Paramètres logement",
                },
                {
                  id: "section-history",
                  label: "📜 Historique",
                },
                {
                  id: "section-session",
                  label: "🪑 Séances",
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Contrôle — résultat */}
      <ControlDialog
        open={controlOpen}
        onOpenChange={setControlOpen}
        law={law}
        adults={adults}
        minors={minors}
        rooms={lease?.rooms}
        rentNetMonthly={lease?.rentNetMonthly}
        rduTotal={rduTotal}
        exceptions={{ dm4Concierge, dm5AVSSeul3p }}
        onChange={({ rooms, rentNetMonthly, rduTotal, exceptions }) => {
          if (typeof rooms !== "undefined") {
            setLease((prev) => ({ ...prev, rooms }));
          }
          if (typeof rentNetMonthly !== "undefined") {
            setLease((prev) => ({ ...prev, rentNetMonthly }));
          }
          if (typeof rduTotal !== "undefined") {
            setRduTotal(rduTotal);
          }
          if (exceptions) {
            setDm4Concierge(!!exceptions.dm4Concierge);
            setDm5AVSSeul3p(!!exceptions.dm5AVSSeul3p);
          }
        }}
        onRun={(result) => {
          console.log("Résultat contrôle:", result);
          setControlSnapshot(result);
          setDecisionOpen(true);

          // ➜ crée un "pending" condensé pour l’UI DernierControl (remplaçable)
          const entry: ControlEntry = {
            date: new Date().toISOString().slice(0, 10),
            baremeColumn: (result as any).baremeColumn, // si dispo
            by: "DBO",
            updatedBy: "DBO",
            result: {
              son: result.underOcc ?? "none",
              rte: (result.rte ?? "unknown") as any,
              dif: false,
            },
          };
          setPendingControl(entry);
        }}
      />

      {/* Décision suite au contrôle */}
      <Dialog open={decisionOpen} onOpenChange={setDecisionOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Décision suite au contrôle</DialogTitle>
          </DialogHeader>

          {controlSnapshot && (
            <DecisionForm
              law={law}
              adults={adults}
              minors={minors}
              rooms={lease?.rooms}
              son={controlSnapshot.underOcc ?? "none"}
              rte={controlSnapshot.rte ?? "unknown"}
              dif={false}
              cap={controlSnapshot.cap}
              percentOverCap={controlSnapshot.percentOverCap}
              defaultDates={{
                notification: new Date().toISOString().slice(0, 10),
                startDate: new Date().toISOString().slice(0, 10),
              }}
              onSubmit={(decision) => {
                console.log("Décision enregistrée", decision);
                setDecisionOpen(false);
              }}
              onCancel={() => setDecisionOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modale d'interaction (ouverte via InteractionBar) */}
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

export default TenantProfilePage;