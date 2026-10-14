import type {
  AnalyticsMeta,
  AnalyticsOverview,
  CollectionTrendPoint,
  CohortVsCash,
  OccupancySummary,
  PropertyRevenue,
  ReceivablesStatusDistribution,
  ReceivablesSummary,
  ReceivablesTrendPoint,
  TenantsSummary,
} from '@/types/analytics'

export type AnalyticsMode = 'overview' | 'rent' | 'occupancy'

export interface AnalyticsDashboardData {
  overview?: AnalyticsOverview
  receivables?: ReceivablesSummary
  occupancy?: OccupancySummary
  tenants?: TenantsSummary
  collections?: CollectionTrendPoint[]
  receivablesTrend?: ReceivablesTrendPoint[]
  status?: ReceivablesStatusDistribution
  revenue?: PropertyRevenue[]
  cohortCash?: CohortVsCash
  meta: AnalyticsMeta[]
}
