'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Pencil, Plus, Trash2, Wrench } from 'lucide-react'
import type { ServiceProvider } from '@/types'
import { PermissionCode } from '@/types'
import { serviceProvidersAPI } from '@/lib/api'
import ServiceProviderForm from '@/components/forms/ServiceProviderForm'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'

interface PropertyServiceProvidersTabProps {
  propertyId: string
  serviceProviders: ServiceProvider[]
  onPropertyChanged: () => Promise<void> | void
}

export function PropertyServiceProvidersTab({ propertyId, serviceProviders, onPropertyChanged }: PropertyServiceProvidersTabProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null)
  const [deletingProviderId, setDeletingProviderId] = useState<string | null>(null)

  const closeForm = () => { setShowForm(false); setEditingProvider(null) }
  const handleSuccess = async () => { closeForm(); await onPropertyChanged() }
  const handleDelete = async (providerId: string) => {
    if (!window.confirm('Are you sure you want to delete this service provider?')) return
    setDeletingProviderId(providerId)
    try {
      await serviceProvidersAPI.delete(providerId)
      await onPropertyChanged()
    } catch (error) {
      console.error('Error deleting service provider:', error)
    } finally {
      setDeletingProviderId(null)
    }
  }

  if (showForm) {
    return (
      <PermissionGuard permission={editingProvider ? PermissionCode.EDIT_SERVICE_PROVIDER : PermissionCode.CREATE_SERVICE_PROVIDER}>
        <Card>
          <CardHeader className="border-b border-border"><SectionHeader title={editingProvider ? 'Edit Service Provider' : 'Add Service Provider'} actions={<Button variant="outline" onClick={closeForm}>Cancel</Button>} /></CardHeader>
          <CardContent className="pt-5"><ServiceProviderForm serviceProvider={editingProvider ?? undefined} propertyId={propertyId} onSuccess={handleSuccess} onCancel={closeForm} /></CardContent>
        </Card>
      </PermissionGuard>
    )
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Service Providers" description="Manage contractors and services assigned to this property." actions={<PermissionGuard permission={PermissionCode.CREATE_SERVICE_PROVIDER}><Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Add Provider</Button></PermissionGuard>} />
      {serviceProviders.length === 0 ? (
        <EmptyState icon={Wrench} title="No service providers yet" description="Add a provider to begin tracking property services." action={<PermissionGuard permission={PermissionCode.CREATE_SERVICE_PROVIDER}><Button onClick={() => setShowForm(true)}>Add Your First Provider</Button></PermissionGuard>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {serviceProviders.map((provider) => (
            <Card key={provider.id}>
              <CardHeader className="border-b border-border">
                <h3 className="font-semibold text-foreground">
                  {provider.id ? (
                    <Link
                      href={`/properties/${provider.id}/service-provider-detail`}
                      className="inline-block max-w-full truncate underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {provider.name}
                    </Link>
                  ) : provider.name}
                </h3>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <ProviderDetail label="Contact" value={provider.contact || 'N/A'} />
                  <ProviderDetail label="Contract Period" value={provider.contractPeriod || 'N/A'} />
                  <ProviderDetail label="Charge" value={`Ksh ${provider.chargeAmount.toLocaleString()} · ${provider.chargeFrequency.replaceAll('_', ' ')}`} />
                  <ProviderDetail label="Service" value={provider.serviceContract || 'N/A'} />
                </div>
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <PermissionGuard permission={PermissionCode.EDIT_SERVICE_PROVIDER}><Button size="sm" variant="outline" onClick={() => { setEditingProvider(provider); setShowForm(true) }}><Pencil className="h-4 w-4" />Edit</Button></PermissionGuard>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/properties/${provider.id}/service-provider-detail`)}><Eye className="h-4 w-4" />View Details</Button>
                  <PermissionGuard permission={PermissionCode.DELETE_SERVICE_PROVIDER}><Button size="sm" variant="outline" className="text-destructive" loading={deletingProviderId === provider.id} onClick={() => handleDelete(provider.id)}><Trash2 className="h-4 w-4" />Delete</Button></PermissionGuard>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function ProviderDetail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 break-words text-foreground">{value}</p></div>
}
