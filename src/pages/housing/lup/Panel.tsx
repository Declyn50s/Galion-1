// src/pages/housing/lup/Panel.tsx
import React from "react";
import { X, Info } from "lucide-react";
import { classNames } from "./classNames";

export const Panel: React.FC<{ open: boolean; onClose: () => void; title?: string; children: any }> = ({ open, onClose, children, title }) => (
<div className={classNames(
"fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl border-l transition-transform duration-300 z-40",
open ? "translate-x-0" : "translate-x-full"
)}>
<div className="flex items-center justify-between p-4 border-b">
<div className="flex items-center gap-2">
<Info className="h-5 w-5 text-gray-500" />
<h3 className="font-semibold">{title || "Détails"}</h3>
</div>
<button className="p-2 hover:bg-gray-50 rounded-lg" onClick={onClose}>
<X className="h-5 w-5" />
</button>
</div>
<div className="p-4 overflow-auto h-[calc(100%-56px)]">{children}</div>
</div>
);