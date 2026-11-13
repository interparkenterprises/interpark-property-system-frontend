import Link from 'next/link'
import type { Property } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button, buttonStyles } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Building2 } from 'lucide-react'

interface RolePropertyAccessSectionProps {
  properties: Property[]
  selectedIds: string[]
  error?: string
  search: string
  onSearchChange: (value: string) => void
  onToggle: (id: string) => void
  onToggleAll: () => void
  readOnly?: boolean
}

export function RolePropertyAccessSection({
  properties,
  selectedIds,
  error,
  search,
  onSearchChange,
  onToggle,
  onToggleAll,
  readOnly = false,
}: RolePropertyAccessSectionProps) {
  const term = search.trim().toLowerCase()
  const visibleProperties = properties.filter((property) =>
    `${property.name} ${property.address}`.toLowerCase().includes(term),
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Property Access</CardTitle>
            <CardDescription>{readOnly ? 'Properties currently associated with this role.' : 'Select the properties associated with this role.'}</CardDescription>
          </div>
          <Badge variant="secondary">{selectedIds.length} selected</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {properties.length ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <Input
                label="Search properties"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search by name or address"
                className="sm:min-w-72"
              />
              {!readOnly && (
                <Button type="button" variant="outline" size="sm" onClick={onToggleAll}>
                  {selectedIds.length === properties.length ? 'Deselect all' : 'Select all'}
                </Button>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              {visibleProperties.map((property) => (
                <label
                  key={property.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={selectedIds.includes(property.id)}
                    disabled={readOnly}
                    onChange={() => onToggle(property.id)}
                  />
                  <span className="min-w-0">
                    {readOnly ? (
                      <Link href={`/properties/${property.id}`} className="block text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline">
                        {property.name}
                      </Link>
                    ) : (
                      <span className="block text-sm font-medium text-foreground">{property.name}</span>
                    )}
                    <span className="block truncate text-xs text-muted-foreground">{property.address}</span>
                  </span>
                </label>
              ))}
            </div>
            {!visibleProperties.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">No properties match this search.</p>
            )}
          </>
        ) : (
          <EmptyState
            icon={Building2}
            title={readOnly ? 'No properties assigned' : 'No properties available'}
            description={readOnly ? 'This role does not currently provide access to any properties.' : 'Create a property before creating a property-scoped role.'}
            action={readOnly ? undefined : <Link href="/properties/create" className={buttonStyles()}>Create a Property</Link>}
          />
        )}
      </CardContent>
    </Card>
  )
}
