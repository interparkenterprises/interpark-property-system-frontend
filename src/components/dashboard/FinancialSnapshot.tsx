import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { ReceivablesSummary } from '@/types/analytics'
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface FinancialSnapshotProps {
  data: ReceivablesSummary | null
  authorized: boolean
  loading: boolean
  error: string | null
  canOpenRentAnalytics: boolean
}

interface FinancialMetricProps {
  label: string
  value: React.ReactNode
  description?: string
}

const money = (value: number | undefined) => value == null ? '—' : formatCompactKes(value)

function FinancialMetric({ label, value, description }: FinancialMetricProps) {
  return (
    <div className="flex min-w-0 flex-col rounded-md bg-muted/55 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="kpi-value mt-2 min-w-0 font-semibold text-foreground">{value}</div>
      {description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>}
    </div>
  )
}

export function FinancialSnapshot({ data, authorized, loading, error, canOpenRentAnalytics }: FinancialSnapshotProps) {
  if (!authorized) return null

  const amount = (value: number | undefined) => (
    <span className="block min-w-0 max-w-full [overflow-wrap:anywhere]" title={value == null ? undefined : formatExactKes(value)}>
      {money(value)}
    </span>
  )

  const content = (
    <Card className={canOpenRentAnalytics ? 'relative transition-colors group-hover:border-primary/45 group-hover:bg-card/95' : 'relative'}>
      <CardHeader className="pr-12">
        <CardTitle id="financial-snapshot-heading">Financial Snapshot</CardTitle>
        <CardDescription>Rent billing, payments received and unsettled balances.</CardDescription>
      </CardHeader>

      {canOpenRentAnalytics && (
        <ArrowUpRight className="absolute right-5 top-5 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
      )}

      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Financial metrics unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map(item => <Skeleton key={item} className="h-28" />)}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
            <FinancialMetric label="Billed rent" value={amount(data.billed)} description={`${data.invoiceCount} invoices due`} />
            <FinancialMetric label="Cash collected" value={amount(data.cashCollectedInPeriod)} description={data.cashTransactionCount == null ? 'Payment total unavailable' : `${data.cashTransactionCount} payments received`} />
            <FinancialMetric label="Outstanding rent" value={amount(data.outstanding)} description={`${data.openInvoiceCount} unsettled invoices`} />
            <FinancialMetric label="Collection rate" value={<span title={data.collectionRate == null ? undefined : `${data.collectionRate}%`}>{data.collectionRate == null ? '—' : `${data.collectionRate.toFixed(1)}%`}</span>} description="Allocated collections ÷ billed rent" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )

  return (
    <section aria-labelledby="financial-snapshot-heading">
      {canOpenRentAnalytics ? (
        <Link href="/analytics/rent" className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
          {content}
        </Link>
      ) : content}
    </section>
  )
}
