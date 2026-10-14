import type { BillInvoiceSummary, RentInvoiceSummary } from '@/types/analytics'
import { DomainChartsSection, DomainSummary, InvoiceDetailSections, PropertyComparison } from '../DomainSections'
import type { DomainViewProps } from '../DomainView'

export function InvoiceAnalytics({ definition, data, summary, trendData, statusData, categoryData, propertyData }: DomainViewProps) {
  const invoiceSummary = data.summary as Record<string, unknown> & {
    rentInvoices?: RentInvoiceSummary
    billInvoices?: BillInvoiceSummary
  }
  return (
    <>
      <DomainSummary summary={summary} definition={definition} />
      <InvoiceDetailSections rent={invoiceSummary.rentInvoices ?? null} bill={invoiceSummary.billInvoices ?? null} performance={data.performance} aging={data.aging} />
      <DomainChartsSection trend={trendData} status={statusData} categories={categoryData} properties={propertyData} showProperties />
      <PropertyComparison data={propertyData} />
    </>
  )
}
