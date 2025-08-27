// src/features/user-profile/components/PersonalInfoCard/PersonalInfoForm.tsx
import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'
import { NationalitySelector } from '@/components/NationalitySelector'
import { StatusSelect } from '@/components/StatusSelect'
import type { SelectedStatus } from '../../hooks/useUserProfileState'
import type { UserProfile as UserProfileType } from '@/types/user'
import {
  MARITAL_STATUS_OPTIONS,
  RESIDENCE_PERMIT_OPTIONS,
} from '@/types/user'
import CuratorSection from './CuratorSection'
import LausanneStatusFields from './LausanneStatusFields'
import PermitExpiryField from './PermitExpiryField'

interface Props {
  userProfile: UserProfileType
  updateProfile: (field: keyof UserProfileType, value: any) => void
  onCancel: () => void
  onSave: () => void
  statuses: SelectedStatus[]
  setStatuses: (s: SelectedStatus[]) => void
}

const PersonalInfoForm: React.FC<Props> = ({
  userProfile,
  updateProfile,
  onCancel,
  onSave,
  statuses,
  setStatuses,
}) => {
  return (
    <>
      {/* Identité & contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            value={userProfile.lastName}
            onChange={(e) => updateProfile('lastName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            value={userProfile.firstName}
            onChange={(e) => updateProfile('firstName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Genre</Label>
          <Select
            value={userProfile.gender}
            onValueChange={(v) => updateProfile('gender', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Masculin">Masculin</SelectItem>
              <SelectItem value="Féminin">Féminin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">Date de naissance</Label>
          <Input
            id="birthDate"
            type="date"
            value={userProfile.birthDate}
            onChange={(e) => updateProfile('birthDate', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nss">NSS</Label>
          <Input
            id="nss"
            value={userProfile.socialSecurityNumber}
            onChange={(e) =>
              updateProfile('socialSecurityNumber', e.target.value)
            }
            placeholder="756.1234.5678.90"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            value={userProfile.address}
            onChange={(e) => updateProfile('address', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addressComplement">Complément d'adresse</Label>
          <Input
            id="addressComplement"
            value={userProfile.addressComplement}
            onChange={(e) =>
              updateProfile('addressComplement', e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">NPA</Label>
          <Input
            id="postalCode"
            value={userProfile.postalCode}
            onChange={(e) => updateProfile('postalCode', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input
            id="city"
            value={userProfile.city}
            onChange={(e) => updateProfile('city', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            value={userProfile.phone}
            onChange={(e) => updateProfile('phone', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={userProfile.email}
            onChange={(e) => updateProfile('email', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nationality">Nationalité</Label>
          <NationalitySelector
            value={userProfile.nationality}
            onChange={(v) => updateProfile('nationality', v)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="residencePermit">Permis de séjour</Label>
          <Select
            value={userProfile.residencePermit}
            onValueChange={(v) => updateProfile('residencePermit', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {userProfile.nationality === 'Suisse' ? (
                <SelectItem value="Citoyen">Citoyen</SelectItem>
              ) : (
                RESIDENCE_PERMIT_OPTIONS
                  .filter((p) => p !== 'Citoyen')
                  .map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maritalStatus">État civil</Label>
          <Select
            value={userProfile.maritalStatus}
            onValueChange={(v) => updateProfile('maritalStatus', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MARITAL_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Via Lausanne + date conditionnelle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LausanneStatusFields
          value={userProfile.lausanneStatus}
          date={userProfile.lausanneStatusDate}
          onChange={(k, v) => updateProfile(k as any, v)}
        />
      </div>

      {/* Échéance de permis conditionnelle */}
      <PermitExpiryField
        permit={userProfile.residencePermit}
        value={userProfile.permitExpiryDate}
        onChange={(v) => updateProfile('permitExpiryDate', v)}
      />

      <Separator className="my-6" />

      {/* Curateur */}
      <CuratorSection
        hasCurator={userProfile.hasCurator}
        curatorName={userProfile.curatorName}
        curatorAddress={userProfile.curatorAddress}
        curatorPhone={userProfile.curatorPhone}
        curatorEmail={userProfile.curatorEmail}
        onChange={updateProfile}
      />

      <Separator className="my-6" />

      {/* Statuts */}
      <StatusSelect value={statuses} onChange={setStatuses} />

      <Separator className="my-6" />

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={onSave} className="gap-2">
          <Save className="h-4 w-4" />
          Enregistrer
        </Button>
      </div>
    </>
  )
}

export default PersonalInfoForm
