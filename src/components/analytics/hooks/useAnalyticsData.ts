'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { propertiesAPI } from '@/lib/api'
import { analyticsAPI, toAnalyticsApiFailure } from '@/lib/analyticsApi'
import type { Property } from '@/types'
import type {
  AnalyticsApiFailure,
  AnalyticsFilters,
  TenantsSummary,
} from '@/types/analytics'
import type { AnalyticsDashboardData, AnalyticsMode } from '../types'

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
  const [draftFilters, setDraftFilters] = useState<AnalyticsFilters>(initialFilters)
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters)
  const [properties, setProperties] = useState<Property[]>([])
  const [data, setData] = useState<AnalyticsDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AnalyticsApiFailure | null>(null)

  const canPayments = auth.isAdmin || auth.isManager || auth.hasPermission('VIEW_PAYMENT_REPORTS')
  const canArrears = auth.isAdmin || auth.isManager || auth.hasPermission('VIEW_ARREARS')
  const canUnits = auth.isAdmin || auth.isManager || auth.hasPermission('VIEW_UNITS')
  const canTenants = auth.isAdmin || auth.isManager || auth.hasPermission('VIEW_TENANTS')
  const authorized = mode === 'rent'
    ? canPayments && canArrears
    : mode === 'occupancy'
      ? canUnits && canTenants
      : canPayments && canArrears && canUnits && canTenants

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
        const [overview, collections, receivablesTrend, status, revenue, cohortCash] = await Promise.all([
          analyticsAPI.getOverview(filters),
          analyticsAPI.getCollectionsTrend(filters),
          analyticsAPI.getReceivablesTrend(filters),
          analyticsAPI.getStatusDistribution(filters),
          analyticsAPI.getRevenueByProperty(filters),
          analyticsAPI.getCohortVsCash(filters),
        ])
        setData({
          overview: overview.data,
          collections: collections.data.series,
          receivablesTrend: receivablesTrend.data.series,
          status: status.data,
          revenue: revenue.data.properties,
          cohortCash: cohortCash.data,
          meta: [overview.meta, collections.meta, receivablesTrend.meta, status.meta, revenue.meta, cohortCash.meta],
        })
      } else {
        const [rent, collections, receivablesTrend, status, revenue, cohortCash] = await Promise.all([
          analyticsAPI.getRentInvoiceAnalytics(filters),
          analyticsAPI.getCollectionsTrend(filters),
          analyticsAPI.getReceivablesTrend(filters),
          analyticsAPI.getStatusDistribution(filters),
          analyticsAPI.getRevenueByProperty(filters),
          analyticsAPI.getCohortVsCash(filters),
        ])
        setData({
          receivables: rent.data.summary,
          collections: collections.data.series,
          receivablesTrend: receivablesTrend.data.series,
          status: rent.data.statusDistribution || status.data,
          revenue: revenue.data.properties,
          cohortCash: cohortCash.data,
          meta: [rent.meta, collections.meta, receivablesTrend.meta, status.meta, revenue.meta, cohortCash.meta],
        })
      }
    } catch (requestError) {
      setData(null)
      setError(toAnalyticsApiFailure(requestError))
    } finally {
      setLoading(false)
    }
  }, [authorized, filters, mode])

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

  const applyFilters = () => setFilters({
    ...draftFilters,
    asOf: draftFilters.dateTo ?? dateString(new Date()),
  })

  return {
    authorized,
    data,
    draftFilters,
    error,
    filters,
    loading,
    occupancy,
    properties,
    summary,
    tenants,
    applyFilters,
    load,
    setDraftFilters,
  }
}
