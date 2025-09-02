import type { SelectedStatus } from "@/components/StatusSelect"

/* --------- Domain types --------- */
export type Role = "demandeur" | "conjoint" | "enfant" | "autre"

export const ROLE_LABEL: Record<Role, string> = {
  demandeur: "Demandeur",
  conjoint: "Conjoint",
  enfant: "Enfant",
  autre: "Autre",
}

export interface MoneyBlock {
  monthly: number
  months: number
  includeInRDU: boolean
  remark?: string
}

export interface AnnualBlock {
  annual: number
  includeInRDU: boolean
  remark?: string
}

export interface Employment extends MoneyBlock {
  employer: string
  jobTitle: string
  hasGratification?: boolean
  gratificationAnnual?: number
}

export interface RenteAIBlock extends MoneyBlock {
  percentage: number
}

export interface PensionAlimentaireEntry extends MoneyBlock {
  direction: "percu" | "verse"
  beneficiary?: string
}

export interface Person {
  id: string
  role: Role
  name: string
  statuses: SelectedStatus[]

  employments?: Employment[]

  independant?: MoneyBlock
  pcFamille?: MoneyBlock
  renteAI?: RenteAIBlock
  renteAVS?: MoneyBlock
  deuxiemePilier?: MoneyBlock
  prestationComplementaire?: MoneyBlock
  rentePont?: MoneyBlock
  renteVeufVe?: MoneyBlock
  autreRevenu?: MoneyBlock
  bourseOcbe?: AnnualBlock

  ri?: MoneyBlock
  evam?: MoneyBlock
  chomage?: MoneyBlock
  formation?: MoneyBlock
  indemniteMaladieAccident?: MoneyBlock
  indemniteJournaliereAI?: MoneyBlock

  allocationFamiliale?: MoneyBlock
  fortune?: MoneyBlock
  ovam?: MoneyBlock
  ail?: MoneyBlock          // 🔻 déduction (soustraite du RDU si includeInRDU = true)
  brapa?: MoneyBlock

  pensionsAlimentaires?: PensionAlimentaireEntry[]
}

/* ---------- factories ---------- */
export const emptyMoney = (months = 12): MoneyBlock => ({ monthly: 0, months, includeInRDU: true, remark: "" })
export const emptyEmployment = (): Employment => ({
  employer: "",
  jobTitle: "",
  hasGratification: false,
  gratificationAnnual: 0,
  ...emptyMoney(12),
})
export const emptyRenteAI = (): RenteAIBlock => ({ percentage: 0, ...emptyMoney(12) })
export const emptyAnnual = (): AnnualBlock => ({ annual: 0, includeInRDU: true, remark: "" })
export const emptyPension = (): PensionAlimentaireEntry => ({ direction: "percu", ...emptyMoney(12) })

/* ---------- helpers ---------- */
export const chf = (n: number) => `CHF ${n.toLocaleString("fr-CH", { maximumFractionDigits: 0 })}`

export function hasStatus(person: Person, key: string) {
  return person.statuses.some(s => s.value === key)
}

export const computeAnnualMoney = (m?: MoneyBlock) => (m ? (Number(m.monthly) || 0) * (Number(m.months) || 0) : 0)
export const computeAnnualAnnual = (a?: AnnualBlock) => (a ? Number(a.annual) || 0 : 0)
export const computeEmploymentAnnual = (e?: Employment) =>
  e ? computeAnnualMoney(e) + (e.hasGratification ? (Number(e.gratificationAnnual) || 0) : 0) : 0

export const computePensionAnnualImpactRDU = (p?: PensionAlimentaireEntry) =>
  p ? (p.includeInRDU ? (p.direction === "percu" ? 1 : -1) * computeAnnualMoney(p) : 0) : 0
export const computePensionAnnualForTotal = (p?: PensionAlimentaireEntry) =>
  p ? (p.direction === "percu" ? computeAnnualMoney(p) : 0) : 0

/** Totaux par personne + ménage (annuel et RDU) */
export function computeTotalsFor(persons: Person[]) {
  const totalAnnualByPerson: Record<string, number> = {}
  const rduByPerson: Record<string, number> = {}

  for (const p of persons) {
    const moneyBlocks: (MoneyBlock | undefined)[] = [
      p.independant, p.pcFamille, p.renteAI, p.renteAVS, p.deuxiemePilier, p.prestationComplementaire,
      p.rentePont, p.renteVeufVe, p.autreRevenu, p.ri, p.evam, p.chomage, p.formation,
      p.indemniteMaladieAccident, p.indemniteJournaliereAI, p.allocationFamiliale, p.fortune, p.ovam, p.brapa,
    ]
    const ailDeduction: MoneyBlock | undefined = p.ail
    const annualBlocks: (AnnualBlock | undefined)[] = [p.bourseOcbe]
    const employmentBlocks = p.employments ?? []
    const pensions = p.pensionsAlimentaires ?? []

    const annual = [
      ...moneyBlocks.map(computeAnnualMoney),
      ...annualBlocks.map(computeAnnualAnnual),
      ...employmentBlocks.map(computeEmploymentAnnual),
      ...pensions.map(computePensionAnnualForTotal),
    ].reduce((a, b) => a + b, 0)

    const rdu = [
      ...moneyBlocks.map(b => (b?.includeInRDU ? computeAnnualMoney(b) : 0)),
      ...annualBlocks.map(a => (a?.includeInRDU ? computeAnnualAnnual(a) : 0)),
      ...employmentBlocks.map(e => (e.includeInRDU ? computeEmploymentAnnual(e) : 0)),
      ...pensions.map(computePensionAnnualImpactRDU),
      ...(ailDeduction && ailDeduction.includeInRDU ? [-computeAnnualMoney(ailDeduction)] : [0]),
    ].reduce((a, b) => a + b, 0)

    totalAnnualByPerson[p.id] = annual
    rduByPerson[p.id] = rdu
  }

  const totalAnnualHousehold = Object.values(totalAnnualByPerson).reduce((a, b) => a + b, 0)
  const totalRDUHousehold = Object.values(rduByPerson).reduce((a, b) => a + b, 0)
  return { totalAnnualByPerson, rduByPerson, totalAnnualHousehold, totalRDUHousehold }
}
