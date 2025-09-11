// src/features/user-profile/components/Household/HouseholdMemberRow.tsx
import React from "react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Edit, Trash2, User } from "lucide-react";
import type { HouseholdMember } from "@/types/user";

// ✅ util commun rôles
import { canonicalizeRole, toDisplayRole, ROLE_OPTIONS } from "@/lib/roles";
import { useToast } from "@/hooks/use-toast";

// Helpers âge (local)
const toDate = (s?: string) => {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
const yearsDiff = (iso?: string) => {
  const d = toDate(iso);
  if (!d) return 0;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const md = today.getMonth() - d.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < d.getDate())) age--;
  return age;
};

interface Props {
  member: HouseholdMember;
  onSwap: () => void;
  onRemove: () => void;
  /** patch partiel (ex: { role: "enfant droit de visite" }) */
  onUpdate?: (patch: Partial<HouseholdMember>) => void;
}

const HouseholdMemberRow: React.FC<Props> = ({
  member,
  onSwap,
  onRemove,
  onUpdate,
}) => {
  const { toast } = useToast();

  const bg =
    member.gender === "Masculin"
      ? "bg-blue-50 dark:bg-blue-900/20"
      : member.gender === "Féminin"
      ? "bg-pink-50 dark:bg-pink-900/20"
      : "bg-slate-50 dark:bg-slate-800";

  const [first, ...lastParts] = (member.name || "").trim().split(" ");
  const last = lastParts.join(" ");

  // `member.role` peut déjà être canonique : on recanonicalise pour sécurité
  const currentCanonical = canonicalizeRole(member.role);

  const age = yearsDiff(member.birthDate);
  const isMinorOrUnknownDOB = !member.birthDate || age < 18;

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 ${bg}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-slate-600" />
        </div>

        <div className="flex-1">
          <div className="font-medium text-slate-900 dark:text-white">
            <span className="capitalize">{first?.toLowerCase()}</span>{" "}
            <span className="uppercase">{last}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Rôle:</span>
              {onUpdate ? (
                <Select
                  value={currentCanonical}
                  onValueChange={(v) => {
                    const next = canonicalizeRole(v);
                    // ❌ Interdit de passer "conjoint" si mineur ou date inconnue
                    if (next === "conjoint" && isMinorOrUnknownDOB) {
                      toast({
                        variant: "destructive",
                        title: "Conjoint invalide",
                        description:
                          "Le conjoint doit être majeur (≥ 18 ans) et la date de naissance doit être renseignée.",
                      });
                      return;
                    }
                    onUpdate({ role: next }); // ← **toujours canonique**
                  }}
                >
                  <SelectTrigger className="h-8 w-[220px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => {
                      const val = canonicalizeRole(r.value);
                      const disabled =
                        val === "conjoint" && isMinorOrUnknownDOB;
                      return (
                        <SelectItem key={r.value} value={r.value} disabled={disabled}>
                          {r.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <span className="font-medium">
                  {toDisplayRole(currentCanonical)}
                </span>
              )}
            </div>

            <div className="text-slate-500">
              {member.status ? `• ${member.status}` : ""}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            {member.birthDate
              ? new Date(member.birthDate).toLocaleDateString("fr-CH")
              : "—"}{" "}
            • {member.nationality} • {member.residencePermit}
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
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-600 hover:text-red-700"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Supprimer <strong>{member.name}</strong> du ménage ? Cette action
                est irréversible et supprimera également les statuts liés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={onRemove}
                className="bg-red-600 hover:bg-red-700"
              >
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
