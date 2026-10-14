import type { OccupancySummary, TenantsSummary } from '@/types/analytics'
import { OccupancyMetrics } from './OccupancyMetrics'

export function OccupancyAnalytics({ occupancy, tenants }: { occupancy: OccupancySummary; tenants: TenantsSummary }) {
  return <OccupancyMetrics occupancy={occupancy} tenants={tenants} />
}
