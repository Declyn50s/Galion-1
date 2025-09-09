// src/features/user-profile/components/IncomeCard/types.ts
import type { SelectedStatus } from "@/components/StatusSelect"
import type { Role } from "./model"

export type PeopleItem = {
  id: string
  role: Role
  rawRole?: string
  name: string
  statuses?: SelectedStatus[]
  birthDate?: string
  nationality?: string
  residencePermit?: string
  permitExpiryDate?: string
}

export type TenantContext = {
  enabled?: boolean
  rentNetMonthly?: number | null
}
