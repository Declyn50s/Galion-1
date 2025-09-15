//src/components/interaction/Observations.tsx
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function Observations({
  text,
  isAlert,
  tags,
  onText,
  onAlert,
  onToggleTag,
}: {
  text: string;
  isAlert: boolean;
  tags: string[];
  onText: (v: string) => void;
  onAlert: (v: boolean) => void;
  onToggleTag: (tag: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Observations</label>
        <div className="flex items-center gap-2">
          <Switch checked={isAlert} onCheckedChange={(c) => onAlert(!!c)} />
          <Label className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Alerte
          </Label>
        </div>
      </div>

      <Textarea
        placeholder="Détails de l'interaction…"
        value={text}
        onChange={(e) => onText(e.target.value)}
        rows={4}
        className="resize-none"
      />

      <div className="flex gap-2">
        {["Refus", "Incomplet", "Dérogation"].map((tag) => {
          const active = tags?.includes(tag);
          return (
            <Button
              key={tag}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleTag(tag)}
              className={tag === "Refus" ? "text-red-700 border-red-200 hover:bg-red-50" : ""}
            >
              {tag}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
