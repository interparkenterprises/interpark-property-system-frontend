import type { AnalyticsApiFailure, OccupancySummary } from '@/types/analytics'
import { Progress } from '@/components/ui/progress'
import { formatPercent } from '../AnalyticsCore'
import { OverviewPanel } from './OverviewPanel'

const integer = new Intl.NumberFormat('en-KE')

export function OccupancyPanel({ data, asOf, loading, error, onRetry }: {
  data?: OccupancySummary
  asOf: string
  loading: boolean
  error?: AnalyticsApiFailure
  onRetry: () => void
}) {
  return (
    <OverviewPanel title="Occupancy" description={`Current unit status as of ${asOf}.`} href="/analytics/occupancy" loading={loading} error={error} onRetry={onRetry} contentClassName="space-y-5">
      {data ? (
        <>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Occupancy rate</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{formatPercent(data.occupancyRate)}</p>
          </div>
          <Progress value={data.occupiedUnits} max={data.totalUnits} label="Occupied units" className="h-3" />
          <dl className="grid grid-cols-3 divide-x divide-border rounded-md border border-border bg-muted/25 py-3 text-center">
            <div className="min-w-0 px-2"><dt className="text-xs text-muted-foreground">Occupied</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{integer.format(data.occupiedUnits)}</dd></div>
            <div className="min-w-0 px-2"><dt className="text-xs text-muted-foreground">Vacant</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{integer.format(data.vacantUnits)}</dd></div>
            <div className="min-w-0 px-2"><dt className="text-xs text-muted-foreground">Total</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{integer.format(data.totalUnits)}</dd></div>
          </dl>
        </>
      ) : <p className="py-16 text-center text-sm text-muted-foreground">No occupancy data is available.</p>}
    </OverviewPanel>
  )
}
