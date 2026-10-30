import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { OccupancySummary, TenantsSummary } from '@/types/analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Explain, exactMoneyTitle, formatCompactMoney, formatPercent } from '../AnalyticsCore'
import { ChartPanel } from '../charts/ChartPanel'
import { LeftReasonChart } from '../charts/LeftReasonChart'

export function OccupancyMetrics({ occupancy, tenants }: { occupancy: OccupancySummary; tenants: TenantsSummary }) {
  return (
    <>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="space-y-1.5"><CardTitle>Occupancy composition</CardTitle><CardDescription>Current unit status as of the selected as-of date.</CardDescription></div>
            <Link href="/properties" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Open properties <ArrowUpRight className="h-4 w-4" /></Link>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-xs font-medium text-muted-foreground">Current occupancy rate</p><p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{formatPercent(occupancy.occupancyRate)}</p></div>
              <p className="text-sm text-muted-foreground">{occupancy.totalUnits.toLocaleString()} total units</p>
            </div>
            {occupancy.occupancyRate != null && <Progress value={occupancy.occupancyRate} label="Current occupancy rate" />}
            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/45 p-4"><dt className="text-xs text-muted-foreground">Occupied units</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{occupancy.occupiedUnits.toLocaleString()}</dd></div>
              <div className="rounded-lg bg-muted/45 p-4"><dt className="text-xs text-muted-foreground">Vacant units</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{occupancy.vacantUnits.toLocaleString()}</dd></div>
            </dl>
            <div className="space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">Occupied without an active tenant</span><span className="font-medium tabular-nums">{occupancy.occupiedWithoutTenant.toLocaleString()}</span></div>
              <div className="flex justify-between gap-3"><span className="text-muted-foreground">Vacant with an active tenant</span><span className="font-medium tabular-nums">{occupancy.vacantWithTenant.toLocaleString()}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tenant position</CardTitle><CardDescription>Current tenant records and lifetime tenant context.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg bg-muted/45 p-4">
              <p className="text-xs font-medium text-muted-foreground">Current tenant records</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{tenants.currentTenants.toLocaleString()}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <div><dt className="text-xs text-muted-foreground">Former tenants</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{tenants.formerTenants.toLocaleString()}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Total tenants ever</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{tenants.totalTenantsEver.toLocaleString()}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Existing churn rate</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{formatPercent(tenants.churnRate)}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-muted-foreground">Current rent roll</dt><dd className="mt-1 truncate text-lg font-semibold tabular-nums" title={exactMoneyTitle(tenants.currentRentRoll)}>{formatCompactMoney(tenants.currentRentRoll)}</dd></div>
            </dl>
            <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
              <div className="min-w-0"><p className="text-xs text-muted-foreground">Average rent</p><p className="mt-1 truncate font-medium tabular-nums" title={exactMoneyTitle(tenants.averageRent)}>{formatCompactMoney(tenants.averageRent)}</p></div>
              <div className="min-w-0"><p className="text-xs text-muted-foreground">Deposits held</p><p className="mt-1 truncate font-medium tabular-nums" title={exactMoneyTitle(tenants.depositsHeld)}>{formatCompactMoney(tenants.depositsHeld)}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
      {tenants.byLeftReason && Object.keys(tenants.byLeftReason).length > 0 && (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartPanel title="Why tenants left" subtitle="Distribution of leftReason across former tenants" tooltip="Counts by the recorded departure reason. UNSPECIFIED means the reason was never captured — a data-quality signal.">
            <LeftReasonChart data={tenants.byLeftReason} />
          </ChartPanel>
          <Explain title="Using the left-reason chart">
            A large <strong className="text-foreground">NON_PAYMENT</strong> slice points to arrears-driven churn and should be reviewed alongside former-tenant arrears. <strong className="text-foreground">EVICTED</strong> departures require separate review because the recorded reason does not identify the cause of eviction. A large <strong className="text-foreground">UNSPECIFIED</strong> slice means staff are not recording departure reasons, so treat the breakdown as directional.
          </Explain>
        </div>
      )}
    </>
  )
}
