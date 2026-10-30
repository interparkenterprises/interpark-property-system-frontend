import type { ComprehensiveInvoiceSummary, DomainTrendPoint } from '@/types/analytics'
import { DomainChartsSection, PropertyComparison } from '../DomainSections'
import type { DomainViewProps } from '../DomainView'
import { ConsolidatedInvoiceSummary, InvoiceAgingPanel, InvoiceBreakdownPanels, PaymentPerformancePanel } from './InvoicePanels'

export function InvoiceAnalytics({ definition, data, trendData, statusData, categoryData, propertyData }: DomainViewProps) {
  const invoiceSummary = data.summary as unknown as ComprehensiveInvoiceSummary
  const displayTrend = trendData.flatMap(point => {
    if (typeof point.amount === 'number') return [point]
    const rentPoint = point as unknown as { period: string; billed?: unknown; invoiceCount?: unknown }
    if (typeof rentPoint.billed !== 'number') return []
    return [{
      period: rentPoint.period,
      amount: rentPoint.billed,
      count: typeof rentPoint.invoiceCount === 'number' ? rentPoint.invoiceCount : 0,
    } satisfies DomainTrendPoint]
  })

  return (
    <>
      <ConsolidatedInvoiceSummary summary={invoiceSummary} definition={definition} />
      <InvoiceBreakdownPanels rent={invoiceSummary.rentInvoices ?? null} bill={invoiceSummary.billInvoices ?? null} />
      <PaymentPerformancePanel performance={data.performance} />
      <InvoiceAgingPanel aging={data.aging} />
      <DomainChartsSection trend={displayTrend} status={statusData} categories={categoryData} properties={propertyData} showProperties />
      <PropertyComparison data={propertyData} />
    </>
  )
}
