import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Person, MoneyBlock } from "../model"

export default function QuickTagGrid({
  person,
  ensureBlock,
  patchBlock,
  clearBlock,
}: {
  person: Person
  ensureBlock: <K extends keyof Person>(pid: string, key: K, factory: () => any) => void
  patchBlock: <K extends keyof Person>(pid: string, key: K, patch: Partial<any>) => void
  clearBlock: <K extends keyof Person>(pid: string, key: K) => void
}) {
  const TAGS: { key: keyof Person; label: string }[] = [
    { key: "allocationFamiliale", label: "Allocation familiale" },
    { key: "fortune", label: "Fortune" },
    { key: "ovam", label: "OVAM" },
    { key: "lhps", label: "Déduction maladie LHPS" }, // 🔻
    { key: "brapa", label: "BRAPA" },
  ]

  return (
    <div className="space-y-2">
      <div className="text-[12px] text-slate-600 font-medium">Champs / tags</div>
      <div className="flex flex-wrap gap-2">
        {TAGS.map(({ key, label }) => {
          // @ts-ignore
          const active = !!person[key]
          return (
            <button
              key={String(key)}
              type="button"
              onClick={() => (active ? clearBlock(person.id, key) : ensureBlock(person.id, key, () => ({ monthly: 0, months: 12, includeInRDU: true })))}
              className={`px-2 h-7 rounded-full border text-xs transition ${
                active
                  ? "bg-purple-50 border-purple-300 text-purple-700"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TAGS.map(({ key, label }) => {
          // @ts-ignore
          const block: MoneyBlock | undefined = person[key]
          if (!block) return null
          return (
            <div key={String(key)} className="rounded-md border px-3 py-2 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{label}</span>
                <Button variant="ghost" size="sm" onClick={() => clearBlock(person.id, key)}>Supprimer</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <Field label="Mensuel">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={block.monthly}
                    onChange={e => patchBlock(person.id, key, { monthly: parseFloat(e.target.value || "0") })}
                    className="h-8"
                    placeholder="0"
                  />
                </Field>
                <Field label="Nb de mois">
                  <Input
                    type="number"
                    min={0}
                    max={12}
                    value={block.months}
                    onChange={e => patchBlock(person.id, key, { months: parseInt(e.target.value || "0") })}
                    className="h-8"
                    placeholder="12"
                  />
                </Field>
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-600">Inclure RDU</div>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={block.includeInRDU}
                      onChange={e => patchBlock(person.id, key, { includeInRDU: e.target.checked })}
                    />
                    <span className="text-slate-700">Oui</span>
                  </label>
                </div>
                <Field label="Remarque">
                  <Input
                    value={block.remark ?? ""}
                    onChange={e => patchBlock(person.id, key, { remark: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="Note facultative"
                  />
                </Field>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] text-slate-600">{label}</div>
      {children}
    </div>
  )
}
