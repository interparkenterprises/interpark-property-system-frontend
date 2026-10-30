'use client'

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { EmptyState } from '@/components/ui/empty-state'
import { RankedComparison } from '@/components/ui/ranked-comparison'
import { SectionHeader } from '@/components/ui/section-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat'
import type {
  CommissionStats,
  InvoiceStatus,
  OtherIncomeListResponse,
  OtherIncomeStatsResponse,
} from '@/types'

const statusColors: Record<string, string> = {
  PAID: 'var(--chart-2)',
  PROCESSING: 'var(--chart-1)',
  PENDING: 'var(--chart-3)',
  PARTIAL: 'var(--chart-4)',
  UNPAID: 'var(--chart-3)',
  OVERDUE: 'var(--destructive)',
  CANCELLED: 'var(--muted-foreground)',
}

interface CompositionItem {
  key: string
  label: string
  amount: number
  count?: number
}

function CompositionBreakdown({ items }: { items: CompositionItem[] }) {
  const visibleItems = items.filter((item) => item.amount > 0 || (item.count ?? 0) > 0)
  const total = visibleItems.reduce((sum, item) => sum + item.amount, 0)

  if (!visibleItems.length) {
    return <p className="text-sm text-muted-foreground">No status composition is available yet.</p>
  }

  return (
    <div className="space-y-3">
      {total > 0 && (
        <div
          className="flex h-2.5 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={visibleItems.map((item) => `${item.label}: ${formatExactKes(item.amount)}`).join(', ')}
        >
          {visibleItems.map((item) => (
            <span
              key={item.key}
              className="h-full min-w-1"
              style={{
                width: `${(item.amount / total) * 100}%`,
                backgroundColor: statusColors[item.key] || 'var(--chart-5)',
              }}
            />
          ))}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => (
          <div key={item.key} className="flex min-w-0 items-center justify-between gap-3 border-b border-border py-2 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: statusColors[item.key] || 'var(--chart-5)' }} />
              <span className="truncate text-muted-foreground">{item.label}</span>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-medium tabular-nums text-foreground" title={formatExactKes(item.amount)}>{formatCompactKes(item.amount)}</div>
              {item.count !== undefined && <div className="text-xs text-muted-foreground">{item.count.toLocaleString()} record{item.count === 1 ? '' : 's'}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SupportingMetric({ label, value, title, description }: { label: string; value: React.ReactNode; title?: string; description?: string }) {
  return (
    <div className="min-w-0 border-t border-border pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tabular-nums text-foreground" title={title}>{value}</p>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

export function CommissionPerformancePanel({ stats }: { stats: CommissionStats }) {
  const composition = [
    { key: 'PAID', label: 'Paid', amount: stats.totalPaid },
    { key: 'PROCESSING', label: 'Processing', amount: stats.totalProcessing },
    { key: 'PENDING', label: 'Pending', amount: stats.totalPending },
  ]

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Commission performance"
          description="Commission amounts grouped by their existing workflow status."
        />
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.6fr)]">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Total earned</p>
          <p className="mt-1 truncate text-3xl font-semibold tracking-tight tabular-nums text-foreground" title={formatExactKes(stats.totalEarned)}>
            {formatCompactKes(stats.totalEarned)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Existing commission-earned figure from the manager statistics endpoint.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <SupportingMetric label="Pending" value={formatCompactKes(stats.totalPending)} title={formatExactKes(stats.totalPending)} description="Awaiting invoice processing" />
            <SupportingMetric label="Processing" value={formatCompactKes(stats.totalProcessing)} title={formatExactKes(stats.totalProcessing)} description="Invoice in progress" />
            <SupportingMetric label="Total paid" value={formatCompactKes(stats.totalPaid)} title={formatExactKes(stats.totalPaid)} description="Commission paid" />
          </div>
        </div>
        <div className="min-w-0 border-t border-border pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <h3 className="text-sm font-semibold text-foreground">Status composition</h3>
          <p className="mt-1 mb-4 text-xs text-muted-foreground">Share of commission value across mutually exclusive statuses.</p>
          <CompositionBreakdown items={composition} />
        </div>
      </CardContent>
    </Card>
  )
}

interface OtherIncomeSummary {
  totalCount: number
  totalAmount: number
  totalVat: number
  unpaidCount: number
}

export function OtherIncomeOverviewPanel({
  summary,
  statusBreakdown,
}: {
  summary: OtherIncomeSummary
  statusBreakdown: OtherIncomeListResponse['statusBreakdown']
}) {
  const composition = statusBreakdown.map((item) => ({
    key: item.status,
    label: item.status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase()),
    amount: Number(item._sum.totalAmount || 0),
    count: item._count,
  }))

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Other income overview"
          description="Authoritative manager totals with the existing invoice-status breakdown."
        />
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.6fr)]">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Total value</p>
          <p className="mt-1 truncate text-3xl font-semibold tracking-tight tabular-nums text-foreground" title={formatExactKes(summary.totalAmount)}>
            {formatCompactKes(summary.totalAmount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Total invoiced other income returned by the existing manager summary.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <SupportingMetric label="Total invoices" value={summary.totalCount.toLocaleString()} />
            <SupportingMetric label="Total VAT" value={formatCompactKes(summary.totalVat)} title={formatExactKes(summary.totalVat)} />
            <SupportingMetric label="Open / overdue" value={summary.unpaidCount.toLocaleString()} description="Current filtered result" />
          </div>
        </div>
        <div className="min-w-0 border-t border-border pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <h3 className="text-sm font-semibold text-foreground">Income status</h3>
          <p className="mt-1 mb-4 text-xs text-muted-foreground">Invoice value and record count from the manager-level status summary.</p>
          <CompositionBreakdown items={composition} />
        </div>
      </CardContent>
    </Card>
  )
}

export function IncomeRecordOverview({
  amount,
  vatAmount,
  totalAmount,
  status,
  dueDate,
  incomeShare,
  attachmentCount,
}: {
  amount: number
  vatAmount: number
  totalAmount: number
  status: InvoiceStatus
  dueDate: string
  incomeShare: string
  attachmentCount: number
}) {
  return (
    <Card>
      <CardHeader>
        <SectionHeader title="Record overview" description="Financial values for this selected income invoice." actions={<StatusBadge status={status} />} />
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.6fr)]">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Invoice total</p>
          <p className="mt-1 truncate text-3xl font-semibold tracking-tight tabular-nums text-foreground" title={formatExactKes(totalAmount)}>{formatCompactKes(totalAmount)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Existing total after the saved VAT treatment.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SupportingMetric label="Original amount" value={formatCompactKes(amount)} title={formatExactKes(amount)} />
          <SupportingMetric label="VAT amount" value={formatCompactKes(vatAmount)} title={formatExactKes(vatAmount)} />
          <SupportingMetric label="Due date" value={dueDate} />
          <SupportingMetric label="Current-year share" value={incomeShare} description="Share of manager other income" />
          <SupportingMetric label="Attachments" value={attachmentCount.toLocaleString()} />
        </div>
      </CardContent>
    </Card>
  )
}

const contextChartConfig = {
  invoiced: { label: 'Invoiced value', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function IncomeContextPanel({
  stats,
  categoryLabels,
}: {
  stats: OtherIncomeStatsResponse['data']
  categoryLabels: Record<string, string>
}) {
  const monthlyData = Object.entries(stats.monthlyData)
    .map(([month, value]) => ({
      month: new Intl.DateTimeFormat('en-KE', { month: 'short' }).format(new Date(2020, Number(month), 1)),
      invoiced: Number(value),
      order: Number(month),
    }))
    .sort((left, right) => left.order - right.order)
  const hasMonthlyData = monthlyData.some((item) => item.invoiced > 0)

  const categoryItems = Object.entries(stats.categoryData)
    .map(([category, value]) => ({
      id: category,
      label: categoryLabels[category] || category.replaceAll('_', ' '),
      values: { amount: { value: Number(value), display: formatCompactKes(Number(value)), title: formatExactKes(Number(value)) } },
    }))
    .filter((item) => (item.values.amount.value || 0) > 0)
    .sort((left, right) => (right.values.amount.value || 0) - (left.values.amount.value || 0))

  const statusItems = Object.entries(stats.statusData)
    .map(([status, value]) => ({
      id: status,
      label: status.replaceAll('_', ' '),
      values: { amount: { value: Number(value), display: formatCompactKes(Number(value)), title: formatExactKes(Number(value)) } },
    }))
    .filter((item) => (item.values.amount.value || 0) > 0)
    .sort((left, right) => (right.values.amount.value || 0) - (left.values.amount.value || 0))

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Income context"
          description="Manager-wide other income issued in the current calendar year. These values are portfolio context, not values for this record alone."
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <SupportingMetric label="Current-year portfolio total" value={formatCompactKes(stats.totalIncome)} title={formatExactKes(stats.totalIncome)} />
          <SupportingMetric label="Current-year invoice count" value={stats.count.toLocaleString()} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)]">
          <div className="min-w-0 border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-foreground">Issued value by month</h3>
            <p className="mt-1 text-xs text-muted-foreground">Invoice total grouped by issue month; it does not represent cash received.</p>
            {hasMonthlyData ? (
              <ChartContainer config={contextChartConfig} className="mt-4 h-64 w-full aspect-auto">
                <LineChart accessibilityLayer data={monthlyData} margin={{ left: 4, right: 12, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => <span className="font-mono font-medium tabular-nums">{formatExactKes(Number(value))}</span>} />} />
                  <Line dataKey="invoiced" type="monotone" stroke="var(--color-invoiced)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ChartContainer>
            ) : (
              <EmptyState className="mt-4 min-h-48" title="No monthly income data" description="No issued income value is available for the current year." />
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            <div className="min-w-0 border-t border-border pt-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Value by category</h3>
              <RankedComparison items={categoryItems} columns={[{ key: 'amount', label: 'Invoiced', emphasized: true }]} bars={[{ key: 'amount', color: 'var(--chart-1)' }]} maxItems={categoryItems.length} labelHeading="Category" emptyMessage="No category totals are available." />
            </div>
            <div className="min-w-0 border-t border-border pt-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Value by status</h3>
              <RankedComparison items={statusItems} columns={[{ key: 'amount', label: 'Invoiced', emphasized: true }]} bars={[{ key: 'amount', color: 'var(--chart-2)' }]} maxItems={statusItems.length} labelHeading="Status" emptyMessage="No status totals are available." />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
