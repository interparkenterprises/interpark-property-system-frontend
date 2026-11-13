'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Download, FileText, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { GenerateCommissionInvoiceDialog, type CommissionInvoiceFormData } from '@/components/my-income/GenerateCommissionInvoiceDialog'
import { CommissionPerformancePanel } from '@/components/my-income/IncomeAnalyticalPanels'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonStyles } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { commissionsAPI } from '@/lib/api'
import type { CommissionStats, CommissionStatus, GenerateCommissionInvoiceRequest, ManagerCommission } from '@/types'

type CommissionFilter = 'all' | 'pending' | 'paid' | 'processing'
const STORAGE_KEY = 'invoiceFormData'
const defaultInvoiceValues: CommissionInvoiceFormData = { description: '', vatRate: 16, bankName: '', accountName: '', accountNumber: '', branch: '', bankCode: '', swiftCode: '', currency: 'KES' }

function formatDate(value: string) { return new Date(value).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }) }
function formatCurrency(value: number) { return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(value) }
function statusAppearance(status: CommissionStatus) {
  if (status === 'PAID') return 'success' as const
  if (status === 'PENDING') return 'warning' as const
  if (status === 'PROCESSING') return 'info' as const
  return 'destructive' as const
}

function CommissionTableSkeleton() {
  return <div className="space-y-3 rounded-lg border border-border p-4">{[0, 1, 2, 3].map(row => <div key={row} className="grid grid-cols-4 gap-4"><Skeleton className="h-5" /><Skeleton className="h-5" /><Skeleton className="h-5" /><Skeleton className="h-5" /></div>)}</div>
}

export default function MyIncomePage() {
  const { user } = useAuth()
  const userId = user?.id
  const [commissions, setCommissions] = useState<ManagerCommission[]>([])
  const [stats, setStats] = useState<CommissionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<CommissionFilter>('all')
  const [updatingCommission, setUpdatingCommission] = useState<string | null>(null)
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null)
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedCommissionForInvoice, setSelectedCommissionForInvoice] = useState<string | null>(null)
  const [invoiceFormData, setInvoiceFormData] = useState(defaultInvoiceValues)
  const loadedOnce = useRef(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    const frame = window.requestAnimationFrame(() => {
      try { setInvoiceFormData(current => ({ ...current, ...JSON.parse(saved), description: '' })) } catch { /* Ignore invalid persisted data. */ }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])
  useEffect(() => { if (showInvoiceModal) localStorage.setItem(STORAGE_KEY, JSON.stringify(invoiceFormData)) }, [invoiceFormData, showInvoiceModal])

  const fetchIncomeData = useCallback(async (fullLoading = false) => {
    if (!userId) return
    if (fullLoading) setLoading(true); else setTableLoading(true)
    setError(null)
    try {
      const [commissionResponse, statsResponse] = await Promise.all([commissionsAPI.getManagerCommissions(userId), commissionsAPI.getCommissionStats(userId)])
      const records = commissionResponse?.data || []
      setCommissions(selectedPeriod === 'all' ? records : records.filter(record => record.status === selectedPeriod.toUpperCase()))
      setStats(statsResponse)
      loadedOnce.current = true
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch income data')
    } finally {
      setLoading(false); setTableLoading(false)
    }
  }, [selectedPeriod, userId])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void fetchIncomeData(!loadedOnce.current))
    return () => window.cancelAnimationFrame(frame)
  }, [fetchIncomeData])

  const openInvoiceModal = (commission: ManagerCommission) => {
    let persisted = invoiceFormData
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) { try { persisted = { ...persisted, ...JSON.parse(saved) } } catch { /* Ignore invalid persisted data. */ } }
    setSelectedCommissionForInvoice(commission.id)
    setInvoiceFormData({ ...persisted, description: `Management commission for ${commission.property?.name || 'property'} (${formatDate(commission.periodStart)} - ${formatDate(commission.periodEnd)})`, accountName: persisted.accountName || user?.name || '' })
    setShowInvoiceModal(true)
  }

  const generateInvoice = async () => {
    if (!selectedCommissionForInvoice) return
    setGeneratingInvoice(selectedCommissionForInvoice)
    try {
      const request: GenerateCommissionInvoiceRequest = { ...invoiceFormData, branch: invoiceFormData.branch || undefined, bankCode: invoiceFormData.bankCode || undefined, swiftCode: invoiceFormData.swiftCode || undefined }
      await commissionsAPI.generateCommissionInvoice(selectedCommissionForInvoice, request)
      toast.success('Commission invoice generated successfully.')
      setShowInvoiceModal(false); setSelectedCommissionForInvoice(null)
      await fetchIncomeData(false)
    } catch (invoiceError) {
      toast.error(invoiceError instanceof Error ? invoiceError.message : 'Unable to generate the commission invoice. Please try again.')
    } finally { setGeneratingInvoice(null) }
  }

  const markAsPaid = async (id: string) => {
    setUpdatingCommission(id)
    try { await commissionsAPI.markAsPaid(id); await fetchIncomeData(false) }
    catch (updateError) { alert(updateError instanceof Error ? updateError.message : 'Failed to update commission status') }
    finally { setUpdatingCommission(null) }
  }

  const downloadInvoice = async (id: string) => {
    setDownloadingInvoice(id)
    try {
      const blob = await commissionsAPI.downloadCommissionInvoice(id)
      const url = URL.createObjectURL(blob); const link = document.createElement('a')
      link.href = url; link.download = `commission-invoice-${id}.pdf`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url)
      toast.success('Commission invoice download initiated.')
    } catch (downloadError) { toast.error(downloadError instanceof Error ? downloadError.message : 'Unable to download the commission invoice. Please try again.') }
    finally { setDownloadingInvoice(null) }
  }

  if (loading) return <div className="flex min-h-64 items-center justify-center"><CommissionTableSkeleton /></div>

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader title="My income" description="Track your commission earnings and other income." actions={<Link href="/myIncome/other" className={buttonStyles({ variant: 'outline', size: 'sm' })}>Other income</Link>} />
      <div className="flex gap-2 border-b border-border pb-2"><Link href="/myIncome" className={buttonStyles({ size: 'sm' })}>Commission history</Link><Link href="/myIncome/other" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>Other income</Link></div>
      {error && <Alert variant="destructive"><AlertTitle>Unable to load commission income</AlertTitle><AlertDescription>{error}</AlertDescription><Button className="mt-3" variant="outline" size="sm" onClick={() => void fetchIncomeData(true)}><RefreshCw className="size-4" />Retry</Button></Alert>}

      {stats && <CommissionPerformancePanel stats={stats} />}

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3"><CardTitle>Commission history</CardTitle><div className="flex flex-wrap gap-2">{(['all', 'pending', 'processing', 'paid'] as const).map(filter => <Button key={filter} size="sm" variant={selectedPeriod === filter ? 'default' : 'outline'} onClick={() => setSelectedPeriod(filter)} className="capitalize">{filter}</Button>)}</div></CardHeader>
        <CardContent>
          {tableLoading ? <CommissionTableSkeleton /> : commissions.length === 0 ? <EmptyState title="No commissions found" description={selectedPeriod === 'all' ? "You don't have any commissions yet." : `No ${selectedPeriod} commissions found.`} /> : (
            <Table className="min-w-[1080px]"><TableHead><TableHeader>Property</TableHeader><TableHeader>Period</TableHeader><TableHeader className="text-right">Income amount</TableHeader><TableHeader className="text-right">Commission rate</TableHeader><TableHeader className="text-right">Commission</TableHeader><TableHeader>Status</TableHeader><TableHeader>Paid date</TableHeader><TableHeader>Actions</TableHeader></TableHead>
              <TableBody>{commissions.map(commission => <TableRow key={commission.id}>
                <TableCell className="min-w-52 whitespace-normal"><p className="font-medium">{commission.property?.name || 'Unknown Property'}</p><p className="text-xs text-muted-foreground">{commission.property?.address}</p></TableCell>
                <TableCell>{formatDate(commission.periodStart)} – {formatDate(commission.periodEnd)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(commission.incomeAmount)}</TableCell><TableCell className="text-right tabular-nums">{commission.commissionFee}%</TableCell><TableCell className="text-right font-semibold tabular-nums">{formatCurrency(commission.commissionAmount)}</TableCell>
                <TableCell><StatusBadge status={commission.status} appearance={statusAppearance(commission.status)} /></TableCell><TableCell>{commission.paidDate ? formatDate(commission.paidDate) : '—'}</TableCell>
                <TableCell><div className="flex flex-wrap gap-1">{commission.status === 'PENDING' && <Button size="sm" variant="outline" onClick={() => openInvoiceModal(commission)}><FileText className="size-4" />Generate invoice</Button>}{commission.status === 'PROCESSING' && <><Button size="sm" variant="outline" onClick={() => void markAsPaid(commission.id)} loading={updatingCommission === commission.id}>Mark as paid</Button><Button size="sm" variant="outline" onClick={() => void downloadInvoice(commission.id)} loading={downloadingInvoice === commission.id}><Download className="size-4" />Download</Button></>}{commission.status === 'PAID' && <span className="text-xs text-muted-foreground">Completed</span>}</div></TableCell>
              </TableRow>)}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {stats?.commissionsByProperty?.length ? <Card><CardHeader><CardTitle>Commission by property</CardTitle></CardHeader><CardContent className="divide-y divide-border">{stats.commissionsByProperty.map(property => <div key={property.propertyId} className="flex items-center justify-between gap-4 py-3 text-sm"><span>{property.propertyName}</span><span className="font-semibold tabular-nums">{formatCurrency(property.totalCommission)}</span></div>)}</CardContent></Card> : null}

      <GenerateCommissionInvoiceDialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal} values={invoiceFormData} onChange={setInvoiceFormData} onSubmit={() => void generateInvoice()} submitting={Boolean(generatingInvoice)} />
    </div>
  )
}
