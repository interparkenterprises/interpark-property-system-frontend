import { AlertTriangle, Building2, CircleDollarSign, Info, Landmark, Percent, ReceiptText, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CohortVsCash, MetricDefinition, PropertyRevenue } from '@/types/analytics'
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InteractiveMetricCard } from '@/components/ui/interactive-metric-card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const money = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 })
const number = new Intl.NumberFormat('en-KE')

export const formatMoney = (value: number | null | undefined) => value == null ? 'Not available' : money.format(value)
export const formatCompactMoney = (value: number | null | undefined) => value == null ? 'Not available' : formatCompactKes(value)
export const formatPercent = (value: number | null | undefined) => value == null ? 'Not available' : `${value.toFixed(2)}%`
export const exactMoneyTitle = (value: number | null | undefined) => value == null ? undefined : formatExactKes(value)

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <Info aria-label="More information" className="h-3.5 w-3.5 cursor-help text-muted-foreground transition-colors group-hover:text-primary" />
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-md border border-border bg-card p-3 text-xs font-normal leading-relaxed text-card-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  )
}

export function DefinitionTip({ definitions, metricKey }: { definitions?: Record<string, MetricDefinition>; metricKey: string }) {
  const definition = definitions?.[metricKey]
  if (!definition) return null
  return <InfoTip text={`${definition.description} (basis: ${definition.basis}, axis: ${definition.axis})`} />
}

export function Explain({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Alert variant="info">
      <Info className="absolute left-4 top-3.5 h-4 w-4 text-primary" aria-hidden="true" />
      <div className="pl-6">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{children}</AlertDescription>
      </div>
    </Alert>
  )
}

type MetricTone = 'sky' | 'emerald' | 'amber' | 'rose'

const metricIcons: Record<MetricTone, LucideIcon> = {
  sky: ReceiptText,
  emerald: CircleDollarSign,
  amber: Percent,
  rose: Landmark,
}

export function MetricCard({ label, value, detail, href, fullValueTitle, tooltip, tone = 'sky' }: {
  label: string
  value: string
  detail?: string
  href?: string
  fullValueTitle?: string
  tooltip?: string
  tone?: MetricTone
}) {
  const Icon = metricIcons[tone]
  return (
    <InteractiveMetricCard
      title={label}
      value={<span title={fullValueTitle}>{value}</span>}
      description={detail || tooltip ? <>{detail}{tooltip && <InfoTip text={tooltip} />}</> : undefined}
      icon={<Icon className="h-5 w-5" />}
      href={href}
    />
  )
}

function MiniStat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/25 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
    </div>
  )
}

export function CohortVsCashPanel({ data }: { data: CohortVsCash }) {
  const rows = [
    ['Billed (invoices due in range)', data.cohort.billed],
    ['Allocated to those invoices', data.cohort.allocated],
    ['Cash collected (by date paid)', data.cash.collected],
    ['Excluded credit / prepaid', data.cash.excludedCredit + data.cash.excludedPrepaid],
    ['Outstanding snapshot (as of)', data.snapshot.outstanding],
  ] as const

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">Cohort vs cash<InfoTip text="Cohort metrics follow invoices. Cash metrics follow payment dates. They answer different questions, so totals are expected to differ." /></CardTitle>
        <CardDescription>Invoice-cohort receivables and payment-date collections reconciled in one call as of {data.snapshot.asOf}.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <ul className="space-y-2">
          {rows.map(([label, value]) => (
            <li key={label} className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold tabular-nums text-foreground">{formatMoney(value)}</span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MiniStat label="Cohort collection rate" value={formatPercent(data.cohort.collectionRate)} detail={`${number.format(data.cohort.invoiceCount)} invoice(s)`} />
          <MiniStat label="Cash transactions" value={number.format(data.cash.transactionCount)} detail="Credit and prepaid excluded" />
          <MiniStat label="Open invoices (snapshot)" value={number.format(data.snapshot.openInvoiceCount)} detail={`Arrears ${formatCompactMoney(data.snapshot.arrears)}`} />
          <MiniStat label="Invoices vs cash gap" value={formatMoney(data.cash.collected - data.cohort.allocated)} detail="Collections on invoices due outside the range" />
        </div>
      </CardContent>
    </Card>
  )
}

export function DataQualityNotices({ values }: { values: Record<string, boolean | number | string | null>[] }) {
  const merged = Object.assign({}, ...values)
  const notices: string[] = []
  if (merged.excludedCancelledInvoices) notices.push('Cancelled invoices are excluded from all financial metrics.')
  if (Number(merged.excludedCreditCount) > 0 || Number(merged.excludedPrepaidCount) > 0) notices.push(`${Number(merged.excludedCreditCount) || 0} credit and ${Number(merged.excludedPrepaidCount) || 0} prepaid payment records were excluded from cash trends.`)
  if (Number(merged.occupiedWithoutTenant) > 0) notices.push(`${merged.occupiedWithoutTenant} occupied unit(s) have no linked ACTIVE tenant record.`)
  if (Number(merged.vacantWithTenant) > 0) notices.push(`${merged.vacantWithTenant} vacant unit(s) still have an ACTIVE tenant linked.`)
  if (Number(merged.formerTenantsOnOccupiedUnits) > 0) notices.push(`${merged.formerTenantsOnOccupiedUnits} former tenant(s) are still tied to occupied units (informational).`)
  if (Number(merged.leftTenantsMissingLeftAt) > 0) notices.push(`${merged.leftTenantsMissingLeftAt} LEFT tenant(s) are missing a leftAt timestamp — backfill recommended.`)
  if (merged.contractedChargesOnly) notices.push('Service-provider values are configured contracted charges, not invoices, payments, or actual expenses.')
  if (merged.amountsAreDocumentSnapshots) notices.push('Demand-letter amounts are document snapshots. Current arrears continue to come from rent invoices.')
  if (merged.billOverdueIsNotRentArrears) notices.push('Overdue Bill Invoice balances are utility-bill receivables, not rent arrears. Current rent arrears use Invoice.')
  if (merged.propertyAttributionUnavailable) notices.push('This source has no reliable property relationship, so results are restricted to organization or manager scope.')
  if (merged.paidAmountIsDocumentStatusValue) notices.push('Paid Other Income is the value of documents marked PAID; partial cash collection is unavailable.')
  if (merged.configuredSalaryNotNormalized) notices.push('Configured salaries are not normalized across daily, weekly, bi-weekly, and monthly frequencies.')
  if (Number(merged.excludedNonKesRecords) > 0) notices.push(`${merged.excludedNonKesRecords} non-KES record(s) were excluded to prevent mixed-currency totals.`)
  if (!notices.length) return null

  return (
    <Alert variant="warning">
      <AlertTriangle className="absolute left-4 top-3.5 h-4 w-4 text-warning" aria-hidden="true" />
      <div className="pl-6">
        <AlertTitle>Data-quality notes</AlertTitle>
        <div className="mt-2 text-sm leading-5 text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">{notices.map(notice => <li key={notice}>{notice}</li>)}</ul>
        </div>
      </div>
    </Alert>
  )
}

export function RevenueTable({ data }: { data: PropertyRevenue[] }) {
  if (!data.length) return null
  return (
    <Table>
      <TableHead>
        <TableHeader>Property</TableHeader>
        <TableHeader className="text-right">Billed</TableHeader>
        <TableHeader className="text-right">Paid</TableHeader>
        <TableHeader className="text-right">Outstanding</TableHeader>
        <TableHeader className="text-right">Rate</TableHeader>
        <TableHeader className="text-right">Invoices</TableHeader>
      </TableHead>
      <TableBody>
        {data.map(row => (
          <TableRow key={row.propertyId}>
            <TableCell className="font-medium">{row.propertyName}</TableCell>
            <TableCell className="text-right tabular-nums">{formatMoney(row.billed)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatMoney(row.paid)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatMoney(row.outstanding)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatPercent(row.collectionRate)}</TableCell>
            <TableCell className="text-right tabular-nums">{number.format(row.invoiceCount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function RevenueSection({ data, definitions }: { data: PropertyRevenue[]; definitions?: Record<string, MetricDefinition> }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start gap-3">
        <div className="rounded-md bg-primary/10 p-2 text-primary"><Building2 className="h-5 w-5" /></div>
        <div>
          <CardTitle className="flex items-center">Revenue by property<DefinitionTip definitions={definitions} metricKey="paid" /></CardTitle>
          <CardDescription>Backend-calculated invoice metrics for the active scope.</CardDescription>
        </div>
      </CardHeader>
      <CardContent><RevenueTable data={data} /></CardContent>
    </Card>
  )
}

export function Freshness({ generatedAt, definition }: { generatedAt: string; definition: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Info className="h-3.5 w-3.5" aria-hidden="true" />
      Live data generated {new Date(generatedAt).toLocaleString('en-KE')} · Metric definitions v{definition}
    </p>
  )
}

export function TenantMetricIcon() {
  return <UsersRound className="h-5 w-5" />
}
