//src/components/entry/EntryChildrenControls.tsx
import React from "react";
import { UserPlus, UserMinus } from "lucide-react";

type Props = {
  minors: number;
  majors: number;
  addMinor: () => void;
  removeMinor: () => void;
  addMajor: () => void;
  removeMajor: () => void;
};

const EntryChildrenControls: React.FC<Props> = ({ minors, majors, addMinor, removeMinor, addMajor, removeMajor }) => (
  <div className="flex flex-wrap items-center gap-2">
    <button type="button" onClick={addMinor} className="h-8 px-2 rounded border text-xs inline-flex items-center gap-1" title="Ajouter enfant mineur">
      <UserPlus className="h-3.5 w-3.5" /> Enfant (−18)
    </button>
    <button type="button" onClick={removeMinor} className="h-8 px-2 rounded border text-xs inline-flex items-center gap-1" title="Retirer enfant mineur">
      <UserMinus className="h-3.5 w-3.5" /> Enfant (−18)
    </button>
    <button type="button" onClick={addMajor} className="h-8 px-2 rounded border text-xs inline-flex items-center gap-1" title="Ajouter enfant majeur">
      <UserPlus className="h-3.5 w-3.5" /> Enfant (+18)
    </button>
    <button type="button" onClick={removeMajor} className="h-8 px-2 rounded border text-xs inline-flex items-center gap-1" title="Retirer enfant majeur">
      <UserMinus className="h-3.5 w-3.5" /> Enfant (+18)
    </button>
  </div>
);

export default EntryChildrenControls;
