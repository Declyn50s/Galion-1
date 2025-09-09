// src/features/user-profile/components/IncomeCard/parts/SummaryField.tsx
import React from "react"

export default function SummaryField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border px-3 py-2 bg-slate-50 text-sm flex items-center justify-between">
      <span className="text-slate-600 text-xs">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  )
}
