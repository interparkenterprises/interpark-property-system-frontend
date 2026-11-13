'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Pencil, Plus, UserRoundX, Users } from 'lucide-react'
import type { Tenant, TenantLeftReason } from '@/types'
import { tenantsAPI } from '@/lib/api'
import TenantForm from '@/components/forms/TenantForm'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'
import { Skeleton } from '@/components/ui/skeleton'
import { MarkTenantLeftDialog } from '../dialogs/MarkTenantLeftDialog'
import { useBreadcrumbAction, useBreadcrumbTrail } from '@/components/layout/BreadcrumbContext'

interface PropertyTenantsTabProps {
  propertyId: string
  canManageTenants: boolean
  onPropertyChanged: () => Promise<void> | void
}

interface MarkLeftState { open: boolean; tenantId: string | null; tenantName: string }

export function PropertyTenantsTab({ propertyId, canManageTenants, onPropertyChanged }: PropertyTenantsTabProps) {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [fetchingTenants, setFetchingTenants] = useState(true)
  const [showTenantForm, setShowTenantForm] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [markLeft, setMarkLeft] = useState<MarkLeftState>({ open: false, tenantId: null, tenantName: '' })
  const [selectedReason, setSelectedReason] = useState<TenantLeftReason | ''>('')
  const [markLeftError, setMarkLeftError] = useState<string | null>(null)
  const [deletingTenantId, setDeletingTenantId] = useState<string | null>(null)
  useBreadcrumbTrail(showTenantForm ? editingTenant?.fullName : null, editingTenant ? `/properties/${editingTenant.id}/tenant-details` : undefined)
  useBreadcrumbAction(showTenantForm ? (editingTenant ? 'Edit' : 'Create') : null)

  const fetchTenants = useCallback(async () => {
    setFetchingTenants(true)
    try {
      setTenants(await tenantsAPI.getByProperty(propertyId))
    } catch (error) {
      console.error('Error fetching tenants:', error)
      if (!(error instanceof Error && error.message.includes('403'))) toast.error('Failed to load tenants')
      setTenants([])
    } finally {
      setFetchingTenants(false)
    }
  }, [propertyId])

  useEffect(() => {
    let active = true
    tenantsAPI.getByProperty(propertyId)
      .then((result) => { if (active) setTenants(result) })
      .catch((error) => {
        console.error('Error fetching tenants:', error)
        if (active) {
          if (!(error instanceof Error && error.message.includes('403'))) toast.error('Failed to load tenants')
          setTenants([])
        }
      })
      .finally(() => { if (active) setFetchingTenants(false) })
    return () => { active = false }
  }, [propertyId])

  const closeForm = () => { setShowTenantForm(false); setEditingTenant(null) }
  const handleSuccess = async () => {
    closeForm()
    await Promise.all([fetchTenants(), onPropertyChanged()])
  }
  const openMarkLeft = (tenant: Tenant) => {
    setMarkLeft({ open: true, tenantId: tenant.id, tenantName: tenant.fullName })
    setSelectedReason('')
    setMarkLeftError(null)
  }
  const closeMarkLeft = () => {
    if (deletingTenantId) return
    setMarkLeft({ open: false, tenantId: null, tenantName: '' })
    setSelectedReason('')
    setMarkLeftError(null)
  }
  const confirmMarkLeft = async () => {
    if (!markLeft.tenantId) return
    setDeletingTenantId(markLeft.tenantId)
    setMarkLeftError(null)
    try {
      const result = await tenantsAPI.delete(markLeft.tenantId, { leftReason: selectedReason || null })
      toast.success(result?.message ?? `Tenant '${markLeft.tenantName}' marked as left successfully.`)
      await Promise.all([fetchTenants(), onPropertyChanged()])
      setMarkLeft({ open: false, tenantId: null, tenantName: '' })
      setSelectedReason('')
    } catch (error) {
      console.error('Error marking tenant as left:', error)
      const message = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        ?? (error as Error)?.message
        ?? 'Failed to mark tenant as left'
      setMarkLeftError(message)
      toast.error(message)
    } finally {
      setDeletingTenantId(null)
    }
  }

  if (showTenantForm && canManageTenants) {
    return (
      <PermissionGuard module="tenants" action={editingTenant ? 'edit' : 'create'}>
        <Card>
          <CardHeader className="border-b border-border"><SectionHeader title={editingTenant ? 'Edit Tenant' : 'Add Tenant'} actions={<Button variant="outline" onClick={closeForm}>Cancel</Button>} /></CardHeader>
          <CardContent className="pt-5"><TenantForm tenant={editingTenant ?? undefined} propertyId={propertyId} onSuccess={handleSuccess} onCancel={closeForm} /></CardContent>
        </Card>
      </PermissionGuard>
    )
  }

  return (
    <div className="space-y-4">
      <MarkTenantLeftDialog open={markLeft.open} tenantName={markLeft.tenantName} reason={selectedReason} error={markLeftError} loading={Boolean(deletingTenantId)} onReasonChange={setSelectedReason} onClose={closeMarkLeft} onConfirm={confirmMarkLeft} />
      <SectionHeader
        title="Property Tenants"
        description={canManageTenants ? 'Manage tenants and their property assignments.' : 'Open a tenant to access the financial information available to you.'}
        actions={canManageTenants ? <PermissionGuard module="tenants" action="create"><Button onClick={() => setShowTenantForm(true)}><Plus className="h-4 w-4" />Add Tenant</Button></PermissionGuard> : <span className="rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary">Financial Access Only</span>}
      />
      {fetchingTenants ? (
        <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
      ) : tenants.length === 0 ? (
        <EmptyState icon={Users} title="No tenants yet" description="No tenants have been added to this property." action={canManageTenants ? <PermissionGuard module="tenants" action="create"><Button onClick={() => setShowTenantForm(true)}>Add Your First Tenant</Button></PermissionGuard> : undefined} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardHeader className="border-b border-border">
                <h3 className="font-semibold text-foreground">
                  {tenant.id ? (
                    <Link
                      href={`/properties/${tenant.id}/tenant-details`}
                      className="inline-block max-w-full truncate underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {tenant.fullName}
                    </Link>
                  ) : tenant.fullName}
                </h3>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <TenantDetail label="Contact" value={tenant.contact || 'N/A'} />
                  <TenantDetail label="Unit" value={tenant.unit ? `${tenant.unit.unitNo || tenant.unit.type || 'Unit'}${tenant.unit.bedrooms !== undefined ? ` · ${tenant.unit.bedrooms} bed / ${tenant.unit.bathrooms ?? 0} bath` : ''}` : 'N/A'} />
                  <TenantDetail label="Rent" value={`Ksh ${tenant.rent.toLocaleString()} / month`} />
                  <TenantDetail label="Lease" value={tenant.leaseTerm || 'N/A'} />
                  {tenant.termStart && <TenantDetail label="Started" value={new Date(tenant.termStart).toLocaleDateString()} />}
                </div>
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  {canManageTenants && <PermissionGuard module="tenants" action="edit"><Button size="sm" variant="outline" onClick={() => { setEditingTenant(tenant); setShowTenantForm(true) }}><Pencil className="h-4 w-4" />Edit</Button></PermissionGuard>}
                  <Button size="sm" variant="outline" onClick={() => router.push(`/properties/${tenant.id}/tenant-details`)}><Eye className="h-4 w-4" />View Details</Button>
                  {canManageTenants && <PermissionGuard module="tenants" action="delete"><Button size="sm" variant="outline" className="text-destructive" onClick={() => openMarkLeft(tenant)}><UserRoundX className="h-4 w-4" />Mark as Left</Button></PermissionGuard>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function TenantDetail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-foreground">{value}</p></div>
}
