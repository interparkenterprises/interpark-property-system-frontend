import Link from 'next/link'
import type { UserAccessDetails } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button, buttonStyles } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { KnownProperty, PropertyPermissionKey } from './user-management'
import { formatUserDate, PROPERTY_PERMISSION_OPTIONS } from './user-management'

interface UserPropertyAccessProps {
  details: UserAccessDetails
  availableProperties: KnownProperty[]
  drafts: Record<string, PropertyPermissionKey[]>
  grantPropertyId: string
  manualPropertyId: string
  grantPermissions: PropertyPermissionKey[]
  actionKey: string | null
  onGrantPropertyChange: (value: string) => void
  onManualPropertyChange: (value: string) => void
  onToggleGrantPermission: (permission: PropertyPermissionKey) => void
  onToggleDraftPermission: (propertyId: string, permission: PropertyPermissionKey) => void
  onGrant: () => void
  onSave: (propertyId: string, propertyName: string) => void
  onRevoke: (propertyId: string, propertyName: string) => void
  onRegrant: (propertyId: string, propertyName: string) => void
}

function PermissionChecks({ selected, prefix, onToggle }: { selected: PropertyPermissionKey[]; prefix: string; onToggle: (permission: PropertyPermissionKey) => void }) {
  return <div className="flex flex-wrap gap-x-5 gap-y-3">{PROPERTY_PERMISSION_OPTIONS.map((permission) => <Label key={`${prefix}-${permission.key}`} className="flex cursor-pointer items-center gap-2 font-normal"><Checkbox checked={selected.includes(permission.key)} onChange={() => onToggle(permission.key)} />{permission.label}</Label>)}</div>
}

export function UserPropertyAccess(props: UserPropertyAccessProps) {
  const { details, availableProperties, drafts, grantPropertyId, manualPropertyId, grantPermissions, actionKey } = props
  const inherited = details.currentAccess.role?.defaultProperties || []
  const direct = details.currentAccess.properties.filter((property) => property.isActive)
  const revoked = details.currentAccess.properties.filter((property) => !property.isActive)
  return <div className="space-y-4">
    <Card><CardHeader><CardTitle>Grant property access</CardTitle><CardDescription>Add a direct property grant. Properties inherited from the assigned role are excluded.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-1.5"><Label>Eligible property</Label><Select value={grantPropertyId} onValueChange={props.onGrantPropertyChange}><SelectTrigger><SelectValue placeholder="Select a property" /></SelectTrigger><SelectContent>{availableProperties.map((property) => <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>)}</SelectContent></Select>{!availableProperties.length && <p className="text-xs text-muted-foreground">No known eligible properties are available.</p>}</div><Input label="Or enter property ID" helperText="The backend will verify that you are allowed to grant this property." placeholder="Property ID" value={manualPropertyId} onChange={(event) => props.onManualPropertyChange(event.target.value)} /></div><div className="space-y-3"><Label>Permissions</Label><PermissionChecks selected={grantPermissions} prefix="grant" onToggle={props.onToggleGrantPermission} /></div><Button loading={actionKey === `grant-property-${details.user.id}`} onClick={props.onGrant}>Grant access</Button></CardContent></Card>
    <Card><CardHeader><CardTitle>Inherited from role</CardTitle><CardDescription>These properties come from {details.currentAccess.role?.name || 'the assigned role'} and cannot be revoked for only this user.</CardDescription></CardHeader><CardContent>{inherited.length ? <div className="divide-y divide-border">{inherited.map((property) => <div key={property.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{property.name}</p><p className="text-xs text-muted-foreground">Inherited from {details.currentAccess.role?.name}</p></div><Badge variant="neutral">Inherited from role</Badge></div>)}</div> : <p className="text-sm text-muted-foreground">No properties are inherited from this role.</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Directly granted</CardTitle><CardDescription>Edit property-specific permissions or revoke a direct grant.</CardDescription></CardHeader><CardContent>{direct.length ? <div className="space-y-4">{direct.map((property) => <div key={property.id} className="rounded-md border border-border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{property.name}</p><Badge variant="info">Direct access</Badge></div><p className="mt-1 text-xs text-muted-foreground">Granted {formatUserDate(property.grantedAt)} · Expires {formatUserDate(property.expiresAt)}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" loading={actionKey === `save-property-${property.id}`} onClick={() => props.onSave(property.id, property.name)}>Save permissions</Button><Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" loading={actionKey === `revoke-property-${property.id}`} onClick={() => props.onRevoke(property.id, property.name)}>Revoke access</Button></div></div><div className="mt-4"><PermissionChecks selected={drafts[property.id] || []} prefix={property.id} onToggle={(permission) => props.onToggleDraftPermission(property.id, permission)} /></div></div>)}</div> : <p className="text-sm text-muted-foreground">No active direct property grants.</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Revoked / available for re-grant</CardTitle><CardDescription>Previously revoked direct grants can be restored with view access.</CardDescription></CardHeader><CardContent>{revoked.length ? <div className="divide-y divide-border">{revoked.map((property) => <div key={property.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{property.name}</p><p className="text-xs text-muted-foreground">Previous grant date {formatUserDate(property.grantedAt)}</p></div><Button size="sm" variant="outline" loading={actionKey === `regrant-property-${property.id}`} onClick={() => props.onRegrant(property.id, property.name)}>Grant access again</Button></div>)}</div> : <p className="text-sm text-muted-foreground">No revoked direct grants.</p>}</CardContent></Card>
    {details.currentAccess.role && <p className="text-sm text-muted-foreground">Inherited property changes affect every user with the role. Review them in <Link href="/roles" className={buttonStyles({ variant: 'link' })}>Role Management</Link>.</p>}
  </div>
}
