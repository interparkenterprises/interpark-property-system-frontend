import { DomainChartsSection, PropertyComparison } from '../DomainSections'
import type { DomainViewProps } from '../DomainView'
import { MetricRow, PrimaryMetric, SummaryCard, SummaryHeading, summaryNumber } from '../SummaryPanelPrimitives'

export function OtherIncomeAnalytics({ definition, summary, trendData, statusData, categoryData, propertyData }: DomainViewProps) {
  return (
    <>
      <section className="space-y-3" aria-labelledby="other-income-summary-heading">
        <div id="other-income-summary-heading"><SummaryHeading drill={definition.drill} /></div>
        <SummaryCard title="Other income position" description="Non-rent income documents and their recorded document values.">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr]"><PrimaryMetric label="Invoiced amount" value={summaryNumber(summary, 'invoicedAmount')} /><PrimaryMetric label="Income document count" value={summaryNumber(summary, 'invoiceCount')} kind="count" /></div>
          <dl className="mt-3 grid gap-x-8 md:grid-cols-2"><MetricRow label="Paid document value" value={summaryNumber(summary, 'paidDocumentAmount')} detail="Value of documents marked paid" /><MetricRow label="VAT amount" value={summaryNumber(summary, 'vatAmount')} detail="Tax component; not a payment category" /></dl>
        </SummaryCard>
      </section>
      <DomainChartsSection trend={trendData} status={statusData} categories={categoryData} properties={propertyData} showProperties={definition.property} />
      {definition.property && <PropertyComparison data={propertyData} />}
    </>
  )
}
