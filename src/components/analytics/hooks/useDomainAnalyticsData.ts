'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { propertiesAPI } from '@/lib/api'
import { analyticsAPI, toAnalyticsApiFailure } from '@/lib/analyticsApi'
import type { Property } from '@/types'
import type { AnalyticsApiFailure, AnalyticsFilters, TenantLifecycleAnalytics } from '@/types/analytics'
import { domainConfig, initialDomainFilters } from '../domains/domainConfig'
import { extractCategoryDistribution, extractPropertyBreakdown, extractStatusDistribution, extractTrendData, toLifecycleView } from '../domains/domainTransforms'
import type { AnalyticsDomain, DomainResponse } from '../domains/types'
import { useSharedAnalyticsFilters } from './useSharedAnalyticsFilters'

async function fetchDomain(domain: AnalyticsDomain, filters: AnalyticsFilters): Promise<DomainResponse> {
  switch (domain) {
    case 'invoices': return analyticsAPI.getComprehensiveInvoiceAnalytics(filters) as unknown as Promise<DomainResponse>
    case 'bill-invoices': return analyticsAPI.getBillInvoiceAnalytics(filters) as unknown as Promise<DomainResponse>
    case 'tenants': return analyticsAPI.getTenantAnalytics(filters) as unknown as Promise<DomainResponse>
    case 'service-providers': return analyticsAPI.getServiceProviderAnalytics(filters) as unknown as Promise<DomainResponse>
    case 'commissions': return analyticsAPI.getCommissionAnalytics(filters) as unknown as Promise<DomainResponse>
    case 'demand-letters': return analyticsAPI.getDemandLetterAnalytics(filters) as unknown as Promise<DomainResponse>
    case 'other-income': return analyticsAPI.getOtherIncomeAnalytics(filters) as unknown as Promise<DomainResponse>
    case 'employees': return analyticsAPI.getEmployeeAnalytics(filters) as unknown as Promise<DomainResponse>
  }
}

export function useDomainAnalyticsData(domain: AnalyticsDomain) {
  const definition = domainConfig[domain]
  const auth = useAuth()
  const authorized = definition.roles
    ? auth.isAdmin || auth.isManager
    : auth.isAdmin || auth.isManager || auth.hasPermission(definition.permission || '')

  const { draftFilters, filters, setDraftFilters, applyFilters } = useSharedAnalyticsFilters(initialDomainFilters)
  const [properties, setProperties] = useState<Property[]>([])
  const [response, setResponse] = useState<DomainResponse | null>(null)
  const [lifecycleData, setLifecycleData] = useState<TenantLifecycleAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AnalyticsApiFailure | null>(null)

  useEffect(() => {
    if (!authorized || !definition.property) return
    propertiesAPI.getAll()
      .then(result => setProperties(Array.isArray(result) ? result : []))
      .catch(() => setProperties([]))
  }, [authorized, definition.property])

  const load = useCallback(async () => {
    if (!authorized) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const scoped = definition.property ? filters : { ...filters, propertyId: undefined, landlordId: undefined }
    try {
      if (domain === 'tenants') {
        const [domainResponse, lifecycleResponse] = await Promise.all([
          fetchDomain(domain, scoped),
          analyticsAPI.getTenantLifecycleAnalytics(scoped),
        ])
        setResponse(domainResponse)
        setLifecycleData(lifecycleResponse.data)
      } else {
        setResponse(await fetchDomain(domain, scoped))
        setLifecycleData(null)
      }
    } catch (requestError) {
      setResponse(null)
      setLifecycleData(null)
      setError(toAnalyticsApiFailure(requestError))
    } finally {
      setLoading(false)
    }
  }, [authorized, definition.property, domain, filters])

  useEffect(() => {
    const request = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(request)
  }, [load])

  const data = response?.data ?? null
  return {
    authorized,
    definition,
    response,
    data,
    summary: data?.summary ?? {},
    trendData: useMemo(() => extractTrendData(data), [data]),
    statusData: useMemo(() => extractStatusDistribution(data), [data]),
    categoryData: useMemo(() => extractCategoryDistribution(data), [data]),
    propertyData: useMemo(() => extractPropertyBreakdown(data), [data]),
    lifecycle: useMemo(() => toLifecycleView(lifecycleData), [lifecycleData]),
    draftFilters,
    properties,
    loading,
    error,
    setDraftFilters,
    applyFilters,
    load,
  }
}
