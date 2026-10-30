'use client'

import { AnalyticsShell } from './AnalyticsShell'
import { AnalyticsOverview } from './overview/AnalyticsOverview'
import { OccupancyAnalytics } from './occupancy/OccupancyAnalytics'
import { RentAnalytics } from './rent/RentAnalytics'
import { useAnalyticsData } from './hooks/useAnalyticsData'
import type { AnalyticsMode } from './types'

const copy: Record<AnalyticsMode, { title: string; description: string }> = {
  overview: {
    title: 'Analytics overview',
    description: 'Reliable existing-data metrics across rent receivables, cash, and occupancy.',
  },
  rent: {
    title: 'Rent analytics',
    description: 'Invoice-based receivables and recorded cash collections for rent invoices.',
  },
  occupancy: {
    title: 'Occupancy analytics',
    description: 'Current occupied and vacant unit snapshot with tenant lifecycle.',
  },
}

export default function AnalyticsDashboard({ mode }: { mode: AnalyticsMode }) {
  const state = useAnalyticsData(mode)
  const page = copy[mode]

  return (
    <AnalyticsShell
      title={page.title}
      description={page.description}
      authorized={state.authorized}
      filters={state.draftFilters}
      properties={state.properties}
      loading={state.loading}
      error={state.error}
      meta={state.data?.meta}
      showLoadingState={mode !== 'overview'}
      onFiltersChange={state.setDraftFilters}
      onApply={state.applyFilters}
      onRetry={state.load}
    >
      {mode === 'overview' && (
        <AnalyticsOverview
          data={state.data}
          filters={state.filters}
          occupancy={state.occupancy}
          tenants={state.tenants}
          access={state.overviewAccess}
          loading={state.overviewLoading}
          errors={state.overviewErrors}
          onRetry={state.load}
        />
      )}
      {state.data && mode === 'rent' && (
        <RentAnalytics data={state.data} filters={state.filters} definitions={state.data.meta[0]?.definitions} />
      )}
      {state.data && mode === 'occupancy' && state.occupancy && state.tenants && (
        <OccupancyAnalytics occupancy={state.occupancy} tenants={state.tenants} />
      )}
    </AnalyticsShell>
  )
}
