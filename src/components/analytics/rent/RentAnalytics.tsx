import type { AnalyticsFilters, MetricDefinition } from '@/types/analytics'
import type { AnalyticsDashboardData } from '../types'
import { CohortVsCashPanel, RevenueSection } from '../AnalyticsCore'
import { RentMetrics } from './RentMetrics'
import { ChartPanel } from '../charts/ChartPanel'
import { CollectionsTrendChart } from '../charts/CollectionsTrendChart'
import { ReceivablesTrendChart } from '../charts/ReceivablesTrendChart'
import { RevenueByPropertyChart } from '../charts/RevenueByPropertyChart'
import { StatusDistributionChart } from '../charts/StatusDistributionChart'

export function RentAnalytics({ data, filters, definitions }: {
  data: AnalyticsDashboardData
  filters: AnalyticsFilters
  definitions?: Record<string, MetricDefinition>
}) {
  const summary = data.overview?.receivables || data.receivables
  return (
    <>
      {summary && <RentMetrics summary={summary} filters={filters} />}
      <FinancialAnalyticsDetails data={data} definitions={definitions} />
    </>
  )
}

export function FinancialAnalyticsDetails({ data, definitions }: {
  data: AnalyticsDashboardData
  definitions?: Record<string, MetricDefinition>
}) {
  const summary = data.overview?.receivables || data.receivables
  const hasFinancialRecords = Boolean(summary && (summary.invoiceCount > 0 || summary.openInvoiceCount > 0))
  return (
    <>
      {data.cohortCash && <CohortVsCashPanel data={data.cohortCash} />}
      {data.collections && data.receivablesTrend && data.status && (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartPanel title="Recorded collection trend" subtitle="PaymentReport cash by datePaid; credit and prepaid rows excluded" tooltip="Money actually received, grouped by payment date. Compare with the receivables trend: one follows cash, the other follows invoices."><CollectionsTrendChart data={data.collections} /></ChartPanel>
          <ChartPanel title="Receivables trend" subtitle="Invoice values grouped by due date; gold line = collection rate" tooltip="Bars are billed and outstanding per period; the line shows how much of each period's billing was eventually allocated."><ReceivablesTrendChart data={data.receivablesTrend} /></ChartPanel>
          <ChartPanel title="Paid, partial and unpaid invoices" subtitle="Invoice counts; cancelled invoices excluded" tooltip="A growing partial/overdue share means tenants are paying late or incompletely — check the aging report next."><StatusDistributionChart data={data.status} /></ChartPanel>
          <ChartPanel title="Allocated collections by property" subtitle="Top properties: billed vs allocated collections" tooltip="Billed bars include uncollected amounts; the gap between the two bars is that property's uncollected receivables."><RevenueByPropertyChart data={data.revenue || []} /></ChartPanel>
        </div>
      )}
      {data.revenue && <RevenueSection data={data.revenue} definitions={definitions} />}
      {!hasFinancialRecords && !data.collections?.length && !data.revenue?.length && (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">No supported financial records matched this range. Values above are supported empty-dataset results, not placeholders.</div>
      )}
    </>
  )
}
