//src/components/interaction/FooterActions.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function FooterActions({
  canSubmit,
  onCancel,
  onSubmit,
  submitLabel,
  isSaving,
}: {
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  isSaving: boolean;
}) {
  return (
    <div className="flex justify-between items-center pt-4 border-t">
      <div className="text-xs text-slate-500">
        <kbd className="px-2 py-1 bg-slate-100 rounded text-xs ml-1">Ctrl+Enter</kbd> {submitLabel} •{" "}
        <kbd className="px-2 py-1 bg-slate-100 rounded text-xs ml-1">Esc</kbd> Fermer
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={onSubmit} disabled={!canSubmit || isSaving} className="gap-2">
          <Check className="w-4 h-4" />
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
