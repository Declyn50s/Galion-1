// src/features/user-profile/components/Household/HouseholdMemberDialog.tsx
import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NationalitySelector from "@/components/NationalitySelector";
import PermitExpiryField from "@/features/user-profile/components/PersonalInfoCard/PermitExpiryField";
import type { HouseholdMember } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { canonicalizeRole, ROLE_OPTIONS } from "@/lib/roles";


// Policy: which roles may be duplicated? If you really want strict uniqueness, set allowDuplicates = () => false
const allowDuplicates = (roleCanonical: string) => roleCanonical.startsWith("enfant");

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


const HouseholdMemberDialog: React.FC<Props> = ({ open, onOpenChange, member, household, onSave }) => {
const { toast } = useToast();


const usedRoles = useMemo(() => new Set(household.filter(m => m.id !== member.id).map(m => canonicalizeRole(m.role))), [household, member.id]);


const [name, setName] = useState(member.name || "");
const [birthDate, setBirthDate] = useState(member.birthDate || "");
const [gender, setGender] = useState<"Masculin" | "Féminin" | "">((member.gender as any) || "");
const [role, setRole] = useState(canonicalizeRole(member.role));
const [nationality, setNationality] = useState(member.nationality || "Suisse");
const [residencePermit, setResidencePermit] = useState(member.residencePermit || (nationality === "Suisse" ? "Citoyen" : ""));
const [permitExpiryDate, setPermitExpiryDate] = useState((member as any).permitExpiryDate || "");
const [status, setStatus] = useState(member.status || "");


const isRoleTaken = usedRoles.has(role) && !allowDuplicates(role);
const needsExpiry = nationality !== "Suisse" && (residencePermit === "Permis B" || residencePermit === "Permis F");


const handleSave = () => {
  if (!name.trim() || !role || !gender) {
    toast({ variant: "destructive", title: "Champs requis", description: "Nom, rôle et genre sont obligatoires." });
    return;
  }
  if (canonicalizeRole(role) === "conjoint" && yearsDiff(birthDate) < 18) {
    toast({ variant: "destructive", title: "Conjoint invalide", description: "Le conjoint doit être majeur (≥ 18 ans)." });
    return;
  }
  if (isRoleTaken) {
    toast({ variant: "destructive", title: "Rôle déjà utilisé", description: "Choisis un autre rôle (unicité requise)." });
    return;
  }
  if (needsExpiry && !permitExpiryDate) {
    toast({ variant: "destructive", title: "Échéance manquante", description: "Date d'expiration requise pour le permis sélectionné." });
    return;
  }

  // Normalisation permis
  const finalPermit = nationality === "Suisse" ? "Citoyen" : (residencePermit || "");
  const needsBF = finalPermit === "Permis B" || finalPermit === "Permis F";
  const finalExpiry = nationality === "Suisse" || !needsBF ? "" : permitExpiryDate;

  const patch: Partial<HouseholdMember> = {
    name: name.trim(),
    role: canonicalizeRole(role),        // toujours canonique
    birthDate,
    gender: gender as any,
    nationality,
    residencePermit: finalPermit,
    // Si ton type ne l’a pas, ajoute-le au modèle; sinon enlève la ligne ou garde un @ts-ignore
    // @ts-ignore
    permitExpiryDate: finalExpiry || undefined,
    status,
  };

  onSave(patch);
  onOpenChange(false);
};

// 👉 (facultatif mais utile) si la nationalité devient "Suisse", on force le permis/échéance
React.useEffect(() => {
  if (nationality === "Suisse") {
    setResidencePermit("Citoyen");
    setPermitExpiryDate("");
  }
}, [nationality]);

return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Membre du ménage</DialogTitle>
      </DialogHeader>

      {/* … tes champs (name, birthDate, gender, role, nationality, permit, etc.) … */}

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
        <Button onClick={handleSave}>Enregistrer</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
};

export default HouseholdMemberDialog;