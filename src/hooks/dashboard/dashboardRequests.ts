import { analyticsAPI, toAnalyticsApiFailure } from '@/lib/analyticsApi'
import type { Property } from '@/types'
import type {
  AnalyticsFilters,
  CollectionTrendPoint,
  OccupancySummary,
  PropertyRevenue,
  ReceivablesSummary,
  TenantsSummary,
} from '@/types/analytics'
import type { DashboardErrorState } from '@/components/dashboard/types'
import { todayInNairobi } from '@/components/ui/date-range-picker'

export interface DashboardAnalyticsAccess {
  canUnits: boolean
  canTenants: boolean
  canFinancial: boolean
  canCollections: boolean
}

export interface DashboardAnalyticsPayload {
  occupancy: OccupancySummary | null
  tenants: TenantsSummary | null
  financial: ReceivablesSummary | null
  collections: CollectionTrendPoint[]
  propertyRevenue: PropertyRevenue[]
  generatedAt: string | null
  errors: Pick<DashboardErrorState, 'portfolio' | 'financial' | 'collections' | 'propertyAttention'>
}

export interface DashboardPropertyPayload {
  properties: Property[]
  landlordCount: number
}

const analyticsCache = new Map<string, Promise<DashboardAnalyticsPayload>>()
const propertyCache = new Map<string, Promise<DashboardPropertyPayload>>()

export function dashboardDefaultDateRange() {
  const dateTo = todayInNairobi()
  return { dateFrom: `${dateTo.slice(0, 7)}-01`, dateTo }
}

export function dashboardErrorMessage(error: unknown) {
  return toAnalyticsApiFailure(error).message
}

async function loadAnalytics(filters: AnalyticsFilters, access: DashboardAnalyticsAccess) {
  const payload: DashboardAnalyticsPayload = {
    occupancy: null,
    tenants: null,
    financial: null,
    collections: [],
    propertyRevenue: [],
    generatedAt: null,
    errors: { portfolio: null, financial: null, collections: null, propertyAttention: null },
  }
  const requests: Promise<void>[] = []

  if (access.canUnits) {
    requests.push(analyticsAPI.getOccupancySummary(filters)
      .then(response => {
        payload.occupancy = response.data
        payload.generatedAt ??= response.meta.generatedAt
      })
      .catch(error => { payload.errors.portfolio = dashboardErrorMessage(error) }))
  }

  if (access.canTenants) {
    requests.push(analyticsAPI.getTenantsSummary(filters)
      .then(response => {
        payload.tenants = response.data
        payload.generatedAt ??= response.meta.generatedAt
      })
      .catch(error => { payload.errors.portfolio = dashboardErrorMessage(error) }))
  }

  if (access.canFinancial) {
    requests.push(analyticsAPI.getReceivablesSummary(filters)
      .then(response => {
        payload.financial = response.data
        payload.generatedAt ??= response.meta.generatedAt
      })
      .catch(error => { payload.errors.financial = dashboardErrorMessage(error) }))
  }

  if (access.canCollections) {
    requests.push(analyticsAPI.getCollectionsTrend(filters)
      .then(collections => {
        payload.collections = collections.data.series
        payload.generatedAt ??= collections.meta.generatedAt
      })
      .catch(error => { payload.errors.collections = dashboardErrorMessage(error) }))
    requests.push(analyticsAPI.getRevenueByProperty(filters)
      .then(revenue => {
        payload.propertyRevenue = revenue.data.properties
        payload.generatedAt ??= revenue.meta.generatedAt
      })
      .catch(error => { payload.errors.propertyAttention = dashboardErrorMessage(error) }))
  }

  await Promise.all(requests)
  return payload
}

export function getDashboardAnalytics(key: string, filters: AnalyticsFilters, access: DashboardAnalyticsAccess) {
  let request = analyticsCache.get(key)
  if (!request) {
    request = loadAnalytics(filters, access)
    analyticsCache.set(key, request)
  }
  return request
}

export function getDashboardProperties(key: string, loader: () => Promise<DashboardPropertyPayload>) {
  let request = propertyCache.get(key)
  if (!request) {
    request = loader()
    propertyCache.set(key, request)
  }
  return request
}

export function clearDashboardRequestCache() {
  analyticsCache.clear()
  propertyCache.clear()
}
