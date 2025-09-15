//src/components/interaction/ResiliationFields.tsx
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function ResiliationFields({
  signature,
  date,
  onSignature,
  onDate,
}: {
  signature: boolean;
  date: string;
  onSignature: (v: boolean) => void;
  onDate: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Résiliation</label>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox id="signatureConvention" checked={signature} onCheckedChange={(c) => onSignature(!!c)} />
          <Label htmlFor="signatureConvention" className="text-sm">Signature de convention</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="terminationDate" className="text-sm">Date de résiliation</Label>
          <Input
            id="terminationDate"
            type="date"
            value={date}
            onChange={(e) => onDate(e.target.value)}
            className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>
      </div>
    </div>
  );
}
