import Link from 'next/link'
import { Archive, ArchiveRestore, Pencil, Trash2, UsersRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonStyles } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ManagedUserRecord } from './user-management'
import { formatUserDate, getCustomRoleName, getPropertyPreview } from './user-management'

type UserAction = 'enable' | 'disable' | 'delete'
interface UsersTableProps { users: ManagedUserRecord[]; loading: boolean; hasFilters: boolean; actionKey: string | null; onAction: (action: UserAction, user: ManagedUserRecord) => void }

function IconAction({ label, children, ...props }: React.ComponentProps<typeof Button> & { label: string }) {
  return <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" aria-label={label} {...props}>{children}</Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
}

function UserIdentity({ user }: { user: ManagedUserRecord }) {
  return <div className="min-w-0"><Link href={`/users/${user.id}`} className="block truncate font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{user.name}</Link><p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p></div>
}

function UserActions({ user, actionKey, onAction }: Pick<UsersTableProps, 'actionKey' | 'onAction'> & { user: ManagedUserRecord }) {
  const active = user.canManagerLogin === true
  const busy = actionKey?.endsWith(user.id) ?? false
  return <div className="flex items-center gap-1">
    <Tooltip><TooltipTrigger asChild><Link href={`/users/${user.id}?section=role&edit=true`} aria-label={`Edit access for ${user.name}`} className={buttonStyles({ variant: 'ghost', size: 'icon' })}><Pencil className="h-4 w-4" aria-hidden="true" /></Link></TooltipTrigger><TooltipContent>Edit access</TooltipContent></Tooltip>
    <IconAction label={active ? 'Disable account' : 'Enable account'} disabled={busy} loading={actionKey === `${active ? 'disable' : 'enable'}-${user.id}`} onClick={() => onAction(active ? 'disable' : 'enable', user)}>{active ? <Archive className="h-4 w-4" aria-hidden="true" /> : <ArchiveRestore className="h-4 w-4" aria-hidden="true" />}</IconAction>
    <IconAction label="Delete user" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={busy} loading={actionKey === `delete-${user.id}`} onClick={() => onAction('delete', user)}><Trash2 className="h-4 w-4" aria-hidden="true" /></IconAction>
  </div>
}

function PropertiesSummary({ user }: { user: ManagedUserRecord }) {
  const properties = getPropertyPreview(user)
  if (!properties.length) return <span className="text-muted-foreground">No properties</span>
  return <span title={properties.join(', ')}>{properties.length} propert{properties.length === 1 ? 'y' : 'ies'}</span>
}

export function UsersTable({ users, loading, hasFilters, actionKey, onAction }: UsersTableProps) {
  if (loading) return <UsersTableSkeleton />
  if (!users.length) return <EmptyState icon={UsersRound} title={hasFilters ? 'No users match these filters' : 'No managed users found'} description={hasFilters ? 'Adjust the search or filters and try again.' : 'Managed users will appear here when they are created.'} />
  return <TooltipProvider><div className="space-y-3">
    <div className="hidden md:block"><Table className="min-w-[900px]"><TableHead><TableHeader>Name</TableHeader><TableHeader>Role</TableHeader><TableHeader>Status</TableHeader><TableHeader>Properties</TableHeader><TableHeader className="hidden xl:table-cell">Created</TableHeader><TableHeader>Actions</TableHeader></TableHead><TableBody>{users.map((user) => <TableRow key={user.id}><TableCell className="min-w-56 whitespace-normal"><UserIdentity user={user} /></TableCell><TableCell className="whitespace-normal"><Badge variant="secondary">{getCustomRoleName(user) || user.role || 'No role'}</Badge></TableCell><TableCell><Badge variant={user.canManagerLogin ? 'success' : 'warning'}>{user.canManagerLogin ? 'Active' : 'Disabled'}</Badge></TableCell><TableCell><PropertiesSummary user={user} /></TableCell><TableCell className="hidden text-muted-foreground xl:table-cell">{formatUserDate(user.createdAt)}</TableCell><TableCell><UserActions user={user} actionKey={actionKey} onAction={onAction} /></TableCell></TableRow>)}</TableBody></Table></div>
    <div className="grid gap-3 md:hidden">{users.map((user) => <Card key={user.id}><CardHeader className="pb-3"><UserIdentity user={user} /></CardHeader><CardContent className="grid grid-cols-2 gap-3 text-xs"><div><p className="text-muted-foreground">Role</p><p className="mt-1 font-medium">{getCustomRoleName(user) || user.role || 'No role'}</p></div><div><p className="text-muted-foreground">Status</p><Badge className="mt-1" variant={user.canManagerLogin ? 'success' : 'warning'}>{user.canManagerLogin ? 'Active' : 'Disabled'}</Badge></div><div><p className="text-muted-foreground">Properties</p><p className="mt-1 font-medium"><PropertiesSummary user={user} /></p></div><div><p className="text-muted-foreground">Created</p><p className="mt-1 font-medium">{formatUserDate(user.createdAt)}</p></div></CardContent><CardFooter className="px-3 py-2"><UserActions user={user} actionKey={actionKey} onAction={onAction} /></CardFooter></Card>)}</div>
    <p className="text-sm text-muted-foreground">Showing {users.length} user{users.length === 1 ? '' : 's'}</p>
  </div></TooltipProvider>
}

export function UsersTableSkeleton() {
  return <div className="rounded-md border border-border p-4" aria-label="Loading users" aria-busy="true"><Skeleton className="h-4 w-40" /><div className="mt-5 space-y-5">{[0,1,2,3].map((row) => <div key={row} className="grid grid-cols-[1fr_8rem_8rem] gap-6 border-t border-border pt-4"><div className="space-y-2"><Skeleton className="h-4 w-44" /><Skeleton className="h-3 w-56" /></div><Skeleton className="h-6 w-20" /><Skeleton className="h-8 w-28" /></div>)}</div></div>
}
