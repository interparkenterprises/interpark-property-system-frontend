import type { AnalyticsApiFailure, TenantsSummary } from '@/types/analytics'
import { formatPercent, InfoTip } from '../AnalyticsCore'
import { LeftReasonChart } from '../charts/LeftReasonChart'
import { OverviewPanel } from './OverviewPanel'

const integer = new Intl.NumberFormat('en-KE')

export function TenantMovementPanel({ data, loading, error, onRetry }: {
  data?: TenantsSummary
  loading: boolean
  error?: AnalyticsApiFailure
  onRetry: () => void
}) {
  return (
    <OverviewPanel title="Tenant movement" description="Current tenants, departures and recorded reasons for leaving." href="/analytics/tenants" loading={loading} error={error} onRetry={onRetry} contentClassName="space-y-4">
      {data ? (
        <>
          <dl className="grid grid-cols-3 gap-2">
            <div className="min-w-0 rounded-md bg-muted/45 p-3"><dt className="truncate text-xs text-muted-foreground">Current</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{integer.format(data.currentTenants)}</dd></div>
            <div className="min-w-0 rounded-md bg-muted/45 p-3"><dt className="truncate text-xs text-muted-foreground">Former</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{integer.format(data.formerTenants)}</dd></div>
            <div className="min-w-0 rounded-md bg-muted/45 p-3"><dt className="truncate text-xs text-muted-foreground">Churn<InfoTip text="Former tenants as a share of all tenants recorded over time." /></dt><dd className="mt-1 truncate text-lg font-semibold tabular-nums">{formatPercent(data.churnRate)}</dd></div>
          </dl>
          <div className="h-64 min-w-0"><LeftReasonChart data={data.byLeftReason} /></div>
        </>
      ) : <p className="py-16 text-center text-sm text-muted-foreground">No tenant movement data is available.</p>}
    </OverviewPanel>
  )
}
