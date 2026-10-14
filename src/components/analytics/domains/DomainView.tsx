import type { DomainDistributionItem, DomainTrendPoint } from '@/types/analytics'
import { DomainChartsSection, DomainSummary, PropertyComparison } from './DomainSections'
import type { DomainConfig, DomainDashboardData, LifecycleView, PropertyBreakdownRow } from './types'

export interface DomainViewProps {
  definition: DomainConfig
  data: DomainDashboardData
  summary: Record<string, unknown>
  trendData: DomainTrendPoint[]
  statusData: DomainDistributionItem[]
  categoryData: DomainDistributionItem[]
  propertyData: PropertyBreakdownRow[]
  lifecycle: LifecycleView | null
}

export function StandardDomainView({ definition, summary, trendData, statusData, categoryData, propertyData }: DomainViewProps) {
  return (
    <>
      <DomainSummary summary={summary} definition={definition} />
      <DomainChartsSection trend={trendData} status={statusData} categories={categoryData} properties={propertyData} showProperties={definition.property} />
      {definition.property && <PropertyComparison data={propertyData} />}
    </>
  )
}
