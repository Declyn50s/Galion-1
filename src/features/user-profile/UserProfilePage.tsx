// src/features/user-profile/UserProfilePage.tsx
import React from 'react'
import { useParams } from 'react-router-dom'

import HeaderBar from './components/HeaderBar'
import InteractionBar from './components/InteractionBar'
import DatesCard from './components/DatesCard'
import IncomeCard from './components/IncomeCard'
import PersonalInfoCard from './components/PersonalInfoCard'
import HouseholdCard from './components/Household/HouseholdCard'
import { useUserProfileState } from './hooks/useUserProfileState'
import { InteractionDialog } from '@/components/InteractionDialog'

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const state = useUserProfileState(userId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <HeaderBar
          isApplicant={state.userProfile.isApplicant}
          isTenant={state.userProfile.isTenant}
          onSave={state.savePersonalInfo}
          onAttestation={() => console.log('Attestation click')}
          onCopyAddress={state.copyAddressInfo}
        />

        <InteractionBar onClick={state.handleInteractionClick} />

        <div className="grid grid-cols-4 gap-6">
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

          <DatesCard
            registrationDate={state.userProfile.registrationDate}
            lastCertificateDate={state.userProfile.lastCertificateDate}
            deadline={state.userProfile.deadline}
            maxRooms={state.userProfile.maxRooms}
            minRent={state.userProfile.minRent}
            onChange={state.updateProfile}
          />
        </div>

        <div className="grid grid-cols-6 gap-6">
          <HouseholdCard
            household={state.userProfile.household}
            onRemove={state.removeHouseholdMember}
            onSwap={state.swapWithPersonalInfo}
            onAdd={state.addHouseholdMember}
          />

          <IncomeCard
            individualIncome={state.userProfile.individualIncome}
            householdIncome={state.userProfile.householdIncome}
          />
        </div>
      </div>

      {state.dialogOpen.type && (
        <InteractionDialog
          isOpen={state.dialogOpen.isOpen}
          onClose={state.handleDialogClose}
          initialType={state.dialogOpen.type}
          onSave={(data) => {
            console.log('Interaction saved:', data)
          }}
        />
      )}
    </div>
  )
}

export default UserProfilePage
