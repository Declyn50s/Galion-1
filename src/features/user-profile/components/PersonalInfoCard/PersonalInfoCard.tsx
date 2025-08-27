// src/features/user-profile/components/PersonalInfoCard/PersonalInfoCard.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Copy } from 'lucide-react'
import PersonalInfoDisplay from './PersonalInfoDisplay'
import PersonalInfoForm from './PersonalInfoForm'
import type { SelectedStatus } from '../../hooks/useUserProfileState'
import type { UserProfile as UserProfileType } from '@/types/user'

interface Props {
  userProfile: UserProfileType
  isEditing: boolean
  isSwapping: boolean
  statuses: SelectedStatus[]
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onCopyAddress: () => void
  updateProfile: (field: keyof UserProfileType, value: any) => void
  setStatuses: (s: SelectedStatus[]) => void
}

const PersonalInfoCard: React.FC<Props> = ({
  userProfile,
  isEditing,
  isSwapping,
  statuses,
  onEdit,
  onCancel,
  onSave,
  onCopyAddress,
  updateProfile,
  setStatuses,
}) => {
  const baseBg =
    userProfile.gender === 'Masculin'
      ? 'bg-blue-50/80 dark:bg-blue-900/20'
      : userProfile.gender === 'Féminin'
      ? 'bg-pink-50/80 dark:bg-pink-900/20'
      : 'bg-white/80 dark:bg-slate-800'

  return (
    <Card
      className={`col-span-6 shadow-lg border-0 backdrop-blur-sm transition-all duration-300 ${
        isSwapping ? 'scale-105 shadow-2xl ring-4 ring-blue-200 bg-blue-50/90' : baseBg
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle
            className={`text-xl font-semibold transition-colors duration-300 ${
              isSwapping ? 'text-blue-700' : 'text-slate-800'
            }`}
          >
            👤 Informations personnelles
          </CardTitle>
          {!isEditing && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCopyAddress} className="gap-2">
                <Copy className="h-4 w-4" />
                Copier
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <PersonalInfoForm
            userProfile={userProfile}
            updateProfile={updateProfile}
            onCancel={onCancel}
            onSave={onSave}
            statuses={statuses}
            setStatuses={setStatuses}
          />
        ) : (
          <PersonalInfoDisplay userProfile={userProfile} statuses={statuses} />
        )}
      </CardContent>
    </Card>
  )
}

export default PersonalInfoCard
