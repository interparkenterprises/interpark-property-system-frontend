import { DomainChartsSection, PropertyComparison } from '../DomainSections'
import type { DomainViewProps } from '../DomainView'
import { MetricRow, PrimaryMetric, SummaryCard, SummaryHeading, summaryNumber } from '../SummaryPanelPrimitives'

export function DemandLetterAnalytics({ definition, summary, trendData, statusData, categoryData, propertyData }: DomainViewProps) {
  return (
    <>
      <section className="space-y-3" aria-labelledby="demand-summary-heading">
        <div id="demand-summary-heading"><SummaryHeading drill={definition.drill} /></div>
        <div className="grid gap-6 xl:grid-cols-2">
          <SummaryCard title="Document overview" description="Demand-letter volume and the amount captured when each document was issued.">
            <div className="grid gap-3 sm:grid-cols-2"><PrimaryMetric label="Demand letters issued" value={summaryNumber(summary, 'letterCount')} kind="count" /><PrimaryMetric label="Document snapshot amount" value={summaryNumber(summary, 'documentSnapshotAmount')} /></div>
          </SummaryCard>
          <SummaryCard title="Document outcomes" description="Recorded actions and outcomes; these rows are not assumed to be a complete status distribution.">
            <dl><MetricRow label="Partial payment recorded" value={summaryNumber(summary, 'partialPaymentRecorded')} /><MetricRow label="Settled" value={summaryNumber(summary, 'settledCount')} kind="count" /><MetricRow label="Escalated" value={summaryNumber(summary, 'escalatedCount')} kind="count" /></dl>
          </SummaryCard>
        </div>
      </section>
      <DomainChartsSection trend={trendData} status={statusData} categories={categoryData} properties={propertyData} showProperties={definition.property} />
      {definition.property && <PropertyComparison data={propertyData} />}
    </>
  )
}
