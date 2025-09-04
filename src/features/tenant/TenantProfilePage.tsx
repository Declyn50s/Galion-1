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
import LeaseCard, { type LeaseValue } from "@/features/tenant/components/LeaseCard";
import QuickNavSticky, {
  QuickNavIcons,
} from "@/features/user-profile/components/QuickNavSticky/QuickNavSticky";

import { useUserProfileState } from "@/features/user-profile/hooks/useUserProfileState";
import { InteractionDialog } from "@/components/InteractionDialog";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Immeubles (pour détecter LLM + base)
import { isAdresseInImmeubles, IMMEUBLES, stripDiacritics } from "@/data/immeubles";

// ─────────────────────────────────────────────────────────
// helpers (alignés sur la page demandeur)
const normalizeRole = (s?: string) =>
  (s || "")
    .toLowerCase()
    .replace(/-/g, "–")
    .replace(/\s*–\s*/g, " – ")
    .trim();

function addressLineFromProfile(p: any): string {
  const direct = p.adresse ?? p.address ?? p.addressLine ?? p.addressLine1 ?? "";
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

// Extraction rue (core) + n° à partir d'une ligne d'adresse utilisateur
function splitStreetAndNumber(line?: string) {
  if (!line) return { street: "", number: "" };
  const up = stripDiacritics(String(line)).toUpperCase();
  const m = up.match(/(\d{1,5})[A-Z]?/); // capte le premier numéro (ignore suffixe A/B)
  const number = m ? m[1] : "";
  const before = m ? up.slice(0, m.index).trim() : up;
  const street = streetCoreLoose(before); // ex: "RUE DE BERNE" -> "BERNE"
  return { street, number };
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
    /^enfant\b/.test(normalizeRole(role)) && /\bvisite\b/.test(normalizeRole(role));

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
          (new Date().getMonth() === dob.getMonth() && new Date().getDate() < dob.getDate())
            ? 1
            : 0)
        : 99;
    if (age >= 18) adults++;
    else minors++;
  }
  return { adults, minors };
}

// Règles de contrôle → résultat texte/flags
type ControlResult = {
  law: LawKind;
  rooms?: number;
  adults: number;
  minors: number;
  underOcc?: "none" | "simple" | "notoire";
  overOcc?: "none" | "sur";
  rte?: "unknown" | "lte20" | "gt20";
  notes: string[];
  actions: string[];
};

function runTenantControl(args: {
  law: LawKind;
  rooms?: number;
  adults: number;
  minors: number;
}): ControlResult {
  const { law, rooms, adults, minors } = args;
  const notes: string[] = [];
  let underOcc: ControlResult["underOcc"] = "none";
  let overOcc: ControlResult["overOcc"] = "none";

  // Hypothèses d’occupation
  if (typeof rooms === "number" && rooms > 0) {
    const unitsUnder = adults + Math.ceil(minors / 2);
    const diffUnder = rooms - unitsUnder;
    if (diffUnder >= 2) underOcc = "notoire";
    else if (diffUnder >= 1) underOcc = "simple";

    const diffOver = adults - rooms; // mineurs exclus
    if (diffOver >= 2) overOcc = "sur";
  } else {
    notes.push("Nombre de pièces inconnu → évaluer l’occupation nécessite le nombre de pièces du bail.");
  }

  const rte: ControlResult["rte"] = "unknown";

  const actions: string[] = [];
  if (underOcc === "notoire") {
    actions.push("Sous-occupation notoire (≥ 2 unités en moins).");
    if (law === "RC") {
      actions.push("Anciennes lois (RC 47/53/65) : résiliation du bail + supplément 20% du loyer net.");
    } else if (law === "LC.75") {
      actions.push("LC.75 : résiliation du bail + suppression des aides (commune/canton/AS selon cas).");
    } else if (law === "LC.2007") {
      actions.push("LC.2007 : résiliation du bail + suppression des aides.");
    }
  } else if (underOcc === "simple") {
    actions.push("Sous-occupation simple (1 unité en moins).");
    if (law === "RC") {
      actions.push("Anciennes lois (RC 47/53/65) : supplément 20% du loyer net.");
    } else if (law === "LC.75") {
      actions.push("LC.75 : suppression partielle/totale des aides.");
    } else if (law === "LC.2007") {
      actions.push("LC.2007 : pas de suppression d’aides.");
    }
  }

  if (overOcc === "sur") {
    actions.push("Sur-occupation (≥ 2 unités adultes de plus que le nombre de pièces).");
    actions.push("Mesure à qualifier par la régie/autorité (peut justifier une résiliation).");
  }

  if (rte === "unknown") {
    actions.push("RTE : données manquantes (loyer net du bail et/ou cap barème).");
    actions.push("• Pour < 20 % : RC = +50% loyer net (trimestriel) / LC.75 = suppression (dégressive) / LC.2007 = aides maintenues.");
    actions.push("• Pour > 20 % : RC = +50% loyer net + résiliation / LC.75 = suppression totale + AS + résiliation / LC.2007 = suppression aides (6 mois) + AS immédiate + résiliation.");
  }

  actions.push("Exceptions :");
  actions.push("• DM4 Concierge (≥60%): dépassement admissible jusqu’à 40%.");
  actions.push("• DM5 AVS seul en 3 pièces après décès/départ conjoint: maintien possible.");

  return { law, rooms, adults, minors, underOcc, overOcc, rte, notes, actions };
}
// ─────────────────────────────────────────────────────────

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
  const { street: streetFromProfile, number: numberFromProfile } =
    React.useMemo(() => splitStreetAndNumber(adresseProfil), [adresseProfil]);

  // État local du bail (éditable)
  const initialLease = React.useMemo<LeaseValue>(
    () => ({
      address: streetFromProfile, // ex: "BERNE"
      entry: numberFromProfile, // ex: "9"
      rooms: (state.userProfile as any).maxRooms,
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

  const rooms: number | undefined = (state.userProfile as any).maxRooms;

  const [controlOpen, setControlOpen] = React.useState(false);
  const [control, setControl] = React.useState<ControlResult | null>(null);

  const handleRunControl = () => {
    const result = runTenantControl({ law, rooms, adults, minors });
    setControl(result);
    setControlOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <HeaderBar
          isApplicant={state.userProfile.isApplicant}
          isTenant={isSubsidized}
          onSave={state.savePersonalInfo}
          onCopyAddress={state.copyAddressInfo}
          actionLabel="Contrôle"
          onAction={handleRunControl}
          applicantTo={`/users/${encodeURIComponent(userId ?? "")}`}
        />

        {/* Même pattern que UserProfilePage : InteractionBar sans wrapper, juste après le HeaderBar */}
        <section id="section-guichet">
          <InteractionBar onClick={state.handleInteractionClick} />
        </section>

        {/* ====== Layout avec sidebar sticky ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sticky nav à gauche */}
          <div className="hidden lg:block lg:col-span-3">
            <QuickNavSticky
              size="tight"
              offsetTop={80}
              items={[
                { id: "section-household-info", label: "En bref", icon: QuickNavIcons.menage },
                { id: "section-info", label: "Informations", icon: QuickNavIcons.info },
                { id: "section-household-manage", label: "Ménage", icon: QuickNavIcons.menage },
                { id: "section-interactions", label: "Interactions", icon: QuickNavIcons.timeline },
                { id: "section-lastcheck", label: "Dernier contrôle", icon: QuickNavIcons.timeline },
                { id: "section-lease", label: "Bail", icon: QuickNavIcons.docs },
                { id: "section-income", label: "Revenu", icon: QuickNavIcons.revenus },
                { id: "section-docs", label: "Documents", icon: QuickNavIcons.docs },
                { id: "section-supplement", label: "Supplément loyer", icon: QuickNavIcons.props },
                { id: "section-suppression", label: "Suppression des aides", icon: QuickNavIcons.props },
                { id: "section-echeancier", label: "Échéancier cellules logement", icon: QuickNavIcons.timeline },
                { id: "section-history", label: "Historique", icon: QuickNavIcons.timeline },
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

            {/* 4) Interactions (timeline uniquement) */}
            <section id="section-interactions" className="space-y-3">
              <InteractionTimeline />
            </section>

            {/* 5) Dernier contrôle (placeholder) */}
            <section id="section-lastcheck">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Dernier contrôle — à intégrer (date, résultat, pièces vérifiées, remarques).
              </div>
            </section>

            {/* 6) Bail */}
            <section id="section-lease">
              <LeaseCard
                value={lease}
                onChange={handleLeaseChange}
                onModifyDates={() => console.log("Modifier dates bail")}
                onModifyRent={() => console.log("Modifier loyer / montant bail")}
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
                onTotalsChange={({ totalRDUHousehold }) => setRduTotal(totalRDUHousehold)}
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

            {/* 12) Historique */}
            <section id="section-history">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Historique — à intégrer (journal global spécifique locataire).
              </div>
            </section>

            {/* 13) Séances */}
            <section id="section-session">
              <div className="rounded-md border bg-white p-4 text-sm text-slate-600">
                Séances — à intégrer (réunions, décisions liées au dossier locataire).
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Contrôle — résultat */}
      <Dialog open={controlOpen} onOpenChange={setControlOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Contrôle du locataire</DialogTitle>
          </DialogHeader>
        {control && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Régime&nbsp;: {control.law}</Badge>
              {typeof control.rooms === "number" && (
                <Badge variant="outline">{control.rooms} pièces</Badge>
              )}
              <Badge variant="outline">{control.adults} adulte(s)</Badge>
              <Badge variant="outline">{control.minors} mineur(s)</Badge>
            </div>

            <ul className="list-disc pl-5 space-y-1">
              {control.underOcc === "notoire" && <li>Sous-occupation notoire (≥ 2 unités en moins).</li>}
              {control.underOcc === "simple" && <li>Sous-occupation simple (1 unité en moins).</li>}
              {control.underOcc === "none" && <li>Aucune sous-occupation détectée.</li>}
              {control.overOcc === "sur" && <li>Sur-occupation (≥ 2 unités adultes au-dessus des pièces).</li>}
              {control.overOcc !== "sur" && <li>Aucune sur-occupation détectée.</li>}
              {control.rte === "unknown" && <li>RTE : données bail/barème manquantes (loyer net/colonne/cap).</li>}
            </ul>

            {control.notes.length > 0 && (
              <div className="text-slate-500">
                {control.notes.map((n, i) => (
                  <div key={i}>• {n}</div>
                ))}
              </div>
            )}

            <div className="mt-2">
              <div className="font-medium mb-1">Conséquences / recommandations</div>
              <ul className="list-disc pl-5 space-y-1">
                {control.actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        </DialogContent>
      </Dialog>

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
