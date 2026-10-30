import { DomainChartsSection, PropertyComparison } from '../DomainSections'
import type { DomainViewProps } from '../DomainView'
import { CompositionBar, MetricRow, PrimaryMetric, SummaryCard, SummaryHeading, summaryNumber } from '../SummaryPanelPrimitives'

export function CommissionAnalytics({ definition, summary, trendData, statusData, categoryData, propertyData }: DomainViewProps) {
  const total = summaryNumber(summary, 'totalCommission')
  const paid = summaryNumber(summary, 'paidCommission')
  const pending = summaryNumber(summary, 'pendingCommission')
  const additionalActiveStatuses = statusData.filter(item => !['PAID', 'PENDING', 'PROCESSING', 'CANCELLED'].includes(item.label.toUpperCase()) && item.count > 0)
  const supportsComposition = total != null && paid != null && pending != null && total > 0 && additionalActiveStatuses.length === 0 && Math.abs(paid + pending - total) < 0.02
  return (
    <>
      <section className="space-y-3" aria-labelledby="commission-summary-heading">
        <div id="commission-summary-heading"><SummaryHeading drill={definition.drill} /></div>
        <SummaryCard title="Commission settlement" description="Accrued commission and its recorded settlement position.">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr]"><PrimaryMetric label="Total commission" value={total} /><PrimaryMetric label="Commission records" value={summaryNumber(summary, 'commissionCount')} kind="count" /></div>
          {supportsComposition && <div className="mt-5"><CompositionBar label="Paid and pending commission" segments={[{ label: 'Paid', value: paid, className: 'bg-primary' }, { label: 'Pending / processing', value: pending, className: 'bg-[var(--chart-3)]' }]} /></div>}
          <dl className="mt-3 grid gap-x-8 md:grid-cols-2"><MetricRow label="Paid commission" value={paid} /><MetricRow label="Pending / processing commission" value={pending} /></dl>
          {additionalActiveStatuses.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Additional commission statuses are retained in the Status distribution below; no two-part composition is shown.</p>}
        </SummaryCard>
      </section>
      <DomainChartsSection trend={trendData} status={statusData} categories={categoryData} properties={propertyData} showProperties={definition.property} />
      {definition.property && <PropertyComparison data={propertyData} />}
    </>
  )
}
