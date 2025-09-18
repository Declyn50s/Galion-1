// src/features/user-profile/components/Household/HouseholdMemberDialog.tsx
import React, { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Save, UserPlus } from "lucide-react"

// ⬇️ garde l'import par défaut (aligné avec tes autres fichiers)
import NationalitySelector from "@/components/NationalitySelector"
import { StatusSelect } from "@/components/StatusSelect"
import type { SelectedStatus } from "@/features/user-profile/hooks/useUserProfileState"
import type { HouseholdMember } from "@/types/user"
import {
  MARITAL_STATUS_OPTIONS,
  RESIDENCE_PERMIT_OPTIONS,
} from "@/types/user"

import CuratorSection from "@/features/user-profile/components/PersonalInfoCard/CuratorSection"
import LausanneStatusFields from "@/features/user-profile/components/PersonalInfoCard/LausanneStatusFields"
import PermitExpiryField from "@/features/user-profile/components/PersonalInfoCard/PermitExpiryField"

// Valeurs canoniques déjà adoptées dans Household
const ROLE_OPTIONS = [
  { value: "conjoint", label: "Conjoint·e" },
  { value: "enfant", label: "Enfant" },
  { value: "enfant garde alternée", label: "Enfant (garde alternée)" },
  { value: "enfant droit de visite", label: "Enfant (droit de visite)" },
  { value: "autre", label: "Autre" },
] as const

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  // édition si fourni, sinon création
  member?: Partial<HouseholdMember> | null
  onSave: (payload: Partial<HouseholdMember> & {
    id?: string
    // champs “similaires” au PersonalInfoForm ajoutés au membre
    lastName?: string
    firstName?: string
    socialSecurityNumber?: string
    address?: string
    addressComplement?: string
    postalCode?: string
    city?: string
    phone?: string
    email?: string
    maritalStatus?: string
    lausanneStatus?: string
    lausanneStatusDate?: string
    statuses?: SelectedStatus[]
  }) => void
}

const splitName = (full?: string) => {
  const raw = (full ?? "").trim()
  if (!raw) return { firstName: "", lastName: "" }
  const parts = raw.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: "" }
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.slice(-1)[0] }
}

const buildName = (firstName?: string, lastName?: string) =>
  [firstName ?? "", lastName ?? ""].map(s => (s ?? "").trim()).filter(Boolean).join(" ")

const HouseholdMemberDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  member,
  onSave,
}) => {
  // Pré-hydrate les champs à partir du membre existant
  const initial = useMemo(() => {
    const { firstName, lastName } = splitName(member?.name)
    return {
      id: member?.id,
      role: (member?.role as string) ?? "",
      lastName,
      firstName,
      gender: (member?.gender as any) ?? "",
      birthDate: member?.birthDate ?? "",
      socialSecurityNumber: (member as any)?.socialSecurityNumber ?? "",
      address: (member as any)?.address ?? "",
      addressComplement: (member as any)?.addressComplement ?? "",
      postalCode: (member as any)?.postalCode ?? "",
      city: (member as any)?.city ?? "",
      phone: (member as any)?.phone ?? "",
      email: (member as any)?.email ?? "",

      nationality: member?.nationality ?? "Suisse",
      residencePermit: member?.residencePermit ?? "Citoyen",
      permitExpiryDate: (member as any)?.permitExpiryDate ?? "",

      maritalStatus: (member as any)?.maritalStatus ?? "",
      lausanneStatus: (member as any)?.lausanneStatus ?? "",
      lausanneStatusDate: (member as any)?.lausanneStatusDate ?? "",

      hasCurator: !!member?.hasCurator,
      curatorName: member?.curatorName ?? "",
      curatorAddress: member?.curatorAddress ?? "",
      curatorPhone: member?.curatorPhone ?? "",
      curatorEmail: member?.curatorEmail ?? "",

      statuses: ((member as any)?.statuses ?? []) as SelectedStatus[],
      status: member?.status ?? "", // champ libre existant dans HouseholdMember
    }
  }, [member])

  const [form, setForm] = useState(initial)

  // Ré-hydrate si on ré-ouvre avec un autre membre
  useEffect(() => setForm(initial), [initial, open])

  const patch = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(s => ({ ...s, [k]: v }))

  // Règles Nationalité/Permis identiques à PersonalInfoForm
  useEffect(() => {
    if (form.nationality === "Suisse") {
      if (form.residencePermit !== "Citoyen") {
        patch("residencePermit", "Citoyen")
      }
      if (form.permitExpiryDate) {
        patch("permitExpiryDate", "")
      }
    }
  }, [form.nationality])

  useEffect(() => {
    // si le permis n'est pas B/F → pas d’échéance
    if (!(form.residencePermit === "Permis B" || form.residencePermit === "Permis F")) {
      if (form.permitExpiryDate) patch("permitExpiryDate", "")
    }
  }, [form.residencePermit])

  const handleSave = () => {
    const payload: Partial<HouseholdMember> & any = {
      id: form.id,
      role: (form.role ?? "").toString().trim(),
      // normalise name
      name: buildName(form.firstName, form.lastName),
      // champs similaires au PersonalInfoForm
      lastName: form.lastName,
      firstName: form.firstName,
      gender: form.gender,
      birthDate: form.birthDate,
      socialSecurityNumber: form.socialSecurityNumber,
      address: form.address,
      addressComplement: form.addressComplement,
      postalCode: form.postalCode,
      city: form.city,
      phone: form.phone,
      email: form.email,

      nationality: form.nationality,
      residencePermit: form.nationality === "Suisse" ? "Citoyen" : form.residencePermit,
      permitExpiryDate:
        form.nationality !== "Suisse" &&
        (form.residencePermit === "Permis B" || form.residencePermit === "Permis F")
          ? form.permitExpiryDate
          : "",

      maritalStatus: form.maritalStatus,
      lausanneStatus: form.lausanneStatus,
      lausanneStatusDate: form.lausanneStatusDate,

      hasCurator: form.hasCurator,
      curatorName: form.curatorName,
      curatorAddress: form.curatorAddress,
      curatorPhone: form.curatorPhone,
      curatorEmail: form.curatorEmail,

      statuses: form.statuses,
      status: form.status,
    }

    onSave(payload)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 
        Responsive + scroll interne :
        - w-[95vw] sur mobile, max-w adaptative
        - max-h-[85vh] + overflow-hidden (le body scrolle)
      */}
      <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden">
        {/* Conteneur vertical : header / body (scroll) / footer */}
        <div className="flex max-h-[85vh] flex-col">
          <DialogHeader className="px-4 sm:px-6 py-3 border-b bg-white sticky top-0 z-10">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <UserPlus className="h-5 w-5 shrink-0" />
              {form.id ? "Modifier le membre du ménage" : "Ajouter un membre au ménage"}
            </DialogTitle>
          </DialogHeader>

          {/* BODY scrollable */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
            {/* Rôle dans le ménage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label>Rôle dans le ménage</Label>
                <Select value={form.role} onValueChange={(v) => patch("role", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sélectionner…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Identité & contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" value={form.lastName} onChange={e => patch("lastName", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" value={form.firstName} onChange={e => patch("firstName", e.target.value)} className="h-9" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Genre</Label>
                <Select value={form.gender} onValueChange={(v: "Masculin" | "Féminin") => patch("gender", v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculin">Masculin</SelectItem>
                    <SelectItem value="Féminin">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Date de naissance</Label>
                <Input id="birthDate" type="date" value={form.birthDate} onChange={e => patch("birthDate", e.target.value)} className="h-9" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nss">NSS</Label>
                <Input
                  id="nss"
                  value={form.socialSecurityNumber}
                  onChange={e => patch("socialSecurityNumber", e.target.value)}
                  placeholder="756.1234.5678.90"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" value={form.address} onChange={e => patch("address", e.target.value)} className="h-9" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressComplement">Complément d'adresse</Label>
                <Input
                  id="addressComplement"
                  value={form.addressComplement}
                  onChange={e => patch("addressComplement", e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">NPA</Label>
                <Input id="postalCode" value={form.postalCode} onChange={e => patch("postalCode", e.target.value)} className="h-9" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" value={form.city} onChange={e => patch("city", e.target.value)} className="h-9" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" value={form.phone} onChange={e => patch("phone", e.target.value)} className="h-9" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={e => patch("email", e.target.value)} className="h-9" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationalité</Label>
                <NationalitySelector value={form.nationality} onChange={(v) => patch("nationality", v)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="residencePermit">Permis de séjour</Label>
                <Select
                  value={form.residencePermit}
                  onValueChange={(v) => patch("residencePermit", v)}
                >
                  <SelectTrigger className="h-9"><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>
                    {form.nationality === "Suisse" ? (
                      <SelectItem value="Citoyen">Citoyen</SelectItem>
                    ) : (
                      RESIDENCE_PERMIT_OPTIONS
                        .filter((p) => p !== "Citoyen")
                        .map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maritalStatus">État civil</Label>
                <Select
                  value={form.maritalStatus}
                  onValueChange={(v) => patch("maritalStatus", v)}
                >
                  <SelectTrigger className="h-9"><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                  <SelectContent>
                    {MARITAL_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Via Lausanne + date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <LausanneStatusFields
                value={form.lausanneStatus}
                date={form.lausanneStatusDate}
                onChange={(k, v) => patch(k as keyof typeof form, v as any)}
              />
            </div>

            {/* Échéance de permis conditionnelle */}
            <PermitExpiryField
              permit={form.residencePermit}
              value={form.permitExpiryDate}
              onChange={(v) => patch("permitExpiryDate", v)}
            />

            <Separator />

            {/* Curateur */}
            <CuratorSection
              hasCurator={form.hasCurator}
              curatorName={form.curatorName}
              curatorAddress={form.curatorAddress}
              curatorPhone={form.curatorPhone}
              curatorEmail={form.curatorEmail}
              onChange={(field, value) => patch(field as keyof typeof form, value as any)}
            />

            <Separator />

            {/* Statuts (revenus/présences etc.) */}
            <StatusSelect
              value={form.statuses}
              onChange={(v) => patch("statuses", v)}
            />
          </div>

          {/* FOOTER fixe */}
          <DialogFooter className="gap-2 px-4 sm:px-6 py-3 border-t bg-white sticky bottom-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default HouseholdMemberDialog
