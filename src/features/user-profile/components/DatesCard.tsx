// src/features/user-profile/components/DatesCard.tsx
import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  computeBareme,
  rentLimitFromIncome,
  BaremeColumn,
} from "@/lib/bareme"

type Props = {
  registrationDate?: string
  lastCertificateDate?: string
  deadline?: string
  maxRooms?: number
  /** Loyer min calculé en amont (si dispo) — correspond à la limite pour RDU + colonne */
  minRent?: number
  /** (optionnel) Nb d’enfants COMPTÉS (info UI uniquement) */
  countedMinors?: number
  /** Colonne de barème à utiliser (incluant bonus DV, borne max, etc.) */
  baremeColumn: BaremeColumn
  /** RDU ménage (fallback pour calculer le loyer min si minRent n’est pas fourni) */
  rduForBareme?: number
  onChange: (field: string, value: any) => void
  className?: string
}

/* -------- small helpers robustes -------- */
const isFiniteNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n)
const fmtCHF = (amount?: number) =>
  isFiniteNumber(amount) ? `CHF ${amount.toLocaleString("fr-CH", { maximumFractionDigits: 0 })}` : "—"

const DatesCard: React.FC<Props> = ({
  registrationDate,
  lastCertificateDate,
  deadline,
  maxRooms,
  minRent,
  countedMinors = 0,
  baremeColumn,
  rduForBareme,
  onChange,
  className = "",
}) => {
  // 1) Colonne du barème : fournie par le parent (déjà “finale”)
  const col = baremeColumn

  // 2) Loyer min effectif : prend la prop si dispo, sinon calcule via RDU + col
  const effectiveMinRent = useMemo(() => {
    if (isFiniteNumber(minRent)) return minRent
    if (isFiniteNumber(rduForBareme) && rduForBareme > 0) {
      return rentLimitFromIncome(rduForBareme, col)
    }
    return undefined
  }, [minRent, rduForBareme, col])

  // 3) Infos barème (tranche loyer + plage RDU) basées sur le loyer min effectif
  const bar = useMemo(() => {
    if (!isFiniteNumber(effectiveMinRent) || effectiveMinRent <= 0) return null
    // computeBareme est robuste côté lib (arrondi et NaN-safe), mais on garde la garde ici
    return computeBareme(effectiveMinRent, col)
  }, [effectiveMinRent, col])

  return (
    <Card className={`border bg-white shadow-sm ${className}`}>
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-[13px] font-medium">📅 Dates</CardTitle>
      </CardHeader>

      <CardContent className="px-3 pb-3">
        {/* Ligne 1 : 3 dates */}
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
              value={isFiniteNumber(maxRooms) ? String(maxRooms) : ""}
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

          <Field label={`Loyer min (limite) • Col. ${col}`}>
            <div>
              <Input
                readOnly
                value={fmtCHF(effectiveMinRent)}
                className="h-8 text-xs bg-slate-100 cursor-not-allowed"
              />
              {bar && (
                <p className="mt-1 text-[11px] leading-tight text-slate-600">
                  Tranche loyer{" "}
                  {fmtCHF(bar?.rentRange?.min)}{" – "}{fmtCHF(bar?.rentRange?.max)}{" "}
                  • RDU admissible{" "}
                  {fmtCHF(bar?.incomeRange?.min)}{" – "}{fmtCHF(bar?.incomeRange?.max)}
                  {typeof countedMinors === "number" && (
                    <> • Enfants comptés: {countedMinors}</>
                  )}
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
