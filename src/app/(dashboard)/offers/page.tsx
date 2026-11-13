'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, FilePlus2, FileText, RefreshCw, Search, ShieldX, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { OfferLetter, OfferStatus } from '@/types'
import { offerLettersAPI } from '@/lib/api'
import OfferLetterForm from '@/components/forms/OfferLetterForm'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { useAuth } from '@/context/AuthContext'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const offerStatuses: OfferStatus[] = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'CONVERTED']

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const currencyFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function statusAppearance(status: OfferStatus): 'neutral' | 'info' | 'success' | 'warning' | 'destructive' {
  if (status === 'ACCEPTED' || status === 'CONVERTED') return 'success'
  if (status === 'SENT') return 'info'
  if (status === 'EXPIRED') return 'warning'
  if (status === 'REJECTED' || status === 'CANCELLED') return 'destructive'
  return 'neutral'
}

export default function OffersPage() {
  const { user, userId } = useAuth()
  const {
    canViewOffers,
    canCreateOffer,
    canEditOffer,
    canDeleteOffer,
    isAdmin,
    isManager,
    isManagedUser,
    getAccessiblePropertyIds,
  } = useGlobalPermissions()
  const [offers, setOffers] = useState<OfferLetter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<OfferStatus | 'ALL'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null)
  const [deletingOffer, setDeletingOffer] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [offerPendingDelete, setOfferPendingDelete] = useState<OfferLetter | null>(null)

  const fetchOffers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let data = await offerLettersAPI.getAll()
      if (isManager && userId) {
        data = data.filter((offer) => offer.createdById === userId)
      } else if (!isAdmin && isManagedUser) {
        const accessiblePropertyIds = getAccessiblePropertyIds()
        data = data.filter((offer) => offer.propertyId && accessiblePropertyIds.includes(offer.propertyId))
      }
      setOffers(data)
    } catch (fetchError) {
      console.error('Failed to fetch offers:', fetchError)
      setError(fetchError instanceof Error ? fetchError.message : 'Offer letters could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [getAccessiblePropertyIds, isAdmin, isManagedUser, isManager, userId])

  useEffect(() => {
    if (!user || !canViewOffers) return
    const frame = window.requestAnimationFrame(() => void fetchOffers())
    return () => window.cancelAnimationFrame(frame)
  }, [canViewOffers, fetchOffers, user])

  const filteredOffers = useMemo(() => offers.filter((offer) => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const matchesStatus = filterStatus === 'ALL' || offer.status === filterStatus
    const matchesSearch = !normalizedSearch
      || offer.offerNumber.toLowerCase().includes(normalizedSearch)
      || offer.lead?.name?.toLowerCase().includes(normalizedSearch)
      || offer.property?.name?.toLowerCase().includes(normalizedSearch)
    return matchesStatus && matchesSearch
  }), [filterStatus, offers, searchTerm])

  const handleGeneratePDF = async (offerId: string) => {
    setGeneratingPdf(offerId)
    try {
      await offerLettersAPI.generatePDF(offerId)
      await fetchOffers()
      toast.success('Offer letter PDF generated successfully.')
    } catch (operationError) {
      console.error('Failed to generate PDF:', operationError)
      toast.error(operationError instanceof Error ? operationError.message : 'Unable to generate the offer letter PDF. Please try again.')
    } finally {
      setGeneratingPdf(null)
    }
  }

  const handleDownloadPDF = async (offerId: string, offerNumber: string) => {
    setDownloadingPdf(offerId)
    try {
      const blob = await offerLettersAPI.downloadPDF(offerId)
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `Offer-Letter-${offerNumber}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(url)
      toast.success('Offer letter download initiated.')
    } catch (operationError) {
      console.error('Failed to download PDF:', operationError)
      toast.error(operationError instanceof Error ? operationError.message : 'Unable to download the offer letter PDF. Please try again.')
    } finally {
      setDownloadingPdf(null)
    }
  }

  const handleStatusChange = async (offerId: string, status: OfferStatus) => {
    if (!canEditOffer) return
    setUpdatingStatus(offerId)
    try {
      await offerLettersAPI.updateStatus(offerId, status)
      await fetchOffers()
      toast.success('Offer status updated')
    } catch (operationError) {
      console.error('Failed to update status:', operationError)
      toast.error(operationError instanceof Error ? operationError.message : 'Failed to update offer status.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDelete = async () => {
    if (!offerPendingDelete || !canDeleteOffer) return
    setDeletingOffer(offerPendingDelete.id)
    try {
      await offerLettersAPI.delete(offerPendingDelete.id)
      setOfferPendingDelete(null)
      await fetchOffers()
      toast.success('Offer letter deleted')
    } catch (operationError) {
      console.error('Failed to delete offer:', operationError)
      toast.error(operationError instanceof Error ? operationError.message : 'Failed to delete offer letter.')
    } finally {
      setDeletingOffer(null)
    }
  }

  if (!canViewOffers) {
    return <EmptyState icon={ShieldX} title="Access denied" description="You don't have permission to view offer letters." className="min-h-64" />
  }

  if (showForm) {
    return (
      <div className="min-w-0 space-y-6 pb-4">
        <PageHeader title="Create Offer Letter" description="Prepare an offer using the existing property, unit, financial, and lease terms." actions={<Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Back to offers</Button>} />
        <OfferLetterForm onSuccess={() => { setShowForm(false); void fetchOffers() }} onCancel={() => setShowForm(false)} />
      </div>
    )
  }

  const description = isAdmin ? 'Manage all offer letters.' : isManager ? 'Manage the offer letters you created.' : 'View offer letters for your assigned properties.'
  const stats = [
    ['Total Offers', offers.length],
    ['Draft', offers.filter((offer) => offer.status === 'DRAFT').length],
    ['Sent', offers.filter((offer) => offer.status === 'SENT').length],
    ['Accepted', offers.filter((offer) => offer.status === 'ACCEPTED').length],
    ['Rejected', offers.filter((offer) => offer.status === 'REJECTED').length],
  ] as const

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader
        title="Offer Letters"
        description={description}
        actions={canCreateOffer ? <PermissionGuard module="offers" action="create"><Button size="sm" onClick={() => setShowForm(true)}><FilePlus2 className="h-4 w-4" aria-hidden="true" />Create Offer Letter</Button></PermissionGuard> : undefined}
      />

      {isAdmin && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map(([label, value]) => <Card key={label}><CardContent className="pt-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold text-foreground">{value}</p></CardContent></Card>)}
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-border"><CardTitle>Search and filter</CardTitle></CardHeader>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input aria-label="Search offer letters" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by offer number, lead, or property..." className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as OfferStatus | 'ALL')}>
            <SelectTrigger aria-label="Filter by status"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">All statuses</SelectItem>{offerStatuses.map((status) => <SelectItem key={status} value={status}>{status.replaceAll('_', ' ')}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <OffersTableSkeleton />
      ) : error ? (
        <Alert variant="destructive" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><AlertTitle>Unable to load offers</AlertTitle><AlertDescription>{error}</AlertDescription></div><Button variant="outline" size="sm" onClick={() => void fetchOffers()}><RefreshCw className="h-4 w-4" aria-hidden="true" />Retry</Button></Alert>
      ) : filteredOffers.length === 0 ? (
        <EmptyState icon={FileText} title="No offer letters found" description={offers.length ? 'No offers match the current search and status filter.' : 'No offer letters are available yet.'} action={canCreateOffer ? <Button size="sm" onClick={() => setShowForm(true)}>Create Offer Letter</Button> : undefined} />
      ) : (
        <Table className="min-w-[1100px]">
          <TableHead><TableHeader>Offer #</TableHeader><TableHeader>Lead</TableHeader><TableHeader>Property</TableHeader><TableHeader>Type</TableHeader><TableHeader>Rent Amount</TableHeader><TableHeader>Status</TableHeader><TableHeader>Issue Date</TableHeader>{isAdmin && <TableHeader>Created By</TableHeader>}<TableHeader>Actions</TableHeader></TableHead>
          <TableBody>
            {filteredOffers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell className="font-medium">{offer.offerNumber}</TableCell>
                <TableCell><p className="font-medium">{offer.lead?.name || 'N/A'}</p><p className="text-xs text-muted-foreground">{offer.lead?.phone || 'No phone'}</p></TableCell>
                <TableCell><p>{offer.property?.name || 'N/A'}</p>{offer.unit && <p className="text-xs text-muted-foreground">Unit {offer.unit.unitNo}</p>}</TableCell>
                <TableCell><Badge variant="neutral">{offer.letterType}</Badge></TableCell>
                <TableCell className="tabular-nums">{currencyFormatter.format(offer.rentAmount || 0)}</TableCell>
                <TableCell>
                  {canEditOffer ? (
                    <Select value={offer.status} onValueChange={(value) => void handleStatusChange(offer.id, value as OfferStatus)} disabled={updatingStatus === offer.id}><SelectTrigger className="h-8 min-w-32"><SelectValue /></SelectTrigger><SelectContent>{offerStatuses.map((status) => <SelectItem key={status} value={status}>{status.replaceAll('_', ' ')}</SelectItem>)}</SelectContent></Select>
                  ) : <StatusBadge status={offer.status} appearance={statusAppearance(offer.status)} />}
                </TableCell>
                <TableCell className="text-muted-foreground">{offer.issueDate ? dateFormatter.format(new Date(offer.issueDate)) : 'N/A'}</TableCell>
                {isAdmin && <TableCell className="max-w-48 truncate text-muted-foreground">{offer.createdById || 'Unknown'}</TableCell>}
                <TableCell>
                  <div className="flex min-w-max items-center gap-1">
                    {!offer.documentUrl ? <Button variant="ghost" size="sm" loading={generatingPdf === offer.id} onClick={() => void handleGeneratePDF(offer.id)}><FileText className="h-3.5 w-3.5" aria-hidden="true" />Generate PDF</Button> : <Button variant="ghost" size="sm" loading={downloadingPdf === offer.id} onClick={() => void handleDownloadPDF(offer.id, offer.offerNumber)}><Download className="h-3.5 w-3.5" aria-hidden="true" />Download</Button>}
                    <PermissionGuard module="offers" action="delete"><Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" loading={deletingOffer === offer.id} onClick={() => setOfferPendingDelete(offer)}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Delete</Button></PermissionGuard>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={Boolean(offerPendingDelete)} onOpenChange={(open) => { if (!open && !deletingOffer) setOfferPendingDelete(null) }}>
        <DialogContent><DialogHeader><DialogTitle>Delete offer letter?</DialogTitle><DialogDescription>This permanently deletes {offerPendingDelete?.offerNumber || 'this offer letter'}. This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setOfferPendingDelete(null)} disabled={Boolean(deletingOffer)}>Cancel</Button><Button variant="destructive" loading={Boolean(deletingOffer)} onClick={() => void handleDelete()}>{deletingOffer ? 'Deleting...' : 'Delete offer'}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  )
}

function OffersTableSkeleton() {
  return <div className="space-y-4 rounded-lg border border-border p-5" aria-label="Loading offer letters" aria-busy="true"><Skeleton className="h-5 w-40" />{[0, 1, 2, 3].map((row) => <div key={row} className="grid grid-cols-[1fr_1fr_8rem] gap-6 border-t border-border pt-4"><Skeleton className="h-9" /><Skeleton className="h-9" /><Skeleton className="h-9" /></div>)}</div>
}
