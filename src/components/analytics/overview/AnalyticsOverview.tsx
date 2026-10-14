import type { AnalyticsFilters, OccupancySummary, TenantsSummary } from '@/types/analytics'
import type { AnalyticsDashboardData } from '../types'
import { Explain } from '../AnalyticsCore'
import { FinancialAnalyticsDetails } from '../rent/RentAnalytics'
import { RentMetrics } from '../rent/RentMetrics'
import { OccupancyMetrics } from '../occupancy/OccupancyMetrics'

export function AnalyticsOverview({ data, filters, occupancy, tenants }: {
  data: AnalyticsDashboardData
  filters: AnalyticsFilters
  occupancy?: OccupancySummary
  tenants?: TenantsSummary
}) {
  return (
    <>
      <Explain title="How to read this dashboard">
        <strong className="text-foreground">Billed</strong> and <strong className="text-foreground">paid</strong> follow invoices due in the range; <strong className="text-foreground">recorded collections</strong> follow the date money was received. They answer different questions, so they will not match. The cohort-vs-cash panel reconciles them. Hover any information icon for the exact metric definition.
      </Explain>
      {data.overview?.receivables && <RentMetrics summary={data.overview.receivables} filters={filters} />}
      {occupancy && tenants && <OccupancyMetrics occupancy={occupancy} tenants={tenants} />}
      <FinancialAnalyticsDetails data={data} definitions={data.meta[0]?.definitions} />
    </>
  )
}
