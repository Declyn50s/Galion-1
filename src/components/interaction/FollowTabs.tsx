//src/components/interaction/FollowTabs.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type FollowTab = "tache" | "journal" | "information" | null;

export default function FollowTabs({
  selected,
  onSelect,
  published,
}: {
  selected: FollowTab;
  onSelect: (t: FollowTab) => void;
  published: boolean;
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Suivi</label>
      <div className="flex gap-2 items-center">
        <Button
          variant={selected === "tache" ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(selected === "tache" ? null : "tache")}
          className="flex-1"
        >
          Tâche
        </Button>

        <Button
          variant={selected === "journal" ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(selected === "journal" ? null : "journal")}
          className="flex-1"
        >
          Journal
        </Button>

        <Button
          variant={selected === "information" ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(selected === "information" ? null : "information")}
          className="flex-1"
        >
          Information
        </Button>

        {published && <Badge variant="secondary" className="ml-2">Publié</Badge>}
      </div>
    </div>
  );
}
