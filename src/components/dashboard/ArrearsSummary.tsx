import Link from 'next/link'
import { ArrowRight, CircleAlert } from 'lucide-react'
import type { ReceivablesSummary } from '@/types/analytics'
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { buttonStyles } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ArrearsSummaryProps {
  data: ReceivablesSummary | null
  authorized: boolean
  loading: boolean
  error: string | null
}

function share(amount: number, total: number) {
  if (total <= 0) return 0
  return Math.max(0, (amount / total) * 100)
}

function percentage(value: number) {
  return `${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 1 }).format(value)}%`
}

export function ArrearsSummary({ data, authorized, loading, error }: ArrearsSummaryProps) {
  if (!authorized) return null

  const split = data?.arrearsByTenantStatus
  const total = split?.total ?? data?.arrears ?? 0
  const active = split?.activeTenants ?? data?.arrears ?? 0
  const former = split?.formerTenants ?? 0
  const activeShare = share(active, total)
  const formerShare = share(former, total)

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CircleAlert className="h-4 w-4 text-warning" />Arrears summary</CardTitle>
        <CardDescription>Overdue rent as of the selected period end.</CardDescription>
      </CardHeader>

      <CardContent className="min-w-0 flex-1">
        {error ? (
          <Alert variant="destructive"><AlertTitle>Arrears unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
        ) : loading ? (
          <div className="space-y-5">
            <Skeleton className="h-16 w-2/3" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : data ? (
          <div className="min-w-0 space-y-5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Total arrears</p>
              <p className="kpi-value mt-2 min-w-0 font-semibold text-foreground" title={formatExactKes(total)}>{formatCompactKes(total)}</p>
            </div>

            <div
              className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`Arrears composition: active tenants ${percentage(activeShare)}, former tenants ${percentage(formerShare)}`}
            >
              {activeShare > 0 && <span className="h-full bg-primary" style={{ width: `${activeShare}%` }} />}
              {formerShare > 0 && <span className="h-full bg-warning" style={{ width: `${formerShare}%` }} />}
            </div>

            <dl className="space-y-3 text-sm">
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                <dt className="flex min-w-0 items-center gap-2 text-muted-foreground"><span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-primary" aria-hidden="true" />Active tenants</dt>
                <dd className="font-medium tabular-nums text-foreground" title={formatExactKes(active)}>{formatCompactKes(active)}</dd>
                <dd className="col-span-2 pl-5 text-xs text-muted-foreground">{percentage(activeShare)} of total arrears</dd>
              </div>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                <dt className="flex min-w-0 items-center gap-2 text-muted-foreground"><span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-warning" aria-hidden="true" />Former tenants</dt>
                <dd className="font-medium tabular-nums text-foreground" title={formatExactKes(former)}>{formatCompactKes(former)}</dd>
                <dd className="col-span-2 pl-5 text-xs text-muted-foreground">{percentage(formerShare)} of total arrears</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="justify-end">
        <Link href="/analytics/rent" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
          Review rent analytics <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardFooter>
    </Card>
  )
}
