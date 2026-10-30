import type { AnalyticsFilters, ReceivablesSummary } from '@/types/analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { exactMoneyTitle, formatCompactMoney, formatPercent } from '../AnalyticsCore'

function MoneyValue({ value, className = '' }: { value: number; className?: string }) {
  return <span className={`block min-w-0 truncate tabular-nums ${className}`} title={exactMoneyTitle(value)}>{formatCompactMoney(value)}</span>
}

export function RentMetrics({ summary, filters }: { summary: ReceivablesSummary; filters: AnalyticsFilters }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rent performance</CardTitle>
        <CardDescription>Invoice-cohort billing, allocations and balances for the selected reporting scope.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="min-w-0 rounded-lg bg-muted/45 p-4">
            <p className="text-xs font-medium text-muted-foreground">Billed rent</p>
            <MoneyValue value={summary.billed} className="mt-2 text-2xl font-semibold text-foreground" />
            <p className="mt-1 text-xs text-muted-foreground">{summary.invoiceCount.toLocaleString()} invoice(s) due in range</p>
          </div>
          <div className="min-w-0 rounded-lg bg-muted/45 p-4">
            <p className="text-xs font-medium text-muted-foreground">Allocated collections</p>
            <MoneyValue value={summary.paid} className="mt-2 text-2xl font-semibold text-foreground" />
            <p className="mt-1 text-xs text-muted-foreground">Allocated to invoices in this cohort</p>
          </div>
          <div className="min-w-0 rounded-lg bg-muted/45 p-4">
            <p className="text-xs font-medium text-muted-foreground">Invoice collection rate</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{formatPercent(summary.collectionRate)}</p>
            {summary.collectionRate != null && <Progress className="mt-3" value={summary.collectionRate} label="Invoice collection rate" />}
          </div>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-0 rounded-lg border border-border/70 p-4">
            <dt className="text-sm text-muted-foreground">Outstanding rent</dt>
            <dd><MoneyValue value={summary.outstanding} className="mt-1 text-xl font-semibold text-foreground" /></dd>
            <p className="mt-1 text-xs text-muted-foreground">{summary.openInvoiceCount.toLocaleString()} open invoice(s)</p>
          </div>
          <div className="min-w-0 rounded-lg border border-border/70 p-4">
            <dt className="text-sm text-muted-foreground">Rent arrears</dt>
            <dd><MoneyValue value={summary.arrears} className="mt-1 text-xl font-semibold text-foreground" /></dd>
            <p className="mt-1 text-xs text-muted-foreground">Positive balances past due as of {filters.asOf}</p>
          </div>
        </dl>
        {summary.arrearsByTenantStatus && (
          <div className="border-t border-border pt-4">
            <div className="mb-3"><h4 className="text-sm font-semibold text-foreground">Active vs former tenant arrears</h4><p className="text-xs text-muted-foreground">Current-tenant balances and debt associated with departed tenants.</p></div>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="min-w-0 rounded-lg bg-muted/35 p-3"><dt className="text-xs text-muted-foreground">Active-tenant arrears</dt><dd><MoneyValue value={summary.arrearsByTenantStatus.activeTenants} className="mt-1 text-base font-semibold text-foreground" /></dd></div>
              <div className="min-w-0 rounded-lg bg-muted/35 p-3"><dt className="text-xs text-muted-foreground">Former-tenant arrears</dt><dd><MoneyValue value={summary.arrearsByTenantStatus.formerTenants} className="mt-1 text-base font-semibold text-foreground" /></dd></div>
              <div className="min-w-0 rounded-lg bg-muted/35 p-3"><dt className="text-xs text-muted-foreground">Total arrears breakdown</dt><dd><MoneyValue value={summary.arrearsByTenantStatus.total} className="mt-1 text-base font-semibold text-foreground" /></dd></div>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
