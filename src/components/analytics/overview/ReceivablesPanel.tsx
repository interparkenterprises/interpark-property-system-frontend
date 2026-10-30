import type { AnalyticsApiFailure, ReceivablesStatusDistribution, ReceivablesSummary } from '@/types/analytics'
import { exactMoneyTitle, formatCompactMoney, InfoTip } from '../AnalyticsCore'
import { StatusDistributionChart } from '../charts/StatusDistributionChart'
import { OverviewPanel } from './OverviewPanel'

export function ReceivablesPanel({ summary, status, loading, error, onRetry }: {
  summary?: ReceivablesSummary
  status?: ReceivablesStatusDistribution
  loading: boolean
  error?: AnalyticsApiFailure
  onRetry: () => void
}) {
  return (
    <OverviewPanel
      title="Unpaid rent"
      description="Open receivables and overdue balances at the selected period end."
      href="/analytics/rent"
      loading={loading}
      error={error}
      onRetry={onRetry}
      contentClassName="space-y-5"
    >
      {summary && status ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 rounded-md bg-muted/45 p-3">
              <p className="text-xs text-muted-foreground">Outstanding<InfoTip text="All unpaid balances for invoices due in the selected period." /></p>
              <p className="mt-1 truncate text-lg font-semibold tabular-nums" title={exactMoneyTitle(summary.outstanding)}>{formatCompactMoney(summary.outstanding)}</p>
            </div>
            <div className="min-w-0 rounded-md bg-destructive/8 p-3">
              <p className="text-xs text-muted-foreground">Arrears<InfoTip text="The overdue portion of outstanding rent as of the selected period end." /></p>
              <p className="mt-1 truncate text-lg font-semibold tabular-nums text-destructive" title={exactMoneyTitle(summary.arrears)}>{formatCompactMoney(summary.arrears)}</p>
            </div>
          </div>
          <div className="h-72 min-w-0"><StatusDistributionChart data={status} /></div>
        </>
      ) : <p className="py-16 text-center text-sm text-muted-foreground">No receivables data matched these filters.</p>}
    </OverviewPanel>
  )
}
