import Link from 'next/link'
import type { CustomRole, PermissionInfo, UserAccessDetails } from '@/types'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button, buttonStyles } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UserRolePermissionsProps {
  details: UserAccessDetails
  roles: CustomRole[]
  selectedRoleId: string
  saving: boolean
  onRoleChange: (roleId: string) => void
  onSave: () => void
}

export function UserRolePermissions({ details, roles, selectedRoleId, saving, onRoleChange, onSave }: UserRolePermissionsProps) {
  const role = details.currentAccess.role
  const grouped = (role?.permissions || []).reduce<Record<string, PermissionInfo[]>>((result, permission) => {
    const category = permission.category || 'Other'
    result[category] = [...(result[category] || []), permission]
    return result
  }, {})
  return <div className="space-y-4">
    <Card><CardHeader><CardTitle>Assigned custom role</CardTitle><CardDescription>{role?.description || 'Change the role that provides this user’s inherited permissions and properties.'}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"><Select value={selectedRoleId} onValueChange={onRoleChange}><SelectTrigger aria-label="Assigned role"><SelectValue placeholder="Select a role" /></SelectTrigger><SelectContent>{roles.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}{item.id === role?.id ? ' (Current)' : ''}</SelectItem>)}</SelectContent></Select><Button onClick={onSave} loading={saving} disabled={!selectedRoleId || selectedRoleId === role?.id}>Switch role</Button></div><p className="text-xs text-muted-foreground">Changing the role changes the user’s inherited permissions and property access. Direct property grants remain separate.</p></CardContent></Card>
    <Card><CardHeader><CardTitle>Inherited role permissions</CardTitle><CardDescription>These permissions come from {role?.name || 'the assigned role'} and are not independently editable here.</CardDescription></CardHeader><CardContent>{Object.keys(grouped).length ? <Accordion multiple defaultValue={Object.keys(grouped)}>{Object.entries(grouped).map(([category, permissions]) => <AccordionItem key={category} value={category}><AccordionTrigger>{category} <Badge variant="neutral" className="ml-2">{permissions.length}</Badge></AccordionTrigger><AccordionContent><div className="flex flex-wrap gap-2">{permissions.map((permission) => <Badge key={permission.code} variant="outline" title={permission.name}>{permission.code}</Badge>)}</div></AccordionContent></AccordionItem>)}</Accordion> : <p className="text-sm text-muted-foreground">No role permissions assigned.</p>}</CardContent></Card>
    {role && <p className="text-sm text-muted-foreground">To change inherited permissions for every user with this role, use <Link href="/roles" className={buttonStyles({ variant: 'link' })}>Role Management</Link>.</p>}
  </div>
}
