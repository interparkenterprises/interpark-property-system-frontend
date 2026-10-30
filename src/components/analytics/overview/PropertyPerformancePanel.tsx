import type { AnalyticsApiFailure, PropertyRevenue } from '@/types/analytics'
import { RankedComparison } from '@/components/ui/ranked-comparison'
import { exactMoneyTitle, formatCompactMoney } from '../AnalyticsCore'
import { OverviewPanel } from './OverviewPanel'

export function PropertyPerformancePanel({ data, loading, error, onRetry }: {
  data?: PropertyRevenue[]
  loading: boolean
  error?: AnalyticsApiFailure
  onRetry: () => void
}) {
  const ranked = [...(data || [])].sort((a, b) => b.outstanding - a.outstanding).slice(0, 6)
  return (
    <OverviewPanel title="Property performance" description="Highest outstanding balances across the active property scope." href="/analytics/rent" loading={loading} error={error} onRetry={onRetry} contentClassName="space-y-2">
      {ranked.length ? (
        <RankedComparison
          items={ranked.map(row => ({
            id: row.propertyId,
            label: row.propertyName,
            values: {
              billed: { value: row.billed, display: formatCompactMoney(row.billed), title: exactMoneyTitle(row.billed) },
              paid: { value: row.paid, display: formatCompactMoney(row.paid), title: exactMoneyTitle(row.paid) },
              outstanding: { value: row.outstanding, display: formatCompactMoney(row.outstanding), title: exactMoneyTitle(row.outstanding) },
            },
          }))}
          columns={[{ key: 'billed', label: 'Billed' }, { key: 'paid', label: 'Allocated' }, { key: 'outstanding', label: 'Outstanding', emphasized: true }]}
          bars={[{ key: 'billed', color: 'color-mix(in srgb, var(--primary) 22%, transparent)' }, { key: 'paid', color: 'var(--primary)' }]}
          barMode="overlay"
          labelHeading="Property"
          maxItems={6}
        />
      ) : <p className="py-16 text-center text-sm text-muted-foreground">No property performance data matched these filters.</p>}
    </OverviewPanel>
  )
}
