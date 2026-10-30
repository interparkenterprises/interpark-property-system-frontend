import type { AnalyticsFilters, OccupancySummary, TenantsSummary } from '@/types/analytics'
import type { AnalyticsDashboardData, OverviewPanelAccess, OverviewPanelErrors, OverviewPanelLoading } from '../types'
import { CollectionsPerformancePanel } from './CollectionsPerformancePanel'
import { OccupancyPanel } from './OccupancyPanel'
import { PropertyPerformancePanel } from './PropertyPerformancePanel'
import { ReceivablesPanel } from './ReceivablesPanel'
import { TenantMovementPanel } from './TenantMovementPanel'

export function AnalyticsOverview({ data, filters, occupancy, tenants, access, loading, errors, onRetry }: {
  data: AnalyticsDashboardData | null
  filters: AnalyticsFilters
  occupancy?: OccupancySummary
  tenants?: TenantsSummary
  access: OverviewPanelAccess
  loading: OverviewPanelLoading
  errors: OverviewPanelErrors
  onRetry: () => void
}) {
  const receivables = data?.overview?.receivables || data?.receivables

  return (
    <div className="space-y-6">
      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        {access.collections && (
          <CollectionsPerformancePanel
            summary={receivables}
            trend={data?.receivablesTrend}
            loading={loading.collections}
            error={errors.collections}
            onRetry={onRetry}
            className="xl:col-span-2"
          />
        )}
        {access.receivables && (
          <ReceivablesPanel
            summary={receivables}
            status={data?.status}
            loading={loading.receivables}
            error={errors.receivables}
            onRetry={onRetry}
          />
        )}
      </div>
      <div className="grid min-w-0 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {access.occupancy && <OccupancyPanel data={occupancy} asOf={filters.asOf} loading={loading.occupancy} error={errors.occupancy} onRetry={onRetry} />}
        {access.tenants && <TenantMovementPanel data={tenants} loading={loading.tenants} error={errors.tenants} onRetry={onRetry} />}
        {access.properties && <PropertyPerformancePanel data={data?.revenue} loading={loading.properties} error={errors.properties} onRetry={onRetry} />}
      </div>
    </div>
  )
}
