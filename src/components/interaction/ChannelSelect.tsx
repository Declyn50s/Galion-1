//src/components/interaction/ChannelSelect.tsx
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INTERACTION_TYPES } from "@/types/interaction";
import { iconMap } from "./utils";

export default function ChannelSelect({
  value,
  onChange,
}: {
  value: keyof typeof INTERACTION_TYPES;
  onChange: (v: keyof typeof INTERACTION_TYPES) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Canal de communication</label>
      <Select value={value} onValueChange={(v) => onChange(v as keyof typeof INTERACTION_TYPES)}>
        <SelectTrigger className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(INTERACTION_TYPES).map(([key, cfg]) => {
            const Icon = iconMap[(cfg.icon as keyof typeof iconMap) || "MessageSquare"];
            return (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {cfg.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
