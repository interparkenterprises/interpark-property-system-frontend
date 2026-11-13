import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DetailItem, DetailList } from '@/components/ui/detail-list'
import type { RoleRecord } from './role-management'
import { formatRoleDateTime, rolePermissions, rolePropertyIds } from './role-management'

export function RoleOverview({ role }: { role: RoleRecord }) {
  return (
    <div className="space-y-4">
      <Alert variant="warning">
        <AlertTitle>Shared role configuration</AlertTitle>
        <AlertDescription>Changes to this role can alter permissions and property access for every user currently assigned to it.</AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Role Overview</CardTitle>
          <CardDescription>Identity, scope and assignment information for this custom role.</CardDescription>
        </CardHeader>
        <CardContent>
          <DetailList>
            <DetailItem label="Role name">{role.name}</DetailItem>
            <DetailItem label="Description">{role.description || 'No description provided.'}</DetailItem>
            <DetailItem label="Created">{formatRoleDateTime(role.createdAt)}</DetailItem>
            <DetailItem label="Last updated">{formatRoleDateTime(role.updatedAt)}</DetailItem>
            <DetailItem label="Permissions"><Badge variant="secondary">{rolePermissions(role).length}</Badge></DetailItem>
            <DetailItem label="Associated properties"><Badge variant="secondary">{rolePropertyIds(role).length}</Badge></DetailItem>
            <DetailItem label="Assigned users"><Badge variant="secondary">{role.assignments?.length || 0}</Badge></DetailItem>
          </DetailList>
        </CardContent>
      </Card>
    </div>
  )
}
