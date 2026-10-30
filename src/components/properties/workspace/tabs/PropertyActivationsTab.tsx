'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Eye, FileCheck2, Pencil, Plus, Trash2 } from 'lucide-react'
import type { ActivationRequest } from '@/types'
import { PermissionCode } from '@/types'
import { activationsAPI } from '@/lib/api'
import ActivationForm from '@/components/forms/ActivationForm'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'
import { Skeleton } from '@/components/ui/skeleton'

interface PropertyActivationsTabProps { propertyId: string; propertyName: string }

export function PropertyActivationsTab({ propertyId, propertyName }: PropertyActivationsTabProps) {
  const [activationRequests, setActivationRequests] = useState<ActivationRequest[]>([])
  const [activationsLoading, setActivationsLoading] = useState(true)
  const [showActivationForm, setShowActivationForm] = useState(false)
  const [editingActivation, setEditingActivation] = useState<ActivationRequest | null>(null)
  const [deletingActivationId, setDeletingActivationId] = useState<string | null>(null)

  const fetchActivations = useCallback(async () => {
    setActivationsLoading(true)
    try {
      const response = await activationsAPI.getAll({ propertyId, page: 1, limit: 50 })
      setActivationRequests(response.data)
    } catch (error) {
      console.error('Error fetching activation requests:', error)
      if ((error as { response?: { status?: number } })?.response?.status === 403) setActivationRequests([])
    } finally {
      setActivationsLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    let active = true
    activationsAPI.getAll({ propertyId, page: 1, limit: 50 })
      .then((response) => { if (active) setActivationRequests(response.data) })
      .catch((error) => {
        console.error('Error fetching activation requests:', error)
        if (active && (error as { response?: { status?: number } })?.response?.status === 403) setActivationRequests([])
      })
      .finally(() => { if (active) setActivationsLoading(false) })
    return () => { active = false }
  }, [propertyId])

  const closeForm = () => { setShowActivationForm(false); setEditingActivation(null) }
  const handleSuccess = () => { closeForm(); void fetchActivations() }
  const handleView = async (activationId: string) => {
    try {
      const activation = await activationsAPI.getById(activationId)
      if (activation.documentUrl) window.open(activation.documentUrl, '_blank')
    } catch (error) {
      console.error('Error viewing activation:', error)
    }
  }
  const handleDownload = async (activationId: string, requestNumber: string) => {
    try {
      const pdfBlob = await activationsAPI.downloadPDF(activationId)
      downloadBlob(pdfBlob, `activation-request-${requestNumber}.pdf`)
    } catch (error) {
      console.error('Error downloading activation:', error)
      window.alert('Failed to download activation request')
    }
  }
  const handleDelete = async (activationId: string) => {
    if (!window.confirm('Are you sure you want to delete this activation request?')) return
    setDeletingActivationId(activationId)
    try {
      await activationsAPI.delete(activationId)
      await fetchActivations()
    } catch (error) {
      console.error('Error deleting activation:', error)
    } finally {
      setDeletingActivationId(null)
    }
  }

  if (showActivationForm) {
    return (
      <PermissionGuard permission={editingActivation ? PermissionCode.EDIT_ACTIVATION_REQUEST : PermissionCode.CREATE_ACTIVATION_REQUEST}>
        <ActivationForm propertyId={propertyId} propertyName={propertyName} activation={editingActivation} onSuccess={handleSuccess} onCancel={closeForm} />
      </PermissionGuard>
    )
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Activation Forms" description="Manage space activation and temporary lease requests." actions={<PermissionGuard permission={PermissionCode.CREATE_ACTIVATION_REQUEST}><Button onClick={() => setShowActivationForm(true)}><Plus className="h-4 w-4" />Create Request</Button></PermissionGuard>} />
      {activationsLoading ? (
        <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      ) : activationRequests.length === 0 ? (
        <EmptyState icon={FileCheck2} title="No activation requests yet" description="Create the first activation request for this property." action={<PermissionGuard permission={PermissionCode.CREATE_ACTIVATION_REQUEST}><Button onClick={() => setShowActivationForm(true)}>Create First Request</Button></PermissionGuard>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {activationRequests.map((activation) => (
            <Card key={activation.id}>
              <CardHeader className="flex-row items-start justify-between border-b border-border">
                <div><p className="text-xs text-muted-foreground">Request No.</p><h3 className="mt-1 font-semibold text-foreground">{activation.requestNumber}</h3></div>
                <Badge variant={activationVariant(activation.status)}>{activation.status.replaceAll('_', ' ')}</Badge>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <ActivationDetail label="Company" value={activation.companyName} />
                <ActivationDetail label="Contact Person" value={activation.contactPerson} />
                <ActivationDetail label="Type" value={activation.activationType.replaceAll('_', ' ')} />
                <ActivationDetail label="Period" value={`${new Date(activation.startDate).toLocaleDateString('en-GB')} – ${new Date(activation.endDate).toLocaleDateString('en-GB')}`} />
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <PermissionGuard permission={PermissionCode.EDIT_ACTIVATION_REQUEST}><Button size="sm" variant="outline" onClick={() => { setEditingActivation(activation); setShowActivationForm(true) }}><Pencil className="h-4 w-4" />Edit</Button></PermissionGuard>
                  {activation.documentUrl && <Button size="sm" variant="outline" onClick={() => handleView(activation.id)}><Eye className="h-4 w-4" />View</Button>}
                  <Button size="sm" variant="outline" onClick={() => handleDownload(activation.id, activation.requestNumber)}><Download className="h-4 w-4" />Download</Button>
                  <PermissionGuard permission={PermissionCode.DELETE_ACTIVATION_REQUEST}><Button size="sm" variant="outline" className="text-destructive" loading={deletingActivationId === activation.id} onClick={() => handleDelete(activation.id)}><Trash2 className="h-4 w-4" />Delete</Button></PermissionGuard>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function activationVariant(status: ActivationRequest['status']): 'neutral' | 'info' | 'success' | 'warning' | 'destructive' {
  if (status === 'APPROVED' || status === 'COMPLETED') return 'success'
  if (status === 'REJECTED') return 'destructive'
  if (status === 'UNDER_REVIEW') return 'warning'
  if (status === 'SUBMITTED') return 'info'
  return 'neutral'
}

function ActivationDetail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-sm text-foreground">{value}</p></div>
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
