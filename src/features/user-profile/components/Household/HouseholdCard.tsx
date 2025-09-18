import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Search as SearchIcon, Baby, History, Edit } from "lucide-react";
import HouseholdMemberRow from "./HouseholdMemberRow";
import HouseholdMemberDialog from "./HouseholdMemberDialog";
import type { HouseholdMember } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { RESIDENCE_PERMIT_OPTIONS } from "@/types/user";
import NationalitySelector from "@/components/NationalitySelector";
import PermitExpiryField from "@/features/user-profile/components/PersonalInfoCard/PermitExpiryField";
import { canonicalizeRole, ROLE_OPTIONS } from "@/lib/roles";

// helpers âge (inchangés)
const toDate = (s?: string) => { if (!s) return undefined; const d = new Date(s); return Number.isNaN(d.getTime()) ? undefined : d; };
const yearsDiff = (iso?: string) => { const d = toDate(iso); if (!d) return 0; const t = new Date(); let a = t.getFullYear() - d.getFullYear(); const md = t.getMonth() - d.getMonth(); if (md < 0 || (md === 0 && t.getDate() < d.getDate())) a--; return a; };
const isSpouse = (role?: string) => canonicalizeRole(role) === "conjoint";

type CanonicalRole = (typeof ROLE_OPTIONS)[number]["value"];

interface Props {
  household: HouseholdMember[];
  onRemove: (id: string) => void;
  onSwap: (member: HouseholdMember) => void;
  onQuickAdd: (m: Omit<HouseholdMember, "id">) => void;
  onUpdate?: (id: string, patch: Partial<HouseholdMember>) => void;
  onOpenHistory?: () => void; // 🔽 bouton "Historique"
}

const HouseholdCard: React.FC<Props> = ({
  household,
  onRemove,
  onSwap,
  onQuickAdd,
  onUpdate,
  onOpenHistory,
}) => {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  // 🔽 Ajout rapide standard
  const [nss, setNss] = useState("");
  const [role, setRole] = useState<CanonicalRole | "">("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"Masculin" | "Féminin" | "">("");
  const [nationality, setNationality] = useState("Suisse");
  const [residencePermit, setResidencePermit] = useState<string>("Citoyen");
  const [permitExpiryDate, setPermitExpiryDate] = useState<string>("");
  const [status, setStatus] = useState("");

  // 🔽 Ajout “enfant à naître”
  const [addingUnborn, setAddingUnborn] = useState(false);
  const [expectedBirthDate, setExpectedBirthDate] = useState<string>("");

  const [editing, setEditing] = useState<HouseholdMember | null>(null);

  const hasSpouse = useMemo(
    () => household.some((h) => canonicalizeRole(h.role) === "conjoint"),
    [household]
  );

  // NSS démo
  const handleSearchByNSS = async () => {
    if (!nss.trim()) {
      toast({ variant: "destructive", title: "NSS manquant", description: "Saisis un NSS avant de rechercher." });
      return;
    }
    try {
      const res = await fetch("/people.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: "Aucune fiche trouvée", description: "Renseigne les champs manuellement." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur de recherche", description: "Impossible de contacter la base." });
    }
  };

  const resetFields = () => {
    setNss(""); setRole(""); setFirstName(""); setLastName("");
    setBirthDate(""); setGender(""); setNationality("Suisse");
    setResidencePermit("Citoyen"); setPermitExpiryDate(""); setStatus("");
  };

  const handleNationalityChange = (val: string) => {
    setNationality(val);
    if (val === "Suisse") { setResidencePermit("Citoyen"); setPermitExpiryDate(""); }
  };

  // Ajout rapide standard
  const handleQuickAdd = () => {
    const roleCanonical = role ? (role as CanonicalRole) : ("" as CanonicalRole);
    if (!firstName || !lastName || !roleCanonical || !birthDate || !gender || !nationality) {
      toast({ variant: "destructive", title: "Champs manquants", description: "Prénom, nom, rôle, date de naissance, genre et nationalité sont requis." });
      return;
    }
    if (hasSpouse && isSpouse(roleCanonical)) {
      toast({ variant: "destructive", title: "Conjoint déjà présent", description: "Un seul conjoint autorisé." });
      return;
    }
    if (isSpouse(roleCanonical) && yearsDiff(birthDate) < 18) {
      toast({ variant: "destructive", title: "Conjoint invalide", description: "Le conjoint doit être majeur (≥ 18 ans)." });
      return;
    }
    const needsExpiry = residencePermit === "Permis B" || residencePermit === "Permis F";
    if (nationality !== "Suisse" && needsExpiry && !permitExpiryDate) {
      toast({ variant: "destructive", title: "Échéance manquante", description: "Pour B/F, renseigne la date d’expiration." });
      return;
    }

    const finalPermit = nationality === "Suisse" ? "Citoyen" : residencePermit;
    const finalExpiry = nationality !== "Suisse" && needsExpiry ? permitExpiryDate : undefined;

    const payload: Omit<HouseholdMember, "id"> = {
      role: roleCanonical,
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
    toast({ title: "Membre ajouté", description: `${firstName} ${lastName} a été ajouté.` });
    resetFields();
    setAdding(false);
  };

  // 🔽 Ajout “Enfant à naître”
  const handleAddUnborn = () => {
    if (!expectedBirthDate) {
      toast({ variant: "destructive", title: "DPA manquante", description: "Indique la date prévue d’accouchement." });
      return;
    }
    const payload: Omit<HouseholdMember, "id"> = {
      role: "enfant",                 // canonique pour la suite
      name: "Enfant à naître",
      status: "N/A",
      birthDate: "",                  // inconnu (ne pas compter)
      gender: "",
      nationality: "Suisse",
      residencePermit: "Citoyen",
      hasCurator: false,
      curatorName: "",
      curatorAddress: "",
      curatorPhone: "",
      curatorEmail: "",
      unborn: true,                   // <—
      expectedBirthDate,              // <—
    };
    onQuickAdd(payload);
    setExpectedBirthDate("");
    setAddingUnborn(false);
    toast({ title: "Ajouté", description: "Enfant à naître enregistré." });
  };

  // normalise rôles existants
  useEffect(() => {
    if (!onUpdate) return;
    household.forEach((m) => {
      const canon = canonicalizeRole(m.role);
      if (canon !== m.role) onUpdate(m.id, { role: canon });
    });
  }, [household, onUpdate]);

  return (
    <Card className="user-profile-header col-span-5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            👪 Ménage ({household.length} personne{household.length > 1 ? "s" : ""})
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onOpenHistory ?? (() => toast({ title: "À venir", description: "Historique du ménage sera implémenté ici." }))}
              title="Historique du ménage"
            >
              <History className="h-4 w-4" />
              Historique
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setAddingUnborn((v) => !v)}
              title="Déclarer un enfant à naître (DPA)"
            >
              <Baby className="h-4 w-4" />
              Enfant à naître
            </Button>

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
        {/* --- Bandeau ajout “enfant à naître” --- */}
        {addingUnborn && (
          <div className="rounded-lg border border-slate-200 bg-blue-50/60 p-3 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <Label htmlFor="expectedBirthDate">Date prévue d’accouchement</Label>
                <Input
                  id="expectedBirthDate"
                  type="date"
                  value={expectedBirthDate}
                  onChange={(e) => setExpectedBirthDate(e.target.value)}
                />
              </div>
              <div className="md:col-span-2 flex items-end gap-2">
                <Button onClick={handleAddUnborn}>Ajouter</Button>
                <Button variant="outline" onClick={() => { setExpectedBirthDate(""); setAddingUnborn(false); }}>Annuler</Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              L’enfant à naître n’est pas compté dans les effectifs. À la naissance, édite la fiche pour renseigner prénom/nom et date de naissance.
            </p>
          </div>
        )}

        {/* --- Formulaire d’ajout rapide standard --- */}
        {adding && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <Label htmlFor="nss">NSS</Label>
                <Input id="nss" value={nss} onChange={(e) => setNss(e.target.value)} placeholder="756.XXXX.XXXX.XX" />
              </div>
              <div className="md:col-span-2 flex items-end gap-2">
                <Button type="button" variant="outline" onClick={handleSearchByNSS} className="gap-2">
                  <SearchIcon className="h-4 w-4" />
                  Rechercher NSS
                </Button>
                <span className="text-xs text-slate-500">Sinon, renseigne ci-dessous.</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Rôle</Label>
                <Select value={role} onValueChange={(v: CanonicalRole) => setRole(v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        disabled={(hasSpouse && canonicalizeRole(opt.value) === "conjoint") ||
                                  (canonicalizeRole(opt.value) === "conjoint" && birthDate && yearsDiff(birthDate) < 18)}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Prénom</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Nom</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Date de naissance</Label>
                <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label>Genre</Label>
                <Select value={gender} onValueChange={(v: "Masculin" | "Féminin") => setGender(v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculin">Masculin</SelectItem>
                    <SelectItem value="Féminin">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label>Nationalité</Label>
                <NationalitySelector value={nationality} onChange={handleNationalityChange} />
              </div>

              {nationality !== "Suisse" && (
                <div className="space-y-1">
                  <Label>Permis</Label>
                  <Select
                    value={residencePermit}
                    onValueChange={(v) => {
                      setResidencePermit(v);
                      if (!(v === "Permis B" || v === "Permis F")) setPermitExpiryDate("");
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                    <SelectContent>
                      {RESIDENCE_PERMIT_OPTIONS.filter((p) => p !== "Citoyen").map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {nationality !== "Suisse" && (
                <div className="md:col-span-2">
                  <PermitExpiryField permit={residencePermit} value={permitExpiryDate} onChange={setPermitExpiryDate} />
                </div>
              )}

              <div className="space-y-1 md:col-span-2">
                <Label>Statut (facultatif)</Label>
                <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Étudiant, Sans emploi…" />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button onClick={handleQuickAdd}>Ajouter</Button>
              <Button variant="outline" onClick={() => { resetFields(); setAdding(false); }}>Annuler</Button>
            </div>
          </div>
        )}

        {/* --- Liste --- */}
        {household.length === 0 ? (
          <div className="text-sm text-slate-500 italic">Aucun membre pour l’instant.</div>
        ) : (
          <div className="space-y-4">
            {household.map((m) => {
              const canonical = canonicalizeRole(m.role);
              return (
                <HouseholdMemberRow
                  key={m.id}
                  member={{ ...m, role: canonical }}
                  onRemove={() => onRemove(m.id)}
                  onSwap={() => onSwap(m)}
                  onEdit={() => setEditing(m)}                 // 🔽 édition individuelle
                  onUpdate={
                    onUpdate
                      ? (patch) => {
                          const p = { ...patch } as Partial<HouseholdMember>;
                          if (p.role) {
                            const nextRole = canonicalizeRole(p.role);
                            if (nextRole === "conjoint" && yearsDiff(m.birthDate) < 18) {
                              toast({ variant: "destructive", title: "Conjoint invalide", description: "Le conjoint doit être majeur (≥ 18 ans)." });
                              return;
                            }
                            p.role = nextRole;
                          }
                          onUpdate(m.id, p);
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </CardContent>

      {/* 🔽 Dialog édition membre */}
      {editing && (
        <HouseholdMemberDialog
          open={!!editing}
          onOpenChange={(o) => { if (!o) setEditing(null); }}
          member={editing}
          household={household}
          onSave={(patch) => { onUpdate?.(editing.id, patch); }}
        />
      )}
    </Card>
  );
};

export default HouseholdCard;
