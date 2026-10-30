import { Progress } from '@/components/ui/progress'
import { DomainChartsSection, PropertyComparison } from '../DomainSections'
import type { DomainViewProps } from '../DomainView'
import { CompositionBar, MetricRow, PrimaryMetric, SummaryCard, SummaryHeading, summaryNumber } from '../SummaryPanelPrimitives'

export function BillInvoiceAnalytics({ definition, summary, trendData, statusData, categoryData, propertyData }: DomainViewProps) {
  const billed = summaryNumber(summary, 'billed')
  const paid = summaryNumber(summary, 'paid')
  const outstanding = summaryNumber(summary, 'outstanding')
  const collectionRate = summaryNumber(summary, 'collectionRate')
  const supportsComposition = billed != null && paid != null && outstanding != null && billed > 0 && Math.abs(paid + outstanding - billed) < 0.02
  return (
    <>
      <section className="space-y-3" aria-labelledby="bill-summary-heading">
        <div id="bill-summary-heading"><SummaryHeading drill={definition.drill} /></div>
        <SummaryCard title="Billing performance" description="Utility and service bill invoices for the selected reporting scope.">
          <div className="grid gap-3 md:grid-cols-3">
            <PrimaryMetric label="Total billed" value={billed} />
            <PrimaryMetric label="Collection rate" value={collectionRate} kind="percent" />
            <PrimaryMetric label="Bill invoice count" value={summaryNumber(summary, 'invoiceCount')} kind="count" />
          </div>
          {collectionRate != null && <Progress className="mt-4" value={collectionRate} label="Bill invoice collection rate" />}
          {supportsComposition && <div className="mt-5"><CompositionBar label="Paid and outstanding bill invoice amounts" segments={[{ label: 'Paid', value: paid, className: 'bg-primary' }, { label: 'Outstanding', value: outstanding, className: 'bg-[var(--chart-4)]' }]} /></div>}
          <dl className="mt-3 grid gap-x-8 md:grid-cols-2">
            <div><MetricRow label="Amount paid" value={paid} /><MetricRow label="Outstanding" value={outstanding} /></div>
            <div><MetricRow label="Overdue bill balance" value={summaryNumber(summary, 'overdueBillBalance')} detail="Shown separately from the paid/outstanding composition" /></div>
          </dl>
        </SummaryCard>
      </section>
      <DomainChartsSection trend={trendData} status={statusData} categories={categoryData} properties={propertyData} showProperties={definition.property} />
      {definition.property && <PropertyComparison data={propertyData} />}
    </>
  )
}
