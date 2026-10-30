import type { CohortVsCash, OccupancySummary, TenantsSummary } from '@/types/analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { exactMoneyTitle, formatCompactMoney, formatPercent, InfoTip } from '../AnalyticsCore'

const number = new Intl.NumberFormat('en-KE')

function Money({ value }: { value: number }) {
  return <span className="min-w-0 truncate tabular-nums" title={exactMoneyTitle(value)}>{formatCompactMoney(value)}</span>
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border/60 py-2.5 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-foreground">{children}</dd>
    </div>
  )
}

export function CohortCashComparison({ data }: { data: CohortVsCash }) {
  const difference = data.cash.collected - data.cohort.allocated
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">Cohort vs cash<InfoTip text="Cohort metrics follow invoices. Cash metrics follow payment dates. They answer different questions, so totals are expected to differ." /></CardTitle>
        <CardDescription>Invoice allocations and payment-date cash remain distinct measures, as of {data.snapshot.asOf}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="min-w-0 rounded-lg bg-muted/45 p-4">
            <p className="text-xs font-medium text-muted-foreground">Allocated collections</p>
            <p className="mt-2 truncate text-2xl font-semibold text-foreground" title={exactMoneyTitle(data.cohort.allocated)}>{formatCompactMoney(data.cohort.allocated)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Against invoices due in range</p>
          </div>
          <div className="min-w-0 rounded-lg bg-muted/45 p-4">
            <p className="text-xs font-medium text-muted-foreground">Cash received</p>
            <p className="mt-2 truncate text-2xl font-semibold text-foreground" title={exactMoneyTitle(data.cash.collected)}>{formatCompactMoney(data.cash.collected)}</p>
            <p className="mt-1 text-xs text-muted-foreground">By payment date</p>
          </div>
          <div className="min-w-0 rounded-lg bg-muted/45 p-4">
            <p className="text-xs font-medium text-muted-foreground">Existing invoice-versus-cash difference</p>
            <p className="mt-2 truncate text-2xl font-semibold text-foreground" title={exactMoneyTitle(difference)}>{formatCompactMoney(difference)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Cash received less allocated collections</p>
          </div>
        </div>
        <div className="grid gap-x-8 lg:grid-cols-2">
          <dl>
            <Detail label="Billed invoices due in range"><Money value={data.cohort.billed} /></Detail>
            <Detail label="Cohort collection rate">{formatPercent(data.cohort.collectionRate)}</Detail>
            <Detail label="Invoice count">{number.format(data.cohort.invoiceCount)}</Detail>
            <Detail label="Open invoices">{number.format(data.snapshot.openInvoiceCount)}</Detail>
          </dl>
          <dl>
            <Detail label="Cash transactions">{number.format(data.cash.transactionCount)}</Detail>
            <Detail label="Excluded credit"><Money value={data.cash.excludedCredit} /></Detail>
            <Detail label="Excluded prepaid"><Money value={data.cash.excludedPrepaid} /></Detail>
            <Detail label="Outstanding snapshot"><Money value={data.snapshot.outstanding} /></Detail>
            <Detail label="Arrears snapshot"><Money value={data.snapshot.arrears} /></Detail>
          </dl>
        </div>
      </CardContent>
    </Card>
  )
}

export function PortfolioContext({ occupancy, tenants }: { occupancy?: OccupancySummary; tenants?: TenantsSummary }) {
  if (!occupancy && !tenants) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio context</CardTitle>
        <CardDescription>Current-state occupancy and tenant position alongside the selected rent period.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        {occupancy && (
          <div className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div><p className="text-xs text-muted-foreground">Current occupancy rate</p><p className="mt-1 text-2xl font-semibold tabular-nums">{formatPercent(occupancy.occupancyRate)}</p></div>
              <p className="text-sm text-muted-foreground">{number.format(occupancy.totalUnits)} units</p>
            </div>
            {occupancy.occupancyRate != null && <Progress value={occupancy.occupancyRate} label="Current occupancy rate" />}
            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/40 p-3"><dt className="text-xs text-muted-foreground">Occupied</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{number.format(occupancy.occupiedUnits)}</dd></div>
              <div className="rounded-lg bg-muted/40 p-3"><dt className="text-xs text-muted-foreground">Vacant</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{number.format(occupancy.vacantUnits)}</dd></div>
            </dl>
            {(occupancy.occupiedWithoutTenant > 0 || occupancy.vacantWithTenant > 0) && <p className="text-xs text-warning">Data review: {number.format(occupancy.occupiedWithoutTenant)} occupied without an active tenant; {number.format(occupancy.vacantWithTenant)} vacant with an active tenant.</p>}
          </div>
        )}
        {tenants && (
          <dl>
            <Detail label="Current tenants">{number.format(tenants.currentTenants)}</Detail>
            <Detail label="Former tenants">{number.format(tenants.formerTenants)}</Detail>
            <Detail label="Total tenants ever">{number.format(tenants.totalTenantsEver)}</Detail>
            <Detail label="Existing churn rate">{formatPercent(tenants.churnRate)}</Detail>
            <Detail label="Current rent roll"><Money value={tenants.currentRentRoll} /></Detail>
            <Detail label="Average rent"><Money value={tenants.averageRent} /></Detail>
            <Detail label="Deposits held"><Money value={tenants.depositsHeld} /></Detail>
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
