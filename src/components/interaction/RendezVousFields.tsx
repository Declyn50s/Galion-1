//src/components/interaction/RendezVousFields.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function RendezVousFields({
  date,
  moved,
  onDate,
  onMoved,
}: {
  date: string;
  moved: boolean;
  onDate: (v: string) => void;
  onMoved: (v: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Rendez-vous</label>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="appointmentDate" className="text-sm">Date du rendez-vous</Label>
          <Input
            id="appointmentDate"
            type="datetime-local"
            value={date}
            onChange={(e) => onDate(e.target.value)}
            className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="appointmentMoved" checked={moved} onCheckedChange={(c) => onMoved(!!c)} />
          <Label htmlFor="appointmentMoved" className="text-sm">Rendez-vous déplacé</Label>
        </div>
      </div>
    </div>
  );
}
