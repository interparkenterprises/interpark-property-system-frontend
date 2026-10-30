import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { AgingBucket, BillInvoiceSummary, ComprehensiveInvoiceSummary, InvoicePerformanceMetrics, RentInvoiceSummary } from '@/types/analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { exactMoneyTitle, formatCompactMoney, formatPercent, InfoTip } from '../../AnalyticsCore'
import type { DomainConfig } from '../types'

const integer = new Intl.NumberFormat('en-KE')

function Money({ value, className }: { value: number | null; className?: string }) {
  return <span className={className} title={exactMoneyTitle(value)}>{formatCompactMoney(value)}</span>
}

export function ConsolidatedInvoiceSummary({ summary, definition }: { summary: ComprehensiveInvoiceSummary; definition: DomainConfig }) {
  return (
    <section className="space-y-3" aria-labelledby="invoice-summary-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="invoice-summary-heading" className="text-lg font-semibold text-foreground">Summary</h2><p className="text-sm text-muted-foreground">Combined rent and bill invoice position for the selected reporting scope.</p></div>
        <Link href={definition.drill} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Open source records <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Invoice summary</CardTitle>
          <CardDescription>Backend-calculated billing, allocation and outstanding balances.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total invoiced</dt><dd className="mt-1 truncate text-2xl font-semibold tabular-nums text-foreground"><Money value={summary.totalAmount} /></dd></div>
            <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total paid</dt><dd className="mt-1 truncate text-2xl font-semibold tabular-nums text-foreground"><Money value={summary.totalPaid} /></dd></div>
            <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total outstanding</dt><dd className="mt-1 truncate text-2xl font-semibold tabular-nums text-foreground"><Money value={summary.totalOutstanding} /></dd></div>
          </dl>
          <div className="grid gap-4 border-t border-border pt-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">Overall collection rate</span><span className="font-semibold tabular-nums text-foreground">{formatPercent(summary.overallCollectionRate)}</span></div>
              {summary.overallCollectionRate != null ? <Progress value={summary.overallCollectionRate} max={100} label="Overall invoice collection rate" /> : <div className="h-2 rounded-full bg-muted" aria-label="Collection rate unavailable" />}
            </div>
            <div className="min-w-32 md:border-l md:border-border md:pl-4"><p className="text-xs text-muted-foreground">Invoices</p><p className="mt-1 text-lg font-semibold tabular-nums">{integer.format(summary.totalInvoices)}</p></div>
            <div className="min-w-32 md:border-l md:border-border md:pl-4"><p className="text-xs text-muted-foreground">Total overdue</p><p className="mt-1 truncate text-lg font-semibold tabular-nums text-destructive"><Money value={summary.totalOverdue} /></p></div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function InvoiceTypePanel({ title, data }: { title: string; data: RentInvoiceSummary | BillInvoiceSummary | null }) {
  return (
    <Card className="h-full min-w-0">
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>Invoice totals and backend collection performance.</CardDescription></CardHeader>
      <CardContent>
        {data ? (
          <>
            <div className="mb-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Invoice count</p><p className="mt-1 text-2xl font-semibold tabular-nums">{integer.format(data.count)}</p></div>
            <dl className="divide-y divide-border rounded-md border border-border">
              {[
                ['Total amount', data.amount],
                ['Paid', data.paid],
                ['Outstanding', data.outstanding],
                ['Overdue', data.overdue],
              ].map(([label, raw]) => (
                <div key={label} className="flex min-w-0 items-center justify-between gap-4 px-4 py-2.5"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="truncate text-sm font-semibold tabular-nums text-foreground"><Money value={raw as number} /></dd></div>
              ))}
              <div className="space-y-2 px-4 py-3"><div className="flex items-center justify-between gap-4"><dt className="text-sm text-muted-foreground">Collection rate</dt><dd className="text-sm font-semibold tabular-nums text-foreground">{formatPercent(data.collectionRate)}</dd></div>{data.collectionRate != null && <Progress value={data.collectionRate} max={100} label={`${title} collection rate`} />}</div>
            </dl>
          </>
        ) : <p className="py-12 text-center text-sm text-muted-foreground">No {title.toLowerCase()} data is available.</p>}
      </CardContent>
    </Card>
  )
}

export function InvoiceBreakdownPanels({ rent, bill }: { rent: RentInvoiceSummary | null; bill: BillInvoiceSummary | null }) {
  if (!rent && !bill) return null
  return (
    <section className="space-y-3" aria-labelledby="invoice-breakdown-heading">
      <div><h2 id="invoice-breakdown-heading" className="text-lg font-semibold text-foreground">Rent vs bill invoice breakdown</h2><p className="text-sm text-muted-foreground">The two invoice categories retain their separate accounting definitions.</p></div>
      <div className="grid gap-4 md:grid-cols-2"><InvoiceTypePanel title="Rent invoices" data={rent} /><InvoiceTypePanel title="Bill invoices" data={bill} /></div>
    </section>
  )
}

export function PaymentPerformancePanel({ performance }: { performance?: InvoicePerformanceMetrics }) {
  if (!performance) return null
  const metrics = [
    { label: 'Average days to pay', value: performance.paymentVelocity.overall == null ? 'Not available' : `${performance.paymentVelocity.overall} days`, title: undefined },
    { label: 'On-time payment rate', value: formatPercent(performance.onTimePaymentRate.rentInvoices), title: 'Rent invoices paid on time' },
    { label: 'Average rent invoice', value: formatCompactMoney(performance.averageInvoiceAmount.rentInvoices), title: exactMoneyTitle(performance.averageInvoiceAmount.rentInvoices) },
    { label: 'Average bill invoice', value: formatCompactMoney(performance.averageInvoiceAmount.billInvoices), title: exactMoneyTitle(performance.averageInvoiceAmount.billInvoices) },
  ]
  return (
    <section className="space-y-3" aria-labelledby="payment-performance-heading">
      <h2 id="payment-performance-heading" className="text-lg font-semibold text-foreground">Payment performance</h2>
      <Card>
        <CardHeader><CardTitle className="flex items-center">Payment performance metrics<InfoTip text="Payment velocity, on-time performance and average invoice values are calculated by the backend from the selected invoice cohort." /></CardTitle><CardDescription>Payment speed and typical invoice values.</CardDescription></CardHeader>
        <CardContent><dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(item => <div key={item.label} className="min-w-0 border-b border-border pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5 lg:last:border-r-0"><dt className="text-xs text-muted-foreground">{item.label}</dt><dd className="mt-1 truncate text-xl font-semibold tabular-nums text-foreground" title={item.title}>{item.value}</dd></div>)}</dl></CardContent>
      </Card>
    </section>
  )
}

const agingColors = ['var(--chart-2)', 'var(--chart-1)', 'var(--chart-3)', 'var(--chart-4)', 'var(--destructive)']

function AgingDistribution({ buckets }: { buckets: AgingBucket[] }) {
  const total = buckets.reduce((sum, bucket) => sum + Math.max(0, bucket.amount), 0)
  return (
    <div className="space-y-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Aging distribution across ${buckets.length} buckets`}>
        {total > 0 && buckets.map((bucket, index) => <span key={bucket.label} title={`${bucket.label}: ${exactMoneyTitle(bucket.amount)}`} style={{ width: `${(Math.max(0, bucket.amount) / total) * 100}%`, backgroundColor: agingColors[index % agingColors.length] }} />)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {buckets.map((bucket, index) => (
          <div key={bucket.label} className="min-w-0">
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: agingColors[index % agingColors.length] }} aria-hidden="true" /><p className="truncate text-xs text-muted-foreground">{bucket.label}</p></div>
            <p className="mt-1 truncate text-sm font-semibold tabular-nums text-foreground" title={exactMoneyTitle(bucket.amount)}>{formatCompactMoney(bucket.amount)}</p>
            <p className="text-xs text-muted-foreground">{integer.format(bucket.count)} invoice(s)</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function InvoiceAgingPanel({ aging }: { aging?: { rentInvoices: AgingBucket[]; billInvoices: AgingBucket[]; combined: AgingBucket[] } }) {
  if (!aging?.combined?.length) return null
  return (
    <section className="space-y-3" aria-labelledby="aging-summary-heading">
      <h2 id="aging-summary-heading" className="text-lg font-semibold text-foreground">Aging summary</h2>
      <Card>
        <CardHeader><CardTitle>Outstanding balance aging</CardTitle><CardDescription>Backend aging buckets at the selected as-of date.</CardDescription></CardHeader>
        <CardContent>
          <Tabs defaultValue="combined">
            <TabsList aria-label="Invoice aging views">
              <TabsTrigger value="combined">Combined</TabsTrigger>
              <TabsTrigger value="rent">Rent</TabsTrigger>
              <TabsTrigger value="bill">Bills</TabsTrigger>
            </TabsList>
            <TabsContent value="combined"><AgingDistribution buckets={aging.combined} /></TabsContent>
            <TabsContent value="rent"><AgingDistribution buckets={aging.rentInvoices} /></TabsContent>
            <TabsContent value="bill"><AgingDistribution buckets={aging.billInvoices} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  )
}
