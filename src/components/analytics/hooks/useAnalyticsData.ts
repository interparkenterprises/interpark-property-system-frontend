'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { propertiesAPI } from '@/lib/api'
import { analyticsAPI, toAnalyticsApiFailure } from '@/lib/analyticsApi'
import type { Property } from '@/types'
import type {
  AnalyticsApiFailure,
  AnalyticsFilters,
  TenantsSummary,
} from '@/types/analytics'
import type { AnalyticsDashboardData, AnalyticsMode, OverviewPanelAccess, OverviewPanelErrors, OverviewPanelLoading } from '../types'
import { useSharedAnalyticsFilters } from './useSharedAnalyticsFilters'

const dateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const initialFilters = (): AnalyticsFilters => {
  const now = new Date()
  return {
    dateFrom: dateString(new Date(now.getFullYear(), now.getMonth(), 1)),
    dateTo: dateString(now),
    asOf: dateString(now),
    grain: 'month',
  }
}

export function useAnalyticsData(mode: AnalyticsMode) {
  const auth = useAuth()
  const { draftFilters, filters, setDraftFilters, applyFilters } = useSharedAnalyticsFilters(initialFilters)
  const [properties, setProperties] = useState<Property[]>([])
  const [data, setData] = useState<AnalyticsDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AnalyticsApiFailure | null>(null)
  const hasLoadedOverview = useRef(false)

  const canPayments = auth.isAdmin || auth.isManager || auth.hasPermission('VIEW_PAYMENT_REPORTS')
  const canArrears = auth.isAdmin || auth.isManager || auth.hasPermission('VIEW_ARREARS')
  const canUnits = auth.isAdmin || auth.isManager || auth.hasPermission('VIEW_UNITS')
  const canTenants = auth.isAdmin || auth.isManager || auth.hasPermission('VIEW_TENANTS')
  const financialAccess = canPayments && canArrears
  const occupancyAccess = canUnits && canTenants
  const overviewAccess = useMemo<OverviewPanelAccess>(() => ({
    collections: financialAccess,
    receivables: financialAccess,
    occupancy: occupancyAccess,
    tenants: canTenants,
    properties: financialAccess,
  }), [canTenants, financialAccess, occupancyAccess])
  const [overviewErrors, setOverviewErrors] = useState<OverviewPanelErrors>({})
  const [overviewLoading, setOverviewLoading] = useState<OverviewPanelLoading>({
    collections: mode === 'overview' && overviewAccess.collections,
    receivables: mode === 'overview' && overviewAccess.receivables,
    occupancy: mode === 'overview' && overviewAccess.occupancy,
    tenants: mode === 'overview' && overviewAccess.tenants,
    properties: mode === 'overview' && overviewAccess.properties,
  })
  const authorized = mode === 'rent'
    ? canPayments && canArrears
    : mode === 'occupancy'
      ? canUnits && canTenants
      : Object.values(overviewAccess).some(Boolean)

  useEffect(() => {
    if (!authorized) return
    propertiesAPI
      .getAll()
      .then(result => setProperties(Array.isArray(result) ? result : []))
      .catch(() => setProperties([]))
  }, [authorized])

  const load = useCallback(async () => {
    if (!authorized) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (mode === 'occupancy') {
        const [occupancy, tenants] = await Promise.all([
          analyticsAPI.getOccupancySummary(filters),
          analyticsAPI.getTenantsSummary(filters),
        ])
        setData({ occupancy: occupancy.data, tenants: tenants.data, meta: [occupancy.meta, tenants.meta] })
      } else if (mode === 'overview') {
        const isInitialLoad = !hasLoadedOverview.current

        if (isInitialLoad) setOverviewLoading({ ...overviewAccess })
        setOverviewErrors({})
        if (isInitialLoad) setData({ meta: [] })

        const failure = (result: PromiseSettledResult<unknown> | undefined) =>
          result?.status === 'rejected' ? toAnalyticsApiFailure(result.reason) : undefined
        const mergePanelData = (patch: Partial<AnalyticsDashboardData>, meta = [] as AnalyticsDashboardData['meta']) => {
          setData(current => ({ ...(current || { meta: [] }), ...patch, meta: [...(current?.meta || []), ...meta] }))
        }
        const finishPanel = (panel: keyof OverviewPanelLoading, panelError?: AnalyticsApiFailure) => {
          if (panelError) setOverviewErrors(current => ({ ...current, [panel]: panelError }))
          setOverviewLoading(current => ({ ...current, [panel]: false }))
        }
        const requests: Promise<void>[] = []

        if (financialAccess) {
          const rentRequest = analyticsAPI.getRentInvoiceAnalytics(filters)
          const trendRequest = analyticsAPI.getReceivablesTrend(filters)
          const statusRequest = analyticsAPI.getStatusDistribution(filters)

          requests.push(Promise.allSettled([rentRequest, trendRequest]).then(([rent, trend]) => {
            const patch: Partial<AnalyticsDashboardData> = {}
            const meta: AnalyticsDashboardData['meta'] = []
            if (rent.status === 'fulfilled') {
              patch.receivables = rent.value.data.summary
              meta.push(rent.value.meta)
            }
            if (trend.status === 'fulfilled') {
              patch.receivablesTrend = trend.value.data.series
              meta.push(trend.value.meta)
            }
            mergePanelData(patch, meta)
            finishPanel('collections', failure(rent) || failure(trend))
          }))

          requests.push(Promise.allSettled([rentRequest, statusRequest]).then(([rent, status]) => {
            const patch: Partial<AnalyticsDashboardData> = {}
            const meta: AnalyticsDashboardData['meta'] = []
            if (rent.status === 'fulfilled') patch.receivables = rent.value.data.summary
            if (status.status === 'fulfilled') {
              patch.status = status.value.data
              meta.push(status.value.meta)
            }
            mergePanelData(patch, meta)
            finishPanel('receivables', failure(rent) || failure(status))
          }))

          requests.push(Promise.allSettled([analyticsAPI.getRevenueByProperty(filters)]).then(([revenue]) => {
            if (revenue.status === 'fulfilled') mergePanelData({ revenue: revenue.value.data.properties }, [revenue.value.meta])
            finishPanel('properties', failure(revenue))
          }))
        }

        if (occupancyAccess) {
          requests.push(Promise.allSettled([analyticsAPI.getOccupancySummary(filters)]).then(([occupancyResult]) => {
            if (occupancyResult.status === 'fulfilled') mergePanelData({ occupancy: occupancyResult.value.data }, [occupancyResult.value.meta])
            finishPanel('occupancy', failure(occupancyResult))
          }))
        }

        if (canTenants) {
          requests.push(Promise.allSettled([analyticsAPI.getTenantsSummary(filters)]).then(([tenantsResult]) => {
            if (tenantsResult.status === 'fulfilled') mergePanelData({ tenants: tenantsResult.value.data }, [tenantsResult.value.meta])
            finishPanel('tenants', failure(tenantsResult))
          }))
        }

        await Promise.all(requests)
        hasLoadedOverview.current = true
      } else {
        const [rent, collections, receivablesTrend, status, revenue, cohortCash, occupancyResult, tenantsResult] = await Promise.all([
          analyticsAPI.getRentInvoiceAnalytics(filters),
          analyticsAPI.getCollectionsTrend(filters),
          analyticsAPI.getReceivablesTrend(filters),
          analyticsAPI.getStatusDistribution(filters),
          analyticsAPI.getRevenueByProperty(filters),
          analyticsAPI.getCohortVsCash(filters),
          occupancyAccess ? analyticsAPI.getOccupancySummary(filters).catch(() => null) : Promise.resolve(null),
          canTenants ? analyticsAPI.getTenantsSummary(filters).catch(() => null) : Promise.resolve(null),
        ])
        setData({
          receivables: rent.data.summary,
          collections: collections.data.series,
          receivablesTrend: receivablesTrend.data.series,
          status: rent.data.statusDistribution || status.data,
          revenue: revenue.data.properties,
          cohortCash: cohortCash.data,
          occupancy: occupancyResult?.data,
          tenants: tenantsResult?.data,
          meta: [rent.meta, collections.meta, receivablesTrend.meta, status.meta, revenue.meta, cohortCash.meta, occupancyResult?.meta, tenantsResult?.meta].filter(Boolean) as AnalyticsDashboardData['meta'],
        })
      }
    } catch (requestError) {
      setData(null)
      setError(toAnalyticsApiFailure(requestError))
      if (mode === 'overview') {
        setOverviewLoading({ collections: false, receivables: false, occupancy: false, tenants: false, properties: false })
      }
    } finally {
      setLoading(false)
    }
  }, [authorized, canTenants, filters, financialAccess, mode, occupancyAccess, overviewAccess])

  useEffect(() => {
    const request = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(request)
  }, [load])

  const summary = data?.overview?.receivables || data?.receivables
  const occupancy = data?.overview?.occupancy || data?.occupancy
  const tenants = useMemo<TenantsSummary | undefined>(() => {
    const raw = data?.overview?.tenants || data?.tenants
    if (!raw) return undefined
    return {
      currentTenants: raw.currentTenants,
      formerTenants: raw.formerTenants,
      totalTenantsEver: raw.totalTenantsEver,
      churnRate: raw.churnRate ?? null,
      currentRentRoll: raw.currentRentRoll ?? 0,
      averageRent: raw.averageRent ?? 0,
      depositsHeld: raw.depositsHeld ?? 0,
      byLeftReason: raw.byLeftReason ?? {},
    }
  }, [data])

  return {
    authorized,
    data,
    draftFilters,
    error,
    filters,
    loading,
    occupancy,
    overviewAccess,
    overviewErrors,
    overviewLoading,
    properties,
    summary,
    tenants,
    applyFilters,
    load,
    setDraftFilters,
  }
}
