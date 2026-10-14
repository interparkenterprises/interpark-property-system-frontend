'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { propertiesAPI } from '@/lib/api'
import { analyticsAPI, toAnalyticsApiFailure } from '@/lib/analyticsApi'
import type { Property } from '@/types'
import type { AnalyticsApiFailure, AnalyticsFilters, AnalyticsMeta, TenantChurnAnalytics } from '@/types/analytics'

const dateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const initialFilters = (): AnalyticsFilters => {
  const now = new Date()
  return {
    dateFrom: dateString(new Date(now.getFullYear() - 1, now.getMonth(), 1)),
    dateTo: dateString(now),
    asOf: dateString(now),
    grain: 'month',
  }
}

export function useDepartedTenantAnalytics() {
  const auth = useAuth()
  const canView = auth.isAdmin || auth.isManager || auth.hasPermission('VIEW_TENANTS')
  const [draftFilters, setDraftFilters] = useState<AnalyticsFilters>(initialFilters)
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters)
  const [properties, setProperties] = useState<Property[]>([])
  const [data, setData] = useState<TenantChurnAnalytics | null>(null)
  const [meta, setMeta] = useState<AnalyticsMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AnalyticsApiFailure | null>(null)

  useEffect(() => {
    if (!canView) return
    propertiesAPI.getAll()
      .then(result => setProperties(Array.isArray(result) ? result : []))
      .catch(() => setProperties([]))
  }, [canView])

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await analyticsAPI.getTenantChurnAnalytics(filters)
      setData(result.data)
      setMeta(result.meta)
    } catch (requestError) {
      setData(null)
      setError(toAnalyticsApiFailure(requestError))
    } finally {
      setLoading(false)
    }
  }, [canView, filters])

  useEffect(() => {
    const request = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(request)
  }, [load])

  const applyFilters = () => setFilters({
    ...draftFilters,
    asOf: draftFilters.dateTo ?? dateString(new Date()),
  })

  return { canView, draftFilters, setDraftFilters, properties, data, meta, loading, error, load, applyFilters }
}
