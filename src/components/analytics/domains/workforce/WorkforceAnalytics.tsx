import { DomainChartsSection, PropertyComparison } from '../DomainSections'
import type { DomainViewProps } from '../DomainView'
import { CompositionBar, MetricRow, PrimaryMetric, SummaryCard, SummaryHeading, summaryNumber } from '../SummaryPanelPrimitives'

export function WorkforceAnalytics({ definition, summary, trendData, statusData, categoryData, propertyData }: DomainViewProps) {
  const employeeCount = summaryNumber(summary, 'employeeCount')
  const activeEmployees = summaryNumber(summary, 'activeEmployees')
  const statuses = statusData.filter(item => item.count > 0)
  return (
    <>
      <section className="space-y-3" aria-labelledby="workforce-summary-heading">
        <div id="workforce-summary-heading"><SummaryHeading drill={definition.drill} /></div>
        <div className="grid gap-6 xl:grid-cols-2">
          <SummaryCard title="Workforce composition" description="Current headcount and the backend employee-status breakdown.">
            <div className="grid gap-3 sm:grid-cols-2"><PrimaryMetric label="Total employees" value={employeeCount} kind="count" /><PrimaryMetric label="Active employees" value={activeEmployees} kind="count" /></div>
            {statuses.length > 0 && <div className="mt-5 space-y-3"><CompositionBar label="Employee status composition" segments={statuses.map((item, index) => ({ label: item.label, value: item.count, className: index === 0 ? 'bg-primary' : index === 1 ? 'bg-[var(--chart-2)]' : 'bg-[var(--chart-4)]' }))} /><dl>{statuses.map(item => <MetricRow key={item.label} label={item.label} value={item.count} kind="count" />)}</dl></div>}
          </SummaryCard>
          <SummaryCard title="Salary position" description="Configured salary values remain distinct from payments recorded in the selected range.">
            <PrimaryMetric label="Configured salaries" value={summaryNumber(summary, 'configuredSalaryTotal')} />
            <dl className="mt-3"><MetricRow label="Average configured salary" value={summaryNumber(summary, 'averageConfiguredSalary')} /><MetricRow label="Salary paid in selected range" value={summaryNumber(summary, 'salaryPaidInRange')} /></dl>
          </SummaryCard>
        </div>
      </section>
      <DomainChartsSection trend={trendData} status={statusData} categories={categoryData} properties={propertyData} showProperties={definition.property} />
      {definition.property && <PropertyComparison data={propertyData} />}
    </>
  )
}
