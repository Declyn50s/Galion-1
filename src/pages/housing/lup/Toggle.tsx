// src/pages/housing/lup/Toggle.tsx
import React from "react";

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
<label className="inline-flex items-center gap-2 cursor-pointer select-none">
<input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
<span className="w-10 h-6 rounded-full bg-gray-300 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:bg-white after:rounded-full after:transition-all peer-checked:bg-emerald-500 peer-checked:after:left-[1.5rem]"></span>
<span className="text-sm text-gray-700">{label}</span>
</label>
);