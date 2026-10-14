'use client'

import { AnalyticsFilters } from '../AnalyticsFilters'
import { DataQualityNotices, Freshness } from '../AnalyticsCore'
import { AnalyticsPageHeader } from '../AnalyticsNavigation'
import { AnalyticsError, AnalyticsLoading, AnalyticsUnauthorized } from '../AnalyticsStates'
import { useDomainAnalyticsData } from '../hooks/useDomainAnalyticsData'
import { BillInvoiceAnalytics } from './bill-invoices/BillInvoiceAnalytics'
import { CommissionAnalytics } from './commissions/CommissionAnalytics'
import { DemandLetterAnalytics } from './demand-letters/DemandLetterAnalytics'
import { InvoiceAnalytics } from './invoices/InvoiceAnalytics'
import { OtherIncomeAnalytics } from './other-income/OtherIncomeAnalytics'
import { ServiceProviderAnalytics } from './service-providers/ServiceProviderAnalytics'
import { TenantAnalytics } from './tenants/TenantAnalytics'
import type { DomainViewProps } from './DomainView'
import type { AnalyticsDomain } from './types'
import { WorkforceAnalytics } from './workforce/WorkforceAnalytics'

function DomainContent({ domain, props }: { domain: AnalyticsDomain; props: DomainViewProps }) {
  switch (domain) {
    case 'invoices': return <InvoiceAnalytics {...props} />
    case 'bill-invoices': return <BillInvoiceAnalytics {...props} />
    case 'tenants': return <TenantAnalytics {...props} />
    case 'service-providers': return <ServiceProviderAnalytics {...props} />
    case 'commissions': return <CommissionAnalytics {...props} />
    case 'demand-letters': return <DemandLetterAnalytics {...props} />
    case 'other-income': return <OtherIncomeAnalytics {...props} />
    case 'employees': return <WorkforceAnalytics {...props} />
  }
}

export function DomainAnalyticsShell({ domain }: { domain: AnalyticsDomain }) {
  const state = useDomainAnalyticsData(domain)
  const description = `${state.definition.blurb} ${state.definition.property
    ? 'Restricted to accessible properties.'
    : `Shown at ${state.data?.scope?.toLowerCase() || 'authorized'} scope; no property attribution is inferred.`}`

  const viewProps: DomainViewProps | null = state.data ? {
    definition: state.definition,
    data: state.data,
    summary: state.summary,
    trendData: state.trendData,
    statusData: state.statusData,
    categoryData: state.categoryData,
    propertyData: state.propertyData,
    lifecycle: state.lifecycle,
  } : null

  return (
    <div className="space-y-6 text-foreground">
      <AnalyticsPageHeader
        title={state.definition.title}
        description={description}
        actions={state.authorized ? (
          <AnalyticsFilters
            value={state.draftFilters}
            properties={state.definition.property ? state.properties : []}
            showProperty={state.definition.property}
            disabled={state.loading}
            onChange={state.setDraftFilters}
            onApply={state.applyFilters}
          />
        ) : undefined}
      />

      {!state.authorized ? (
        <AnalyticsUnauthorized detail={`You do not have permission to view ${state.definition.title.toLowerCase()}.`} />
      ) : state.loading ? (
        <AnalyticsLoading />
      ) : state.error ? (
        <AnalyticsError message={state.error.message} backendUnavailable={state.error.backendUnavailable} retry={state.load} />
      ) : state.response && viewProps ? (
        <>
          <DataQualityNotices values={[state.response.meta.dataQuality]} />
          <DomainContent domain={domain} props={viewProps} />
          <Freshness generatedAt={state.response.meta.generatedAt} definition={state.response.meta.definitionsVersion} />
        </>
      ) : null}
    </div>
  )
}
