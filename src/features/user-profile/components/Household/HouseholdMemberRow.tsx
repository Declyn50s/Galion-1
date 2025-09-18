import React from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, User } from "lucide-react";
import type { HouseholdMember } from "@/types/user";

interface Props {
  member: HouseholdMember;
  onRemove: () => void;
  onSwap: () => void;
  onEdit?: () => void;
  onUpdate?: (patch: Partial<HouseholdMember>) => void;
}

const HouseholdMemberRow: React.FC<Props> = ({ member, onRemove, onSwap, onEdit }) => {
  const genderBg =
    member.gender === "Masculin"
      ? "bg-blue-50"
      : member.gender === "Féminin"
      ? "bg-pink-50"
      : "bg-slate-50";

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${genderBg}`}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-slate-600" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-slate-900">
            {member.name}
            {member.unborn && <Badge className="ml-2" variant="secondary">à naître</Badge>}
          </div>
          <div className="text-sm text-slate-500">
            {member.role} • {member.status || "—"}
          </div>
          <div className="text-xs text-slate-400">
            {member.unborn
              ? `DPA: ${member.expectedBirthDate ?? "—"}`
              : `${member.birthDate || "—"} • ${member.nationality} • ${member.residencePermit}`}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2 w-10 h-10 p-0" title="Modifier" onClick={onEdit}>
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
                Supprimer <strong>{member.name}</strong> du ménage ? Cette action est irréversible.
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
  );
};

export default HouseholdMemberRow;
