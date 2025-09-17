// src/pages/housing/lup/Chip.tsx
import React from "react";
import { X } from "lucide-react";

export const Chip: React.FC<{ label: string; onRemove?: () => void }> = ({ label, onRemove }) => (
<span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-2 py-1 text-xs">
{label}
{onRemove && (
<button className="opacity-60 hover:opacity-100" onClick={onRemove}>
<X className="h-3 w-3" />
</button>
)}
</span>
);