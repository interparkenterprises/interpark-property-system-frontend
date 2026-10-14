import type { Property } from '@/types'
import type {
  CollectionTrendPoint,
  OccupancySummary,
  PropertyRevenue,
  ReceivablesSummary,
  TenantsSummary,
} from '@/types/analytics'

export interface DashboardFiltersValue {
  dateFrom: string
  dateTo: string
  propertyId?: string
}

export interface DashboardAuthorization {
  portfolio: boolean
  financial: boolean
  collections: boolean
  arrears: boolean
}

export interface DashboardLoadingState {
  portfolio: boolean
  financial: boolean
  collections: boolean
  propertyAttention: boolean
  properties: boolean
}

export interface DashboardErrorState {
  portfolio: string | null
  financial: string | null
  collections: string | null
  propertyAttention: string | null
  properties: string | null
}

export interface DashboardData {
  properties: Property[]
  landlordCount: number
  occupancy: OccupancySummary | null
  tenants: TenantsSummary | null
  financial: ReceivablesSummary | null
  collections: CollectionTrendPoint[]
  propertyRevenue: PropertyRevenue[]
  generatedAt: string | null
}
