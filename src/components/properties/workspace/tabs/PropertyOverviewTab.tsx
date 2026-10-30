'use client'

import { useEffect, useState } from 'react'
import { Building2, ChartNoAxesColumnIncreasing, DoorOpen, Users } from 'lucide-react'
import type { Property } from '@/types'
import { tenantsAPI } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DetailItem, DetailList } from '@/components/ui/detail-list'
import { Progress } from '@/components/ui/progress'
import { SectionHeader } from '@/components/ui/section-header'
import { StatCard } from '@/components/ui/stat-card'

interface PropertyOverviewTabProps {
  property: Property
  canViewTenants: boolean
  canViewProviders: boolean
}

export function PropertyOverviewTab({ property, canViewTenants, canViewProviders }: PropertyOverviewTabProps) {
  const units = property.units ?? []
  const serviceProviders = property.serviceProviders ?? []
  const leads = property.leads ?? []
  const occupiedUnits = units.filter((unit) => unit.status === 'OCCUPIED').length
  const vacantUnits = units.filter((unit) => unit.status === 'VACANT').length
  const occupancyRate = units.length ? Math.round((occupiedUnits / units.length) * 100) : 0
  const [tenantCount, setTenantCount] = useState<number | null>(null)

  useEffect(() => {
    if (!canViewTenants) return
    let active = true
    tenantsAPI.getByProperty(property.id)
      .then((tenants) => { if (active) setTenantCount(tenants.length) })
      .catch((error) => console.error('Error fetching tenants for overview:', error))
    return () => { active = false }
  }, [canViewTenants, property.id])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Units" value={units.length} description="Units registered to this property" icon={<Building2 className="h-5 w-5" />} tone="primary" />
        <StatCard label="Occupied" value={occupiedUnits} description={`${vacantUnits} vacant`} icon={<Users className="h-5 w-5" />} tone="success" />
        <StatCard label="Vacant" value={vacantUnits} description="Available units" icon={<DoorOpen className="h-5 w-5" />} tone="info" />
        <StatCard label="Occupancy Rate" value={`${occupancyRate}%`} description="Current unit occupancy" icon={<ChartNoAxesColumnIncreasing className="h-5 w-5" />} tone="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border">
            <SectionHeader title="Property Information" description="Registered identity, usage, and ownership details." />
          </CardHeader>
          <CardContent>
            <DetailList>
              <DetailItem label="Address">{property.address}</DetailItem>
              <DetailItem label="LR Number">{property.lrNumber || 'N/A'}</DetailItem>
              <DetailItem label="Property Form"><Badge variant="secondary">{property.form?.replaceAll('_', ' ') || 'N/A'}</Badge></DetailItem>
              <DetailItem label="Usage Type"><Badge variant="outline">{property.usage?.replaceAll('_', ' ') || 'N/A'}</Badge></DetailItem>
              <DetailItem label="Landlord">{property.landlord?.name || 'N/A'}</DetailItem>
              <DetailItem label="Manager">{property.manager?.name || 'N/A'}</DetailItem>
            </DetailList>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <SectionHeader title="Workspace Summary" description="Current activity associated with this property." />
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            {canViewTenants && <SummaryRow label="Active Tenants" value={tenantCount ?? '—'} />}
            {canViewProviders && <SummaryRow label="Service Providers" value={serviceProviders.length} />}
            <SummaryRow label="Active Leads" value={leads.length} />
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Occupancy</span>
                <span className="text-muted-foreground">{occupancyRate}%</span>
              </div>
              <Progress value={occupancyRate} label="Property occupancy" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold text-foreground">{value}</span>
    </div>
  )
}
