'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Banknote,
  Bath,
  BedDouble,
  Building2,
  DoorOpen,
  Maximize2,
  UserRound,
} from 'lucide-react'
import type { RentType, Unit } from '@/types'
import { unitsAPI } from '@/lib/api'
import { formatExactKes } from '@/lib/numberFormat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DetailItem, DetailList } from '@/components/ui/detail-list'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { useBreadcrumbOverride, useBreadcrumbRouteTrail } from '@/components/layout/BreadcrumbContext'

const rentTypeLabels: Record<RentType, string> = {
  FIXED: 'Fixed Amount',
  PER_SQFT: 'Per Square Foot',
  TIERED: 'Tiered',
  GRADUATED: 'Graduated',
  INDEXED: 'Indexed',
  PERCENT_OF_REVENUE: 'Percentage of Revenue',
  PER_ROOM: 'Per Room',
  PER_OCCUPANT: 'Per Occupant',
  PER_BED: 'Per Bed',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  ANNUAL: 'Annual',
  NEGOTIATED: 'Negotiated',
  PARTIAL_SUBSIDY: 'Partial Subsidy',
  VARIABLE: 'Variable',
}

function formatEnumLabel(value?: string | null) {
  return value?.replaceAll('_', ' ') || 'N/A'
}

export default function UnitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const unitId = params.id as string
  const [unit, setUnit] = useState<Unit | null>(null)
  const [loading, setLoading] = useState(true)

  const unitsWorkspaceHref = unit?.propertyId ? `/properties/${unit.propertyId}?tab=units` : '/properties'
  useBreadcrumbOverride(`/properties/${unitId}`, loading ? 'Loading…' : unit?.property?.name ?? 'Property details', unit?.propertyId ? `/properties/${unit.propertyId}` : '/properties')
  useBreadcrumbRouteTrail([
    { label: 'Units', href: unitsWorkspaceHref },
    { label: loading ? 'Loading…' : unit?.unitNo ? `Unit ${unit.unitNo}` : 'Unit details' },
  ], `/properties/${unitId}`, unitsWorkspaceHref)

  useEffect(() => {
    let active = true
    unitsAPI.getById(unitId)
      .then((result) => { if (active) setUnit(result) })
      .catch((error) => {
        console.error('Error fetching unit:', error)
        if (active) setUnit(null)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [unitId])

  if (loading) return <UnitDetailsLoading />

  if (!unit) {
    return (
      <EmptyState
        icon={Building2}
        title="Unit not found"
        description="The unit does not exist or could not be loaded."
        action={<Button onClick={() => router.push(unitsWorkspaceHref)}>Back to Units</Button>}
        className="min-h-[60vh]"
      />
    )
  }

  const isCommercial = unit.unitType === 'COMMERCIAL'
  const isPerSqFt = unit.rentType === 'PER_SQFT'
  const unitName = unit.unitNo ? `Unit ${unit.unitNo}` : unit.type || 'Unit'
  const statusVariant = unit.status === 'VACANT' ? 'success' : 'info'

  return (
    <div className="min-w-0 space-y-6">
      <Button variant="outline" onClick={() => router.push(unitsWorkspaceHref)}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Units
      </Button>

      <Card>
        <CardContent className="flex min-w-0 flex-col gap-4 pt-5 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <DoorOpen className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{unitName}</h1>
              <Badge variant={statusVariant}>{formatEnumLabel(unit.status)}</Badge>
              <Badge variant="outline">{formatEnumLabel(unit.unitType)}</Badge>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {unit.property?.name || 'Property unavailable'}
              {unit.floor ? ` · Floor ${unit.floor}` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Rent Amount"
          value={formatExactKes(unit.rentAmount)}
          description={rentTypeLabels[unit.rentType]}
          icon={<Banknote className="h-5 w-5" />}
          tone="primary"
          title={formatExactKes(unit.rentAmount)}
        />
        <StatCard
          label="Unit Size"
          value={`${unit.sizeSqFt.toLocaleString()} sq ft`}
          description={unit.type || formatEnumLabel(unit.unitType)}
          icon={<Maximize2 className="h-5 w-5" />}
          tone="info"
        />
        {!isCommercial ? (
          <>
            <StatCard label="Bedrooms" value={unit.bedrooms ?? 0} icon={<BedDouble className="h-5 w-5" />} />
            <StatCard label="Bathrooms" value={unit.bathrooms ?? 0} icon={<Bath className="h-5 w-5" />} />
          </>
        ) : (
          <StatCard
            label="Business Usage"
            value={unit.usage || 'N/A'}
            description="Commercial classification"
            icon={<Building2 className="h-5 w-5" />}
            className="sm:col-span-2"
          />
        )}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border">
            <SectionHeader title="Unit information" description="Classification, dimensions and current occupancy." />
          </CardHeader>
          <CardContent>
            <DetailList>
              <DetailItem label="Unit ID"><span className="break-all font-mono text-xs">{unit.id}</span></DetailItem>
              <DetailItem label="Unit Number">{unit.unitNo || 'N/A'}</DetailItem>
              <DetailItem label="Unit Type"><Badge variant="outline">{formatEnumLabel(unit.unitType)}</Badge></DetailItem>
              <DetailItem label="Classification">{unit.type || 'N/A'}</DetailItem>
              {unit.floor && <DetailItem label="Floor">{unit.floor}</DetailItem>}
              <DetailItem label="Size">{unit.sizeSqFt.toLocaleString()} sq ft</DetailItem>
              {!isCommercial && <DetailItem label="Bedrooms">{unit.bedrooms ?? 0}</DetailItem>}
              {!isCommercial && <DetailItem label="Bathrooms">{unit.bathrooms ?? 0}</DetailItem>}
              {isCommercial && <DetailItem label="Business Usage">{unit.usage || 'N/A'}</DetailItem>}
              <DetailItem label="Status"><Badge variant={statusVariant}>{formatEnumLabel(unit.status)}</Badge></DetailItem>
            </DetailList>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <SectionHeader title="Rent information" description="Configured rent and pricing basis for this unit." />
          </CardHeader>
          <CardContent>
            <DetailList>
              <DetailItem label="Rent Amount">
                <span className="font-semibold" title={formatExactKes(unit.rentAmount)}>{formatExactKes(unit.rentAmount)}</span>
              </DetailItem>
              <DetailItem label="Rent Type">{rentTypeLabels[unit.rentType]}</DetailItem>
              {isPerSqFt && unit.calculationInfo && (
                <>
                  <DetailItem label="Rate per sq ft">{formatExactKes(unit.calculationInfo.ratePerSqFt ?? 0)}</DetailItem>
                  <DetailItem label="Calculation Area">{(unit.calculationInfo.sizeSqFt ?? unit.sizeSqFt).toLocaleString()} sq ft</DetailItem>
                  <DetailItem label="Calculated Rent">{formatExactKes(unit.calculationInfo.calculatedRent ?? unit.rentAmount)}</DetailItem>
                  <DetailItem label="Formula">{unit.calculationInfo.formula || 'N/A'}</DetailItem>
                </>
              )}
            </DetailList>
            {isPerSqFt && (
              <p className="mt-4 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-5 text-muted-foreground">
                Rent is calculated by multiplying the configured square-foot rate by the unit area.
              </p>
            )}
          </CardContent>
        </Card>

        {unit.tenant && (
          <Card>
            <CardHeader className="border-b border-border">
              <SectionHeader
                title="Associated tenant"
                description="Current tenant assigned to this unit."
                leading={<div className="rounded-lg bg-primary/10 p-2 text-primary"><UserRound className="h-4 w-4" aria-hidden="true" /></div>}
              />
            </CardHeader>
            <CardContent>
              <DetailList>
                <DetailItem label="Tenant Name">{unit.tenant.fullName}</DetailItem>
                <DetailItem label="Contact">{unit.tenant.contact || 'N/A'}</DetailItem>
                <DetailItem label="Email">{unit.tenant.email || 'N/A'}</DetailItem>
                <DetailItem label="Lease Term">{unit.tenant.leaseTerm || 'N/A'}</DetailItem>
                <DetailItem label="Payment Policy">{formatEnumLabel(unit.tenant.paymentPolicy)}</DetailItem>
                <DetailItem label="Tenant Status"><Badge variant={unit.tenant.status === 'ACTIVE' ? 'success' : 'neutral'}>{formatEnumLabel(unit.tenant.status)}</Badge></DetailItem>
              </DetailList>
            </CardContent>
          </Card>
        )}

        {unit.property && (
          <Card className={unit.tenant ? '' : 'lg:col-span-2'}>
            <CardHeader className="border-b border-border">
              <SectionHeader
                title="Property information"
                description="The property associated with this unit."
                leading={<div className="rounded-lg bg-primary/10 p-2 text-primary"><Building2 className="h-4 w-4" aria-hidden="true" /></div>}
              />
            </CardHeader>
            <CardContent>
              <DetailList>
                <DetailItem label="Property Name">{unit.property.name}</DetailItem>
                <DetailItem label="Address">{unit.property.address}</DetailItem>
                <DetailItem label="Property Type"><Badge variant="secondary">{formatEnumLabel(unit.property.form)}</Badge></DetailItem>
                <DetailItem label="Usage Type">{formatEnumLabel(unit.property.usage)}</DetailItem>
              </DetailList>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function UnitDetailsLoading() {
  return (
    <div className="space-y-6" aria-label="Loading unit details">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}
