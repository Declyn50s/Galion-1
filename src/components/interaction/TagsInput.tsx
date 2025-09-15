//src/components/interaction/TagsInput.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

export default function TagsInput({
  tags,
  newTag,
  setNewTag,
  addTag,
  removeTag,
}: {
  tags: string[];
  newTag: string;
  setNewTag: (v: string) => void;
  addTag: () => void;
  removeTag: (t: string) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Tags (collaborateurs à notifier)</label>
      <div className="flex gap-2">
        <Input
          placeholder="Ajouter un collaborateur…"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTag()}
          className="flex-1"
        />
        <Button
          onClick={addTag}
          disabled={!newTag.trim() || tags.includes(newTag.trim())}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-2">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-red-500"
                type="button"
                aria-label={`Retirer ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
