'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Archive, ArchiveRestore, RefreshCw, Trash2 } from 'lucide-react'
import type { CustomRole, UserAccessDetails } from '@/types'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { useBreadcrumbOverride } from '@/components/layout/BreadcrumbContext'
import { UserActionDialogs } from './UserActionDialogs'
import { UserAuditHistory } from './UserAuditHistory'
import { UserOverview } from './UserOverview'
import { UserPropertyAccess } from './UserPropertyAccess'
import { UserRolePermissions } from './UserRolePermissions'
import type { ManagedUserRecord, PropertyPermissionKey } from './user-management'
import { collectKnownProperties, getPropertyPermissions } from './user-management'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonStyles } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { customRolesAPI, managedUsersAPI } from '@/lib/api'

type Section = 'overview' | 'role' | 'properties' | 'audit'
type Confirmation = { type: 'role' } | { type: 'revoke'; propertyId: string; propertyName: string } | { type: 'enable' | 'disable' | 'delete' } | null

function parseSection(value: string | null): Section {
  return value === 'role' || value === 'properties' || value === 'audit' ? value : 'overview'
}

export function UserAccessWorkspace({ userId }: { userId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { canManageUsers } = useGlobalPermissions()
  const [details, setDetails] = useState<UserAccessDetails | null>(null)
  const [users, setUsers] = useState<ManagedUserRecord[]>([])
  const [roles, setRoles] = useState<CustomRole[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [section, setSection] = useState<Section>(parseSection(searchParams.get('section')))
  const [actionKey, setActionKey] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation>(null)
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [drafts, setDrafts] = useState<Record<string, PropertyPermissionKey[]>>({})
  const [grantPropertyId, setGrantPropertyId] = useState('')
  const [manualPropertyId, setManualPropertyId] = useState('')
  const [grantPermissions, setGrantPermissions] = useState<PropertyPermissionKey[]>(['VIEW'])

  useBreadcrumbOverride(`/users/${userId}`, loading ? 'Loading…' : details?.user.name ?? 'User access')

  const initialize = useCallback((access: UserAccessDetails) => {
    setDetails(access)
    setSelectedRoleId(access.currentAccess.role?.id || '')
    setDrafts(Object.fromEntries(access.currentAccess.properties.map((property) => [property.id, getPropertyPermissions(property)])))
  }, [])

  const load = useCallback(async (refresh = false) => {
    if (!canManageUsers) return
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const [access, allUsers, allRoles] = await Promise.all([managedUsersAPI.getAccessDetails(userId), managedUsersAPI.getAll(), customRolesAPI.getAll()])
      initialize(access)
      setUsers(allUsers as ManagedUserRecord[])
      setRoles(allRoles)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'User access details could not be loaded.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [canManageUsers, initialize, userId])

  const reloadAccess = useCallback(async () => {
    const [access, allUsers] = await Promise.all([managedUsersAPI.getAccessDetails(userId), managedUsersAPI.getAll()])
    initialize(access)
    setUsers(allUsers as ManagedUserRecord[])
  }, [initialize, userId])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load())
    return () => window.cancelAnimationFrame(frame)
  }, [load])

  const record = users.find((user) => user.id === userId)
  const knownProperties = useMemo(() => collectKnownProperties(users, details), [details, users])
  const availableProperties = useMemo(() => {
    const active = new Set(details?.currentAccess.properties.filter((property) => property.isActive).map((property) => property.id) || [])
    const inherited = new Set(details?.currentAccess.role?.defaultProperties?.map((property) => property.id) || [])
    return knownProperties.filter((property) => !active.has(property.id) && !inherited.has(property.id))
  }, [details, knownProperties])

  const selectSection = (value: string) => {
    const next = parseSection(value)
    setSection(next)
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', next)
    params.delete('edit')
    router.replace(`/users/${userId}?${params.toString()}`, { scroll: false })
  }

  const run = async (key: string, successMessage: string, request: () => Promise<unknown>, after?: () => void) => {
    setActionKey(key)
    setError(null)
    setSuccess(null)
    try {
      await request()
      await reloadAccess()
      after?.()
      setSuccess(successMessage)
      setConfirmation(null)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'The requested change could not be saved.')
    } finally {
      setActionKey(null)
    }
  }

  const saveRole = () => {
    if (!selectedRoleId || selectedRoleId === details?.currentAccess.role?.id) return
    setConfirmation({ type: 'role' })
  }

  const grant = async () => {
    if (!details) return
    const propertyId = grantPropertyId || manualPropertyId.trim()
    if (!propertyId) return setError('Select a property or enter a property ID.')
    if (!grantPermissions.length) return setError('Select at least one permission before granting access.')
    if (details.currentAccess.role?.defaultProperties?.some((property) => property.id === propertyId)) return setError('This property is already inherited from the assigned role.')
    if (details.currentAccess.properties.some((property) => property.id === propertyId && property.isActive)) return setError('This property already has an active direct grant.')
    await run(`grant-property-${userId}`, 'Property access granted successfully.', () => managedUsersAPI.grantPropertyAccess(userId, { propertyIds: [propertyId], canEdit: grantPermissions.includes('EDIT'), canExport: grantPermissions.includes('EXPORT') }), () => { setGrantPropertyId(''); setManualPropertyId(''); setGrantPermissions(['VIEW']) })
  }

  const confirmAction = async () => {
    if (!confirmation || !details) return
    if (confirmation.type === 'role') return run(`switch-role-${userId}`, 'Role changed successfully.', () => managedUsersAPI.updateAccess(userId, { roleId: selectedRoleId }))
    if (confirmation.type === 'revoke') return run(`revoke-property-${confirmation.propertyId}`, `Access revoked for ${confirmation.propertyName}.`, () => managedUsersAPI.revokePropertyAccess(userId, confirmation.propertyId))
    if (confirmation.type === 'delete') {
      setActionKey(`delete-${userId}`)
      try { await managedUsersAPI.delete(userId); router.push('/users') } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete user.'); setActionKey(null); setConfirmation(null) }
      return
    }
    const type = confirmation.type
    return run(`${type}-${userId}`, `${details.user.name} ${type === 'enable' ? 'enabled' : 'disabled'} successfully.`, () => type === 'enable' ? managedUsersAPI.enable(userId) : managedUsersAPI.disable(userId))
  }

  if (!canManageUsers) return <Alert variant="destructive"><AlertTitle>Access denied</AlertTitle><AlertDescription>You do not have permission to manage users.</AlertDescription></Alert>
  if (loading) return <div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-80 w-full" /></div>
  if (!details) return <EmptyState title="User unavailable" description={error || 'This managed user could not be found or is no longer accessible.'} action={<Link href="/users" className={buttonStyles()}>Back to User Settings</Link>} />

  const confirmationCopy = confirmation?.type === 'role'
    ? { title: 'Switch assigned role?', description: 'This changes the user’s inherited permissions and property access.', label: 'Switch role', destructive: false }
    : confirmation?.type === 'revoke'
      ? { title: `Revoke access to ${confirmation.propertyName}?`, description: 'The direct grant will be disabled and can be re-granted later.', label: 'Revoke access', destructive: true }
      : confirmation?.type === 'delete'
        ? { title: `Delete ${details.user.name}?`, description: 'This permanently deletes the user and cannot be undone.', label: 'Delete user', destructive: true }
        : confirmation?.type === 'disable'
          ? { title: `Disable ${details.user.name}?`, description: 'This user will no longer be able to sign in.', label: 'Disable account', destructive: false }
          : { title: `Enable ${details.user.name}?`, description: 'This user will regain manager login access.', label: 'Enable account', destructive: false }

  return <div className="min-w-0 space-y-6 pb-4">
    <PageHeader title={details.user.name} description={details.user.email} leading={<Link href="/users" aria-label="Back to User Settings" className={buttonStyles({ variant: 'outline', size: 'icon' })}><ArrowLeft className="h-4 w-4" /></Link>} actions={<><Badge variant={details.user.canManagerLogin ? 'success' : 'warning'}>{details.user.canManagerLogin ? 'Active' : 'Disabled'}</Badge>{details.currentAccess.role && <Badge variant="secondary">{details.currentAccess.role.name}</Badge>}<Button size="sm" variant="outline" loading={refreshing} onClick={() => void load(true)}><RefreshCw className="h-4 w-4" />Refresh</Button><Button size="sm" variant="outline" onClick={() => setConfirmation({ type: details.user.canManagerLogin ? 'disable' : 'enable' })}>{details.user.canManagerLogin ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}{details.user.canManagerLogin ? 'Disable' : 'Enable'}</Button><Button size="sm" variant="destructive" onClick={() => setConfirmation({ type: 'delete' })}><Trash2 className="h-4 w-4" />Delete</Button></>} />
    {error && <Alert variant="destructive"><AlertTitle>Unable to complete request</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
    {success && <Alert variant="success"><AlertTitle>Changes saved</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}
    <Tabs value={section} onValueChange={selectSection} orientation="vertical" className="flex-col md:flex-row">
      <TabsList className="h-auto w-full flex-row items-stretch overflow-x-auto md:w-56 md:flex-col md:overflow-visible" aria-label="User access sections"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="role">Role &amp; Permissions</TabsTrigger><TabsTrigger value="properties">Property Access</TabsTrigger><TabsTrigger value="audit">Audit History</TabsTrigger></TabsList>
      <div className="min-w-0 flex-1"><TabsContent value="overview"><UserOverview details={details} record={record} /></TabsContent><TabsContent value="role"><UserRolePermissions details={details} roles={roles} selectedRoleId={selectedRoleId} saving={actionKey === `switch-role-${userId}`} onRoleChange={setSelectedRoleId} onSave={saveRole} /></TabsContent><TabsContent value="properties"><UserPropertyAccess details={details} availableProperties={availableProperties} drafts={drafts} grantPropertyId={grantPropertyId} manualPropertyId={manualPropertyId} grantPermissions={grantPermissions} actionKey={actionKey} onGrantPropertyChange={setGrantPropertyId} onManualPropertyChange={setManualPropertyId} onToggleGrantPermission={(permission) => setGrantPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission])} onToggleDraftPermission={(propertyId, permission) => setDrafts((current) => ({ ...current, [propertyId]: (current[propertyId] || []).includes(permission) ? (current[propertyId] || []).filter((item) => item !== permission) : [...(current[propertyId] || []), permission] }))} onGrant={() => void grant()} onSave={(propertyId, propertyName) => void run(`save-property-${propertyId}`, `Permissions updated for ${propertyName}.`, () => managedUsersAPI.updatePropertyPermissions(userId, propertyId, { permissions: drafts[propertyId] || [] }))} onRevoke={(propertyId, propertyName) => setConfirmation({ type: 'revoke', propertyId, propertyName })} onRegrant={(propertyId, propertyName) => void run(`regrant-property-${propertyId}`, `Access re-granted for ${propertyName}.`, () => managedUsersAPI.grantPropertyAccess(userId, { propertyIds: [propertyId], canEdit: false, canExport: false }))} /></TabsContent><TabsContent value="audit"><UserAuditHistory history={details.auditHistory} /></TabsContent></div>
    </Tabs>
    {confirmation && <UserActionDialogs open title={confirmationCopy.title} description={confirmationCopy.description} confirmLabel={confirmationCopy.label} destructive={confirmationCopy.destructive} loading={actionKey !== null} onConfirm={() => void confirmAction()} onOpenChange={(open) => !open && setConfirmation(null)} />}
  </div>
}
