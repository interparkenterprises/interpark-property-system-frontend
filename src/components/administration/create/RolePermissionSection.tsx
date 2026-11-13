import type { Permission } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { formatCategory } from './create-role-types'

interface RolePermissionSectionProps {
  category: string
  permissions: Permission[]
  selectedIds: string[]
  search: string
  onSearchChange: (value: string) => void
  onToggle: (id: string) => void
  onToggleCategory: () => void
  readOnly?: boolean
}

export function RolePermissionSection({
  category,
  permissions,
  selectedIds,
  search,
  onSearchChange,
  onToggle,
  onToggleCategory,
  readOnly = false,
}: RolePermissionSectionProps) {
  const selectedCount = permissions.filter((permission) => selectedIds.includes(permission.id)).length
  const term = search.trim().toLowerCase()
  const visiblePermissions = permissions.filter((permission) =>
    `${permission.name} ${permission.code} ${permission.description || ''}`.toLowerCase().includes(term),
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{formatCategory(category)}</CardTitle>
            <CardDescription>{readOnly ? 'Permissions currently included in this role.' : 'Select the permissions this role receives in this category.'}</CardDescription>
          </div>
          <Badge variant="secondary">{selectedCount}/{permissions.length} selected</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Input
            label="Search this category"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search permission name or code"
            className="sm:min-w-72"
          />
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={onToggleCategory}>
              {selectedCount === permissions.length ? 'Deselect category' : 'Select category'}
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {visiblePermissions.map((permission) => (
            <label
              key={permission.id}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
            >
              <Checkbox
                className="mt-0.5"
                checked={selectedIds.includes(permission.id)}
                disabled={readOnly}
                onChange={() => onToggle(permission.id)}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{permission.name}</span>
                  <Badge variant="outline">{permission.code}</Badge>
                </span>
                {permission.description && (
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {permission.description}
                  </span>
                )}
              </span>
            </label>
          ))}
          {!visiblePermissions.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">No permissions match this search.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
