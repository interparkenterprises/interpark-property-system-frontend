import { DomainChartsSection, PropertyComparison } from '../DomainSections'
import type { DomainViewProps } from '../DomainView'
import { TenantLifecyclePanels, TenantSummaryPanels } from './TenantPanels'

export function TenantAnalytics({ definition, summary, trendData, statusData, categoryData, propertyData, lifecycle }: DomainViewProps) {
  return (
    <>
      <TenantSummaryPanels summary={summary} definition={definition} />
      {lifecycle && <TenantLifecyclePanels lifecycle={lifecycle} />}
      <DomainChartsSection trend={trendData} status={statusData} categories={categoryData} properties={propertyData} showProperties />
      <PropertyComparison data={propertyData} />
    </>
  )
}
