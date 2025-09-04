// src/features/user-profile/components/IncomeCard/IncomeCard.tsx
import React, { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus } from "lucide-react"

import { StatusSelect, SelectedStatus } from "@/components/StatusSelect"
import {
  ROLE_LABEL,
  type Role,
  type Person,
  emptyAnnual,
  emptyEmployment,
  emptyMoney,
  emptyPension,
  hasStatus,
  computeTotalsFor,
  chf,
} from "./model"
import MoneyBlockEditor from "./parts/MoneyBlockEditor"
import AnnualBlockEditor from "./parts/AnnualBlockEditor"
import RenteAIEditor from "./parts/RenteAIEditor"
import QuickTagGrid from "./parts/QuickTagGrid"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ✅ barème officiel (plafonds RDU selon loyer & colonne)
import { computeBareme, type BaremeColumn } from "@/lib/bareme"

/* ---------- helpers permis (mêmes règles que HouseholdCounters) ---------- */
const toDate = (s?: string) => {
  if (!s) return undefined
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? undefined : d
}
const isPermitValid = (nationality?: string, permit?: string, expiry?: string) => {
  const nat = (nationality ?? "").trim().toLowerCase()
  const p = (permit ?? "").trim()
  if (nat === "suisse" || p === "Citoyen" || p === "Permis C") return true
  if (p === "Permis B" || p === "Permis F") {
    const d = toDate(expiry)
    if (!d) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d >= today
  }
  return false
}

/* ---------- helpers barème ---------- */
const yearsDiff = (iso?: string) => {
  if (!iso) return 0
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 0
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const md = today.getMonth() - d.getMonth()
  if (md < 0 || (md === 0 && today.getDate() < d.getDate())) age--
  return age
}

const BAREME_COLUMNS = [
  { id: 1, label: "1 à 2 personnes ou groupe", info: "0 enfant" },
  { id: 2, label: "avec 1 enfant", info: "1 enfant" },
  { id: 3, label: "avec 2 enfants", info: "2 enfants" },
  { id: 4, label: "avec 3 enfants", info: "3 enfants" },
  { id: 5, label: "avec 4 enfants ou +", info: "≥ 4 enfants" },
]

/** Forme attendue pour la liste des membres passée depuis UserProfilePage */
export type PeopleItem = {
  id: string
  role: Role
  name: string
  statuses?: SelectedStatus[]
  // pour le comptage "counted"
  birthDate?: string
  nationality?: string
  residencePermit?: string
  permitExpiryDate?: string
}

/** Contexte optionnel — affichage des métriques barème pour le locataire (TenantProfilePage). */
type TenantContext = {
  /** Active le bloc “Calcul barème (locataire)” */
  enabled?: boolean
  /** Loyer net mensuel du bail (CHF) */
  rentNetMonthly?: number | null
}

/** API : tu passes les membres du ménage (people). L’état vit ici (uncontrolled). */
export default function IncomeCard({
  people,
  onTotalsChange,
  countMode = "counted", // "table" | "all" | "counted"
  onBaremeChange,
  /** ➜ Active le bloc spécifique locataire (TenantProfilePage uniquement) */
  tenantContext,
}: {
  people: PeopleItem[]
  onTotalsChange?: (payload: {
    totalAnnualByPerson: Record<string, number>
    rduByPerson: Record<string, number>
    totalAnnualHousehold: number
    totalRDUHousehold: number
  }) => void
  countMode?: "table" | "all" | "counted"
  onBaremeChange?: (payload: {
    mode: "auto" | "manual"
    column: number
    description: string
    minorsCount: number
  }) => void
  tenantContext?: TenantContext
}) {
  /* --- IMPORTANT : hydrate/merge quand `people` arrive ou change --- */
  const [persons, setPersons] = useState<Person[]>([])
  const peopleSignature = useMemo(
    () => people.map(p => `${p.id}|${p.role}|${p.name}`).join(";"),
    [people]
  )

  useEffect(() => {
    setPersons(prev => {
      // premier chargement : hydrate tout
      if (prev.length === 0) {
        return people.map(p => ({
          id: p.id,
          role: p.role,
          name: p.name,
          statuses: p.statuses ?? [],
        }))
      }

      // merge : on conserve les montants déjà saisis
      const incomingById = new Map(people.map(m => [m.id, m]))
      const updatedKept = prev
        .filter(p => incomingById.has(p.id))
        .map(p => {
          const inc = incomingById.get(p.id)!
          // sync nom/rôle si changé
          if (p.name !== inc.name || p.role !== inc.role) {
            return { ...p, name: inc.name, role: inc.role }
          }
          return p
        })

      const added = people
        .filter(m => !prev.some(p => p.id === m.id))
        .map(m => ({ id: m.id, role: m.role, name: m.name, statuses: m.statuses ?? [] }))

      return [...updatedKept, ...added]
    })
  }, [peopleSignature, people])

  // Nb d'enfants "comptés" (permis valide + <18 ans)
  const countedMinors = useMemo(() => {
    return people.reduce((acc, m) => {
      if (!isPermitValid(m.nationality, m.residencePermit, m.permitExpiryDate)) return acc
      const age = yearsDiff(m.birthDate)
      return acc + (age < 18 ? 1 : 0)
    }, 0)
  }, [people])

  // Colonne barème automatique: 0 enfant => col 1 ; n enfants => col = min(n,4)+1
  const autoBaremeCol = useMemo(() => {
    const n = Math.min(countedMinors, 4)
    return n === 0 ? 1 : n + 1
  }, [countedMinors])

  // Mode et valeur manuelle
  const [baremeMode, setBaremeMode] = useState<"auto" | "manual">("auto")
  const [baremeColManual, setBaremeColManual] = useState<number>(1)
  const baremeSelected = baremeMode === "auto" ? autoBaremeCol : baremeColManual

  // Notifie en externe (optionnel)
  useEffect(() => {
    if (!onBaremeChange) return
    const meta = BAREME_COLUMNS.find(c => c.id === baremeSelected)
    onBaremeChange({
      mode: baremeMode,
      column: baremeSelected,
      description: meta ? meta.label : `Colonne ${baremeSelected}`,
      minorsCount: countedMinors,
    })
  }, [baremeSelected, baremeMode, countedMinors, onBaremeChange])

  // Auto-ensure blocs lorsqu’on (dé)sélectionne des statuts
  useEffect(() => {
    setPersons(arr => {
      let changed = false
      const next = arr.map(p => {
        let q = { ...p }
        const ensure = <K extends keyof Person>(key: K, factory: () => any) => {
          // @ts-ignore
          if (!q[key]) {
            // @ts-ignore
            q[key] = factory()
            changed = true
          }
        }
        const drop = <K extends keyof Person>(key: K) => {
          // @ts-ignore
          if (q[key]) {
            // @ts-ignore
            q[key] = undefined
            changed = true
          }
        }

        // Emploi
        if (hasStatus(q, "salarie")) {
          if (!q.employments || q.employments.length === 0) {
            q.employments = [emptyEmployment()]
            changed = true
          }
        } else if (q.employments?.length) {
          q.employments = []
          changed = true
        }

        // Indépendant
        hasStatus(q, "independant") ? ensure("independant", () => emptyMoney(12)) : drop("independant")

        // Prestations & rentes
        hasStatus(q, "pc_famille") ? ensure("pcFamille", () => emptyMoney(12)) : drop("pcFamille")

        if (hasStatus(q, "rente_ai")) {
          const pct = q.statuses.find(s => s.value === "rente_ai")?.percentage ?? 0
          ensure("renteAI", () => ({ ...emptyMoney(12), percentage: pct }))
          if (q.renteAI && (q as any).renteAI.percentage !== pct) {
            // @ts-ignore
            q.renteAI = { ...q.renteAI, percentage: pct }
            changed = true
          }
        } else drop("renteAI")

        hasStatus(q, "rente_avs") ? ensure("renteAVS", () => emptyMoney(12)) : drop("renteAVS")
        hasStatus(q, "deuxieme_pilier") ? ensure("deuxiemePilier", () => emptyMoney(12)) : drop("deuxiemePilier")
        hasStatus(q, "prestation_complementaire") ? ensure("prestationComplementaire", () => emptyMoney(12)) : drop("prestationComplementaire")
        hasStatus(q, "rente_pont") ? ensure("rentePont", () => emptyMoney(12)) : drop("rentePont")
        hasStatus(q, "autre_revenu") ? ensure("autreRevenu", () => emptyMoney(12)) : drop("autreRevenu")
        hasStatus(q, "bourse") ? ensure("bourseOcbe", () => emptyAnnual()) : drop("bourseOcbe")

        // Autres statuts
        hasStatus(q, "ri") ? ensure("ri", () => emptyMoney(12)) : drop("ri")
        hasStatus(q, "evam") ? ensure("evam", () => emptyMoney(12)) : drop("evam")
        hasStatus(q, "chomage") ? ensure("chomage", () => emptyMoney(12)) : drop("chomage")
        hasStatus(q, "formation") ? ensure("formation", () => emptyMoney(12)) : drop("formation")

        return q
      })
      return changed ? next : arr
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(persons.map(p => p.statuses))])

  // Totaux (annuels & RDU)
  const totals = useMemo(() => computeTotalsFor(persons), [persons])

  useEffect(() => {
    onTotalsChange?.(totals)
  }, [totals, onTotalsChange])

  const updatePerson = (id: string, patch: Partial<Person>) =>
    setPersons(list => list.map(p => (p.id === id ? { ...p, ...patch } : p)))
  const removePerson = (id: string) => setPersons(list => list.filter(p => p.id !== id))

  // Helpers génériques pour sous-éditeurs
  const ensureBlock = <K extends keyof Person>(pid: string, key: K, factory: () => any) => {
    setPersons(arr =>
      arr.map(p => {
        if (p.id !== pid) return p
        // @ts-ignore
        if (!p[key]) {
          // @ts-ignore
          return { ...p, [key]: factory() }
        }
        return p
      })
    )
  }
  const patchBlock = <K extends keyof Person>(pid: string, key: K, patch: Partial<any>) => {
    setPersons(arr =>
      arr.map(p => {
        if (p.id !== pid) return p
        // @ts-ignore
        const cur = p[key]
        if (!cur) return p
        return { ...p, [key]: { ...cur, ...patch } }
      })
    )
  }
  const clearBlock = <K extends keyof Person>(pid: string, key: K) => {
    setPersons(arr => arr.map(p => (p.id === pid ? { ...p, [key]: undefined } : p)))
  }

  // Emplois
  const addEmployment = (pid: string) =>
    setPersons(arr =>
      arr.map(p => (p.id === pid ? { ...p, employments: [...(p.employments ?? []), emptyEmployment()] } : p))
    )
  const patchEmployment = (pid: string, idx: number, patch: Partial<Person["employments"][number]>) =>
    setPersons(arr =>
      arr.map(p => {
        if (p.id !== pid) return p
        const list = [...(p.employments ?? [])]
        if (!list[idx]) return p
        list[idx] = { ...list[idx], ...patch }
        return { ...p, employments: list }
      })
    )
  const removeEmployment = (pid: string, idx: number) =>
    setPersons(arr =>
      arr.map(p => {
        if (p.id !== pid) return p
        const list = [...(p.employments ?? [])]
        list.splice(idx, 1)
        return { ...p, employments: list }
      })
    )

  // Pensions
  const addPension = (pid: string) =>
    setPersons(arr =>
      arr.map(p =>
        p.id === pid
          ? { ...p, pensionsAlimentaires: [...(p.pensionsAlimentaires ?? []), emptyPension()] }
          : p
      )
    )
  const patchPension = (pid: string, idx: number, patch: Partial<Person["pensionsAlimentaires"][number]>) =>
    setPersons(arr =>
      arr.map(p => {
        if (p.id !== pid) return p
        const list = [...(p.pensionsAlimentaires ?? [])]
        if (!list[idx]) return p
        list[idx] = { ...list[idx], ...patch }
        return { ...p, pensionsAlimentaires: list }
      })
    )
  const removePension = (pid: string, idx: number) =>
    setPersons(arr =>
      arr.map(p => {
        if (p.id !== pid) return p
        const list = [...(p.pensionsAlimentaires ?? [])]
        list.splice(idx, 1)
        return { ...p, pensionsAlimentaires: list }
      })
    )

  // 🔹 compteur affiché (au lieu de persons.length)
  const displayPeopleCount = useMemo(() => {
    if (!people?.length) return persons.length
    if (countMode === "table") return persons.length
    if (countMode === "all") return people.length
    // "counted" : permis valables uniquement
    return people.reduce((acc, m) => {
      return acc + (isPermitValid(m.nationality, m.residencePermit, m.permitExpiryDate) ? 1 : 0)
    }, 0)
  }, [people, persons.length, countMode])

  // ——— Bloc “Calcul barème (locataire)” ———
  const rentNetMonthly = tenantContext?.rentNetMonthly ?? null
  const baremeInfo = useMemo(() => {
    if (!tenantContext?.enabled || !rentNetMonthly || rentNetMonthly <= 0) return null
    const col = Math.min(5, Math.max(1, baremeSelected)) as BaremeColumn
    return computeBareme(rentNetMonthly, col)
  }, [tenantContext?.enabled, rentNetMonthly, baremeSelected])

  const capIncome = baremeInfo?.incomeCap ?? null
  const rentFloor = baremeInfo?.rentRange.min ?? null

  const depassementAbs = useMemo(() => {
    if (!capIncome) return null
    return Math.max(0, totals.totalRDUHousehold - capIncome)
  }, [capIncome, totals.totalRDUHousehold])

  const depassementPct = useMemo(() => {
    if (!capIncome || capIncome <= 0) return null
    const pct = ((totals.totalRDUHousehold - capIncome) / capIncome) * 100
    return Math.max(0, Math.round(pct * 100) / 100) // 2 décimales
  }, [capIncome, totals.totalRDUHousehold])

  // pour désactiver les membres déjà pris dans une autre carte
  const usedIds = new Set(persons.map(p => p.id))

  return (
    <div className="space-y-4">
      {persons.map(person => (
        <Card key={person.id} className="bg-white/90 border shadow-sm">
          <CardHeader className="py-3 px-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {ROLE_LABEL[person.role]}
                </Badge>

                {/* Liste déroulante des membres */}
                <Select
                  value={person.id}
                  onValueChange={(val) => {
                    const found = people.find((p) => p.id === val)
                    if (!found) return
                    updatePerson(person.id, {
                      id: found.id,
                      name: found.name,
                      role: found.role,
                    })
                  }}
                >
                  <SelectTrigger className="h-8 w-64">
                    <SelectValue placeholder="Choisir un membre" />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((m) => (
                      <SelectItem
                        key={m.id}
                        value={m.id}
                        disabled={usedIds.has(m.id) && m.id !== person.id}
                      >
                        {m.name} — {ROLE_LABEL[m.role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardTitle>

              {/* Totaux + supprimer */}
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <div className="text-xs text-slate-500">Total annuel</div>
                  <div className="font-medium">{chf(totals.totalAnnualByPerson[person.id] || 0)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">RDU-LHPS</div>
                  <div className="font-medium">{chf(totals.rduByPerson[person.id] || 0)}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePerson(person.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Statuts */}
            <StatusSelect
              value={person.statuses}
              onChange={(v) => updatePerson(person.id, { statuses: v })}
              className="mt-1"
            />
          </CardHeader>

          <CardContent className="px-4 pb-4 space-y-4">
            {/* Salarié·e */}
            {hasStatus(person, "salarie") && (
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] text-slate-600 font-medium">Revenus salariés</div>
                  <Button size="sm" variant="secondary" onClick={() => addEmployment(person.id)}>
                    <Plus className="h-4 w-4 mr-1" /> Ajouter un emploi
                  </Button>
                </div>

                <div className="space-y-3">
                  {(person.employments ?? []).map((job, idx) => (
                    <div key={idx} className="rounded-md border px-3 py-2 bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Emploi #{idx + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeEmployment(person.id, idx)}>
                          Supprimer
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-8 gap-2 items-end">
                        <MoneyBlockEditor.Field label="Employeur">
                          <Input
                            value={job.employer}
                            onChange={e => patchEmployment(person.id, idx, { employer: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="Nom de l'employeur"
                          />
                        </MoneyBlockEditor.Field>

                        <MoneyBlockEditor.Field label="Titre de l'emploi">
                          <Input
                            value={job.jobTitle}
                            onChange={e => patchEmployment(person.id, idx, { jobTitle: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="Ex.: Assistant administratif"
                          />
                        </MoneyBlockEditor.Field>

                        <MoneyBlockEditor.Field label="Mensuel net">
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={job.monthly}
                            onChange={e => patchEmployment(person.id, idx, { monthly: parseFloat(e.target.value || "0") })}
                            className="h-8"
                            placeholder="0"
                          />
                        </MoneyBlockEditor.Field>

                        <MoneyBlockEditor.Field label="Nb de mois (max 14)">
                          <Input
                            type="number"
                            min={0}
                            max={14}
                            value={job.months}
                            onChange={e => patchEmployment(person.id, idx, { months: parseInt(e.target.value || "0") })}
                            className="h-8"
                            placeholder="12"
                          />
                        </MoneyBlockEditor.Field>

                        {/* Gratification optionnelle */}
                        <div className="space-y-1">
                          <div className="text-[11px] text-slate-600">Gratification</div>
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!job.hasGratification}
                                onChange={e =>
                                  patchEmployment(person.id, idx, {
                                    hasGratification: e.target.checked,
                                    gratificationAnnual: e.target.checked ? (job.gratificationAnnual ?? 0) : 0,
                                  })
                                }
                              />
                              <span className="text-slate-700">Activer</span>
                            </label>
                            {job.hasGratification && (
                              <Input
                                type="number"
                                inputMode="decimal"
                                value={job.gratificationAnnual ?? 0}
                                onChange={e =>
                                  patchEmployment(person.id, idx, { gratificationAnnual: parseFloat(e.target.value || "0") })
                                }
                                className="h-8 w-28"
                                placeholder="Annuel"
                              />
                            )}
                          </div>
                        </div>

                        <MoneyBlockEditor.Field label="Remarque">
                          <Input
                            value={job.remark ?? ""}
                            onChange={e => patchEmployment(person.id, idx, { remark: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="Note facultative"
                          />
                        </MoneyBlockEditor.Field>

                        <div className="space-y-1">
                          <div className="text-[11px] text-slate-600">Inclure RDU</div>
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={job.includeInRDU}
                              onChange={e => patchEmployment(person.id, idx, { includeInRDU: e.target.checked })}
                            />
                            <span className="text-slate-700">Oui</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Indépendant */}
            {hasStatus(person, "independant") && (
              <MoneyBlockEditor
                label="Revenu indépendant"
                person={person}
                keyName="independant"
                ensure={() => ensureBlock(person.id, "independant", () => emptyMoney(12))}
                patch={patch => patchBlock(person.id, "independant", patch)}
                clear={() => clearBlock(person.id, "independant")}
              />
            )}

            {/* Prestations & rentes */}
            {hasStatus(person, "pc_famille") && (
              <MoneyBlockEditor
                label="PC Famille"
                person={person}
                keyName="pcFamille"
                ensure={() => ensureBlock(person.id, "pcFamille", () => emptyMoney(12))}
                patch={patch => patchBlock(person.id, "pcFamille", patch)}
                clear={() => clearBlock(person.id, "pcFamille")}
              />
            )}

            {hasStatus(person, "rente_ai") && (
              <RenteAIEditor
                person={person}
                ensure={() => ensureBlock(person.id, "renteAI", () => ({ ...emptyMoney(12), percentage: 0 }))}
                patch={patch => patchBlock(person.id, "renteAI", patch)}
                clear={() => clearBlock(person.id, "renteAI")}
              />
            )}

            {hasStatus(person, "rente_avs") && (
              <MoneyBlockEditor
                label="Rente AVS"
                person={person}
                keyName="renteAVS"
                ensure={() => ensureBlock(person.id, "renteAVS", () => emptyMoney(12))}
                patch={patch => patchBlock(person.id, "renteAVS", patch)}
                clear={() => clearBlock(person.id, "renteAVS")}
              />
            )}

            {hasStatus(person, "deuxieme_pilier") && (
              <MoneyBlockEditor
                label="2ᵉ pilier"
                person={person}
                keyName="deuxiemePilier"
                ensure={() => ensureBlock(person.id, "deuxiemePilier", () => emptyMoney(12))}
                patch={patch => patchBlock(person.id, "deuxiemePilier", patch)}
                clear={() => clearBlock(person.id, "deuxiemePilier")}
              />
            )}

            {hasStatus(person, "prestation_complementaire") && (
              <MoneyBlockEditor
                label="Prestation complémentaire"
                person={person}
                keyName="prestationComplementaire"
                ensure={() => ensureBlock(person.id, "prestationComplementaire", () => emptyMoney(12))}
                patch={patch => patchBlock(person.id, "prestationComplementaire", patch)}
                clear={() => clearBlock(person.id, "prestationComplementaire")}
              />
            )}

            {hasStatus(person, "rente_pont") && (
              <MoneyBlockEditor
                label="Rente-pont"
                person={person}
                keyName="rentePont"
                ensure={() => ensureBlock(person.id, "rentePont", () => emptyMoney(12))}
                patch={patch => patchBlock(person.id, "rentePont", patch)}
                clear={() => clearBlock(person.id, "rentePont")}
              />
            )}

            {hasStatus(person, "autre_revenu") && (
              <MoneyBlockEditor
                label="Autre revenu"
                person={person}
                keyName="autreRevenu"
                ensure={() => ensureBlock(person.id, "autreRevenu", () => emptyMoney(12))}
                patch={patch => patchBlock(person.id, "autreRevenu", patch)}
                clear={() => clearBlock(person.id, "autreRevenu")}
              />
            )}

            {hasStatus(person, "bourse") && (
              <AnnualBlockEditor
                label="Bourse / OCBE (annuel)"
                person={person}
                keyName="bourseOcbe"
                ensure={() => ensureBlock(person.id, "bourseOcbe", () => emptyAnnual())}
                patch={patch => patchBlock(person.id, "bourseOcbe", patch)}
                clear={() => clearBlock(person.id, "bourseOcbe")}
              />
            )}

            {/* Autres statuts */}
            {hasStatus(person, "ri") && (
              <MoneyBlockEditor
                label="RI"
                person={person}
                keyName="ri"
                ensure={() => ensureBlock(person.id, "ri", () => emptyMoney(12))}
                patch={patch => patchBlock(person.id, "ri", patch)}
                clear={() => clearBlock(person.id, "ri")}
              />
            )}

            {hasStatus(person, "evam") && (
              <MoneyBlockEditor
                label="EVAM"
                person={person}
                keyName="evam"
                ensure={() => ensureBlock(person.id, "evam", () => emptyMoney(12))}
                patch={patch => patchBlock(person.id, "evam", patch)}
                clear={() => clearBlock(person.id, "evam")}
              />
            )}

            {hasStatus(person, "chomage") && (
              <MoneyBlockEditor
                label="Chômage"
                person={person}
                keyName="chomage"
                ensure={() => ensureBlock(person.id, "chomage", () => emptyMoney(12))}
                patch={patch => patchBlock(person.id, "chomage", patch)}
                clear={() => clearBlock(person.id, "chomage")}
              />
            )}

            {hasStatus(person, "formation") && (
              <MoneyBlockEditor
                label="En formation"
                person={person}
                keyName="formation"
                ensure={() => ensureBlock(person.id, "formation", () => emptyMoney(12))}
                patch={patch => patchBlock(person.id, "formation", patch)}
                clear={() => clearBlock(person.id, "formation")}
              />
            )}

            {/* PENSIONS ALIMENTAIRES */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[12px] text-slate-600 font-medium">Pensions alimentaires</div>
                <Button size="sm" variant="secondary" onClick={() => addPension(person.id)}>
                  <Plus className="h-4 w-4 mr-1" /> Ajouter une pension
                </Button>
              </div>

              <div className="space-y-3">
                {(person.pensionsAlimentaires ?? []).map((pa, idx) => (
                  <div key={idx} className="rounded-md border px-3 py-2 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Pension #{idx + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removePension(person.id, idx)}>Supprimer</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end">
                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-600">Type</div>
                        <div className="flex items-center gap-3 text-sm">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name={`pa_type_${person.id}_${idx}`}
                              checked={pa.direction === "percu"}
                              onChange={() => patchPension(person.id, idx, { direction: "percu" })}
                            />
                            Perçu
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name={`pa_type_${person.id}_${idx}`}
                              checked={pa.direction === "verse"}
                              onChange={() => patchPension(person.id, idx, { direction: "verse" })}
                            />
                            Versé
                          </label>
                        </div>
                      </div>

                      <MoneyBlockEditor.Field label="Bénéficiaire (enfant)">
                        <Input
                          value={pa.beneficiary ?? ""}
                          onChange={e => patchPension(person.id, idx, { beneficiary: e.target.value })}
                          className="h-8 text-sm"
                          placeholder="Prénom / identifiant"
                        />
                      </MoneyBlockEditor.Field>

                      <MoneyBlockEditor.Field label="Mensuel net">
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={pa.monthly}
                          onChange={e => patchPension(person.id, idx, { monthly: parseFloat(e.target.value || "0") })}
                          className="h-8"
                          placeholder="0"
                        />
                      </MoneyBlockEditor.Field>

                      <MoneyBlockEditor.Field label="Nb de mois">
                        <Input
                          type="number"
                          min={0}
                          max={12}
                          value={pa.months}
                          onChange={e => patchPension(person.id, idx, { months: parseInt(e.target.value || "0") })}
                          className="h-8"
                          placeholder="12"
                        />
                      </MoneyBlockEditor.Field>

                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-600">Inclure RDU</div>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={pa.includeInRDU}
                            onChange={e => patchPension(person.id, idx, { includeInRDU: e.target.checked })}
                          />
                          <span className="text-slate-700">Oui</span>
                        </label>
                      </div>

                      <MoneyBlockEditor.Field label="Remarque">
                        <Input
                          value={pa.remark ?? ""}
                          onChange={e => patchPension(person.id, idx, { remark: e.target.value })}
                          className="h-8 text-sm"
                          placeholder="Note facultative"
                        />
                      </MoneyBlockEditor.Field>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Tags rapides */}
            <QuickTagGrid
              person={person}
              ensureBlock={ensureBlock}
              patchBlock={patchBlock}
              clearBlock={clearBlock}
            />

            <p className="text-[11px] text-slate-500">
              * AIL est traité comme une <b>déduction</b> dans le RDU (soustraction).
            </p>
          </CardContent>
        </Card>
      ))}

      {/* Totaux ménage */}
      <Card className="bg-white/90 border shadow-sm">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold">💰 Totaux ménage</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SummaryField label="Total annuel (ménage)">{chf(totals.totalAnnualHousehold)}</SummaryField>
            <SummaryField label="RDU-LHPS (ménage)">{chf(totals.totalRDUHousehold)}</SummaryField>
            <SummaryField label="Personnes">
              {displayPeopleCount} {displayPeopleCount > 1 ? "personnes" : "personne"}
            </SummaryField>
          </div>
          <Separator className="my-3" />

          {/* --- Barème (colonne) --- */}
          <div className="rounded-md border px-3 py-2 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Colonne barème (RDU)</div>
              <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={baremeMode === "auto"}
                  onChange={(e) => setBaremeMode(e.target.checked ? "auto" : "manual")}
                />
                Automatique (selon ménage)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <div className="text-[11px] text-slate-600 mb-1">Colonne</div>
                <Select
                  value={String(baremeSelected)}
                  onValueChange={(v) => setBaremeColManual(parseInt(v))}
                  disabled={baremeMode === "auto"}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Choisir la colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    {BAREME_COLUMNS.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.id}. {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm">
                <div className="text-[11px] text-slate-600 mb-1">Règle auto (lecture seule)</div>
                <div className="rounded-md border bg-white px-3 py-2">
                  {countedMinors === 0 ? "0 enfant → Col. 1"
                    : `${countedMinors} enfant${countedMinors>1?"s":""} → Col. ${autoBaremeCol}`}
                </div>
              </div>

              <div className="text-sm">
                <div className="text-[11px] text-slate-600 mb-1">Description</div>
                <div className="rounded-md border bg-white px-3 py-2">
                  {BAREME_COLUMNS.find(c => c.id === baremeSelected)?.label ?? `Colonne ${baremeSelected}`}
                </div>
              </div>
            </div>
          </div>

          {/* ───────────────── Bloc “Calcul barème (locataire)” ───────────────── */}
          {tenantContext?.enabled && (
            <div className="rounded-md border px-3 py-3 bg-white/70 space-y-3 mt-3">
              <div className="text-sm font-medium">🔎 Calcul barème (locataire)</div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <SummaryField label="Nb de pers.">{displayPeopleCount}</SummaryField>
                <SummaryField label="Enfants">{countedMinors}</SummaryField>
                <SummaryField label="Loyer bail">{rentNetMonthly ? chf(rentNetMonthly) : "—"}</SummaryField>
                <SummaryField label="Loyer selon barème">{rentFloor != null ? chf(rentFloor) : "—"}</SummaryField>
                <SummaryField label="Montant RDU-LHPS">{chf(totals.totalRDUHousehold)}</SummaryField>
                <SummaryField label="Revenu plafond (barème)">{capIncome != null ? chf(capIncome) : "—"}</SummaryField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <SummaryField label="Dépassement (CHF)">{depassementAbs != null ? chf(depassementAbs) : "—"}</SummaryField>
                <SummaryField label="En %">
                  {depassementPct != null ? `${depassementPct.toFixed(2)} %` : "—"}
                </SummaryField>
                {/* Champs illustratifs (placeholder calcul métier futur) */}
                <SummaryField label="Supplément théorique 100%">
                  {rentNetMonthly && rentFloor != null ? chf(Math.max(0, rentNetMonthly - rentFloor)) : "—"}
                </SummaryField>
                <SummaryField label="Supplément calculé">—</SummaryField>
                <SummaryField label="Supplément sur bail">—</SummaryField>
                <SummaryField label="Loyer à payer">—</SummaryField>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ------- petits helpers UI ------- */
function SummaryField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border px-3 py-2 bg-slate-50 text-sm flex items-center justify-between">
      <span className="text-slate-600 text-xs">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  )
}
