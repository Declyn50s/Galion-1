// src/features/user-profile/components/HouseholdCounters/HouseholdCounters.tsx
import React, { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { HouseholdMember } from "@/types/user"
import { canonicalizeRole } from "@/lib/roles";

type MainPerson = {
  birthDate?: string
  role?: string
  nationality?: string
  residencePermit?: string
  permitExpiryDate?: string
}

type Props = {
  className?: string
  density?: "default" | "compact" | "tight"
  main?: MainPerson
  household: HouseholdMember[]
  variant?: "strip" | "panel"
  showLegend?: boolean
}

const toDate = (s?: string) => {
  if (!s) return undefined
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? undefined : d
}

const isPermitValid = (nationality?: string, permit?: string, expiry?: string) => {
  const nat = (nationality ?? "").trim().toLowerCase()
  const p = (permit ?? "").trim()

  if (nat === "suisse" || p === "Citoyen") return true
  if (p === "Permis C") return true

  if (p === "Permis B" || p === "Permis F") {
    const d = toDate(expiry)
    if (!d) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d >= today
  }
  return false
}

const yearsDiff = (iso?: string) => {
  const d = toDate(iso)
  if (!d) return 0
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const md = today.getMonth() - d.getMonth()
  if (md < 0 || (md === 0 && today.getDate() < d.getDate())) age--
  return age
}

const normalize = (s?: string) =>
  (s ?? "")
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()

/** DV par libellé */
const isVisitingChildRole = (role?: string) =>
  canonicalizeRole(role) === "enfant droit de visite";

const Pill: React.FC<{ label: string; value: number; title?: string }> = ({ label, value, title }) => (
  <div
    className="inline-flex items-center gap-1 rounded-full border bg-white/80 px-2.5 py-1 text-xs shadow-sm"
    title={title}
  >
    <span className="font-semibold text-slate-900">{value}</span>
    <span className="text-slate-500">{label}</span>
  </div>
)

const HouseholdCounters: React.FC<Props> = ({
  className = "",
  density = "compact",
  main,
  household,
  variant = "strip",
  showLegend = false,
}) => {
  const counts = useMemo(() => {
    let total = 0
    let adults = 0
    let minors = 0
    let excluded = 0
    let visitingChildren = 0 // ❗️DV MINEURS UNIQUEMENT

    const pushCounted = (birthDate?: string, nationality?: string, permit?: string, expiry?: string) => {
      if (!isPermitValid(nationality, permit, expiry)) {
        excluded++
        return
      }
      const age = yearsDiff(birthDate)
      total++
      if (age >= 18) adults++
      else minors++
    }

    // Personne principale (jamais DV)
    if (main) {
      const { birthDate, nationality, residencePermit, permitExpiryDate } = main
      if (!nationality && !residencePermit && !permitExpiryDate) {
   const age = yearsDiff(birthDate)
   total++
   if (!birthDate || age >= 18) adults++   // sans date → assume adulte
   else minors++
 } else {
        pushCounted(birthDate, nationality, residencePermit, permitExpiryDate)
      }
    }

    // Membres du ménage
    for (const m of household) {
      const age = yearsDiff(m.birthDate)
      const isDV = isVisitingChildRole(m.role)

      // ✅ Règle : DV = uniquement si mineur ; DV majeur → plus DV
      if (isDV && age < 18) {
        visitingChildren++
        continue // DV mineurs ne sont pas comptés
      }

      // count as personne normale (DV majeurs inclus)
      // @ts-ignore: permitExpiryDate peut ne pas être typé dans HouseholdMember
      pushCounted(m.birthDate, m.nationality, m.residencePermit, (m as any).permitExpiryDate)
    }

    return { total, adults, minors, excluded, visitingChildren }
  }, [main, household])

  const pad =
    density === "tight" ? "px-2 py-1.5" : density === "compact" ? "px-3 py-2" : "px-4 py-3"

  if (variant === "strip") {
    return (
      <Card className={`border bg-white/70 ${pad} ${className}`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-medium text-slate-600 mr-1">👪 Ménage</div>
          <Pill label="Total" value={counts.total} title="Total des personnes comptées" />
          <Pill label="Adultes" value={counts.adults} />
          {counts.minors > 0 && <Pill label="Mineurs" value={counts.minors} />}

          <div className="ml-auto flex items-center gap-1">
            {counts.visitingChildren > 0 && (
              <Pill label="Enfants en droit de visite" value={counts.visitingChildren} title="Enfants DV mineurs (non comptés)" />
            )}
            {counts.excluded > 0 && (
              <>
                <Pill
                  label="Non comptés"
                  value={counts.excluded}
                  title="Permis invalide/expiré (hors enfants DV)"
                />
                <Badge variant="outline" className="text-[10px]">Permis invalide/expiré</Badge>
              </>
            )}
          </div>
        </div>
        {showLegend && (
          <p className="mt-1 text-[10px] leading-tight text-slate-500">
            Comptés = <strong>Suisse/Citoyen</strong>, <strong>Permis C</strong>, ou <strong>Permis B/F</strong> valide.
            Les <strong>enfants en droit de visite</strong> ne sont comptés que s’ils sont <strong>mineurs</strong> (affichés à part).
          </p>
        )}
      </Card>
    )
  }

  // Variante panel
  return (
    <Card className={`border bg-white/80 ${pad} ${className}`}>
      <div className="mb-1 text-xs font-medium text-slate-600">👪 Comptage du ménage</div>
      <div className="flex flex-wrap items-center gap-2">
        <Pill label="Total" value={counts.total} />
        <Pill label="Adultes" value={counts.adults} />
        {counts.minors > 0 && <Pill label="Mineurs" value={counts.minors} />}
        <div className="ml-auto flex items-center gap-1">
          {counts.visitingChildren > 0 && (
            <Pill label="Enfants DV" value={counts.visitingChildren} title="Enfants DV mineurs (non comptés)" />
          )}
          {counts.excluded > 0 && (
            <>
              <Pill
                label="Non comptés"
                value={counts.excluded}
                title="Permis invalide/expiré (hors enfants DV)"
              />
              <Badge variant="outline" className="text-[10px]">Permis invalide/expiré</Badge>
            </>
          )}
        </div>
      </div>
      {showLegend && (
        <p className="mt-1 text-[10px] leading-tight text-slate-500">
          Comptés = <strong>Suisse/Citoyen</strong>, <strong>Permis C</strong>, ou <strong>Permis B/F</strong> valide.
          Les <strong>enfants en droit de visite</strong> ne sont comptés que s’ils sont <strong>mineurs</strong> (affichés à part).
        </p>
      )}
    </Card>
  )
}

export default HouseholdCounters
