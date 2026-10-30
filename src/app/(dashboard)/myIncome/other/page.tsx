'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { CircleCheck, Download, Eye, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import IncomeFormModal from '@/components/forms/IncomeFormModal'
import { OtherIncomeOverviewPanel } from '@/components/my-income/IncomeAnalyticalPanels'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonStyles } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { FormField } from '@/components/ui/form-field'
import { PageHeader } from '@/components/ui/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { otherIncomeAPI } from '@/lib/api'
import type { InvoiceStatus, OtherIncome, OtherIncomeCategory, OtherIncomeListResponse } from '@/types'

function statusAppearance(status: InvoiceStatus) {
  if (status === 'PAID') return 'success' as const
  if (status === 'UNPAID') return 'warning' as const
  if (status === 'PARTIAL') return 'info' as const
  if (status === 'OVERDUE') return 'destructive' as const
  return 'neutral' as const
}
function formatCurrency(value: number) { return `KSH ${Number(value).toLocaleString('en-KE', { maximumFractionDigits: 3 })}` }
function formatDate(value?: string | null) { return value ? new Date(value).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' }
function IncomeTableSkeleton() { return <div className="space-y-3 rounded-lg border border-border p-4">{[0, 1, 2, 3].map(row => <div key={row} className="grid grid-cols-5 gap-4"><Skeleton className="h-5" /><Skeleton className="h-5" /><Skeleton className="h-5" /><Skeleton className="h-5" /><Skeleton className="h-5" /></div>)}</div> }

export default function OtherIncomePage() {
  const { user } = useAuth()
  const userId = user?.id
  const [incomes, setIncomes] = useState<OtherIncome[]>([])
  const [listStats, setListStats] = useState<OtherIncomeListResponse['stats'] | null>(null)
  const [statusBreakdown, setStatusBreakdown] = useState<OtherIncomeListResponse['statusBreakdown']>([])
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingIncome, setEditingIncome] = useState<OtherIncome | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<OtherIncome | null>(null)
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<OtherIncomeCategory | 'all'>('all')
  const loadedOnce = useRef(false)

  const fetchIncomes = useCallback(async (fullLoading = false) => {
    if (!userId) return
    if (fullLoading) setLoading(true); else setTableLoading(true)
    setError(null)
    try {
      const params: { status?: InvoiceStatus; category?: OtherIncomeCategory } = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (categoryFilter !== 'all') params.category = categoryFilter
      const response = await otherIncomeAPI.getMyIncomes(userId, params)
      setIncomes(response.data || [])
      setListStats(response.stats || null)
      setStatusBreakdown(response.statusBreakdown || [])
      loadedOnce.current = true
    } catch (fetchError) { setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch other incomes') }
    finally { setLoading(false); setTableLoading(false) }
  }, [categoryFilter, statusFilter, userId])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void fetchIncomes(!loadedOnce.current))
    return () => window.cancelAnimationFrame(frame)
  }, [fetchIncomes])

  const deleteIncome = async () => {
    if (!pendingDelete) return
    setDeletingId(pendingDelete.id)
    try { await otherIncomeAPI.delete(pendingDelete.id); setPendingDelete(null); await fetchIncomes(false); alert('Income deleted successfully!') }
    catch (deleteError) { alert(deleteError instanceof Error ? deleteError.message : 'Failed to delete income') }
    finally { setDeletingId(null) }
  }
  const downloadPdf = async (id: string) => {
    setDownloading(id)
    try { const blob = await otherIncomeAPI.downloadInvoice(id); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `other-income-invoice-${id}.pdf`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url) }
    catch (downloadError) { alert(downloadError instanceof Error ? downloadError.message : 'Failed to download invoice') }
    finally { setDownloading(null) }
  }
  const markPaid = async (id: string) => {
    setMarkingPaidId(id)
    try { await otherIncomeAPI.markAsPaid(id); await fetchIncomes(false); alert('Income marked as paid!') }
    catch (statusError) { alert(statusError instanceof Error ? statusError.message : 'Failed to update status') }
    finally { setMarkingPaidId(null) }
  }

  const summary = useMemo(() => ({
    totalCount: listStats?.totalCount ?? incomes.length,
    totalAmount: listStats?.totalAmount ?? incomes.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
    totalVat: listStats?.totalVat ?? incomes.reduce((sum, item) => sum + Number(item.vatAmount || 0), 0),
    unpaidCount: incomes.filter(item => item.status === 'UNPAID' || item.status === 'OVERDUE').length,
  }), [incomes, listStats])

  if (loading) return <div className="flex min-h-64 items-center justify-center"><IncomeTableSkeleton /></div>

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader title="Other income" description="Manage income from consultancy, sales, and other services." actions={<Button size="sm" onClick={() => { setEditingIncome(null); setShowForm(true) }}><Plus className="size-4" />Add income</Button>} />
      <div className="flex gap-2 border-b border-border pb-2"><Link href="/myIncome" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>Commission history</Link><Link href="/myIncome/other" className={buttonStyles({ size: 'sm' })}>Other income</Link></div>

      <OtherIncomeOverviewPanel summary={summary} statusBreakdown={statusBreakdown} />

      {error && <Alert variant="destructive"><AlertTitle>Unable to load other income</AlertTitle><AlertDescription>{error}</AlertDescription><Button className="mt-3" size="sm" variant="outline" onClick={() => void fetchIncomes(true)}><RefreshCw className="size-4" />Retry</Button></Alert>}

      <Card>
        <CardHeader className="gap-4">
          <CardTitle>Other income records</CardTitle>
          <div className="flex flex-wrap items-end gap-4">
            <FormField label="Status"><Select value={statusFilter} onValueChange={value => setStatusFilter(value as InvoiceStatus | 'all')}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{(['UNPAID', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED'] as const).map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></FormField>
            <FormField label="Category"><Select value={categoryFilter} onValueChange={value => setCategoryFilter(value as OtherIncomeCategory | 'all')}><SelectTrigger className="w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{otherIncomeAPI.getCategories().map(category => <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>)}</SelectContent></Select></FormField>
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('all'); setCategoryFilter('all') }}>Clear filters</Button>
          </div>
        </CardHeader>
        <CardContent>
          {tableLoading ? <IncomeTableSkeleton /> : incomes.length === 0 ? <EmptyState title="No other income" description="Add income from consultancy, property sales, or other services." /> : (
            <Table className="min-w-[1180px]"><TableHead><TableHeader>Invoice #</TableHeader><TableHeader>Title / client</TableHeader><TableHeader>Category</TableHeader><TableHeader className="text-right">Amount</TableHeader><TableHeader className="text-right">VAT</TableHeader><TableHeader className="text-right">Total</TableHeader><TableHeader>Status</TableHeader><TableHeader>Date</TableHeader><TableHeader>Actions</TableHeader></TableHead>
              <TableBody>{incomes.map(income => <TableRow key={income.id}>
                <TableCell>{income.invoiceNumber ? <Link href={`/myIncome/other/${income.id}`} className="font-semibold text-primary hover:underline">{income.invoiceNumber}</Link> : <span className="text-muted-foreground">No invoice</span>}</TableCell>
                <TableCell className="min-w-56 whitespace-normal"><p className="font-medium">{income.title}</p><p className="text-xs text-muted-foreground">{income.clientName}</p></TableCell><TableCell>{otherIncomeAPI.getCategoryLabel(income.category)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(income.amount)}</TableCell><TableCell className="text-right tabular-nums">{income.vatType !== 'NOT_APPLICABLE' && income.vatAmount ? formatCurrency(income.vatAmount) : 'N/A'}</TableCell><TableCell className="text-right font-semibold tabular-nums">{formatCurrency(income.totalAmount)}</TableCell>
                <TableCell><StatusBadge status={income.status} appearance={statusAppearance(income.status)} /></TableCell><TableCell>{formatDate(income.issueDate)}</TableCell>
                <TableCell>
                  <div className="flex flex-nowrap items-center gap-1">
                    {income.invoiceNumber && (
                      <Link
                        href={`/myIncome/other/${income.id}`}
                        className={buttonStyles({ variant: 'ghost', size: 'icon', className: 'h-8 w-8 text-sky-600 hover:bg-sky-500/10 hover:text-sky-700 dark:text-sky-400' })}
                        aria-label="View income details"
                        title="View income details"
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </Link>
                    )}
                    {(income.status === 'UNPAID' || income.status === 'PARTIAL') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
                        onClick={() => void markPaid(income.id)}
                        loading={markingPaidId === income.id}
                        aria-label="Mark income as paid"
                        title="Mark income as paid"
                      >
                        {markingPaidId !== income.id && <CircleCheck className="size-4" aria-hidden="true" />}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary"
                      onClick={() => void downloadPdf(income.id)}
                      loading={downloading === income.id}
                      aria-label="Download income PDF"
                      title="Download income PDF"
                    >
                      {downloading !== income.id && <Download className="size-4" aria-hidden="true" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
                      onClick={() => { setEditingIncome(income); setShowForm(true) }}
                      aria-label="Edit income"
                      title="Edit income"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setPendingDelete(income)}
                      disabled={deletingId === income.id}
                      aria-label="Delete income"
                      title="Delete income"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>)}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <IncomeFormModal isOpen={showForm} onClose={() => { setShowForm(false); setEditingIncome(null) }} onSuccess={() => void fetchIncomes(false)} editingIncome={editingIncome} managerId={user?.id || ''} />
      <Dialog open={Boolean(pendingDelete)} onOpenChange={open => { if (!open && !deletingId) setPendingDelete(null) }}><DialogContent><DialogHeader><DialogTitle>Delete other income?</DialogTitle><DialogDescription>This will delete {pendingDelete?.invoiceNumber || pendingDelete?.title}. This action uses the existing deletion request and cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setPendingDelete(null)} disabled={Boolean(deletingId)}>Cancel</Button><Button variant="destructive" onClick={() => void deleteIncome()} loading={Boolean(deletingId)}>Delete income</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
