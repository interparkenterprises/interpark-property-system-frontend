import type { PropertyRevenue } from '@/types/analytics'
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat'
import { RankedComparison } from '@/components/ui/ranked-comparison'
import { AnalyticsEmpty } from '../AnalyticsStates'

const percent = (value: number | null) => value == null ? 'Not available' : `${value.toFixed(1)}%`

export function RevenueByPropertyChart({ data }: { data: PropertyRevenue[] }) {
  if (!data.length) return <AnalyticsEmpty title="No property revenue" detail="No invoice activity matched the selected filters." />

  return (
    <RankedComparison
      items={[...data].sort((a, b) => b.paid - a.paid).map(row => ({
        id: row.propertyId,
        label: row.propertyName,
        values: {
          billed: { value: row.billed, display: formatCompactKes(row.billed), title: formatExactKes(row.billed) },
          paid: { value: row.paid, display: formatCompactKes(row.paid), title: formatExactKes(row.paid) },
          rate: { value: row.collectionRate, display: percent(row.collectionRate) },
        },
      }))}
      columns={[{ key: 'billed', label: 'Billed' }, { key: 'paid', label: 'Allocated', emphasized: true }, { key: 'rate', label: 'Rate' }]}
      bars={[{ key: 'billed', color: 'color-mix(in srgb, var(--primary) 22%, transparent)' }, { key: 'paid', color: 'var(--primary)' }]}
      barMode="overlay"
      labelHeading="Property"
    />
  )
}
