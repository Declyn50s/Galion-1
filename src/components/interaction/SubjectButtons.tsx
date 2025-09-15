//src/components/interaction/SubjectButtons.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { PREDEFINED_SUBJECTS } from "@/types/interaction";

export default function SubjectButtons({
  channel,
  value,
  onSelect,
}: {
  channel: string;
  value: string;
  onSelect: (s: string) => void;
}) {
  const filtered = PREDEFINED_SUBJECTS.filter(
    (s) => !(channel === "courrier" && s === "rendez-vous")
  );
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">
        Sujet <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        {filtered.map((subject) => (
          <Button
            key={subject}
            variant={value === subject ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(subject)}
            className="justify-start"
          >
            {subject}
          </Button>
        ))}
      </div>
    </div>
  );
}
