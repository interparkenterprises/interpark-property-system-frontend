'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  ShieldX,
  Trash2,
  UserRound,
} from 'lucide-react'
import type { Lead } from '@/types'
import { leadsAPI } from '@/lib/api'
import LeadForm from '@/components/forms/LeadForm'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { useAuth } from '@/context/AuthContext'
import { useBreadcrumbAction, useBreadcrumbOverride } from '@/components/layout/BreadcrumbContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonStyles } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DetailItem, DetailList } from '@/components/ui/detail-list'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

type LeadLoadError = {
  kind: 'forbidden' | 'load'
  message: string
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const userId = user?.id
  const { canDeleteLead, isAdmin, isManager, getAccessiblePropertyIds } = useGlobalPermissions()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<LeadLoadError | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const leadId = params.id as string
  const editing = searchParams.get('edit') === 'true'
  useBreadcrumbOverride(`/leads/${leadId}`, loading ? 'Loading…' : lead?.name ?? 'Lead details')
  useBreadcrumbAction(editing ? 'Edit' : null)

  const fetchLead = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const data = await leadsAPI.getById(leadId)
      let canViewLead = isAdmin

      if (!isAdmin && isManager) {
        canViewLead = data.createdById === userId
      } else if (!isAdmin) {
        const accessiblePropertyIds = getAccessiblePropertyIds()
        canViewLead = Boolean(data.propertyId && accessiblePropertyIds.includes(data.propertyId))
      }

      if (!canViewLead) {
        setLead(null)
        setLoadError({ kind: 'forbidden', message: 'You do not have permission to view this lead.' })
        return
      }

      setLead(data)
    } catch (error) {
      console.error('Error fetching lead:', error)
      setLead(null)
      setLoadError({
        kind: 'load',
        message: error instanceof Error ? error.message : 'Lead details could not be loaded.',
      })
    } finally {
      setLoading(false)
    }
  }, [getAccessiblePropertyIds, isAdmin, isManager, leadId, userId])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void fetchLead())
    return () => window.cancelAnimationFrame(frame)
  }, [fetchLead])

  const handleDelete = async () => {
    if (!canDeleteLead) {
      setDeleteError("You don't have permission to delete leads.")
      return
    }

    setDeleting(true)
    setDeleteError(null)
    try {
      await leadsAPI.delete(leadId)
      router.push('/leads')
    } catch (error) {
      console.error('Error deleting lead:', error)
      setDeleteError(error instanceof Error ? error.message : 'The lead could not be deleted.')
    } finally {
      setDeleting(false)
    }
  }

  const handleUpdateSuccess = () => {
    router.replace(`/leads/${leadId}`)
    void fetchLead()
  }

  const showDetails = () => router.replace(`/leads/${leadId}`)

  if (loading) return <LeadDetailsSkeleton />

  if (!lead) {
    const forbidden = loadError?.kind === 'forbidden'
    return (
      <EmptyState
        icon={forbidden ? ShieldX : UserRound}
        title={forbidden ? 'Access denied' : 'Lead unavailable'}
        description={loadError?.message || 'The lead record could not be loaded.'}
        className="min-h-64"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/leads" className={buttonStyles({ variant: 'outline' })}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to leads
            </Link>
            {!forbidden && (
              <Button onClick={() => void fetchLead()}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
            )}
          </div>
        }
      />
    )
  }

  if (editing) {
    return (
      <div className="max-w-4xl space-y-6 pb-4">
        <PageHeader
          title="Edit Lead"
          description={`Update contact, enquiry, and property information for ${lead.name}.`}
          actions={
            <Button variant="outline" size="sm" onClick={showDetails}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to details
            </Button>
          }
        />
        <LeadForm lead={lead} onSuccess={handleUpdateSuccess} onCancel={showDetails} />
      </div>
    )
  }

  const headerDescription = [lead.companyName, lead.property?.name].filter(Boolean).join(' · ')

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader
        title={lead.name}
        description={headerDescription || 'Lead contact and enquiry details.'}
        leading={lead.natureOfLead ? <Badge variant="neutral" className="mt-1">{lead.natureOfLead}</Badge> : undefined}
        actions={
          <>
            <Link href="/leads" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to leads
            </Link>
            <PermissionGuard module="leads" action="edit">
              <Button size="sm" onClick={() => router.push(`/leads/${leadId}?edit=true`)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit lead
              </Button>
            </PermissionGuard>
            <PermissionGuard module="leads" action="delete">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeleteError(null)
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete lead
              </Button>
            </PermissionGuard>
          </>
        }
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Contact information</CardTitle>
              <CardDescription>Identity and contact details recorded for this lead.</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailList>
                <DetailItem label="Name" icon={<UserRound className="h-4 w-4" />}>{lead.name}</DetailItem>
                <DetailItem label="Phone" icon={<Phone className="h-4 w-4" />}>{lead.phone}</DetailItem>
                <DetailItem label="Email" icon={<Mail className="h-4 w-4" />}>{lead.email || 'Not provided'}</DetailItem>
                <DetailItem label="Address" icon={<MapPin className="h-4 w-4" />}>{lead.address || 'Not provided'}</DetailItem>
                <DetailItem label="ID number" icon={<IdCard className="h-4 w-4" />}>{lead.idNumber || 'Not provided'}</DetailItem>
                <DetailItem label="Company" icon={<BriefcaseBusiness className="h-4 w-4" />}>{lead.companyName || 'Not provided'}</DetailItem>
              </DetailList>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Lead information</CardTitle>
              <CardDescription>Enquiry classification and record history.</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailList>
                <DetailItem label="Nature of lead">
                  <Badge variant="neutral">{lead.natureOfLead || 'Not specified'}</Badge>
                </DetailItem>
                <DetailItem label="Created" icon={<CalendarDays className="h-4 w-4" />}>
                  {dateFormatter.format(new Date(lead.createdAt))}
                </DetailItem>
              </DetailList>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Property interest</CardTitle>
              <CardDescription>The property associated with this enquiry.</CardDescription>
            </CardHeader>
            <CardContent>
              {lead.property ? (
                <DetailList>
                  <DetailItem label="Property" icon={<Building2 className="h-4 w-4" />}>{lead.property.name}</DetailItem>
                  {lead.property.address && <DetailItem label="Address">{lead.property.address}</DetailItem>}
                  {lead.property.form && <DetailItem label="Property type">{lead.property.form.replaceAll('_', ' ')}</DetailItem>}
                  {lead.property.usage && <DetailItem label="Usage">{lead.property.usage.replaceAll('_', ' ')}</DetailItem>}
                </DetailList>
              ) : (
                <p className="py-3 text-sm text-muted-foreground">No property is associated with this lead.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Notes</CardTitle>
              <CardDescription>Additional context recorded for this lead.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                {lead.notes || <span className="text-muted-foreground">No notes have been added.</span>}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (deleting) return
          setDeleteDialogOpen(open)
          if (!open) setDeleteError(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete lead?</DialogTitle>
            <DialogDescription>
              This will permanently delete {lead.name}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="px-5 py-4">
              <Alert variant="destructive">
                <AlertTitle>Unable to delete lead</AlertTitle>
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" loading={deleting} onClick={() => void handleDelete()}>
              {!deleting && <Trash2 className="h-4 w-4" aria-hidden="true" />}
              {deleting ? 'Deleting lead...' : 'Delete lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LeadDetailsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading lead details" aria-busy="true">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div className="space-y-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  )
}
