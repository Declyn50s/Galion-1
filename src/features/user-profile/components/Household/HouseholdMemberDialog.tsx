// src/features/user-profile/components/Household/HouseholdMemberDialog.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NationalitySelector from "@/components/NationalitySelector";
import PermitExpiryField from "@/features/user-profile/components/PersonalInfoCard/PermitExpiryField";
import type { HouseholdMember } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { canonicalizeRole, ROLE_OPTIONS } from "@/lib/roles";

// ───────────────────────────────────────────────────────────
// Règle de duplication des rôles (OK en multiple pour “enfant*”)
const allowDuplicates = (roleCanonical: string) =>
  roleCanonical.startsWith("enfant");

// Âge helpers
const toDate = (s?: string) => {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  member: HouseholdMember;
  /** full household for validations */
  household: HouseholdMember[];
  onSave: (patch: Partial<HouseholdMember>) => void;
}

const HouseholdMemberDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  member,
  household,
  onSave,
}) => {
  const { toast } = useToast();

  const usedRoles = useMemo(
    () =>
      new Set(
        household
          .filter((m) => m.id !== member.id)
          .map((m) => canonicalizeRole(m.role))
      ),
    [household, member.id]
  );
  const spouseTaken = usedRoles.has("conjoint");

  const [name, setName] = useState(member.name || "");
  const [birthDate, setBirthDate] = useState(member.birthDate || "");
  const [gender, setGender] = useState<"Masculin" | "Féminin" | "">(
    (member.gender as any) || ""
  );
  const [role, setRole] = useState(canonicalizeRole(member.role)); // ← canonique
  const [nationality, setNationality] = useState(member.nationality || "Suisse");
  const [residencePermit, setResidencePermit] = useState(
    member.residencePermit || (member.nationality === "Suisse" ? "Citoyen" : "")
  );
  const [permitExpiryDate, setPermitExpiryDate] = useState<string>(
    // @ts-ignore
    member.permitExpiryDate || ""
  );
  const [status, setStatus] = useState(member.status || "");

  const isRoleTaken = usedRoles.has(role) && !allowDuplicates(role);
  const needsExpiry =
    nationality !== "Suisse" &&
    (residencePermit === "Permis B" || residencePermit === "Permis F");

  // Si nationalité = Suisse → force permis & vide l’échéance
  useEffect(() => {
    if (nationality === "Suisse") {
      setResidencePermit("Citoyen");
      setPermitExpiryDate("");
    }
  }, [nationality]);

  const handleSave = () => {
    if (!name.trim() || !role || !gender) {
      toast({
        variant: "destructive",
        title: "Champs requis",
        description: "Nom, rôle et genre sont obligatoires.",
      });
      return;
    }

    // Conjoint : doit être majeur et avec date connue
    if (canonicalizeRole(role) === "conjoint") {
      if (!birthDate) {
        toast({
          variant: "destructive",
          title: "Date manquante",
          description:
            "La date de naissance est requise pour un conjoint (validation d’âge).",
        });
        return;
      }
      if (yearsDiff(birthDate) < 18) {
        toast({
          variant: "destructive",
          title: "Conjoint invalide",
          description: "Le conjoint doit être majeur (≥ 18 ans).",
        });
        return;
      }
    }

    if (isRoleTaken) {
      toast({
        variant: "destructive",
        title: "Rôle déjà utilisé",
        description: "Choisis un autre rôle (unicité requise).",
      });
      return;
    }

    if (needsExpiry && !permitExpiryDate) {
      toast({
        variant: "destructive",
        title: "Échéance manquante",
        description:
          "Date d'expiration requise pour le permis sélectionné (B/F).",
      });
      return;
    }

    // Normalisation permis
    const finalPermit = nationality === "Suisse" ? "Citoyen" : residencePermit;
    const needsBF = finalPermit === "Permis B" || finalPermit === "Permis F";
    const finalExpiry =
      nationality === "Suisse" || !needsBF ? "" : permitExpiryDate;

    const patch: Partial<HouseholdMember> = {
      name: name.trim(),
      role: canonicalizeRole(role), // toujours canonique
      birthDate,
      gender: gender as any,
      nationality,
      residencePermit: finalPermit,
      // @ts-ignore (selon ton type)
      permitExpiryDate: finalExpiry || undefined,
      status,
    };

    onSave(patch);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Membre du ménage</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nom complet</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prénom Nom"
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

            <div className="space-y-1 md:col-span-2">
              <Label>Rôle</Label>
              <Select
                value={role}
                onValueChange={(v) => {
                  const next = canonicalizeRole(v);
                  // Interdit de sélectionner "conjoint" si un conjoint existe déjà
                  if (next === "conjoint" && spouseTaken) {
                    toast({
                      variant: "destructive",
                      title: "Conjoint déjà présent",
                      description:
                        "Le ménage ne peut contenir qu’un seul conjoint.",
                    });
                    return;
                  }
                  // Interdit de sélectionner "conjoint" si mineur
                  if (next === "conjoint" && birthDate && yearsDiff(birthDate) < 18) {
                    toast({
                      variant: "destructive",
                      title: "Conjoint invalide",
                      description: "Le conjoint doit être majeur (≥ 18 ans).",
                    });
                    return;
                  }
                  setRole(next);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner…" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => {
                    const val = canonicalizeRole(opt.value);
                    const disabled =
                      (val === "conjoint" && spouseTaken) ||
                      (val === "conjoint" &&
                        !!birthDate &&
                        yearsDiff(birthDate) < 18);
                    return (
                      <SelectItem key={opt.value} value={opt.value} disabled={disabled}>
                        {opt.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nationalité</Label>
              <NationalitySelector
                value={nationality}
                onChange={(val) => setNationality(val)}
              />
            </div>

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
                    <SelectItem value="Permis B">Permis B</SelectItem>
                    <SelectItem value="Permis C">Permis C</SelectItem>
                    <SelectItem value="Permis F">Permis F</SelectItem>
                    <SelectItem value="Citoyen">Citoyen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HouseholdMemberDialog;
