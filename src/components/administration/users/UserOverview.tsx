import type { ManagedUser, UserAccessDetails } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DetailItem, DetailList } from '@/components/ui/detail-list'
import { formatUserDate } from './user-management'

export function UserOverview({ details, record }: { details: UserAccessDetails; record?: ManagedUser }) {
  const direct = details.currentAccess.properties.filter((property) => property.isActive).length
  const inherited = details.currentAccess.role?.defaultProperties?.length ?? 0
  return <div className="grid gap-4 xl:grid-cols-2">
    <Card><CardHeader><CardTitle>User information</CardTitle><CardDescription>Account identity and current state.</CardDescription></CardHeader><CardContent><DetailList><DetailItem label="Name">{details.user.name}</DetailItem><DetailItem label="Email">{details.user.email}</DetailItem><DetailItem label="Base role">{record?.role || '—'}</DetailItem><DetailItem label="Custom role">{details.currentAccess.role?.name || 'No custom role'}</DetailItem><DetailItem label="Account status"><Badge variant={details.user.canManagerLogin ? 'success' : 'warning'}>{details.user.canManagerLogin ? 'Active' : 'Disabled'}</Badge></DetailItem><DetailItem label="Created">{formatUserDate(record?.createdAt)}</DetailItem></DetailList></CardContent></Card>
    <Card><CardHeader><CardTitle>Access summary</CardTitle><CardDescription>Authoritative role and property access returned by the access service.</CardDescription></CardHeader><CardContent><DetailList><DetailItem label="Assigned role">{details.currentAccess.role?.name || 'No custom role'}</DetailItem><DetailItem label="Direct properties">{direct}</DetailItem><DetailItem label="Inherited properties">{inherited}</DetailItem><DetailItem label="Total accessible">{direct + inherited}</DetailItem><DetailItem label="Access enabled"><Badge variant={details.currentAccess.isEnabled ? 'success' : 'warning'}>{details.currentAccess.isEnabled ? 'Enabled' : 'Disabled'}</Badge></DetailItem></DetailList></CardContent></Card>
  </div>
}
