'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Building2, Plus, RefreshCw, ShieldX } from 'lucide-react'
import type { Property } from '@/types'
import { propertiesAPI } from '@/lib/api'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { PropertyList, PropertyListSkeleton } from '@/components/properties/PropertyList'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonStyles } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { useRouter } from 'next/navigation'

export default function PropertiesPage() {
  const router = useRouter()
  const isMounted = useRef(true)
  const {
    user,
    isAdmin,
    isManager,
    isManagedUser,
    roleName,
    permissions,
    canViewProperties,
    canCreateProperty,
    canEditProperty,
    canDeleteProperty,
    canViewProperty,
    getAccessiblePropertyIds,
  } = useGlobalPermissions()

  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const accessiblePropertyIds = useMemo(() => getAccessiblePropertyIds(), [getAccessiblePropertyIds])
  const canAccessPage = useMemo(
    () => isAdmin || isManager || isManagedUser || canViewProperties,
    [canViewProperties, isAdmin, isManagedUser, isManager],
  )

  const canViewThisProperty = useCallback((property: Property) => {
    if (isAdmin) return true
    if (isManager) return property.managerId === user?.id
    if (isManagedUser) return accessiblePropertyIds.includes(property.id) || canViewProperty(property.id)
    return canViewProperties
  }, [accessiblePropertyIds, canViewProperties, canViewProperty, isAdmin, isManagedUser, isManager, user?.id])

  const canEditThisProperty = useCallback((property: Property) => {
    if (isAdmin) return true
    if (isManager) return property.managerId === user?.id && permissions.properties.canEdit
    if (isManagedUser) return canEditProperty(property.id)
    return permissions.properties.canEdit
  }, [canEditProperty, isAdmin, isManagedUser, isManager, permissions.properties.canEdit, user?.id])

  const canDeleteThisProperty = useCallback((property: Property) => {
    if (isAdmin) return true
    if (isManager) return property.managerId === user?.id && permissions.properties.canDelete
    if (isManagedUser) return canDeleteProperty(property.id)
    return permissions.properties.canDelete
  }, [canDeleteProperty, isAdmin, isManagedUser, isManager, permissions.properties.canDelete, user?.id])

  const fetchProperties = useCallback(async () => {
    if (!canAccessPage) {
      if (isMounted.current) setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await propertiesAPI.getAll()
      if (!isMounted.current) return
      const safeProperties = Array.isArray(result) ? result : []
      setProperties(safeProperties.filter(canViewThisProperty))
    } catch (fetchError) {
      console.error('Error fetching properties:', fetchError)
      if (isMounted.current) setError('Failed to load properties. Please try again later.')
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [canAccessPage, canViewThisProperty])

  useEffect(() => {
    isMounted.current = true
    const frame = window.requestAnimationFrame(() => void fetchProperties())
    return () => {
      isMounted.current = false
      window.cancelAnimationFrame(frame)
    }
  }, [fetchProperties])

  const handleView = (propertyId: string) => {
    setViewingId(propertyId)
    window.setTimeout(() => router.push(`/properties/${propertyId}`), 150)
  }

  const handleEdit = (property: Property) => {
    if (!canEditThisProperty(property)) {
      window.alert("You don't have permission to edit this property")
      return
    }
    setEditingId(property.id)
    window.setTimeout(() => router.push(`/properties/${property.id}?mode=edit`), 150)
  }

  const handleDelete = async (property: Property) => {
    if (!canDeleteThisProperty(property)) {
      window.alert("You don't have permission to delete this property")
      return
    }
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) return
    setDeletingId(property.id)
    try {
      await propertiesAPI.delete(property.id)
      setProperties((current) => current.filter((item) => item.id !== property.id))
    } catch (deleteError) {
      console.error('Error deleting property:', deleteError)
      window.alert('Failed to delete property. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  if (!canAccessPage) {
    return (
      <EmptyState
        icon={ShieldX}
        title="You don't have permission to view properties"
        description={`Contact an administrator if you need access to property records${roleName || user?.role ? ` for your ${roleName || user?.role} role` : ''}.`}
        className="min-h-64"
      />
    )
  }

  const description = isAdmin
    ? 'Manage the property portfolio, units, landlords, and property workspaces.'
    : isManager
      ? 'Manage your assigned properties and related operations.'
      : isManagedUser
        ? 'View and work with properties you have access to.'
        : 'View and manage the property portfolio.'

  const emptyDescription = isManagedUser
    ? 'No properties have been assigned to you yet.'
    : 'Properties will appear here once they are added.'

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader
        title="Properties"
        description={description}
        actions={canCreateProperty ? (
          <PermissionGuard permission="CREATE_PROPERTY">
            <Link href="/properties/create" className={buttonStyles({ size: 'sm' })}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Property
            </Link>
          </PermissionGuard>
        ) : undefined}
      />

      {loading ? (
        <PropertyListSkeleton />
      ) : error ? (
        <Alert variant="destructive" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <AlertTitle>Unable to load properties</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchProperties()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        </Alert>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={isManagedUser ? 'No accessible properties yet' : 'No properties yet'}
          description={emptyDescription}
          action={canCreateProperty ? (
            <PermissionGuard permission="CREATE_PROPERTY">
              <Link href="/properties/create" className={buttonStyles({ size: 'sm' })}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Property
              </Link>
            </PermissionGuard>
          ) : undefined}
        />
      ) : (
        <PropertyList
          properties={properties}
          viewingId={viewingId}
          editingId={editingId}
          deletingId={deletingId}
          canEdit={canEditThisProperty}
          canDelete={canDeleteThisProperty}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
