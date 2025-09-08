// src/features/user-profile/components/Household/HouseholdCard.tsx
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Search as SearchIcon } from "lucide-react";
import HouseholdMemberRow from "./HouseholdMemberRow";
import type { HouseholdMember } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { RESIDENCE_PERMIT_OPTIONS } from "@/types/user";

// ✅ imports du sélecteur nationalité + champ échéance permis
import NationalitySelector from "@/components/NationalitySelector";
import PermitExpiryField from "@/features/user-profile/components/PersonalInfoCard/PermitExpiryField";

// ───────────────────────────────────────────────────────────
// Helpers normalisation / mapping rôles
const normalize = (s?: string) =>
  (s ?? "")
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isSpouse = (role?: string) => {
  const r = normalize(role);
  return r === "conjoint" || r === "conjointe";
};

// Rôles canoniques stockés
type CanonicalRole =
  | "conjoint"
  | "enfant"
  | "enfant garde alternée"
  | "enfant droit de visite"
  | "autre";

// Rôles affichés par HouseholdMemberRow (doivent correspondre EXACTEMENT à ses options)
type DisplayRole =
  | "Conjoint"
  | "Enfant à charge"
  | "Enfant – garde alternée"
  | "Enfant – droit de visite"
  | "Autre";

// Map Select (formulaire rapide) → valeurs canoniques
const QUICK_ROLE_OPTIONS: { value: CanonicalRole; label: string }[] = [
  { value: "conjoint", label: "Conjoint·e" },
  { value: "enfant", label: "Enfant" },
  { value: "enfant droit de visite", label: "Enfant (droit de visite)" },
  { value: "enfant garde alternée", label: "Enfant (garde alternée)" },
  { value: "autre", label: "Autre" },
];

// Canonique → affiché dans la row
function toDisplayRole(role?: string): DisplayRole {
  const r = normalize(role);
  if (r === "conjoint" || r === "conjointe") return "Conjoint";
  if (r === "enfant") return "Enfant à charge";
  if (r === "enfant garde alternee" || r === "enfant garde alternée")
    return "Enfant – garde alternée";
  if (r === "enfant droit de visite") return "Enfant – droit de visite";
  return "Autre";
}

// Affiché (row) → canonique (stock)
function toCanonicalRole(display: string): CanonicalRole {
  const r = normalize(display);
  if (r === "conjoint") return "conjoint";
  if (r === "enfant a charge") return "enfant";
  if (r === "enfant garde alternee") return "enfant garde alternée";
  if (r === "enfant droit de visite") return "enfant droit de visite";
  return "autre";
}

// ───────────────────────────────────────────────────────────

interface Props {
  household: HouseholdMember[];
  onRemove: (id: string) => void;
  onSwap: (member: HouseholdMember) => void;
  onQuickAdd: (m: Omit<HouseholdMember, "id">) => void;
  onUpdate?: (id: string, patch: Partial<HouseholdMember>) => void;
}

const HouseholdCard: React.FC<Props> = ({
  household,
  onRemove,
  onSwap,
  onQuickAdd,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  // Champs du formulaire rapide
  const [nss, setNss] = useState("");
  const [role, setRole] = useState<CanonicalRole | "">(""); // ← canonique
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"Masculin" | "Féminin" | "">("");
  const [nationality, setNationality] = useState("Suisse");
  const [residencePermit, setResidencePermit] = useState<string>("Citoyen");
  const [permitExpiryDate, setPermitExpiryDate] = useState<string>("");
  const [status, setStatus] = useState("");

  const hasSpouse = useMemo(
    () => household.some((h) => isSpouse(h.role)),
    [household]
  );

  const resetFields = () => {
    setNss("");
    setRole("");
    setFirstName("");
    setLastName("");
    setBirthDate("");
    setGender("");
    setNationality("Suisse");
    setResidencePermit("Citoyen");
    setPermitExpiryDate("");
    setStatus("");
  };

  // NSS → tentative de préremplissage (démo)
  const handleSearchByNSS = async () => {
    if (!nss.trim()) {
      toast({
        variant: "destructive",
        title: "NSS manquant",
        description: "Saisis un NSS avant de rechercher.",
      });
      return;
    }
    try {
      const res = await fetch("/people.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // const people = (await res.json()) as Array<any>;
      // Démo : pas de correspondance → saisie manuelle
      toast({
        title: "Aucune fiche trouvée",
        description: "Renseigne les champs manuellement.",
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Erreur de recherche",
        description:
          "Impossible de contacter la base. Renseigne les champs manuellement.",
      });
    }
  };

  // Changement nationalité : Suisse => pas de permis ; sinon on affiche permis
  const handleNationalityChange = (val: string) => {
    setNationality(val);
    if (val === "Suisse") {
      setResidencePermit("Citoyen");
      setPermitExpiryDate("");
    }
  };

  // Validation + ajout rapide
  const handleQuickAdd = () => {
    const roleCanonical = role ? (role as CanonicalRole) : ("" as CanonicalRole);

    if (
      !firstName ||
      !lastName ||
      !roleCanonical ||
      !birthDate ||
      !gender ||
      !nationality
    ) {
      toast({
        variant: "destructive",
        title: "Champs manquants",
        description:
          "Prénom, nom, rôle, date de naissance, genre et nationalité sont requis.",
      });
      return;
    }

    if (hasSpouse && isSpouse(roleCanonical)) {
      toast({
        variant: "destructive",
        title: "Conjoint déjà présent",
        description: "Le ménage ne peut contenir qu’un seul conjoint.",
      });
      return;
    }

    // Si non-Suisse et permis B/F → exiger une échéance
    const needsExpiry =
      residencePermit === "Permis B" || residencePermit === "Permis F";
    if (nationality !== "Suisse" && needsExpiry && !permitExpiryDate) {
      toast({
        variant: "destructive",
        title: "Échéance manquante",
        description: "Pour un Permis B/F, renseigne la date d’expiration.",
      });
      return;
    }

    // Si Suisse → forcer permis & vider échéance
    const finalPermit = nationality === "Suisse" ? "Citoyen" : residencePermit;
    const finalExpiry =
      nationality !== "Suisse" && needsExpiry ? permitExpiryDate : undefined;

    const payload: Omit<HouseholdMember, "id"> & {
      permitExpiryDate?: string;
    } = {
      role: roleCanonical, // ← stock canonique
      name: `${firstName} ${lastName}`.trim(),
      status: status || "N/A",
      birthDate,
      gender,
      nationality,
      residencePermit: finalPermit,
      permitExpiryDate: finalExpiry,
      hasCurator: false,
      curatorName: "",
      curatorAddress: "",
      curatorPhone: "",
      curatorEmail: "",
    };

    onQuickAdd(payload);
    toast({
      title: "Membre ajouté",
      description: `${firstName} ${lastName} a été ajouté au ménage.`,
    });
    resetFields();
    setAdding(false);
  };

  return (
    <Card className="user-profile-header col-span-5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ménage ({household.length} personne
            {household.length > 1 ? "s" : ""})
            {hasSpouse && (
              <Badge variant="secondary" className="ml-2">
                Conjoint présent
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              variant={adding ? "secondary" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setAdding((v) => !v)}
            >
              <Plus className="h-4 w-4" />
              {adding ? "Fermer" : "Ajouter"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* --- Formulaire d’ajout rapide --- */}
        {adding && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 md:p-4">
            {/* Ligne NSS + Rechercher */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <Label htmlFor="nss">NSS</Label>
                <Input
                  id="nss"
                  value={nss}
                  onChange={(e) => setNss(e.target.value)}
                  placeholder="756.XXXX.XXXX.XX"
                />
              </div>
              <div className="md:col-span-2 flex items-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearchByNSS}
                  className="gap-2"
                >
                  <SearchIcon className="h-4 w-4" />
                  Rechercher NSS
                </Button>
                <span className="text-xs text-slate-500">
                  Si aucune fiche n’est trouvée, renseigne les champs ci-dessous.
                </span>
              </div>
            </div>

            {/* Grille des champs */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Rôle</Label>
                <Select
                  value={role}
                  onValueChange={(v: CanonicalRole) => setRole(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner…" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUICK_ROLE_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        disabled={hasSpouse && isSpouse(opt.value)}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Prénom</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Nom</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Date de naissance</Label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Genre</Label>
                <Select
                  value={gender}
                  onValueChange={(v: "Masculin" | "Féminin") => setGender(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculin">Masculin</SelectItem>
                    <SelectItem value="Féminin">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ Nationalité avec ton composant */}
              <div className="space-y-1 md:col-span-2">
                <Label>Nationalité</Label>
                <NationalitySelector
                  value={nationality}
                  onChange={handleNationalityChange}
                />
              </div>

              {/* ✅ Permis : affiché uniquement si non Suisse */}
              {nationality !== "Suisse" && (
                <div className="space-y-1">
                  <Label>Permis</Label>
                  <Select
                    value={residencePermit}
                    onValueChange={(v) => {
                      setResidencePermit(v);
                      if (!(v === "Permis B" || v === "Permis F")) {
                        setPermitExpiryDate("");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner…" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESIDENCE_PERMIT_OPTIONS
                        .filter((p) => p !== "Citoyen")
                        .map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* ✅ Échéance pour B/F */}
              {nationality !== "Suisse" && (
                <div className="md:col-span-2">
                  <PermitExpiryField
                    permit={residencePermit}
                    value={permitExpiryDate}
                    onChange={setPermitExpiryDate}
                  />
                </div>
              )}

              <div className="space-y-1 md:col-span-2">
                <Label>Statut (facultatif)</Label>
                <Input
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="ex. Étudiant, Sans emploi, etc."
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button onClick={handleQuickAdd}>Ajouter</Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetFields();
                  setAdding(false);
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* --- Liste des membres --- */}
        {household.length === 0 ? (
          <div className="text-sm text-slate-500 italic">
            Aucun membre pour l’instant.
          </div>
        ) : (
          <div className="space-y-4">
            {household.map((m) => {
              const displayMember: HouseholdMember = {
                ...m,
                // ⚠️ on injecte le libellé attendu par HouseholdMemberRow
                role: toDisplayRole(m.role),
              };
              return (
                <HouseholdMemberRow
                  key={m.id}
                  member={displayMember}
                  onRemove={() => onRemove(m.id)}
                  onSwap={() => onSwap(m)}
                  // ↔️ conversion affiché → canonique au changement
                  onUpdateRole={
                    onUpdate
                      ? (newDisplay) =>
                          onUpdate(m.id, { role: toCanonicalRole(newDisplay) })
                      : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HouseholdCard;
