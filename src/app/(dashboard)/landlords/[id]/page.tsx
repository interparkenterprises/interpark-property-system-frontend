'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
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
import type { Landlord } from '@/types'
import { landlordsAPI } from '@/lib/api'
import LandlordForm from '@/components/forms/LandlordForm'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
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

type LandlordApiResponse = Landlord | { data: Landlord }

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function formatEnumLabel(value: string) {
  return value.replaceAll('_', ' ')
}

export default function LandlordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    canViewLandlords,
    canEditLandlord,
    canDeleteLandlord,
    canViewProperties,
  } = useGlobalPermissions()
  const [landlord, setLandlord] = useState<Landlord | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const landlordId = params.id as string
  const editing = searchParams.get('edit') === 'true'
  useBreadcrumbOverride(`/landlords/${landlordId}`, loading ? 'Loading…' : landlord?.name ?? 'Landlord details')
  useBreadcrumbAction(editing ? 'Edit' : null)

  const fetchLandlord = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await landlordsAPI.getById(landlordId) as LandlordApiResponse
      setLandlord('data' in response ? response.data : response)
    } catch (error) {
      console.error('Error fetching landlord:', error)
      setLandlord(null)
      setLoadError(error instanceof Error ? error.message : 'Landlord details could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [landlordId])

  useEffect(() => {
    if (!canViewLandlords) return
    const frame = window.requestAnimationFrame(() => void fetchLandlord())
    return () => window.cancelAnimationFrame(frame)
  }, [canViewLandlords, fetchLandlord])

  const handleDelete = async () => {
    if (!canDeleteLandlord) {
      setDeleteError("You don't have permission to delete landlords.")
      return
    }

    setDeleting(true)
    setDeleteError(null)
    try {
      await landlordsAPI.delete(landlordId)
      router.push('/landlords')
    } catch (error) {
      console.error('Error deleting landlord:', error)
      setDeleteError(error instanceof Error ? error.message : 'The landlord could not be deleted.')
    } finally {
      setDeleting(false)
    }
  }

  const showDetails = () => router.replace(`/landlords/${landlordId}`)

  const handleUpdateSuccess = () => {
    router.replace(`/landlords/${landlordId}`)
    void fetchLandlord()
  }

  if (!canViewLandlords) {
    return (
      <EmptyState
        icon={ShieldX}
        title="Access denied"
        description="You don't have permission to view landlord records."
        className="min-h-64"
        action={<Link href="/dashboard" className={buttonStyles({ variant: 'outline' })}>Back to dashboard</Link>}
      />
    )
  }

  if (loading) return <LandlordDetailsSkeleton />

  if (!landlord) {
    return (
      <EmptyState
        icon={UserRound}
        title="Landlord unavailable"
        description={loadError || 'The landlord record could not be loaded.'}
        className="min-h-64"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/landlords" className={buttonStyles({ variant: 'outline' })}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to landlords
            </Link>
            <Button onClick={() => void fetchLandlord()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          </div>
        }
      />
    )
  }

  if (editing && canEditLandlord) {
    return (
      <div className="max-w-4xl space-y-6 pb-4">
        <PageHeader
          title="Edit Landlord"
          description={`Update contact information for ${landlord.name}.`}
          actions={
            <Button variant="outline" size="sm" onClick={showDetails}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to details
            </Button>
          }
        />
        <LandlordForm landlord={landlord} onSuccess={handleUpdateSuccess} onCancel={showDetails} />
      </div>
    )
  }

  const properties = landlord.properties ?? []
  const contactDescription = [landlord.email, landlord.phone].filter(Boolean).join(' · ')

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader
        title={landlord.name}
        description={contactDescription || 'Landlord contact and property information.'}
        leading={<Badge variant={properties.length > 0 ? 'secondary' : 'neutral'} className="mt-1">{properties.length} {properties.length === 1 ? 'property' : 'properties'}</Badge>}
        actions={
          <>
            <Link href="/landlords" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to landlords
            </Link>
            {canEditLandlord && (
              <Button size="sm" onClick={() => router.push(`/landlords/${landlordId}?edit=true`)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit landlord
              </Button>
            )}
            {canDeleteLandlord && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeleteError(null)
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete landlord
              </Button>
            )}
          </>
        }
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Landlord information</CardTitle>
            <CardDescription>Identity and contact details for this landlord.</CardDescription>
          </CardHeader>
          <CardContent>
            <DetailList>
              <DetailItem label="Name" icon={<UserRound className="h-4 w-4" />}>{landlord.name}</DetailItem>
              <DetailItem label="Email" icon={<Mail className="h-4 w-4" />}>{landlord.email || 'Not provided'}</DetailItem>
              <DetailItem label="Phone" icon={<Phone className="h-4 w-4" />}>{landlord.phone || 'Not provided'}</DetailItem>
              <DetailItem label="Address" icon={<MapPin className="h-4 w-4" />}>{landlord.address || 'Not provided'}</DetailItem>
              <DetailItem label="ID number" icon={<IdCard className="h-4 w-4" />}>{landlord.idNumber || 'Not provided'}</DetailItem>
              <DetailItem label="Created" icon={<CalendarDays className="h-4 w-4" />}>{dateFormatter.format(new Date(landlord.createdAt))}</DetailItem>
            </DetailList>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Associated properties</CardTitle>
            <CardDescription>Properties currently connected to this landlord record.</CardDescription>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No properties assigned"
                description="This landlord does not currently have an associated property."
                className="min-h-52 border-0 bg-transparent"
              />
            ) : (
              <div className="divide-y divide-border">
                {properties.map((property) => (
                  <div key={property.id} className="flex min-w-0 flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      {canViewProperties ? (
                        <Link
                          href={`/properties/${property.id}`}
                          className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {property.name}
                        </Link>
                      ) : (
                        <p className="font-medium text-foreground">{property.name}</p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">{property.address}</p>
                      {property.lrNumber && <p className="mt-1 text-xs text-muted-foreground">LR: {property.lrNumber}</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Badge variant="neutral">{formatEnumLabel(property.form)}</Badge>
                      <Badge variant="secondary">{formatEnumLabel(property.usage)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
            <DialogTitle>Delete landlord?</DialogTitle>
            <DialogDescription>
              This will permanently delete {landlord.name}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="px-5 py-4">
              <Alert variant="destructive">
                <AlertTitle>Unable to delete landlord</AlertTitle>
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" loading={deleting} onClick={() => void handleDelete()}>
              {!deleting && <Trash2 className="h-4 w-4" aria-hidden="true" />}
              {deleting ? 'Deleting landlord...' : 'Delete landlord'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LandlordDetailsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading landlord details" aria-busy="true">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}
