//src/components/interaction/ControleFields.tsx
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ControleFields({
  enabled,
  reason,
  date,
  onEnabled,
  onReason,
  onDate,
}: {
  enabled: boolean;
  reason: string;
  date: string;
  onEnabled: (v: boolean) => void;
  onReason: (v: string) => void;
  onDate: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Contrôle</label>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox id="convocationSelected" checked={enabled} onCheckedChange={(c) => onEnabled(!!c)} />
          <Label htmlFor="convocationSelected" className="text-sm">Convocation</Label>
        </div>

        {enabled && (
          <div className="space-y-3 pl-6 border-l-2 border-blue-200">
            <div className="space-y-2">
              <Label className="text-sm">Motif de la convocation</Label>
              <Select value={reason} onValueChange={onReason}>
                <SelectTrigger className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400">
                  <SelectValue placeholder="Sélectionner un motif..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenu-trop-eleve">Revenu trop élevé</SelectItem>
                  <SelectItem value="sous-occupation">Sous-occupation notoire</SelectItem>
                  <SelectItem value="devoir-information">Devoir d'information</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="convocationDate" className="text-sm">Date de convocation</Label>
              <Input
                id="convocationDate"
                type="datetime-local"
                value={date}
                onChange={(e) => onDate(e.target.value)}
                className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
