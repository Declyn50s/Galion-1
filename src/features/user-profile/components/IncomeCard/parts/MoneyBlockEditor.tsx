import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { Person, MoneyBlock } from "../model"

type KOfMoney<P> = {
  [K in keyof P]: P[K] extends MoneyBlock | undefined ? K : never
}[keyof P]

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-[11px] text-slate-600">{label}</Label>
    {children}
  </div>
)

export default function MoneyBlockEditor<K extends KOfMoney<Person>>({
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
  patch: (patch: Partial<MoneyBlock>) => void
  clear: () => void
}) {
  // @ts-ignore
  const block: MoneyBlock | undefined = person[keyName]

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
          <Field label="Mensuel net">
            <Input
              type="number"
              inputMode="decimal"
              value={block.monthly}
              onChange={e => patch({ monthly: parseFloat(e.target.value || "0") })}
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
              onChange={e => patch({ months: parseInt(e.target.value || "0") })}
              className="h-8"
              placeholder="12"
            />
          </Field>
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
          <Field label="Remarque">
            <Input
              value={block.remark ?? ""}
              onChange={e => patch({ remark: e.target.value })}
              className="h-8 text-sm"
              placeholder="Note facultative"
            />
          </Field>
        </div>
      )}
    </section>
  )
}

MoneyBlockEditor.Field = Field
