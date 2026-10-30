'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, FileText, ReceiptText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { useBreadcrumbOverride, useBreadcrumbRouteTrail } from '@/components/layout/BreadcrumbContext'
import { WhatsAppSendButton } from '@/components/tenant/WhatsAppSendButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { billInvoicesAPI, demandLettersAPI, invoicesAPI, paymentsAPI, tenantsAPI } from '@/lib/api'
import { formatExactKes } from '@/lib/numberFormat'
import { BillInvoice, DemandLetter, Invoice, PaymentReport, PermissionCode, Tenant } from '@/types'
import { useWhatsApp } from '@/hooks/useWhatsApp'

export type TenantFinancialPageKind = 'invoices' | 'payment-reports' | 'bill-invoices' | 'demand-letters' | 'overdue-invoices'

type Row = Invoice | PaymentReport | BillInvoice | DemandLetter

const pageMeta: Record<TenantFinancialPageKind, { title: string; description: string; empty: string }> = {
  invoices: { title: 'Invoices', description: 'Rent invoices, balances and payment status for this tenant.', empty: 'No invoices found' },
  'payment-reports': { title: 'Payment reports', description: 'Recorded rent payments and the balances they produced.', empty: 'No payment reports found' },
  'bill-invoices': { title: 'Bill invoices', description: 'Utility and service bill invoices issued to this tenant.', empty: 'No bill invoices found' },
  'demand-letters': { title: 'Demand letters', description: 'Demand notices generated for outstanding tenant balances.', empty: 'No demand letters found' },
  'overdue-invoices': { title: 'Overdue invoices', description: 'Invoices with an outstanding balance beyond their due date.', empty: 'No overdue invoices found' },
}

function saveBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

function statusAppearance(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'destructive' {
  if (status === 'PAID' || status === 'SETTLED' || status === 'ACKNOWLEDGED') return 'success'
  if (status === 'PARTIAL' || status === 'DRAFT') return 'warning'
  if (status === 'UNPAID' || status === 'OVERDUE' || status === 'ESCALATED') return 'destructive'
  if (status === 'GENERATED' || status === 'SENT') return 'info'
  return 'neutral'
}

export function TenantFinancialPage({ kind }: { kind: TenantFinancialPageKind }) {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string
  const tenantDetailsHref = `/properties/${tenantId}/tenant-details`
  const meta = pageMeta[kind]
  const { permissions, isAdmin, isManager, hasPermission } = useGlobalPermissions()
  const { downloadAllPaymentReports } = useWhatsApp()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [receiptByInvoiceId, setReceiptByInvoiceId] = useState<Map<string, PaymentReport>>(new Map())
  const [partialReport, setPartialReport] = useState<PaymentReport | null>(null)
  const [partialDueDate, setPartialDueDate] = useState('')
  const [partialNotes, setPartialNotes] = useState('')
  const [payingBillInvoice, setPayingBillInvoice] = useState<BillInvoice | null>(null)
  const [billPaymentAmount, setBillPaymentAmount] = useState('')
  const [downloadingAll, setDownloadingAll] = useState(false)

  const canView = isAdmin || isManager || ({
    invoices: hasPermission(PermissionCode.VIEW_INVOICES) || hasPermission(PermissionCode.CREATE_INVOICES) || hasPermission(PermissionCode.DOWNLOAD_INVOICES),
    'payment-reports': hasPermission(PermissionCode.VIEW_PAYMENT_REPORTS) || hasPermission(PermissionCode.RECORD_PAYMENTS),
    'bill-invoices': hasPermission(PermissionCode.VIEW_BILL_INVOICES),
    'demand-letters': hasPermission(PermissionCode.VIEW_DEMAND_LETTERS) || hasPermission(PermissionCode.SEND_DEMAND_LETTERS) || hasPermission(PermissionCode.AUTO_GENERATE_DEMAND_LETTER) || hasPermission(PermissionCode.DOWNLOAD_DEMAND_LETTER),
    'overdue-invoices': hasPermission(PermissionCode.VIEW_OVERDUE_INVOICES),
  } satisfies Record<TenantFinancialPageKind, boolean>)[kind]

  const canDelete = isAdmin || isManager || (kind === 'invoices'
    ? hasPermission(PermissionCode.DELETE_INVOICES)
    : kind === 'payment-reports'
      ? hasPermission(PermissionCode.DELETE_PAYMENT_RECORDS)
      : kind === 'bill-invoices'
        ? hasPermission(PermissionCode.DELETE_BILL_INVOICE)
        : false)
  const canCreateInvoices = isAdmin || isManager || hasPermission(PermissionCode.CREATE_INVOICES)
  const canPayBillInvoices = isAdmin || isManager || permissions.billInvoices.canEdit
  const canDownload = isAdmin || isManager || ({
    invoices: hasPermission(PermissionCode.DOWNLOAD_INVOICES),
    'payment-reports': hasPermission(PermissionCode.VIEW_PAYMENT_REPORTS),
    'bill-invoices': hasPermission(PermissionCode.DOWNLOAD_BILL_INVOICE),
    'demand-letters': hasPermission(PermissionCode.DOWNLOAD_DEMAND_LETTER),
    'overdue-invoices': hasPermission(PermissionCode.DOWNLOAD_INVOICES),
  } satisfies Record<TenantFinancialPageKind, boolean>)[kind]

  const tenantWorkspaceHref = tenant?.unit?.propertyId ? `/properties/${tenant.unit.propertyId}?tab=tenants` : '/properties'
  useBreadcrumbOverride(`/properties/${tenantId}`, loading ? 'Loading…' : tenant?.unit?.property?.name ?? 'Property details', tenant?.unit?.propertyId ? `/properties/${tenant.unit.propertyId}` : '/properties')
  useBreadcrumbRouteTrail([
    { label: 'Tenants', href: tenantWorkspaceHref },
    { label: loading ? 'Loading…' : tenant?.fullName ?? 'Tenant details', href: tenantDetailsHref },
    { label: meta.title },
  ], `/properties/${tenantId}`, tenantDetailsHref)

  const load = useCallback(async () => {
    if (!canView) {
      router.replace('/unauthorized')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const tenantRecord = await tenantsAPI.getById(tenantId)
      setTenant(tenantRecord)
      if (kind === 'invoices') {
        setRows((await invoicesAPI.getInvoicesByTenant(tenantId)).data)
        const reports = await paymentsAPI.getPaymentsByTenant(tenantId)
        const receipts = new Map<string, PaymentReport>()
        reports.forEach((report) => {
          if (report.receiptUrl || report.receiptNumber) report.invoices?.forEach((invoice) => receipts.set(invoice.id, report))
        })
        setReceiptByInvoiceId(receipts)
      }
      if (kind === 'payment-reports') setRows(await paymentsAPI.getPaymentsByTenant(tenantId))
      if (kind === 'bill-invoices') setRows((await billInvoicesAPI.getByTenant(tenantId)).data)
      if (kind === 'demand-letters') setRows((await demandLettersAPI.getAll({ tenantId })).data)
      if (kind === 'overdue-invoices') setRows((await demandLettersAPI.getOverdueInvoices(tenantId)).invoices)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : `Failed to load ${meta.title.toLowerCase()}`
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [canView, kind, meta.title, router, tenantId])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(needle))
  }, [query, rows])

  async function download(row: Row) {
    try {
      setBusyId(row.id)
      if (kind === 'invoices' || kind === 'overdue-invoices') {
        const invoice = row as Invoice
        saveBlob(await invoicesAPI.downloadInvoice(invoice.id), `${invoice.invoiceNumber}.pdf`)
      } else if (kind === 'payment-reports') {
        const report = row as PaymentReport
        saveBlob(await paymentsAPI.downloadReceipt(report.id), `${report.receiptNumber || 'receipt'}.pdf`)
      } else if (kind === 'bill-invoices') {
        const invoice = row as BillInvoice
        saveBlob(await billInvoicesAPI.download(invoice.id), `${invoice.invoiceNumber}.pdf`)
      } else {
        const letter = row as DemandLetter
        saveBlob(await demandLettersAPI.downloadPDF(letter.id), `${letter.letterNumber}.pdf`)
      }
      toast.success('Download started')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Download failed')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(row: Row) {
    if (!canDelete || !window.confirm('Delete this record? This action cannot be undone.')) return
    try {
      setBusyId(row.id)
      if (kind === 'invoices') await invoicesAPI.deleteInvoice(row.id)
      if (kind === 'payment-reports') await paymentsAPI.deletePaymentReport(row.id, {
        deleteLinkedInvoices: true,
        deleteBillInvoices: false,
        deleteIncome: true,
        force: false,
      })
      if (kind === 'bill-invoices') await billInvoicesAPI.deleteBillInvoice(row.id)
      setRows((current) => current.filter((item) => item.id !== row.id))
      toast.success('Record deleted')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  async function downloadReceipt(report: PaymentReport) {
    try {
      setBusyId(report.id)
      saveBlob(await paymentsAPI.downloadReceipt(report.id), `${report.receiptNumber || 'receipt'}.pdf`)
      toast.success('Receipt download started')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Receipt download failed')
    } finally {
      setBusyId(null)
    }
  }

  function openPartialInvoice(report: PaymentReport) {
    setPartialReport(report)
    setPartialDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    setPartialNotes(`Balance invoice for ${report.paymentPeriod}`)
  }

  async function generatePartialInvoice() {
    if (!partialReport || !partialDueDate) return
    try {
      setBusyId(partialReport.id)
      await invoicesAPI.generateFromPartialPayment({ paymentReportId: partialReport.id, dueDate: partialDueDate, notes: partialNotes })
      toast.success('Balance invoice generated')
      setPartialReport(null)
      await load()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Failed to generate balance invoice')
    } finally {
      setBusyId(null)
    }
  }

  async function recordBillInvoicePayment() {
    if (!payingBillInvoice) return
    const amount = Number(billPaymentAmount)
    const remaining = payingBillInvoice.grandTotal - payingBillInvoice.amountPaid
    if (!Number.isFinite(amount) || amount <= 0 || amount > remaining + 0.01) {
      toast.error(`Enter an amount up to ${formatExactKes(remaining)}`)
      return
    }
    try {
      setBusyId(payingBillInvoice.id)
      await billInvoicesAPI.recordPayment(payingBillInvoice.id, {
        amountPaid: amount,
        paymentDate: new Date().toISOString().split('T')[0],
        notes: `Payment recorded for bill invoice ${payingBillInvoice.invoiceNumber}`,
      })
      toast.success('Payment recorded')
      setPayingBillInvoice(null)
      setBillPaymentAmount('')
      await load()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Failed to record payment')
    } finally {
      setBusyId(null)
    }
  }

  async function downloadPaymentReport() {
    if (!tenant) return
    try {
      setDownloadingAll(true)
      const result = await downloadAllPaymentReports(tenant.id, tenant.fullName)
      if (!result.success) throw new Error(result.message || 'Failed to download payment report')
      toast.success('Payment report downloaded')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Failed to download payment report')
    } finally {
      setDownloadingAll(false)
    }
  }

  if (loading) return <TenantFinancialPageLoading />

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={`${tenant?.fullName ?? 'Tenant'} · ${meta.title}`}
        description={meta.description}
        leading={<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><ReceiptText className="size-5" /></div>}
        actions={<>
          {kind === 'payment-reports' && canDownload && <Button disabled={downloadingAll || rows.length === 0} onClick={() => void downloadPaymentReport()}><Download className="size-4" />Download report</Button>}
          {kind === 'payment-reports' && tenant && rows.length > 0 && <WhatsAppSendButton tenantId={tenant.id} documentType="All Payment Reports" tenantPhone={tenant.contact} size="sm" showLabel />}
          <Button variant="outline" onClick={() => router.push(tenantDetailsHref)}><ArrowLeft className="size-4" />Tenant details</Button>
        </>}
      />

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${meta.title.toLowerCase()}…`} className="sm:max-w-sm" />
            <p className="text-sm text-muted-foreground">{filteredRows.length} {filteredRows.length === 1 ? 'record' : 'records'}</p>
          </div>

          {error ? (
            <EmptyState title={`Unable to load ${meta.title.toLowerCase()}`} description={error} action={<Button onClick={() => void load()}>Try again</Button>} />
          ) : filteredRows.length === 0 ? (
            <EmptyState icon={FileText} title={meta.empty} description="Records will appear here when they are available." />
          ) : (
            <FinancialTable kind={kind} rows={filteredRows} tenant={tenant} busyId={busyId} receiptByInvoiceId={receiptByInvoiceId} canDelete={canDelete} canDownload={canDownload} canCreateInvoices={canCreateInvoices} canPayBillInvoices={canPayBillInvoices} onDownload={download} onDownloadReceipt={downloadReceipt} onDelete={remove} onPartialInvoice={openPartialInvoice} onPayBillInvoice={(invoice) => { setPayingBillInvoice(invoice); setBillPaymentAmount(String(Math.max(0, invoice.grandTotal - invoice.amountPaid))) }} />
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(partialReport)} onOpenChange={(open) => !open && setPartialReport(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate balance invoice</DialogTitle><DialogDescription>Create the remaining invoice for {partialReport?.paymentPeriod}.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label htmlFor="partial-due-date">Due date</Label><Input id="partial-due-date" type="date" value={partialDueDate} onChange={(event) => setPartialDueDate(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="partial-notes">Notes</Label><Textarea id="partial-notes" value={partialNotes} onChange={(event) => setPartialNotes(event.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPartialReport(null)}>Cancel</Button><Button disabled={!partialDueDate || busyId === partialReport?.id} onClick={() => void generatePartialInvoice()}>Generate invoice</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(payingBillInvoice)} onOpenChange={(open) => !open && setPayingBillInvoice(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record bill invoice payment</DialogTitle><DialogDescription>Record a payment against {payingBillInvoice?.invoiceNumber}.</DialogDescription></DialogHeader>
          <div className="space-y-2 py-2"><Label htmlFor="bill-payment-amount">Amount paid</Label><Input id="bill-payment-amount" type="number" min="0.01" step="0.01" value={billPaymentAmount} onChange={(event) => setBillPaymentAmount(event.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setPayingBillInvoice(null)}>Cancel</Button><Button disabled={!billPaymentAmount || busyId === payingBillInvoice?.id} onClick={() => void recordBillInvoicePayment()}>Record payment</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FinancialTable({ kind, rows, tenant, busyId, receiptByInvoiceId, canDelete, canDownload, canCreateInvoices, canPayBillInvoices, onDownload, onDownloadReceipt, onDelete, onPartialInvoice, onPayBillInvoice }: {
  kind: TenantFinancialPageKind
  rows: Row[]
  tenant: Tenant | null
  busyId: string | null
  receiptByInvoiceId: Map<string, PaymentReport>
  canDelete: boolean
  canDownload: boolean
  canCreateInvoices: boolean
  canPayBillInvoices: boolean
  onDownload: (row: Row) => void
  onDownloadReceipt: (report: PaymentReport) => void
  onDelete: (row: Row) => void
  onPartialInvoice: (report: PaymentReport) => void
  onPayBillInvoice: (invoice: BillInvoice) => void
}) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Reference</TableHeader>
        <TableHeader>Period / type</TableHeader>
        <TableHeader>Date</TableHeader>
        <TableHeader className="text-right">Amount</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader className="text-right">Actions</TableHeader>
      </TableHead>
      <TableBody>
        {rows.map((row) => {
          const display = rowDisplay(kind, row)
          return (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{display.reference}</TableCell>
              <TableCell>{display.period}</TableCell>
              <TableCell>{display.date ? new Date(display.date).toLocaleDateString() : '—'}</TableCell>
              <TableCell className="text-right font-medium" title={formatExactKes(display.amount)}>{formatExactKes(display.amount)}</TableCell>
              <TableCell><Badge variant={statusAppearance(display.status)}>{display.status}</Badge></TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  {tenant && (kind === 'invoices' || kind === 'demand-letters') && (
                    <WhatsAppSendButton tenantId={tenant.id} documentType={kind === 'invoices' ? 'Invoice' : 'Demand Letter'} documentId={row.id} tenantPhone={tenant.contact} size="sm" />
                  )}
                  {kind === 'payment-reports' && canCreateInvoices && (row as PaymentReport).status === 'PARTIAL' && (row as PaymentReport).arrears > 0 && (
                    <Button size="sm" variant="outline" onClick={() => onPartialInvoice(row as PaymentReport)}>Balance invoice</Button>
                  )}
                  {kind === 'bill-invoices' && canPayBillInvoices && (row as BillInvoice).balance > 0 && (
                    <Button size="sm" variant="outline" onClick={() => onPayBillInvoice(row as BillInvoice)}>Record payment</Button>
                  )}
                  {canDownload && <Button size="sm" variant="outline" disabled={busyId === row.id} onClick={() => onDownload(row)} aria-label={`Download ${display.reference}`}><Download className="size-4" /></Button>}
                  {kind === 'invoices' && receiptByInvoiceId.has(row.id) && (
                    <Button size="sm" variant="outline" disabled={busyId === receiptByInvoiceId.get(row.id)?.id} onClick={() => { const report = receiptByInvoiceId.get(row.id); if (report) onDownloadReceipt(report) }}>Receipt</Button>
                  )}
                  {canDelete && (kind === 'invoices' || kind === 'payment-reports' || kind === 'bill-invoices') && (
                    <Button size="sm" variant="outline" disabled={busyId === row.id} onClick={() => onDelete(row)} aria-label={`Delete ${display.reference}`} className="text-destructive hover:text-destructive"><Trash2 className="size-4" /></Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function rowDisplay(kind: TenantFinancialPageKind, row: Row) {
  if (kind === 'payment-reports') {
    const report = row as PaymentReport
    return { reference: report.receiptNumber || report.id.slice(0, 8), period: report.paymentPeriod, date: report.datePaid, amount: report.amountPaid, status: report.status }
  }
  if (kind === 'bill-invoices') {
    const invoice = row as BillInvoice
    return { reference: invoice.invoiceNumber, period: invoice.billType, date: invoice.issueDate, amount: invoice.grandTotal, status: invoice.status }
  }
  if (kind === 'demand-letters') {
    const letter = row as DemandLetter
    return { reference: letter.letterNumber, period: letter.rentalPeriod, date: letter.issueDate, amount: letter.outstandingAmount, status: letter.status }
  }
  const invoice = row as Invoice
  return { reference: invoice.invoiceNumber, period: invoice.paymentPeriod, date: invoice.issueDate, amount: kind === 'overdue-invoices' ? invoice.balance : invoice.totalDue, status: invoice.status }
}

function TenantFinancialPageLoading() {
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><Skeleton className="h-16 w-full" /><Skeleton className="h-96 w-full" /></div>
}
