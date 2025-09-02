import React from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Edit, Trash2, User } from 'lucide-react'
import type { HouseholdMember } from '@/types/user'

const ROLE_OPTIONS = [
  'Conjoint',
  'Enfant à charge',
  'Enfant – garde alternée',
  'Enfant – droit de visite',
  'Autre',
] as const

interface Props {
  member: HouseholdMember
  onSwap: () => void
  onRemove: () => void
  onUpdateRole?: (newRole: string) => void
}

const HouseholdMemberRow: React.FC<Props> = ({ member, onSwap, onRemove, onUpdateRole }) => {
  const bg =
    member.gender === 'Masculin'
      ? 'bg-blue-50 dark:bg-blue-900/20'
      : member.gender === 'Féminin'
      ? 'bg-pink-50 dark:bg-pink-900/20'
      : 'bg-slate-50 dark:bg-slate-800'

  const [first, ...lastParts] = (member.name || '').trim().split(' ')
  const last = lastParts.join(' ')

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 ${bg}`}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-slate-600" />
        </div>

        <div className="flex-1">
          <div className="font-medium text-slate-900 dark:text-white">
            <span className="capitalize">{first?.toLowerCase()}</span>{' '}
            <span className="uppercase">{last}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Rôle:</span>
              {onUpdateRole ? (
                <Select value={member.role} onValueChange={(v) => onUpdateRole(v)}>
                  <SelectTrigger className="h-8 w-[220px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="font-medium">{member.role}</span>
              )}
            </div>

            <div className="text-slate-500">
              {member.status ? `• ${member.status}` : ''}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            {new Date(member.birthDate).toLocaleDateString('fr-CH')} • {member.nationality} • {member.residencePermit}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSwap}
          className="gap-2 w-10 h-10 p-0"
          title="Échanger avec la personne principale"
        >
          <Edit className="h-4 w-4" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700" title="Supprimer">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Supprimer <strong>{member.name}</strong> du ménage ? Cette action est irréversible et
                supprimera également les statuts liés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={onRemove} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default HouseholdMemberRow
