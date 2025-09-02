// src/features/user-profile/components/DatesCard.tsx
import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { computeBareme, columnFromChildrenCount } from "@/lib/bareme"

type Props = {
  registrationDate?: string
  lastCertificateDate?: string
  deadline?: string
  maxRooms?: number
  /** Loyer min déjà calculé ailleurs (ex: via UserProfilePage avec le barème) */
  minRent?: number
  /** Nombre d’enfants COMPTÉS (sert à choisir la colonne du barème) */
  countedMinors?: number
  /** (Optionnel) RDU ménage si tu veux afficher la ligne de barème correspondante */
  rduForBareme?: number
  onChange: (field: string, value: any) => void
  className?: string
}

const formatCurrency = (amount?: number) =>
  typeof amount === "number"
    ? `CHF ${amount.toLocaleString("fr-CH", { maximumFractionDigits: 0 })}`
    : "—"

// Tolère {min,max} ou [min,max]
function normalizeRange(range: any): { min: number; max: number } | null {
  if (!range) return null
  if (Array.isArray(range)) {
    const [min, max] = range
    return { min: Number(min) || 0, max: Number(max) || 0 }
  }
  if (typeof range.min === "number" && typeof range.max === "number") {
    return { min: range.min, max: range.max }
  }
  return null
}

const DatesCard: React.FC<Props> = ({
  registrationDate,
  lastCertificateDate,
  deadline,
  maxRooms,
  minRent,
  countedMinors = 0,
  rduForBareme,
  onChange,
  className = "",
}) => {
  // Affichage (optionnel) de la ligne de barème si on a le RDU ménage
  const baremeInfo = useMemo(() => {
    if (typeof rduForBareme !== "number") return null
    const col = columnFromChildrenCount(countedMinors) // 0 enfant → col 1 ; 1 → 2 ; … ; ≥4 → 5
    const hit = computeBareme(rduForBareme, col)
    if (!hit) return null
    const rent = normalizeRange(hit.rentRange)
    const inc = normalizeRange(hit.incomeRange)
    return rent && inc ? { col, rent, inc } : null
  }, [rduForBareme, countedMinors])

  return (
    <Card className={`border bg-white shadow-sm ${className}`}>
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-[13px] font-medium">📅 Dates</CardTitle>
      </CardHeader>

      <CardContent className="px-3 pb-3">
        {/* Ligne 1 : 3 dates compactes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Field label="Inscription">
            <Input
              type="date"
              value={registrationDate || ""}
              onChange={(e) => onChange("registrationDate", e.target.value)}
              className="h-8 text-xs"
            />
          </Field>

          <Field label="Attestation">
            <Input
              type="date"
              value={lastCertificateDate || ""}
              onChange={(e) => onChange("lastCertificateDate", e.target.value)}
              className="h-8 text-xs"
            />
          </Field>

          <Field label="Échéance">
            <Input
              type="date"
              value={deadline || ""}
              onChange={(e) => onChange("deadline", e.target.value)}
              className="h-8 text-xs"
            />
          </Field>
        </div>

        {/* Ligne 2 : pièces + loyer min */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          <Field label="Pièces max">
            <Select
              value={maxRooms?.toString() || ""}
              onValueChange={(v) => onChange("maxRooms", v ? Number(v) : undefined)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1.5">1,5</SelectItem>
                <SelectItem value="2.5">2,5</SelectItem>
                <SelectItem value="3.5">3,5</SelectItem>
                <SelectItem value="4.5">4,5</SelectItem>
                <SelectItem value="5.5">5,5</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Loyer min">
            <div>
              <Input
                readOnly
                value={formatCurrency(minRent)}
                className="h-8 text-xs bg-slate-100 cursor-not-allowed"
              />

              {baremeInfo && (
                <p className="mt-1 text-[11px] leading-tight text-slate-600">
                  Colonne {baremeInfo.col} • Tranche loyer{" "}
                  {`CHF ${baremeInfo.rent.min.toLocaleString("fr-CH", { maximumFractionDigits: 0 })}`}
                  {" – "}
                  {`CHF ${baremeInfo.rent.max.toLocaleString("fr-CH", { maximumFractionDigits: 0 })}`}{" "}
                  • RDU admissible{" "}
                  {`CHF ${baremeInfo.inc.min.toLocaleString("fr-CH", { maximumFractionDigits: 0 })}`}
                  {" – "}
                  {`CHF ${baremeInfo.inc.max.toLocaleString("fr-CH", { maximumFractionDigits: 0 })}`}
                </p>
              )}
            </div>
          </Field>
        </div>
      </CardContent>
    </Card>
  )
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1">
    <Label className="text-[11px] text-slate-600">{label}</Label>
    {children}
  </div>
)

export default DatesCard
