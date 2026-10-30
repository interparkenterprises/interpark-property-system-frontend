import type {
  AnalyticsApiFailure,
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

export type OverviewPanelKey = 'collections' | 'receivables' | 'occupancy' | 'tenants' | 'properties'

export type OverviewPanelAccess = Record<OverviewPanelKey, boolean>
export type OverviewPanelLoading = Record<OverviewPanelKey, boolean>
export type OverviewPanelErrors = Partial<Record<OverviewPanelKey, AnalyticsApiFailure>>

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
