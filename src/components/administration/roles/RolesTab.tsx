'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { AdministrationWorkspace } from '@/components/administration/AdministrationWorkspace'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { customRolesAPI } from '@/lib/api'
import { RoleActionDialog } from './RoleActionDialog'
import type { RoleRecord } from './role-management'
import { RolesTable } from './RolesTable'

export function RolesTab() {
  const { canManageRoles } = useGlobalPermissions()
  const [roles, setRoles] = useState<RoleRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const [pendingDelete, setPendingDelete] = useState<RoleRecord | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async (refresh = false) => {
    if (!canManageRoles) return
    if (refresh) setRefreshing(true)
    else setLoading(true)
    setError(undefined)
    try {
      setRoles(await customRolesAPI.getAll() as unknown as RoleRecord[])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Roles could not be loaded.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [canManageRoles])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load())
    return () => window.cancelAnimationFrame(frame)
  }, [load])

  const visibleRoles = useMemo(() => {
    const term = search.trim().toLowerCase()
    return roles
      .filter((role) => !term || `${role.name} ${role.description || ''}`.toLowerCase().includes(term))
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [roles, search])

  const deleteRole = async () => {
    if (!pendingDelete) return
    setDeletingId(pendingDelete.id)
    setError(undefined)
    setSuccess(undefined)
    try {
      await customRolesAPI.delete(pendingDelete.id)
      setRoles((current) => current.filter((role) => role.id !== pendingDelete.id))
      setSuccess(`${pendingDelete.name} deleted successfully.`)
      setPendingDelete(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'The role could not be deleted.')
      setPendingDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  if (!canManageRoles) {
    return <Alert variant="destructive"><AlertTitle>Access denied</AlertTitle><AlertDescription>You do not have permission to manage roles.</AlertDescription></Alert>
  }

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader
        title="User Settings"
        description="Manage users, roles and property access."
        actions={<Button variant="outline" size="sm" loading={refreshing} onClick={() => void load(true)}><RefreshCw className="h-4 w-4" aria-hidden="true" />Refresh</Button>}
      />
      <AdministrationWorkspace activeTab="roles">
        <div className="space-y-5">
          {error && <Alert variant="destructive"><AlertTitle>Unable to complete request</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert variant="success"><AlertTitle>Role deleted</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}
          <div className="max-w-xl"><Input label="Search roles" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search role name or description" /></div>
          <RolesTable roles={visibleRoles} loading={loading} hasSearch={Boolean(search.trim())} deletingId={deletingId} onDelete={setPendingDelete} />
        </div>
      </AdministrationWorkspace>
      {pendingDelete && (
        <RoleActionDialog
          open
          title={`Delete ${pendingDelete.name}?`}
          description={pendingDelete.assignments?.length
            ? `This role has ${pendingDelete.assignments.length} active assigned user${pendingDelete.assignments.length === 1 ? '' : 's'}. The backend will prevent deletion while active assignments remain.`
            : 'This permanently deletes the role, its permission links and property access. This cannot be undone.'}
          confirmLabel="Delete role"
          destructive
          loading={deletingId === pendingDelete.id}
          onConfirm={() => void deleteRole()}
          onOpenChange={(open) => !open && setPendingDelete(null)}
        />
      )}
    </div>
  )
}
