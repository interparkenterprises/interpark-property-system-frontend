'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { useAuth } from '@/context/AuthContext'
import { landlordsAPI, propertiesAPI } from '@/lib/api'
import type { Property } from '@/types'
import type { AnalyticsFilters } from '@/types/analytics'
import type {
  DashboardAuthorization,
  DashboardData,
  DashboardErrorState,
  DashboardFiltersValue,
  DashboardLoadingState,
} from '@/components/dashboard/types'
import {
  clearDashboardRequestCache,
  dashboardErrorMessage,
  dashboardDefaultDateRange,
  getDashboardAnalytics,
  getDashboardProperties,
} from './dashboardRequests'

const INITIAL_DATA: DashboardData = {
  properties: [],
  landlordCount: 0,
  occupancy: null,
  tenants: null,
  financial: null,
  collections: [],
  propertyRevenue: [],
  generatedAt: null,
}

export function useDashboardData() {
  const permissions = useGlobalPermissions()
  const { refreshUserData } = useAuth()
  const {
    user,
    roleName,
    isAdmin,
    isManager,
    isManagedUser,
    canViewProperties,
    canCreateProperty,
    canCreateOffer,
    canViewCommissions,
    getAccessiblePropertyIds,
    canViewProperty,
    hasPermission,
  } = permissions
  const [filters, setFilters] = useState<DashboardFiltersValue>(dashboardDefaultDateRange)
  const [data, setData] = useState<DashboardData>(INITIAL_DATA)
  const [loading, setLoading] = useState<DashboardLoadingState>({
    portfolio: true,
    financial: true,
    collections: true,
    propertyAttention: true,
    properties: true,
  })
  const [errors, setErrors] = useState<DashboardErrorState>({
    portfolio: null,
    financial: null,
    collections: null,
    propertyAttention: null,
    properties: null,
  })
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [isRefreshingPermissions, setIsRefreshingPermissions] = useState(false)
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null)
  const analyticsRequestId = useRef(0)
  const propertyRequestId = useRef(0)

  const accessiblePropertyIds = useMemo(
    () => getAccessiblePropertyIds(),
    [getAccessiblePropertyIds],
  )
  const accessiblePropertyIdsKey = accessiblePropertyIds.join(',')
  const canAccessProperties = canViewProperties || (isManagedUser && accessiblePropertyIds.length > 0)
  const canUnits = isAdmin || isManager || hasPermission('VIEW_UNITS')
  const canTenants = isAdmin || isManager || hasPermission('VIEW_TENANTS')
  const canPayments = isAdmin || isManager || hasPermission('VIEW_PAYMENT_REPORTS')
  const canArrears = isAdmin || isManager || hasPermission('VIEW_ARREARS')

  const authorization: DashboardAuthorization = {
    portfolio: canAccessProperties || canUnits || canTenants,
    financial: canPayments && canArrears,
    collections: canPayments,
    arrears: canPayments && canArrears,
  }
  const navigation = {
    properties: canAccessProperties,
    occupancy: canUnits && canTenants,
    tenants: canTenants,
    rent: canPayments && canArrears,
  }

  const analyticsFilters = useMemo<AnalyticsFilters>(() => {
    return {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      asOf: filters.dateTo,
      grain: 'month',
      propertyId: filters.propertyId,
    }
  }, [filters])

  useEffect(() => {
    if (!user) return
    const requestId = ++propertyRequestId.current
    const cacheKey = [
      user.id,
      isAdmin,
      isManager,
      accessiblePropertyIdsKey,
      refreshNonce,
    ].join(':')

    queueMicrotask(() => {
      setLoading(current => ({ ...current, properties: true }))
      setErrors(current => ({ ...current, properties: null }))
    })

    const request = getDashboardProperties(cacheKey, async () => {
        const allProperties = canAccessProperties ? await propertiesAPI.getAll() : []
        let properties: Property[] = []

        if (isAdmin) {
          properties = allProperties
        } else if (isManager) {
          properties = allProperties.filter((property: Property) => property.managerId === user.id)
        } else if (isManagedUser) {
          properties = allProperties.filter((property: Property) =>
            accessiblePropertyIds.includes(property.id) || canViewProperty(property.id),
          )
        }

        let landlordCount = 0
        if (isAdmin || isManager) {
          const landlords = await landlordsAPI.getAll().catch(() => [])
          landlordCount = Array.isArray(landlords) ? landlords.length : 0
        }

        return { properties, landlordCount }
      })

    request
      .then(result => {
        if (requestId !== propertyRequestId.current) return
        setData(current => ({ ...current, ...result }))
      })
      .catch(error => {
        if (requestId !== propertyRequestId.current) return
        setErrors(current => ({ ...current, properties: dashboardErrorMessage(error) }))
      })
      .finally(() => {
        if (requestId === propertyRequestId.current) {
          setLoading(current => ({ ...current, properties: false }))
        }
      })
  }, [
    accessiblePropertyIds,
    accessiblePropertyIdsKey,
    canAccessProperties,
    canViewProperty,
    isAdmin,
    isManagedUser,
    isManager,
    refreshNonce,
    user,
  ])

  useEffect(() => {
    if (!user) return
    const requestId = ++analyticsRequestId.current
    const cacheKey = JSON.stringify({
      userId: user.id,
      analyticsFilters,
      canUnits,
      canTenants,
      canFinancial: authorization.financial,
      canCollections: authorization.collections,
      refreshNonce,
    })

    queueMicrotask(() => {
      setLoading(current => ({
        ...current,
        portfolio: canUnits || canTenants,
        financial: authorization.financial,
        collections: authorization.collections,
        propertyAttention: authorization.collections,
      }))
      setErrors(current => ({ ...current, portfolio: null, financial: null, collections: null, propertyAttention: null }))
    })

    const request = getDashboardAnalytics(cacheKey, analyticsFilters, {
      canUnits,
      canTenants,
      canFinancial: authorization.financial,
      canCollections: authorization.collections,
    })

    request
      .then(result => {
        if (requestId !== analyticsRequestId.current) return
        setData(current => ({
          ...current,
          occupancy: result.occupancy,
          tenants: result.tenants,
          financial: result.financial,
          collections: result.collections,
          propertyRevenue: result.propertyRevenue,
          generatedAt: result.generatedAt,
        }))
        setErrors(current => ({ ...current, ...result.errors }))
      })
      .finally(() => {
        if (requestId === analyticsRequestId.current) {
          setLoading(current => ({ ...current, portfolio: false, financial: false, collections: false, propertyAttention: false }))
        }
      })
  }, [
    analyticsFilters,
    authorization.collections,
    authorization.financial,
    canTenants,
    canUnits,
    refreshNonce,
    user,
  ])

  const refreshData = useCallback(() => {
    clearDashboardRequestCache()
    setRefreshNonce(value => value + 1)
  }, [])

  const refreshPermissions = useCallback(async () => {
    setIsRefreshingPermissions(true)
    setPermissionMessage(null)
    try {
      await refreshUserData()
      clearDashboardRequestCache()
      setRefreshNonce(value => value + 1)
      setPermissionMessage('Permissions refreshed successfully.')
    } catch (error) {
      setPermissionMessage(error instanceof Error ? error.message : 'Failed to refresh permissions.')
    } finally {
      setIsRefreshingPermissions(false)
    }
  }, [refreshUserData])

  useEffect(() => {
    const needsSync = localStorage.getItem('needsPermissionSync')
    if (needsSync === 'true' && isManagedUser) {
      localStorage.removeItem('needsPermissionSync')
      queueMicrotask(() => void refreshPermissions())
    }
  }, [isManagedUser, refreshPermissions])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !user) return
      const lastRefresh = Number(sessionStorage.getItem('lastDashboardRefresh') || 0)
      if (Date.now() - lastRefresh < 120000) return
      sessionStorage.setItem('lastDashboardRefresh', Date.now().toString())
      void refreshPermissions()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshPermissions, user])

  const updateFilters = useCallback((next: DashboardFiltersValue) => {
    setFilters(next)
  }, [])

  return {
    user,
    roleName,
    isAdmin,
    isManager,
    isManagedUser,
    canCreateProperty,
    canCreateOffer,
    canViewCommissions,
    filters,
    updateFilters,
    data,
    loading,
    errors,
    authorization,
    navigation,
    refreshData,
    refreshPermissions,
    isRefreshingPermissions,
    permissionMessage,
  }
}
