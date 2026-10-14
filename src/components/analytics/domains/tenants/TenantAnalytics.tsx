import { DomainChartsSection, DomainSummary, PropertyComparison, TenantLifecycleSection } from '../DomainSections'
import type { DomainViewProps } from '../DomainView'

export function TenantAnalytics({ definition, summary, trendData, statusData, categoryData, propertyData, lifecycle }: DomainViewProps) {
  return (
    <>
      <DomainSummary summary={summary} definition={definition} />
      {lifecycle && <TenantLifecycleSection lifecycle={lifecycle} />}
      <DomainChartsSection trend={trendData} status={statusData} categories={categoryData} properties={propertyData} showProperties />
      <PropertyComparison data={propertyData} />
    </>
  )
}
