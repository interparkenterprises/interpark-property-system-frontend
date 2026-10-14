import { DomainAnalyticsShell } from './domains/DomainAnalyticsShell'
import type { AnalyticsDomain } from './domains/types'

/** Compatibility wrapper retained for the existing lightweight route modules. */
export default function DomainAnalyticsDashboard({ domain }: { domain: AnalyticsDomain }) {
  return <DomainAnalyticsShell domain={domain} />
}
