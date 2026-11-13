'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Pencil, Save, Trash2, X } from 'lucide-react'
import type { Permission, Property, UpdateCustomRoleRequest } from '@/types'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { RoleInformationSection } from '@/components/administration/create/RoleInformationSection'
import { RolePermissionSection } from '@/components/administration/create/RolePermissionSection'
import { RolePropertyAccessSection } from '@/components/administration/create/RolePropertyAccessSection'
import { useBreadcrumbOverride } from '@/components/layout/BreadcrumbContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonStyles } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { FormSectionFooter } from '@/components/ui/form-section-footer'
import { PageHeader } from '@/components/ui/page-header'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { customRolesAPI, permissionsAPI, propertiesAPI } from '@/lib/api'
import { getEditRoleDraftKey, parseEditRoleDraft, type EditRoleDraft } from './edit-role-draft'
import { RoleActionDialog } from './RoleActionDialog'
import { RoleAssignedUsers } from './RoleAssignedUsers'
import { RoleOverview } from './RoleOverview'
import type { RoleRecord } from './role-management'
import { rolePermissions, roleProperties, rolePropertyIds } from './role-management'

type RoleSection = 'overview' | 'permissions' | 'properties' | 'users'
type EditableRoleSection = Exclude<RoleSection, 'users'>
type Confirmation = 'save' | 'delete' | null

const editableSections: EditableRoleSection[] = ['overview', 'permissions', 'properties']

function parseSection(value: string | null): RoleSection {
  return value === 'permissions' || value === 'properties' || value === 'users' ? value : 'overview'
}

export function RoleDetailsWorkspace({ roleId }: { roleId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { canManageRoles, user } = useGlobalPermissions()
  const [role, setRole] = useState<RoleRecord | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const [section, setSection] = useState<RoleSection>(parseSection(searchParams.get('section')))
  const [lastEditableSection, setLastEditableSection] = useState<EditableRoleSection>(() => {
    const initialSection = parseSection(searchParams.get('section'))
    return initialSection === 'users' ? 'overview' : initialSection
  })
  const [confirmation, setConfirmation] = useState<Confirmation>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])
  const [permissionSearch, setPermissionSearch] = useState('')
  const [propertySearch, setPropertySearch] = useState('')
  const [nameError, setNameError] = useState<string>()
  const [propertyError, setPropertyError] = useState<string>()
  const [draftMessage, setDraftMessage] = useState<string>()
  const [draftError, setDraftError] = useState<string>()
  const [draftConflict, setDraftConflict] = useState<string>()
  const [catalogsReady, setCatalogsReady] = useState(false)
  const editing = searchParams.get('edit') === 'true' && catalogsReady
  const draftKey = user?.id ? getEditRoleDraftKey(user.id, roleId) : null

  useBreadcrumbOverride(`/roles/${roleId}`, loading ? 'Loading…' : role?.name || 'Role details')

  const initializeDraft = useCallback((record: RoleRecord) => {
    setName(record.name)
    setDescription(record.description || '')
    setSelectedPermissionIds(rolePermissions(record).map((permission) => permission.id))
    setSelectedPropertyIds(rolePropertyIds(record))
    setNameError(undefined)
    setPropertyError(undefined)
  }, [])

  const load = useCallback(async () => {
    if (!canManageRoles) return
    setLoading(true)
    setError(undefined)
    const propertyRequest = user?.role === 'MANAGER' && user.id
      ? propertiesAPI.getManagerProperties(user.id)
      : propertiesAPI.getAll()
    const [roleResult, permissionResult, propertyResult] = await Promise.allSettled([
      customRolesAPI.getAll(),
      permissionsAPI.getAll(),
      propertyRequest,
    ])

    if (roleResult.status === 'rejected') {
      setError(roleResult.reason instanceof Error ? roleResult.reason.message : 'Role details could not be loaded.')
      setRole(null)
      setLoading(false)
      return
    }

    const record = (roleResult.value as unknown as RoleRecord[]).find((item) => item.id === roleId) || null
    setRole(record)
    if (record) initializeDraft(record)

    const resourceErrors: string[] = []
    if (permissionResult.status === 'fulfilled') setPermissions(permissionResult.value)
    else {
      setPermissions(record ? rolePermissions(record) : [])
      resourceErrors.push('permission catalog')
    }
    if (propertyResult.status === 'fulfilled') setProperties(propertyResult.value)
    else {
      setProperties(record ? roleProperties(record) : [])
      resourceErrors.push('property catalog')
    }
    setCatalogsReady(resourceErrors.length === 0)
    if (resourceErrors.length) setError(`The ${resourceErrors.join(' and ')} could not be loaded. Current assignments remain visible, but editing is unavailable until the catalogs can be loaded.`)
    setLoading(false)
  }, [canManageRoles, initializeDraft, roleId, user])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load())
    return () => window.cancelAnimationFrame(frame)
  }, [load])

  const groupedPermissions = useMemo(() => permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
    const category = permission.category || 'OTHER'
    groups[category] = [...(groups[category] || []), permission]
    return groups
  }, {}), [permissions])
  const categories = useMemo(() => Object.keys(groupedPermissions).sort((left, right) => left.localeCompare(right)), [groupedPermissions])
  const propertyCatalog = useMemo(() => properties.length ? properties : role ? roleProperties(role) : [], [properties, role])

  useEffect(() => {
    if (!editing || !draftKey || !role) return

    const frame = window.requestAnimationFrame(() => {
      try {
        const savedDraft = localStorage.getItem(draftKey)
        if (!savedDraft) return

        const restored = parseEditRoleDraft(
          JSON.parse(savedDraft) as unknown,
          new Set(permissions.map((permission) => permission.id)),
          new Set(propertyCatalog.map((property) => property.id)),
        )
        if (!restored) return

        if (restored.baseUpdatedAt !== role.updatedAt) {
          setDraftConflict('A local draft was not restored because this role has changed since the draft was saved.')
          return
        }

        setName(restored.name)
        setDescription(restored.description)
        setSelectedPermissionIds(restored.permissionIds)
        setSelectedPropertyIds(restored.propertyIds)
        setDraftMessage('Your saved role edits were restored from this browser.')
        setDraftConflict(undefined)
      } catch (restoreError) {
        console.error('Failed to restore role edit draft:', restoreError)
        setDraftError('The saved role draft could not be restored.')
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [draftKey, editing, permissions, propertyCatalog, role])

  const selectSection = (value: string) => {
    const next = parseSection(value)
    setSection(next)
    if (next !== 'users') setLastEditableSection(next)
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', next)
    router.replace(`/roles/${roleId}?${params.toString()}`, { scroll: false })
  }

  const setEditing = (next: boolean, persistedRole = role) => {
    if (!next && persistedRole) {
      initializeDraft(persistedRole)
      setDraftMessage(undefined)
      setDraftError(undefined)
      setDraftConflict(undefined)
    }
    const params = new URLSearchParams(searchParams.toString())
    if (next) {
      params.set('edit', 'true')
      if (section === 'users') {
        setSection(lastEditableSection)
        params.set('section', lastEditableSection)
      }
    }
    else params.delete('edit')
    router.replace(`/roles/${roleId}?${params.toString()}`, { scroll: false })
  }

  const saveDraft = () => {
    if (!draftKey || !role) {
      setDraftError('Your draft could not be scoped to the authenticated account and role.')
      return
    }

    const draft: EditRoleDraft = {
      name,
      description,
      permissionIds: selectedPermissionIds,
      propertyIds: selectedPropertyIds,
      baseUpdatedAt: role.updatedAt,
    }

    try {
      localStorage.setItem(draftKey, JSON.stringify(draft))
      setDraftMessage('Your role edits were saved in this browser.')
      setDraftError(undefined)
      setDraftConflict(undefined)
    } catch (storageError) {
      console.error('Failed to save role edit draft:', storageError)
      setDraftError('Your role draft could not be saved in this browser.')
    }
  }

  const clearDraft = () => {
    if (!draftKey) return
    try {
      localStorage.removeItem(draftKey)
    } catch (storageError) {
      console.error('Failed to clear role edit draft:', storageError)
    }
  }

  const validateAndConfirm = () => {
    setNameError(undefined)
    setPropertyError(undefined)
    if (!name.trim()) {
      setNameError('Role name is required.')
      setSection('overview')
      return
    }
    if (!selectedPropertyIds.length) {
      setPropertyError('Select at least one property for this role.')
      setSection('properties')
      return
    }
    setConfirmation('save')
  }

  const save = async () => {
    if (!role) return
    const payload: UpdateCustomRoleRequest = {
      name: name.trim(),
      description: description.trim(),
      permissionIds: selectedPermissionIds,
      propertyIds: selectedPropertyIds,
    }
    setSaving(true)
    setError(undefined)
    setSuccess(undefined)
    try {
      await customRolesAPI.update(role.id, payload)
      clearDraft()
      const refreshed = await customRolesAPI.getAll() as unknown as RoleRecord[]
      const updated = refreshed.find((item) => item.id === role.id)
      if (updated) {
        setRole(updated)
        initializeDraft(updated)
      }
      setSuccess('Role changes saved successfully.')
      setConfirmation(null)
      setEditing(false, updated || role)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The role could not be updated.')
      setConfirmation(null)
    } finally {
      setSaving(false)
    }
  }

  const deleteRole = async () => {
    if (!role) return
    setDeleting(true)
    setError(undefined)
    try {
      await customRolesAPI.delete(role.id)
      router.push('/roles')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'The role could not be deleted.')
      setConfirmation(null)
      setDeleting(false)
    }
  }

  const togglePermission = (permissionId: string) => setSelectedPermissionIds((current) => current.includes(permissionId)
    ? current.filter((id) => id !== permissionId)
    : [...current, permissionId])
  const toggleCategory = (category: string) => {
    const ids = groupedPermissions[category].map((permission) => permission.id)
    const allSelected = ids.every((id) => selectedPermissionIds.includes(id))
    setSelectedPermissionIds((current) => allSelected ? current.filter((id) => !ids.includes(id)) : Array.from(new Set([...current, ...ids])))
  }
  const toggleProperty = (propertyId: string) => {
    setPropertyError(undefined)
    setSelectedPropertyIds((current) => current.includes(propertyId) ? current.filter((id) => id !== propertyId) : [...current, propertyId])
  }

  if (!canManageRoles) return <Alert variant="destructive"><AlertTitle>Access denied</AlertTitle><AlertDescription>You do not have permission to manage roles.</AlertDescription></Alert>
  if (loading) return <div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-96 w-full" /></div>
  if (!role) return <EmptyState title="Role unavailable" description={error || 'This role could not be found or is no longer accessible.'} action={<Link href="/roles" className={buttonStyles()}>Back to Role Management</Link>} />

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader
        title={role.name}
        description={role.description || 'Custom role configuration and assignment details.'}
        leading={<Link href="/roles" aria-label="Back to Role Management" className={buttonStyles({ variant: 'outline', size: 'icon' })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Link>}
        actions={<>{editing ? section === 'users' && <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4" aria-hidden="true" />Cancel editing</Button> : <Button variant="outline" disabled={!catalogsReady} title={!catalogsReady ? 'Permission and property catalogs must load before editing.' : undefined} onClick={() => setEditing(true)}><Pencil className="h-4 w-4" aria-hidden="true" />Edit role</Button>}<Button variant="destructive" onClick={() => setConfirmation('delete')}><Trash2 className="h-4 w-4" aria-hidden="true" />Delete</Button></>}
      />
      {error && <Alert variant="destructive"><AlertTitle>Unable to complete request</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert variant="success"><AlertTitle>Changes saved</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}
      {editing && <Alert variant="warning"><AlertTitle>Changes affect assigned users</AlertTitle><AlertDescription>Saving permission or property changes updates the shared access inherited by every active user assigned to this role.</AlertDescription></Alert>}
      {editing && draftError && <Alert variant="destructive"><AlertTitle>Draft unavailable</AlertTitle><AlertDescription>{draftError}</AlertDescription></Alert>}
      {editing && draftConflict && <Alert variant="warning"><AlertTitle>Saved draft conflict</AlertTitle><AlertDescription>{draftConflict}</AlertDescription></Alert>}
      {editing && draftMessage && <Alert variant="info"><AlertTitle>Draft saved</AlertTitle><AlertDescription>{draftMessage}</AlertDescription></Alert>}

      <Tabs value={section} onValueChange={selectSection} orientation="vertical" className="flex-col md:flex-row">
        <TabsList className="h-auto w-full flex-row items-stretch overflow-x-auto md:w-60 md:flex-col md:overflow-visible" aria-label="Role details sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="permissions">Permissions <Badge variant="neutral">{selectedPermissionIds.length}</Badge></TabsTrigger>
          <TabsTrigger value="properties">Property Access <Badge variant="neutral">{selectedPropertyIds.length}</Badge></TabsTrigger>
          <TabsTrigger value="users">Assigned Users <Badge variant="neutral">{role.assignments?.length || 0}</Badge></TabsTrigger>
        </TabsList>
        <div className="min-w-0 flex-1">
          <TabsContent value="overview">
            {editing ? <RoleInformationSection name={name} description={description} nameError={nameError} onNameChange={(value) => { setName(value); setNameError(undefined) }} onDescriptionChange={setDescription} /> : <RoleOverview role={role} />}
          </TabsContent>
          <TabsContent value="permissions">
            <div className="space-y-4">
              {!categories.length ? <EmptyState title="Permission catalog unavailable" description="No permissions are available to display." /> : categories.map((category, index) => <div key={category}>{index > 0 && <Separator className="mb-4" />}<RolePermissionSection category={category} permissions={groupedPermissions[category]} selectedIds={selectedPermissionIds} search={permissionSearch} onSearchChange={setPermissionSearch} onToggle={togglePermission} onToggleCategory={() => toggleCategory(category)} readOnly={!editing} /></div>)}
            </div>
          </TabsContent>
          <TabsContent value="properties">
            <div className="space-y-4">
              <Alert variant="warning"><AlertTitle>Inherited property scope</AlertTitle><AlertDescription>Users assigned to this role inherit its associated property access.</AlertDescription></Alert>
              <RolePropertyAccessSection properties={editing ? propertyCatalog : propertyCatalog.filter((property) => selectedPropertyIds.includes(property.id))} selectedIds={selectedPropertyIds} error={propertyError} search={propertySearch} onSearchChange={setPropertySearch} onToggle={toggleProperty} onToggleAll={() => { setPropertyError(undefined); setSelectedPropertyIds(selectedPropertyIds.length === propertyCatalog.length ? [] : propertyCatalog.map((property) => property.id)) }} readOnly={!editing} />
            </div>
          </TabsContent>
          <TabsContent value="users">
            <Card><CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>Assigned Users</CardTitle><CardDescription>Active assignments using this role. Manage an individual user from their User Access workspace.</CardDescription></div>{editing && <Button type="button" variant="outline" onClick={() => selectSection(lastEditableSection)}>Return to editing</Button>}</CardHeader><CardContent><RoleAssignedUsers assignments={role.assignments || []} /></CardContent></Card>
          </TabsContent>
        </div>
      </Tabs>

      {editing && section !== 'users' && (
        <FormSectionFooter
          sections={editableSections}
          activeSection={section}
          onSectionChange={selectSection}
          onCancel={() => setEditing(false)}
          cancelLabel="Cancel Editing"
          onSaveDraft={saveDraft}
          disabled={saving}
          finalAction={<Button type="button" loading={saving} onClick={validateAndConfirm}><Save className="h-4 w-4" aria-hidden="true" />Save Role Changes</Button>}
        />
      )}

      <RoleActionDialog
        open={confirmation !== null}
        title={confirmation === 'delete' ? `Delete ${role.name}?` : `Save changes to ${role.name}?`}
        description={confirmation === 'delete'
          ? role.assignments?.length ? `This role has ${role.assignments.length} active assigned user${role.assignments.length === 1 ? '' : 's'}. The backend will prevent deletion until active assignments are removed.` : 'This permanently deletes the role, its permission links and property access. This cannot be undone.'
          : `These changes may update inherited access for ${role.assignments?.length || 0} assigned user${role.assignments?.length === 1 ? '' : 's'}.`}
        confirmLabel={confirmation === 'delete' ? 'Delete role' : 'Save changes'}
        destructive={confirmation === 'delete'}
        loading={confirmation === 'delete' ? deleting : saving}
        onConfirm={() => confirmation === 'delete' ? void deleteRole() : void save()}
        onOpenChange={(open) => !open && setConfirmation(null)}
      />
    </div>
  )
}
