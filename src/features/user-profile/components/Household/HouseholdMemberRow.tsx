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
import { Edit, Trash2, User } from 'lucide-react'
import type { HouseholdMember } from '@/types/user'

interface Props {
  member: HouseholdMember
  onSwap: () => void
  onRemove: () => void
}

const HouseholdMemberRow: React.FC<Props> = ({ member, onSwap, onRemove }) => {
  const bg =
    member.gender === 'Masculin'
      ? 'bg-blue-50 dark:bg-blue-900/20'
      : member.gender === 'Féminin'
      ? 'bg-pink-50 dark:bg-pink-900/20'
      : 'bg-slate-50 dark:bg-slate-800'

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 ${bg}`}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-slate-600" />
        </div>
        <div
          className="flex-1 cursor-pointer transition-colors duration-200 hover:bg-blue-50 hover:text-blue-700 rounded p-2 -m-2"
          onDoubleClick={onSwap}
        >
          <div className="font-medium text-slate-900 dark:text-white">
            <span className="capitalize">{member.name.split(' ')[0].toLowerCase()}</span>{' '}
            <span className="uppercase">{member.name.split(' ').slice(1).join(' ')}</span>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {member.role} • {member.status}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">
            {new Date(member.birthDate).toLocaleDateString('fr-CH')} • {member.nationality} • {member.residencePermit}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSwap} className="gap-2 w-10 h-10 p-0" title="Modifier">
          <Edit className="h-4 w-4" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer <strong>{member.name}</strong> du ménage ? Cette action est
                irréversible et supprimera également tous les statuts associés à cette personne.
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
