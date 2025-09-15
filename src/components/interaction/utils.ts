//src/components/interaction/utils.ts
import { Building, Phone, Mail, FileCheck, MessageSquare } from "lucide-react";
import { INTERACTION_TYPES } from "@/types/interaction";

export const iconMap = { Building, Phone, Mail, FileCheck, MessageSquare } as const;

const colorClasses: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  purple: "bg-purple-100 text-purple-700",
  orange: "bg-orange-100 text-orange-700",
  red: "bg-red-100 text-red-700",
  cyan: "bg-cyan-100 text-cyan-700",
  gray: "bg-gray-100 text-gray-700",
  slate: "bg-slate-100 text-slate-700",
  indigo: "bg-indigo-100 text-indigo-700",
  yellow: "bg-yellow-100 text-yellow-700",
};

export function headerColorFor(typeKey: keyof typeof INTERACTION_TYPES) {
  const c = INTERACTION_TYPES[typeKey]?.color as string;
  return colorClasses[c] ?? "bg-slate-100 text-slate-700";
}
