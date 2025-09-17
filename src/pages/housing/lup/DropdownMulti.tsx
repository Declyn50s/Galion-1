// src/pages/housing/lup/DropdownMulti.tsx
import React, { useState } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { classNames } from "./classNames";

export const DropdownMulti: React.FC<{ label: string; options: Array<any>; values: string[]; onChange: (v: string[]) => void }> = ({ label, options, values, onChange }) => {
const [open, setOpen] = useState(false);
return (
<div className="relative">
<button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 border rounded-xl px-3 py-2 text-sm hover:bg-gray-50">
<Filter className="h-4 w-4" /> {label}
<ChevronDown className={classNames("h-4 w-4 transition", open && "rotate-180")} />
</button>
{open && (
<div className="absolute z-20 mt-2 w-56 bg-white rounded-xl shadow-lg border p-2 max-h-72 overflow-auto">
{options.map((opt: any) => (
<label key={opt.value || opt} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
<input
type="checkbox"
className="h-4 w-4"
checked={values.includes(opt.value || opt)}
onChange={(e) => {
const v = opt.value || opt;
if (e.target.checked) onChange([...values, v]);
else onChange(values.filter((x) => x !== v));
}}
/>
<span className="text-sm">{opt.label || opt}</span>
</label>
))}
</div>
)}
</div>
);
};