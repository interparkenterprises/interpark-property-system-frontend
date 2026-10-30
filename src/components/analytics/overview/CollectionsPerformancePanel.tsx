import type { AnalyticsApiFailure, ReceivablesSummary, ReceivablesTrendPoint } from '@/types/analytics'
import { exactMoneyTitle, formatCompactMoney, formatPercent, InfoTip } from '../AnalyticsCore'
import { CollectionsPerformanceChart } from '../charts/CollectionsPerformanceChart'
import { OverviewPanel } from './OverviewPanel'

function Metric({ label, value, title, help }: { label: string; value: string; title?: string; help?: string }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/45 p-3">
      <p className="truncate text-xs text-muted-foreground">{label}{help && <InfoTip text={help} />}</p>
      <p className="mt-1 truncate text-lg font-semibold tabular-nums text-foreground sm:text-xl" title={title}>{value}</p>
    </div>
  )
}

export function CollectionsPerformancePanel({ summary, trend, loading, error, onRetry, className }: {
  summary?: ReceivablesSummary
  trend?: ReceivablesTrendPoint[]
  loading: boolean
  error?: AnalyticsApiFailure
  onRetry: () => void
  className?: string
}) {
  return (
    <OverviewPanel
      title="Collections performance"
      description="Rent billed and payments allocated to invoices due in the selected period."
      href="/analytics/rent"
      loading={loading}
      error={error}
      onRetry={onRetry}
      className={className}
      contentClassName="space-y-5"
    >
      {summary && trend ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric label="Billed rent" value={formatCompactMoney(summary.billed)} title={exactMoneyTitle(summary.billed)} />
            <Metric label="Allocated payments" value={formatCompactMoney(summary.paid)} title={exactMoneyTitle(summary.paid)} help="Payments allocated to invoices due in this period." />
            <Metric label="Collection rate" value={formatPercent(summary.collectionRate)} help="Allocated payments divided by billed rent for the selected invoice cohort." />
          </div>
          <div className="h-72 min-w-0"><CollectionsPerformanceChart data={trend} /></div>
        </>
      ) : <p className="py-16 text-center text-sm text-muted-foreground">No collections data matched these filters.</p>}
    </OverviewPanel>
  )
}
