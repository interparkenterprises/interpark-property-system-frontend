import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CustomRoleRecord } from './create-role-types'
import { formatCategory } from './create-role-types'

export function SelectedRolePreview({ role }: { role: CustomRoleRecord }) {
  const properties = role.propertyAccess || []
  const groupedPermissions = role.permissions.reduce<Record<string, number>>((groups, entry) => {
    const permission = 'code' in entry ? entry : entry.permission
    const category = permission?.category || 'OTHER'
    groups[category] = (groups[category] || 0) + 1
    return groups
  }, {})

  return (
    <Card className="bg-muted/20">
      <CardHeader>
        <CardTitle>{role.name}</CardTitle>
        <CardDescription>{role.description || 'No role description provided.'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inherited properties</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {properties.length ? properties.map((entry, index) => (
              <Badge key={entry.property?.id || entry.propertyId || index} variant="outline">
                {entry.property?.name || entry.propertyId || 'Property'}
              </Badge>
            )) : <span className="text-sm text-muted-foreground">No associated properties returned.</span>}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Permission categories</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(groupedPermissions).length ? Object.entries(groupedPermissions).map(([category, count]) => (
              <Badge key={category} variant="secondary">{formatCategory(category)} · {count}</Badge>
            )) : <span className="text-sm text-muted-foreground">No permissions returned.</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
