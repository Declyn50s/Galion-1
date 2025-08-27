// src/features/user-profile/components/PersonalInfoCard/PersonalInfoDisplay.tsx
import React from 'react'
import type { UserProfile as UserProfileType } from '@/types/user'
import { calcAge, formatDateCH } from '../../utils/format'
import StatusChips from './StatusChips'

interface Props {
  userProfile: UserProfileType
  statuses: { value: string; label: string; icon?: string; percentage?: number }[]
}

const PersonalInfoDisplay: React.FC<Props> = ({ userProfile, statuses }) => {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">Civilité</p>
          <p className="text-slate-800">{userProfile.gender === 'Féminin' ? 'Madame' : 'Monsieur'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">Nom</p>
          <p className="text-slate-800">{userProfile.lastName.toUpperCase()}</p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">Prénom</p>
          <p className="text-slate-800">{userProfile.firstName}</p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">Date de naissance</p>
          <p className="text-slate-800">{formatDateCH(userProfile.birthDate)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">Adresse</p>
          <p className="text-slate-800">{userProfile.address}</p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">Complément</p>
          <p className="text-slate-800">{userProfile.addressComplement}</p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">NPA</p>
          <p className="text-slate-800">{userProfile.postalCode}</p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">Ville</p>
          <p className="text-slate-800">{userProfile.city}</p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">NSS</p>
          <p className="text-slate-800">{userProfile.socialSecurityNumber}</p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">Téléphone</p>
          <p className="text-slate-800">{userProfile.phone}</p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">Email</p>
          <p className="text-slate-800">{userProfile.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">Nationalité</p>
          <p className="text-slate-800">{userProfile.nationality}</p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">Permis</p>
          <p className="text-slate-800">{userProfile.residencePermit}</p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">État civil</p>
          <p className="text-slate-800">{userProfile.maritalStatus}</p>
        </div>
        <div className="space-y-1">
          <p className="text-slate-500 font-medium">Âge</p>
          <p className="text-slate-800">{calcAge(userProfile.birthDate)} ans</p>
        </div>

        {userProfile.lausanneStatus && (
          <div className="space-y-1">
            <p className="text-slate-500 font-medium">{userProfile.lausanneStatus}</p>
            <p className="text-slate-800">
              {userProfile.lausanneStatusDate && userProfile.lausanneStatus !== 'Conditions étudiantes'
                ? formatDateCH(userProfile.lausanneStatusDate)
                : '-'}
            </p>
          </div>
        )}

        {userProfile.hasCurator && userProfile.curatorName && (
          <div className="space-y-1">
            <p className="text-slate-500 font-medium">⚠️ Curateur</p>
            <p className="text-red-600 font-medium">{userProfile.curatorName}</p>
          </div>
        )}

        {(userProfile.residencePermit === 'Permis B' || userProfile.residencePermit === 'Permis F') &&
          userProfile.permitExpiryDate && (
            <div className="space-y-1">
              <p className="text-slate-500 font-medium">Fin de validité du permis</p>
              <p className="text-slate-800">{formatDateCH(userProfile.permitExpiryDate)}</p>
            </div>
          )}
      </div>

      <StatusChips statuses={statuses} />
    </>
  )
}

export default PersonalInfoDisplay
