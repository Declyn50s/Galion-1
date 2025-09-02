import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { Person, RenteAIBlock } from "../model"

export default function RenteAIEditor({
  person,
  ensure,
  patch,
  clear,
}: {
  person: Person
  ensure: () => void
  patch: (patch: Partial<RenteAIBlock>) => void
  clear: () => void
}) {
  const block = person.renteAI as RenteAIBlock | undefined

  return (
    <section className="rounded-md border px-3 py-2 bg-slate-50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Rente AI</span>
        {block ? (
          <Button variant="ghost" size="sm" onClick={clear}>Réinitialiser</Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={ensure}>Ajouter</Button>
        )}
      </div>

      {block && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-600">Mensuel net</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={block.monthly}
              onChange={e => patch({ monthly: parseFloat(e.target.value || "0") })}
              className="h-8"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-600">Nb de mois</Label>
            <Input
              type="number"
              min={0}
              max={12}
              value={block.months}
              onChange={e => patch({ months: parseInt(e.target.value || "0") })}
              className="h-8"
              placeholder="12"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-600">% invalidité (info)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={block.percentage}
              onChange={e => patch({ percentage: parseInt(e.target.value || "0") })}
              className="h-8"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-600">Inclure RDU</Label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={block.includeInRDU}
                onChange={e => patch({ includeInRDU: e.target.checked })}
              />
              <span className="text-slate-700">Oui</span>
            </label>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-600">Remarque</Label>
            <Input
              value={block.remark ?? ""}
              onChange={e => patch({ remark: e.target.value })}
              className="h-8 text-sm"
              placeholder="Note facultative"
            />
          </div>
        </div>
      )}
    </section>
  )
}
