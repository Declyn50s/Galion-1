import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus } from 'lucide-react'
import HouseholdMemberRow from './HouseholdMemberRow'
import type { HouseholdMember } from '@/types/user'

interface Props {
  household: HouseholdMember[]
  onRemove: (id: string) => void
  onSwap: (member: HouseholdMember) => void
  onAdd: () => void
}

const HouseholdCard: React.FC<Props> = ({ household, onRemove, onSwap, onAdd }) => {
  return (
    <Card className="user-profile-header col-span-5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ménage ({household.length} personne{household.length > 1 ? 's' : ''})
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-2" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {household.length === 0 ? (
          <div className="text-sm text-slate-500 italic">
            Aucun membre pour l’instant.
          </div>
        ) : (
          <div className="space-y-4">
            {household.map((m) => (
              <HouseholdMemberRow
                key={m.id}
                member={m}
                onRemove={() => onRemove(m.id)}
                onSwap={() => onSwap(m)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default HouseholdCard
