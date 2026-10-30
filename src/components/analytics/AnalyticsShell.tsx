import type { Property } from '@/types'
import type { AnalyticsApiFailure, AnalyticsFilters as FilterValues, AnalyticsMeta } from '@/types/analytics'
import { AnalyticsFilters } from './AnalyticsFilters'
import { AnalyticsPageHeader } from './AnalyticsNavigation'
import { AnalyticsError, AnalyticsLoading, AnalyticsUnauthorized } from './AnalyticsStates'
import { DataQualityNotices, Freshness } from './AnalyticsCore'

export function AnalyticsShell({
  title, description, authorized, filters, properties, loading, error, meta,
  onFiltersChange, onApply, onRetry, children, showLoadingState = true,
}: {
  title: string
  description: string
  authorized: boolean
  filters: FilterValues
  properties: Property[]
  loading: boolean
  error: AnalyticsApiFailure | null
  meta?: AnalyticsMeta[]
  onFiltersChange: (value: FilterValues) => void
  onApply: () => void
  onRetry: () => void
  children: React.ReactNode
  showLoadingState?: boolean
}) {
  const notices = meta?.map(item => item.dataQuality) || []
  const primaryMeta = meta?.[0]

  return (
    <div className="space-y-6 text-foreground">
      <AnalyticsPageHeader
        title={title}
        description={description}
        actions={authorized ? (
          <AnalyticsFilters value={filters} properties={properties} disabled={loading} onChange={onFiltersChange} onApply={onApply} />
        ) : undefined}
      />
      {!authorized ? (
        <AnalyticsUnauthorized detail="This view requires the matching payment, arrears, unit, and tenant permissions enforced by the analytics API." />
      ) : (
        <>
          {showLoadingState && loading ? <AnalyticsLoading /> : error ? (
            <AnalyticsError message={error.message} backendUnavailable={error.backendUnavailable} retry={onRetry} />
          ) : (
            <>
              {notices.length > 0 && <DataQualityNotices values={notices} />}
              {children}
              {primaryMeta && <Freshness generatedAt={primaryMeta.generatedAt} definition={primaryMeta.definitionsVersion} />}
            </>
          )}
        </>
      )}
    </div>
  )
}
