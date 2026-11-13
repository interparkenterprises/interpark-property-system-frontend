'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { AdministrationWorkspace } from '@/components/administration/AdministrationWorkspace'
import { UserActionDialogs } from '@/components/administration/users/UserActionDialogs'
import { UsersTable } from '@/components/administration/users/UsersTable'
import type { ManagedUserRecord, StatusFilter } from '@/components/administration/users/user-management'
import { getCustomRoleName, getPropertyPreview } from '@/components/administration/users/user-management'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { managedUsersAPI } from '@/lib/api'

type PendingAction = { type: 'enable' | 'disable' | 'delete'; user: ManagedUserRecord } | null

export default function UsersPage() {
  const { canManageUsers } = useGlobalPermissions()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<ManagedUserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionKey, setActionKey] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [role, setRole] = useState(searchParams.get('role') || 'all')
  const [status, setStatus] = useState<StatusFilter>((searchParams.get('status') as StatusFilter) || 'all')

  const loadUsers = useCallback(async (refresh = false) => {
    if (!canManageUsers) return
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const data = await managedUsersAPI.getAll()
      setUsers(data as ManagedUserRecord[])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load managed users.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [canManageUsers])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void loadUsers())
    return () => window.cancelAnimationFrame(frame)
  }, [loadUsers])
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (role !== 'all') params.set('role', role)
    if (status !== 'all') params.set('status', status)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, role, router, search, status])

  const roles = useMemo(() => Array.from(new Set(users.flatMap((user) => [user.role, getCustomRoleName(user)]).filter(Boolean))).sort(), [users])
  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter((user) => {
      if (role !== 'all' && user.role !== role && getCustomRoleName(user) !== role) return false
      if (status === 'active' && !user.canManagerLogin) return false
      if (status === 'inactive' && user.canManagerLogin) return false
      if (!term) return true
      return [user.name, user.email, user.role, getCustomRoleName(user), ...getPropertyPreview(user)].join(' ').toLowerCase().includes(term)
    })
  }, [role, search, status, users])

  const performAction = async () => {
    if (!pendingAction) return
    const { type, user } = pendingAction
    setActionKey(`${type}-${user.id}`)
    setError(null)
    setSuccess(null)
    try {
      if (type === 'enable') await managedUsersAPI.enable(user.id)
      if (type === 'disable') await managedUsersAPI.disable(user.id)
      if (type === 'delete') await managedUsersAPI.delete(user.id)
      setSuccess(type === 'delete' ? `${user.name} deleted successfully.` : `${user.name} ${type === 'enable' ? 'enabled' : 'disabled'} successfully.`)
      setPendingAction(null)
      await loadUsers(true)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Failed to ${type} ${user.name}.`)
    } finally {
      setActionKey(null)
    }
  }

  if (!canManageUsers) return <Alert variant="destructive"><AlertTitle>Access denied</AlertTitle><AlertDescription>You do not have permission to manage users.</AlertDescription></Alert>

  return <div className="min-w-0 space-y-6 pb-4">
    <PageHeader title="User Settings" description="Manage users, roles and property access." actions={<Button variant="outline" size="sm" loading={refreshing} onClick={() => void loadUsers(true)}><RefreshCw className="h-4 w-4" aria-hidden="true" />Refresh</Button>} />
    <AdministrationWorkspace><div className="space-y-6">
    {error && <Alert variant="destructive"><AlertTitle>Unable to complete request</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
    {success && <Alert variant="success"><AlertTitle>Changes saved</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}
    <Card><CardContent className="grid gap-4 pt-5 md:grid-cols-4">
      <div className="md:col-span-2"><Input label="Search" placeholder="Search name, email, role or property" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <div className="space-y-1.5"><label className="text-sm font-medium" htmlFor="user-role-filter">Role</label><Select value={role} onValueChange={setRole}><SelectTrigger id="user-role-filter"><SelectValue placeholder="All roles" /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem>{roles.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><label className="text-sm font-medium" htmlFor="user-status-filter">Status</label><Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}><SelectTrigger id="user-status-filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Disabled</SelectItem></SelectContent></Select></div>
    </CardContent></Card>
    <UsersTable users={filteredUsers} loading={loading} hasFilters={Boolean(search || role !== 'all' || status !== 'all')} actionKey={actionKey} onAction={(type, user) => setPendingAction({ type, user })} />
    {pendingAction && <UserActionDialogs open title={pendingAction.type === 'delete' ? `Delete ${pendingAction.user.name}?` : `${pendingAction.type === 'disable' ? 'Disable' : 'Enable'} ${pendingAction.user.name}?`} description={pendingAction.type === 'delete' ? 'This permanently deletes the user and cannot be undone. Disabling the account is available as a separate action.' : pendingAction.type === 'disable' ? 'This user will no longer be able to sign in.' : 'This user will regain manager login access.'} confirmLabel={pendingAction.type === 'delete' ? 'Delete user' : pendingAction.type === 'disable' ? 'Disable account' : 'Enable account'} destructive={pendingAction.type === 'delete'} loading={actionKey !== null} onConfirm={() => void performAction()} onOpenChange={(open) => !open && setPendingAction(null)} />}
    </div></AdministrationWorkspace>
  </div>
}
