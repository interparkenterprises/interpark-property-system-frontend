import Link from 'next/link'
import { ArrowUpRight, BarChart3, CircleDollarSign, Gauge, ReceiptText, UsersRound } from 'lucide-react'
import type { AgingBucket, BillInvoiceSummary, DomainDistributionItem, DomainTrendPoint, InvoicePerformanceMetrics, RentInvoiceSummary } from '@/types/analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartPanel } from '../charts/ChartPanel'
import { exactMoneyTitle, Explain, formatCompactMoney, formatMoney, formatPercent } from '../AnalyticsCore'
import { CategoryDistributionChart, DomainStatusChart, DomainTrendChart, PropertyBreakdownChart, TenantAdditionsChart } from './DomainCharts'
import { moneyMetricPattern } from './domainConfig'
import type { DomainConfig, LifecycleView, PropertyBreakdownRow } from './types'

const number = new Intl.NumberFormat('en-KE')

function displayMetric(key: string, value: number | null) {
  if (value == null) return { value: 'Not available' }
  if (/rate|percent/i.test(key)) return { value: formatPercent(value) }
  if (moneyMetricPattern.test(key)) return { value: formatCompactMoney(value), title: exactMoneyTitle(value) }
  return { value: number.format(value) }
}

export function DomainSummary({ summary, definition }: { summary: Record<string, unknown>; definition: DomainConfig }) {
  const metrics = Object.entries(summary).filter(([, value]) => typeof value !== 'object' || value === null)
  if (!metrics.length) return null
  return (
    <section className="space-y-3" aria-labelledby="domain-summary-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="domain-summary-heading" className="text-lg font-semibold text-foreground">Summary</h2>
          <p className="text-sm text-muted-foreground">Backend-calculated metrics for the selected reporting scope.</p>
        </div>
        <Link href={definition.drill} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Open source records <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([key, raw]) => {
          const formatted = displayMetric(key, raw as number | null)
          return (
            <StatCard
              key={key}
              label={definition.labels[key] || key.replace(/([A-Z])/g, ' $1').trim()}
              value={<span title={formatted.title} className="block min-w-0 truncate tabular-nums">{formatted.value}</span>}
              icon={moneyMetricPattern.test(key) ? <CircleDollarSign className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
              tone={moneyMetricPattern.test(key) ? 'success' : 'info'}
            />
          )
        })}
      </div>
    </section>
  )
}

export function TenantLifecycleSection({ lifecycle }: { lifecycle: LifecycleView }) {
  const metrics = [
    ['Total tenants', number.format(lifecycle.summary.totalTenants), 'All tenant records'],
    ['Active tenants', number.format(lifecycle.summary.activeTenants), 'Currently active'],
    ['Churned tenants', number.format(lifecycle.summary.churnedTenants), 'No longer active'],
    ['Retention rate', formatPercent(lifecycle.summary.cumulativeRetentionRate), `Period: ${formatPercent(lifecycle.summary.periodRetentionRate)}`],
    ['Average rent', formatCompactMoney(lifecycle.summary.averageRent), `Avg tenure ${lifecycle.summary.averageTenureDays ?? '—'} days`],
    ['Total deposits', formatCompactMoney(lifecycle.summary.totalDeposits), 'All deposits held'],
    ['Tenants with arrears', number.format(lifecycle.tenantsWithArrears), 'Currently past due'],
    ['Paying tenants', number.format(lifecycle.payingTenants), 'Have recorded payments'],
    ['Average invoice balance', formatCompactMoney(lifecycle.averageInvoiceBalance), 'Across arrears holders'],
  ] as const
  return (
    <section className="space-y-4" aria-labelledby="tenant-lifecycle-heading">
      <div>
        <h2 id="tenant-lifecycle-heading" className="text-lg font-semibold text-foreground">Tenant lifecycle overview</h2>
        <p className="text-sm text-muted-foreground">Retention, arrears exposure, payments and tenant additions.</p>
      </div>
      <Explain title="Reading the lifecycle numbers">
        Retention is shown two ways: <strong className="text-foreground">cumulative</strong> covers every tenant record ever, while <strong className="text-foreground">period</strong> covers only the selected window. “Paying tenants” have recorded payments; “tenants with arrears” currently hold a past-due balance.
      </Explain>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, description]) => <StatCard key={label} label={label} value={value} description={description} icon={<UsersRound className="h-5 w-5" />} tone="info" />)}
      </div>
      {lifecycle.newTenantsTrend.length > 0 && (
        <ChartPanel title="New tenants trend" subtitle="Tenant additions per period"><TenantAdditionsChart data={lifecycle.newTenantsTrend} /></ChartPanel>
      )}
    </section>
  )
}

function InvoiceSummary({ title, data }: { title: string; data: RentInvoiceSummary | BillInvoiceSummary | null }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>Invoice totals and collection performance.</CardDescription></CardHeader>
      <CardContent>
        {data ? (
          <dl className="grid grid-cols-2 gap-3">
            {[
              ['Count', number.format(data.count)], ['Amount', formatCompactMoney(data.amount)],
              ['Paid', formatCompactMoney(data.paid)], ['Outstanding', formatCompactMoney(data.outstanding)],
              ['Overdue', formatCompactMoney(data.overdue)], ['Collection rate', formatPercent(data.collectionRate)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-muted/40 p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 min-w-0 truncate text-lg font-semibold tabular-nums text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        ) : <p className="text-sm text-muted-foreground">No {title.toLowerCase()} data available.</p>}
      </CardContent>
    </Card>
  )
}

export function InvoiceDetailSections({ rent, bill, performance, aging }: {
  rent: RentInvoiceSummary | null
  bill: BillInvoiceSummary | null
  performance?: InvoicePerformanceMetrics
  aging?: { rentInvoices: AgingBucket[]; billInvoices: AgingBucket[]; combined: AgingBucket[] }
}) {
  return (
    <>
      {(rent || bill) && (
        <section className="space-y-3" aria-labelledby="invoice-breakdown-heading">
          <h2 id="invoice-breakdown-heading" className="text-lg font-semibold text-foreground">Rent vs bill invoice breakdown</h2>
          <div className="grid gap-4 sm:grid-cols-2"><InvoiceSummary title="Rent invoices" data={rent} /><InvoiceSummary title="Bill invoices" data={bill} /></div>
        </section>
      )}
      {performance && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Avg days to pay" value={performance.paymentVelocity.overall != null ? `${performance.paymentVelocity.overall} days` : 'Not available'} description="Overall payment velocity" icon={<Gauge className="h-5 w-5" />} tone="info" />
          <StatCard label="On-time payment rate" value={formatPercent(performance.onTimePaymentRate.rentInvoices)} description="Rent invoices paid on time" icon={<Gauge className="h-5 w-5" />} tone="success" />
          <StatCard label="Avg rent invoice" value={formatCompactMoney(performance.averageInvoiceAmount.rentInvoices)} description="Average amount" icon={<ReceiptText className="h-5 w-5" />} tone="warning" />
          {performance.averageInvoiceAmount.billInvoices != null && <StatCard label="Avg bill invoice" value={formatCompactMoney(performance.averageInvoiceAmount.billInvoices)} description="Average amount" icon={<ReceiptText className="h-5 w-5" />} tone="warning" />}
        </div>
      )}
      {aging?.combined?.length ? <AgingSummary aging={aging} /> : null}
    </>
  )
}

function AgingSummary({ aging }: { aging: { rentInvoices: AgingBucket[]; billInvoices: AgingBucket[]; combined: AgingBucket[] } }) {
  const row = (title: string, buckets: AgingBucket[]) => buckets.length ? (
    <div>
      <p className="mb-2 text-sm font-medium text-muted-foreground">{title}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {buckets.map(bucket => <div key={bucket.label} className="rounded-md bg-muted/30 p-2 text-center"><p className="text-xs text-muted-foreground">{bucket.label}</p><p className="truncate text-sm font-semibold tabular-nums text-foreground" title={exactMoneyTitle(bucket.amount)}>{formatCompactMoney(bucket.amount)}</p>{title === 'Combined aging' && <p className="text-xs text-muted-foreground">{bucket.count} invoice(s)</p>}</div>)}
      </div>
    </div>
  ) : null
  return (
    <Card>
      <CardHeader><CardTitle>Aging summary</CardTitle><CardDescription>How long outstanding balances have been unpaid. Older buckets need faster follow-up.</CardDescription></CardHeader>
      <CardContent className="space-y-4">{row('Combined aging', aging.combined)}{row('Rent aging', aging.rentInvoices)}{row('Bill aging', aging.billInvoices)}</CardContent>
    </Card>
  )
}

export function DomainChartsSection({ trend, status, categories, properties, showProperties }: {
  trend: DomainTrendPoint[]
  status: DomainDistributionItem[]
  categories: DomainDistributionItem[]
  properties: PropertyBreakdownRow[]
  showProperties: boolean
}) {
  return (
    <>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartPanel title="Trend" subtitle="Values grouped by the reporting period"><DomainTrendChart data={trend} /></ChartPanel>
        <ChartPanel title="Status distribution" subtitle="Counts by record status"><DomainStatusChart data={status} /></ChartPanel>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartPanel title="Category distribution" subtitle="Amounts by category"><CategoryDistributionChart data={categories} /></ChartPanel>
        {showProperties && <ChartPanel title="Top properties" subtitle="Highest to lowest value in the selected range"><PropertyBreakdownChart data={properties} /></ChartPanel>}
      </div>
    </>
  )
}

export function PropertyComparison({ data }: { data: PropertyBreakdownRow[] }) {
  if (!data.length) return null
  return (
    <Card>
      <CardHeader><CardTitle>Property comparison and drill-down</CardTitle><CardDescription>Rent invoice and bill invoice amounts by property.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        <Table>
          <TableHead>
            <TableHeader>Property</TableHeader><TableHeader className="text-right">Invoice amount</TableHeader><TableHeader className="text-right">Bill amount</TableHeader><TableHeader className="text-right">Total amount</TableHeader><TableHeader className="text-right">Records</TableHeader><TableHeader><span className="sr-only">Action</span></TableHeader>
          </TableHead>
          <TableBody>
            {data.map(item => (
              <TableRow key={item.propertyId}>
                <TableCell className="font-medium">{item.propertyName}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(item.rentAmount)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(item.billAmount)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatMoney(item.totalAmount)}</TableCell>
                <TableCell className="text-right tabular-nums">{number.format(item.totalCount)}</TableCell>
                <TableCell className="text-right"><Link className="font-medium text-primary hover:underline" href={`/properties/${item.propertyId}`}>Open property</Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">Top property by total amount: {data[0]?.propertyName ?? 'N/A'} · Bottom: {data[data.length - 1]?.propertyName ?? 'N/A'}</p>
      </CardContent>
    </Card>
  )
}
