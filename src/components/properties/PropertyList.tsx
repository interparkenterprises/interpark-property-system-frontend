'use client'

import { Eye, Pencil, Trash2 } from 'lucide-react'
import type { Property } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface PropertyListProps {
  properties: Property[]
  viewingId: string | null
  editingId: string | null
  deletingId: string | null
  canEdit: (property: Property) => boolean
  canDelete: (property: Property) => boolean
  onView: (propertyId: string) => void
  onEdit: (property: Property) => void
  onDelete: (property: Property) => Promise<void>
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function usageVariant(usage: Property['usage']) {
  if (usage === 'RESIDENTIAL') return 'success' as const
  if (usage === 'COMMERCIAL') return 'info' as const
  if (usage === 'INDUSTRIAL') return 'warning' as const
  return 'neutral' as const
}

function PropertyIdentity({ property, busy, onView }: { property: Property; busy: boolean; onView: (propertyId: string) => void }) {
  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => onView(property.id)}
        disabled={busy}
        className="block max-w-full truncate text-left font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {property.name}
      </button>
      {property.lrNumber && <p className="mt-0.5 truncate text-xs text-muted-foreground">LR: {property.lrNumber}</p>}
    </div>
  )
}

function PropertyTypes({ property }: { property: Property }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant={usageVariant(property.usage)}>{formatLabel(property.usage)}</Badge>
      <Badge variant="secondary">{formatLabel(property.form)}</Badge>
    </div>
  )
}

function PropertyActions({
  property,
  viewingId,
  editingId,
  deletingId,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: Omit<PropertyListProps, 'properties'> & { property: Property }) {
  const isViewing = viewingId === property.id
  const isEditing = editingId === property.id
  const isDeleting = deletingId === property.id
  const rowBusy = isViewing || isEditing || isDeleting

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button variant="ghost" size="sm" loading={isViewing} disabled={rowBusy && !isViewing} onClick={() => onView(property.id)}>
        {!isViewing && <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
        {isViewing ? 'Opening...' : 'View'}
      </Button>
      {canEdit(property) && (
        <Button variant="ghost" size="sm" loading={isEditing} disabled={rowBusy && !isEditing} onClick={() => onEdit(property)}>
          {!isEditing && <Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
          {isEditing ? 'Opening...' : 'Edit'}
        </Button>
      )}
      {canDelete(property) && (
        <Button
          variant="ghost"
          size="sm"
          loading={isDeleting}
          disabled={rowBusy && !isDeleting}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => void onDelete(property)}
        >
          {!isDeleting && <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      )}
    </div>
  )
}

export function PropertyList(props: PropertyListProps) {
  const { properties, viewingId, editingId, deletingId, onView } = props

  return (
    <div className="space-y-3">
      <div className="hidden md:block">
        <Table className="min-w-[880px]">
          <TableHead>
            <TableHeader>Property</TableHeader>
            <TableHeader className="hidden xl:table-cell">Address</TableHeader>
            <TableHeader>Type</TableHeader>
            <TableHeader className="hidden lg:table-cell">Landlord</TableHeader>
            <TableHeader>Units</TableHeader>
            <TableHeader>Actions</TableHeader>
          </TableHead>
          <TableBody>
            {properties.map((property) => {
              const rowBusy = viewingId === property.id || editingId === property.id || deletingId === property.id
              return (
                <TableRow key={property.id}>
                  <TableCell className="min-w-52 whitespace-normal"><PropertyIdentity property={property} busy={rowBusy} onView={onView} /></TableCell>
                  <TableCell className="hidden max-w-72 whitespace-normal text-muted-foreground xl:table-cell"><span className="line-clamp-2">{property.address}</span></TableCell>
                  <TableCell className="min-w-44 whitespace-normal"><PropertyTypes property={property} /></TableCell>
                  <TableCell className="hidden min-w-44 whitespace-normal lg:table-cell">
                    <p className="font-medium text-foreground">{property.landlord?.name || '—'}</p>
                    {property.landlord?.phone && <p className="mt-0.5 text-xs text-muted-foreground">{property.landlord.phone}</p>}
                  </TableCell>
                  <TableCell><Badge variant={(property.units?.length ?? 0) > 0 ? 'secondary' : 'neutral'}>{property.units?.length ?? 0}</Badge></TableCell>
                  <TableCell className="min-w-64"><PropertyActions {...props} property={property} /></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {properties.map((property) => {
          const rowBusy = viewingId === property.id || editingId === property.id || deletingId === property.id
          return (
            <Card key={property.id}>
              <CardHeader className="pb-3"><PropertyIdentity property={property} busy={rowBusy} onView={onView} /></CardHeader>
              <CardContent className="space-y-4">
                <PropertyTypes property={property} />
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Address</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{property.address}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Landlord</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{property.landlord?.name || '—'}</dd>
                    {property.landlord?.phone && <dd className="mt-0.5 text-muted-foreground">{property.landlord.phone}</dd>}
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Units</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{property.units?.length ?? 0}</dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter className="px-3 py-2"><PropertyActions {...props} property={property} /></CardFooter>
            </Card>
          )
        })}
      </div>

      <p className="text-sm text-muted-foreground">Showing {properties.length} propert{properties.length === 1 ? 'y' : 'ies'}</p>
    </div>
  )
}

export function PropertyListSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading properties" aria-busy="true">
      <div className="rounded-md border border-border p-4">
        <Skeleton className="h-4 w-40" />
        <div className="mt-5 space-y-5">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="grid grid-cols-[minmax(0,1fr)_7rem] gap-6 border-t border-border pt-4 sm:grid-cols-[minmax(0,1fr)_9rem_12rem]">
              <div className="space-y-2"><Skeleton className="h-4 w-44 max-w-full" /><Skeleton className="h-3 w-64 max-w-full" /></div>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="hidden h-8 w-44 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
