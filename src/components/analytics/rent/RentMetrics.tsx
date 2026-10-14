import type { AnalyticsFilters, ReceivablesSummary } from '@/types/analytics'
import { Explain, MetricCard, exactMoneyTitle, formatCompactMoney, formatPercent } from '../AnalyticsCore'

export function RentMetrics({ summary, filters }: { summary: ReceivablesSummary; filters: AnalyticsFilters }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Billed rent account" value={formatCompactMoney(summary.billed)} fullValueTitle={exactMoneyTitle(summary.billed)} detail={`${summary.invoiceCount} invoice(s) due in range`} tooltip="Invoice totals (incl. VAT where applicable) for invoices whose due date falls inside the selected range. Cancelled invoices are excluded." tone="sky" />
        <MetricCard label="Allocated collections" value={formatCompactMoney(summary.paid)} fullValueTitle={exactMoneyTitle(summary.paid)} detail="Invoice amountPaid; not cash-date totals" tooltip="Payments allocated to invoices in this due-date cohort. This is not the same as cash received during the period." tone="emerald" />
        <MetricCard label="Invoice collection rate" value={formatPercent(summary.collectionRate)} detail="Allocated collections ÷ billed" tooltip="Allocated collections divided by billed amount for the cohort. Blank when nothing was billed in the range." tone="amber" />
        <MetricCard label="Outstanding rent" value={formatCompactMoney(summary.outstanding)} fullValueTitle={exactMoneyTitle(summary.outstanding)} detail={`${summary.openInvoiceCount} open invoice(s)`} tooltip="Remaining balance on invoices in the cohort, whether or not they are past due." tone="rose" />
        <MetricCard label="Rent arrears" value={formatCompactMoney(summary.arrears)} fullValueTitle={exactMoneyTitle(summary.arrears)} detail={`Positive balances past due as of ${filters.asOf}`} tooltip="Outstanding balances on invoices whose due date is before the as-of date. This is the number to act on." tone="rose" />
      </div>

      {summary.arrearsByTenantStatus && (
        <>
          <Explain title="Active vs former tenant arrears">
            Former-tenant arrears is debt left behind by departed tenants. It usually needs a different collection strategy, such as debt follow-up or deposit offsets, than active-tenant balances.
          </Explain>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Active-tenant arrears" value={formatCompactMoney(summary.arrearsByTenantStatus.activeTenants)} fullValueTitle={exactMoneyTitle(summary.arrearsByTenantStatus.activeTenants)} detail="Current tenants with past-due balances" tone="amber" />
            <MetricCard label="Former-tenant arrears" value={formatCompactMoney(summary.arrearsByTenantStatus.formerTenants)} fullValueTitle={exactMoneyTitle(summary.arrearsByTenantStatus.formerTenants)} detail="Debt left behind by departed tenants" tone="rose" />
            <MetricCard label="Total arrears" value={formatCompactMoney(summary.arrearsByTenantStatus.total)} fullValueTitle={exactMoneyTitle(summary.arrearsByTenantStatus.total)} detail="Active + former tenants" tone="rose" />
          </div>
        </>
      )}
    </>
  )
}
