import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { exactMoneyTitle, formatCompactMoney, formatPercent, InfoTip } from '../../AnalyticsCore'
import { TenantAdditionsChart } from '../DomainCharts'
import type { DomainConfig, LifecycleView } from '../types'

const integer = new Intl.NumberFormat('en-KE')

type TenantSummaryMetrics = {
  currentTenants: number | null
  formerTenants: number | null
  totalTenantsEver: number | null
  currentRentRoll: number | null
  averageRent: number | null
  depositsHeld: number | null
}

const metric = (summary: Record<string, unknown>, key: keyof TenantSummaryMetrics) =>
  typeof summary[key] === 'number' && Number.isFinite(summary[key]) ? summary[key] as number : null

const count = (value: number | null) => value == null ? 'Not available' : integer.format(value)

function TenantPopulationPanel({ data }: { data: TenantSummaryMetrics }) {
  const hasDistribution = data.totalTenantsEver != null && data.totalTenantsEver > 0
  const currentShare = hasDistribution && data.currentTenants != null ? Math.min(100, Math.max(0, (data.currentTenants / data.totalTenantsEver!) * 100)) : 0
  const formerShare = hasDistribution && data.formerTenants != null ? Math.min(100 - currentShare, Math.max(0, (data.formerTenants / data.totalTenantsEver!) * 100)) : 0

  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <CardTitle>Tenant population</CardTitle>
        <CardDescription>Current and former tenants within all recorded tenant accounts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total tenants ever</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{count(data.totalTenantsEver)}</p>
        </div>
        {hasDistribution ? (
          <div
            role="img"
            aria-label={`${count(data.currentTenants)} current tenants and ${count(data.formerTenants)} former tenants out of ${count(data.totalTenantsEver)} total tenant records`}
            className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
          >
            <span style={{ width: `${currentShare}%`, backgroundColor: 'var(--chart-2)' }} />
            <span style={{ width: `${formerShare}%`, backgroundColor: 'var(--chart-4)' }} />
          </div>
        ) : <div className="h-3 rounded-full bg-muted" aria-label="Tenant distribution unavailable" />}
        <dl className="grid grid-cols-2 gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: 'var(--chart-2)' }} aria-hidden="true" />
            <div className="min-w-0"><dt className="text-xs text-muted-foreground">Current tenants</dt><dd className="mt-0.5 text-lg font-semibold tabular-nums">{count(data.currentTenants)}</dd></div>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: 'var(--chart-4)' }} aria-hidden="true" />
            <div className="min-w-0"><dt className="text-xs text-muted-foreground">Former tenants</dt><dd className="mt-0.5 text-lg font-semibold tabular-nums">{count(data.formerTenants)}</dd></div>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

function RentalPositionPanel({ data }: { data: TenantSummaryMetrics }) {
  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <CardTitle>Rental position</CardTitle>
        <CardDescription>Current rent roll, average rent and deposits held for active tenants.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current rent roll</p>
          <p className="mt-1 truncate text-3xl font-semibold tabular-nums text-foreground" title={exactMoneyTitle(data.currentRentRoll)}>{formatCompactMoney(data.currentRentRoll)}</p>
        </div>
        <dl className="divide-y divide-border rounded-md border border-border">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-muted-foreground">Average rent</dt>
            <dd className="truncate text-sm font-semibold tabular-nums text-foreground" title={exactMoneyTitle(data.averageRent)}>{formatCompactMoney(data.averageRent)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-muted-foreground">Deposits held</dt>
            <dd className="truncate text-sm font-semibold tabular-nums text-foreground" title={exactMoneyTitle(data.depositsHeld)}>{formatCompactMoney(data.depositsHeld)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

function TenantRetentionPanel({ lifecycle }: { lifecycle: LifecycleView }) {
  const retention = lifecycle.summary.cumulativeRetentionRate
  const periodRetention = lifecycle.summary.periodRetentionRate
  const tenure = lifecycle.summary.averageTenureDays
  const tenureLabel = tenure == null ? 'Unavailable' : tenure === 0 ? '0 days · same-day average' : `${integer.format(tenure)} days`

  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center">Tenant retention<InfoTip text="Cumulative retention is the backend-calculated share of all tenant records that remain active. Period retention considers tenants who existed at the start of the selected period." /></CardTitle>
        <CardDescription>Long-term retention with selected-period context.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cumulative retention</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{formatPercent(retention)}</p>
        </div>
        {retention != null ? <Progress value={retention} max={100} label="Cumulative tenant retention" className="h-3" /> : <div className="h-3 rounded-full bg-muted" aria-label="Cumulative retention unavailable" />}
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
          <div><dt className="text-xs text-muted-foreground">Active tenants</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{integer.format(lifecycle.summary.activeTenants)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Churned tenants</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{integer.format(lifecycle.summary.churnedTenants)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Period retention</dt><dd className="mt-1 text-sm font-semibold tabular-nums">{periodRetention == null ? 'Unavailable' : formatPercent(periodRetention)}</dd></div>
          <div><dt className="flex items-center text-xs text-muted-foreground">Average tenure<InfoTip text="Average time from account creation to departure for former tenants. The backend uses the recorded departure date and falls back to the last update date for legacy records." /></dt><dd className="mt-1 text-sm font-semibold tabular-nums">{tenureLabel}</dd></div>
        </dl>
        <p className="text-xs text-muted-foreground">Lifecycle records: {integer.format(lifecycle.summary.totalTenants)} total tenants.</p>
        {lifecycle.newTenantsTrend.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium text-foreground">New tenants over time</p>
            <div className="h-44 min-w-0"><TenantAdditionsChart data={lifecycle.newTenantsTrend} /></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TenantFinancialActivityPanel({ lifecycle }: { lifecycle: LifecycleView }) {
  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center">Tenant financial activity<InfoTip text="Paying tenants and tenants with arrears are separate backend measures and may overlap. They are not parts of a single total." /></CardTitle>
        <CardDescription>Payment participation and current balance exposure.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="divide-y divide-border rounded-md border border-border">
          <div className="flex items-end justify-between gap-4 px-4 py-4"><dt className="text-sm text-muted-foreground">Tenants with arrears</dt><dd className="text-2xl font-semibold tabular-nums text-foreground">{integer.format(lifecycle.tenantsWithArrears)}</dd></div>
          <div className="flex items-end justify-between gap-4 px-4 py-4"><dt className="text-sm text-muted-foreground">Paying tenants</dt><dd className="text-2xl font-semibold tabular-nums text-foreground">{integer.format(lifecycle.payingTenants)}</dd></div>
          <div className="flex items-end justify-between gap-4 px-4 py-4"><dt className="text-sm text-muted-foreground">Average invoice balance</dt><dd className="truncate text-lg font-semibold tabular-nums text-foreground" title={exactMoneyTitle(lifecycle.averageInvoiceBalance)}>{formatCompactMoney(lifecycle.averageInvoiceBalance)}</dd></div>
        </dl>
        <div className="rounded-md bg-muted/35 p-3 text-xs leading-5 text-muted-foreground">
          Lifecycle financial context: average rent <span className="font-medium text-foreground" title={exactMoneyTitle(lifecycle.summary.averageRent)}>{formatCompactMoney(lifecycle.summary.averageRent)}</span> · deposits <span className="font-medium text-foreground" title={exactMoneyTitle(lifecycle.summary.totalDeposits)}>{formatCompactMoney(lifecycle.summary.totalDeposits)}</span>.
        </div>
      </CardContent>
    </Card>
  )
}

export function TenantSummaryPanels({ summary, definition }: { summary: Record<string, unknown>; definition: DomainConfig }) {
  const data: TenantSummaryMetrics = {
    currentTenants: metric(summary, 'currentTenants'),
    formerTenants: metric(summary, 'formerTenants'),
    totalTenantsEver: metric(summary, 'totalTenantsEver'),
    currentRentRoll: metric(summary, 'currentRentRoll'),
    averageRent: metric(summary, 'averageRent'),
    depositsHeld: metric(summary, 'depositsHeld'),
  }

  return (
    <section className="space-y-3" aria-labelledby="tenant-summary-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="tenant-summary-heading" className="text-lg font-semibold text-foreground">Summary</h2><p className="text-sm text-muted-foreground">Current tenant population and rental position.</p></div>
        <Link href={definition.drill} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Open source records <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2"><TenantPopulationPanel data={data} /><RentalPositionPanel data={data} /></div>
    </section>
  )
}

export function TenantLifecyclePanels({ lifecycle }: { lifecycle: LifecycleView }) {
  return (
    <section className="space-y-3" aria-labelledby="tenant-lifecycle-heading">
      <div><h2 id="tenant-lifecycle-heading" className="text-lg font-semibold text-foreground">Tenant Lifecycle Overview</h2><p className="text-sm text-muted-foreground">Retention, tenure, payment participation and arrears exposure.</p></div>
      <div className="grid gap-4 lg:grid-cols-2"><TenantRetentionPanel lifecycle={lifecycle} /><TenantFinancialActivityPanel lifecycle={lifecycle} /></div>
    </section>
  )
}
