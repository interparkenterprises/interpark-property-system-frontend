import Link from 'next/link'
import { Building2, DoorOpen, Home, UserRound } from 'lucide-react'
import type { Property } from '@/types'
import type { OccupancySummary, TenantsSummary } from '@/types/analytics'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { InteractiveMetricCard } from '@/components/ui/interactive-metric-card'
import { Skeleton } from '@/components/ui/skeleton'

interface PortfolioOverviewProps {
  properties: Property[]
  landlordCount: number
  occupancy: OccupancySummary | null
  tenants: TenantsSummary | null
  selectedPropertyId?: string
  isManagedUser: boolean
  showLandlords: boolean
  canOpenProperties: boolean
  canOpenOccupancy: boolean
  canOpenTenants: boolean
  loading: boolean
  error: string | null
}

const percent = (value: number | null | undefined) => value == null ? '—' : `${value.toFixed(1)}%`

export function PortfolioOverview({
  properties,
  landlordCount,
  occupancy,
  tenants,
  selectedPropertyId,
  isManagedUser,
  showLandlords,
  canOpenProperties,
  canOpenOccupancy,
  canOpenTenants,
  loading,
  error,
}: PortfolioOverviewProps) {
  const visiblePropertyCount = selectedPropertyId ? 1 : properties.length

  return (
    <section className="space-y-4" aria-labelledby="portfolio-overview-heading">
      <div>
        <h2 id="portfolio-overview-heading" className="text-lg font-semibold text-foreground">Portfolio overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">Property access, unit availability and active tenancy at a glance.</p>
      </div>

      {error && (
        <Alert variant="warning">
          <AlertTitle>Some portfolio metrics could not be loaded</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map(item => <Skeleton key={item} className="h-32" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InteractiveMetricCard title="Properties" value={visiblePropertyCount} description={showLandlords ? `${landlordCount} landlords` : 'Within your current access'} icon={<Building2 className="h-5 w-5" />} href={canOpenProperties ? '/properties' : undefined} />
          <InteractiveMetricCard title="Units" value={occupancy?.totalUnits ?? '—'} description={occupancy ? `${occupancy.vacantUnits} vacant units` : 'Unit analytics unavailable'} icon={<DoorOpen className="h-5 w-5" />} href={canOpenOccupancy ? '/analytics/occupancy' : undefined} />
          <InteractiveMetricCard title="Occupancy" value={percent(occupancy?.occupancyRate)} description={occupancy ? `${occupancy.occupiedUnits} occupied units` : 'Occupancy analytics unavailable'} icon={<Home className="h-5 w-5" />} href={canOpenOccupancy ? '/analytics/occupancy' : undefined} />
          <InteractiveMetricCard title="Current tenants" value={tenants?.currentTenants ?? '—'} description={tenants ? `${tenants.formerTenants} former tenants` : 'Tenant analytics unavailable'} icon={<UserRound className="h-5 w-5" />} href={canOpenTenants ? '/analytics/tenants' : undefined} />
        </div>
      )}

      {isManagedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Your assigned properties</CardTitle>
            <CardDescription>Properties you currently have permission to view.</CardDescription>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <EmptyState icon={Building2} title="No properties assigned" description="Contact your manager if you need access to a property." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {properties.map(property => (
                  <Link key={property.id} href={`/properties/${property.id}`} className="rounded-md border border-border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <p className="font-medium text-foreground">{property.name}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{property.address || 'No address provided'}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  )
}
