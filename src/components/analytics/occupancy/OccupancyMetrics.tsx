import type { OccupancySummary, TenantsSummary } from '@/types/analytics'
import { Explain, MetricCard, exactMoneyTitle, formatCompactMoney, formatPercent } from '../AnalyticsCore'
import { ChartPanel } from '../charts/ChartPanel'
import { LeftReasonChart } from '../charts/LeftReasonChart'

export function OccupancyMetrics({ occupancy, tenants }: { occupancy: OccupancySummary; tenants: TenantsSummary }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current occupancy rate" value={formatPercent(occupancy.occupancyRate)} detail={`${occupancy.totalUnits} current unit(s)`} tooltip="Occupied units ÷ total units, snapshot as of the as-of date." tone="sky" />
        <MetricCard label="Occupied units" value={occupancy.occupiedUnits.toLocaleString()} href="/properties" detail={`${occupancy.occupiedWithoutTenant} without an ACTIVE tenant`} tone="emerald" />
        <MetricCard label="Vacant units" value={occupancy.vacantUnits.toLocaleString()} href="/properties" detail={`${occupancy.vacantWithTenant} still linked to an ACTIVE tenant`} tone="amber" />
        <MetricCard label="Current tenant records" value={tenants.currentTenants.toLocaleString()} href="/properties" tone="sky" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Former tenants" value={tenants.formerTenants.toLocaleString()} detail="Total departed records" tone="rose" />
        <MetricCard label="Total tenants ever" value={tenants.totalTenantsEver.toLocaleString()} detail="Active + former" tone="sky" />
        <MetricCard label="Churn rate" value={formatPercent(tenants.churnRate)} detail="Left ÷ total ever" tooltip="Share of all tenant records ever that have left. A lifetime measure, not a period churn rate." tone="amber" />
        <MetricCard label="Current rent roll" value={formatCompactMoney(tenants.currentRentRoll)} fullValueTitle={exactMoneyTitle(tenants.currentRentRoll)} detail={`Avg ${formatCompactMoney(tenants.averageRent)} · deposits ${formatCompactMoney(tenants.depositsHeld)}`} tone="emerald" />
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
