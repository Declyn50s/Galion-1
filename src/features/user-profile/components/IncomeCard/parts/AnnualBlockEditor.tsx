import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { Person, AnnualBlock } from "../model"

type KOfAnnual<P> = {
  [K in keyof P]: P[K] extends AnnualBlock | undefined ? K : never
}[keyof P]

export default function AnnualBlockEditor<K extends KOfAnnual<Person>>({
  label,
  person,
  keyName,
  ensure,
  patch,
  clear,
}: {
  label: string
  person: Person
  keyName: K
  ensure: () => void
  patch: (patch: Partial<AnnualBlock>) => void
  clear: () => void
}) {
  // @ts-ignore
  const block: AnnualBlock | undefined = person[keyName]

  return (
    <section className="rounded-md border px-3 py-2 bg-slate-50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {block ? (
          <Button variant="ghost" size="sm" onClick={clear}>Réinitialiser</Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={ensure}>Ajouter</Button>
        )}
      </div>
      {block && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Montant annuel</label>
            <Input
              type="number"
              inputMode="decimal"
              value={block.annual}
              onChange={e => patch({ annual: parseFloat(e.target.value || "0") })}
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
            <label className="text-[11px] text-slate-600">Remarque</label>
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
