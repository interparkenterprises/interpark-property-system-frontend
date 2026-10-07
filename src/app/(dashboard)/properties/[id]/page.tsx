'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'
import type { Property } from '@/types'
import { PermissionCode } from '@/types'
import { propertiesAPI } from '@/lib/api'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { TabsContent } from '@/components/ui/tabs'
import { PropertyEditView } from '@/components/properties/workspace/PropertyEditView'
import { PropertyWorkspaceHeader } from '@/components/properties/workspace/PropertyWorkspaceHeader'
import { PropertyWorkspaceTabs, type PropertyWorkspaceTab } from '@/components/properties/workspace/PropertyWorkspaceTabs'
import { PropertyImageDialog } from '@/components/properties/workspace/dialogs/PropertyImageDialog'
import { PropertyActivationsTab } from '@/components/properties/workspace/tabs/PropertyActivationsTab'
import { PropertyManagersDorTab } from '@/components/properties/workspace/tabs/PropertyManagersDorTab'
import { PropertyOverviewTab } from '@/components/properties/workspace/tabs/PropertyOverviewTab'
import { PropertyServiceProvidersTab } from '@/components/properties/workspace/tabs/PropertyServiceProvidersTab'
import { PropertyTenantsTab } from '@/components/properties/workspace/tabs/PropertyTenantsTab'
import { PropertyUnitsTab } from '@/components/properties/workspace/tabs/PropertyUnitsTab'

const tenantDetailsPermissions = [
  PermissionCode.VIEW_TENANT_FINANCIALS,
  PermissionCode.VIEW_INVOICES,
  PermissionCode.VIEW_PAYMENT_REPORTS,
  PermissionCode.VIEW_BILL_INVOICES,
  PermissionCode.VIEW_DEMAND_LETTERS,
  PermissionCode.VIEW_OVERDUE_INVOICES,
  PermissionCode.RECORD_PAYMENTS,
  PermissionCode.CREATE_INVOICES,
  PermissionCode.CREATE_BILL_INVOICE,
  PermissionCode.DOWNLOAD_INVOICES,
  PermissionCode.CREATE_DEMAND_LETTER,
  PermissionCode.SEND_DEMAND_LETTERS,
  PermissionCode.AUTO_GENERATE_DEMAND_LETTER,
  PermissionCode.DOWNLOAD_DEMAND_LETTER,
]

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string
  const { isAdmin, isManager, canViewProperty, canAccessModule, canViewServiceProviders, canViewActivations, hasPermission } = useGlobalPermissions()

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<PropertyWorkspaceTab>('overview')
  const [propertyImageUrl, setPropertyImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)

  const canViewUnits = canAccessModule('units')
  const canManageTenants = canAccessModule('tenants')
  const canViewProviders = canViewServiceProviders
  const canViewReports = canAccessModule('reports')
  const canViewActivationsTab = canViewActivations
  const canAccessTenantDetailsPage = useMemo(
    () => isAdmin || isManager || tenantDetailsPermissions.some((permission) => hasPermission(permission)),
    [hasPermission, isAdmin, isManager],
  )
  const canViewTenantTab = canManageTenants || canAccessTenantDetailsPage
  const canViewFinancialDetails = isAdmin || isManager || hasPermission(PermissionCode.VIEW_TENANT_FINANCIALS)

  const refreshProperty = useCallback(async () => {
    try {
      setProperty(await propertiesAPI.getById(propertyId))
    } catch (error) {
      console.error('Error fetching property:', error)
      setProperty(null)
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  const refreshPropertyImage = useCallback(async () => {
    setImageLoading(true)
    try {
      const imageBlob = await propertiesAPI.getPropertyImage(propertyId)
      const nextUrl = URL.createObjectURL(imageBlob)
      setPropertyImageUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl)
        return nextUrl
      })
    } catch (error) {
      console.error('Error fetching property image:', error)
      setPropertyImageUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl)
        return null
      })
    } finally {
      setImageLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    let active = true
    Promise.allSettled([
      propertiesAPI.getById(propertyId),
      propertiesAPI.getPropertyImage(propertyId),
    ]).then(([propertyResult, imageResult]) => {
      if (!active) return
      if (propertyResult.status === 'fulfilled') setProperty(propertyResult.value)
      else {
        console.error('Error fetching property:', propertyResult.reason)
        setProperty(null)
      }
      if (imageResult.status === 'fulfilled') setPropertyImageUrl(URL.createObjectURL(imageResult.value))
      else {
        console.error('Error fetching property image:', imageResult.reason)
        setPropertyImageUrl(null)
      }
      setLoading(false)
      setImageLoading(false)
    })
    return () => { active = false }
  }, [propertyId])

  useEffect(() => () => {
    if (propertyImageUrl) URL.revokeObjectURL(propertyImageUrl)
  }, [propertyImageUrl])

  useEffect(() => {
    if (!loading && property && !canViewProperty(propertyId)) router.push('/unauthorized')
  }, [canViewProperty, loading, property, propertyId, router])

  const activeTabIsVisible = activeTab === 'overview'
    || (activeTab === 'units' && canViewUnits)
    || (activeTab === 'tenants' && canViewTenantTab)
    || (activeTab === 'providers' && canViewProviders)
    || (activeTab === 'reports' && canViewReports)
    || (activeTab === 'activations' && canViewActivationsTab)
  const visibleActiveTab: PropertyWorkspaceTab = activeTabIsVisible ? activeTab : 'overview'

  const handlePropertyUpdate = async () => {
    setEditing(false)
    await Promise.all([refreshProperty(), refreshPropertyImage()])
  }

  const handlePropertyDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this property?')) return
    try {
      await propertiesAPI.delete(propertyId)
      router.push('/properties')
    } catch (error) {
      console.error('Error deleting property:', error)
    }
  }

  if (loading) return <PropertyWorkspaceLoading />
  if (!property) {
    return (
      <EmptyState
        icon={Building2}
        title="Property not found"
        description="The property you are looking for does not exist or could not be loaded."
        action={<Button onClick={() => router.push('/properties')}>Back to Properties</Button>}
        className="min-h-[60vh]"
      />
    )
  }
  if (editing) return <PropertyEditView property={property} onSuccess={handlePropertyUpdate} onCancel={() => setEditing(false)} />

  return (
    <div className="min-w-0 space-y-6">
      <PropertyImageDialog open={imageDialogOpen} onOpenChange={setImageDialogOpen} imageUrl={propertyImageUrl} propertyName={property.name} propertyAddress={property.address} />
      <PropertyWorkspaceHeader property={property} imageUrl={propertyImageUrl} imageLoading={imageLoading} onImageOpen={() => setImageDialogOpen(true)} onEdit={() => setEditing(true)} onDelete={handlePropertyDelete} />
      <PropertyWorkspaceTabs
        value={visibleActiveTab}
        onValueChange={setActiveTab}
        canViewUnits={canViewUnits}
        canViewTenants={canViewTenantTab}
        canViewProviders={canViewProviders}
        canViewReports={canViewReports}
        canViewActivations={canViewActivationsTab}
      >
        <TabsContent value="overview" className="pt-4">
          {visibleActiveTab === 'overview' && <PropertyOverviewTab property={property} canViewTenants={canViewTenantTab} canViewProviders={canViewProviders} canViewFinancialDetails={canViewFinancialDetails} />}
        </TabsContent>
        {canViewUnits && <TabsContent value="units" className="pt-4">{visibleActiveTab === 'units' && <PropertyUnitsTab propertyId={propertyId} units={property.units ?? []} onPropertyChanged={refreshProperty} />}</TabsContent>}
        {canViewTenantTab && <TabsContent value="tenants" className="pt-4">{visibleActiveTab === 'tenants' && <PropertyTenantsTab propertyId={propertyId} canManageTenants={canManageTenants} onPropertyChanged={refreshProperty} />}</TabsContent>}
        {canViewProviders && <TabsContent value="providers" className="pt-4">{visibleActiveTab === 'providers' && <PropertyServiceProvidersTab propertyId={propertyId} serviceProviders={property.serviceProviders ?? []} onPropertyChanged={refreshProperty} />}</TabsContent>}
        {canViewReports && <TabsContent value="reports" className="pt-4">{visibleActiveTab === 'reports' && <PropertyManagersDorTab propertyId={propertyId} />}</TabsContent>}
        {canViewActivationsTab && <TabsContent value="activations" className="pt-4">{visibleActiveTab === 'activations' && <PropertyActivationsTab propertyId={propertyId} />}</TabsContent>}
      </PropertyWorkspaceTabs>
    </div>
  )
}

function PropertyWorkspaceLoading() {
  return (
    <div className="space-y-6" aria-label="Loading property">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
      </div>
    </div>
  )
}
