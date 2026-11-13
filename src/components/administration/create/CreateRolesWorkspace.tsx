'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Permission, Property } from '@/types'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { AdministrationWorkspace } from '@/components/administration/AdministrationWorkspace'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { customRolesAPI, permissionsAPI, propertiesAPI } from '@/lib/api'
import { CreateCustomRoleForm } from './CreateCustomRoleForm'
import { CreateManagedUserForm } from './CreateManagedUserForm'
import type { CustomRoleRecord } from './create-role-types'

const managedUserModes = new Set(['user', 'managed-user', 'create-user'])

export function CreateRolesWorkspace() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { canManageRoles, canManageUsers, user } = useGlobalPermissions()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<CustomRoleRecord[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const requestedMode = searchParams.get('mode') ?? searchParams.get('tab')
  const requestedManagedUser = requestedMode ? managedUserModes.has(requestedMode) : false
  const activeTab = requestedManagedUser && canManageUsers
    ? 'create-user'
    : canManageRoles
      ? 'create-role'
      : 'create-user'

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      const permissionRequest = canManageRoles ? permissionsAPI.getAll() : Promise.resolve([] as Permission[])
      const roleRequest = canManageRoles || canManageUsers
        ? customRolesAPI.getAll()
        : Promise.resolve([])
      const propertyRequest = canManageRoles
        ? user?.role === 'MANAGER' && user.id
          ? propertiesAPI.getManagerProperties(user.id)
          : propertiesAPI.getAll()
        : Promise.resolve([] as Property[])

      const [permissionData, roleData, propertyData] = await Promise.all([
        permissionRequest,
        roleRequest,
        propertyRequest,
      ])
      setPermissions(permissionData)
      setRoles(roleData as CustomRoleRecord[])
      setProperties(propertyData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load role creation data.')
    } finally {
      setLoading(false)
    }
  }, [canManageRoles, canManageUsers, user])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void loadData())
    return () => window.cancelAnimationFrame(frame)
  }, [loadData])

  useEffect(() => {
    if (requestedManagedUser && !canManageUsers && canManageRoles) {
      router.replace('/roles/create')
    } else if (!requestedManagedUser && !canManageRoles && canManageUsers) {
      router.replace('/roles/create?mode=user')
    }
  }, [canManageRoles, canManageUsers, requestedManagedUser, router])

  const handleRoleCreated = (createdRole: CustomRoleRecord) => {
    setSuccess(`Role "${createdRole.name}" created successfully.`)
    setRoles((current) => [...current.filter((role) => role.id !== createdRole.id), createdRole])
    void customRolesAPI.getAll()
      .then((updatedRoles) => setRoles(updatedRoles as CustomRoleRecord[]))
      .catch((refreshError) => setError(refreshError instanceof Error ? refreshError.message : 'The role list could not be refreshed.'))
    if (canManageUsers) {
      setSelectedRoleId(createdRole.id)
      router.push('/roles/create?mode=user')
    }
  }

  const handleUserCreated = (message: string) => {
    setSuccess(message)
    void customRolesAPI.getAll()
      .then((updatedRoles) => setRoles(updatedRoles as CustomRoleRecord[]))
      .catch((refreshError) => setError(refreshError instanceof Error ? refreshError.message : 'The role list could not be refreshed.'))
  }

  if (!canManageRoles && !canManageUsers) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Access denied</AlertTitle>
        <AlertDescription>You do not have permission to create roles or managed users.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader
        title="User Settings"
        description="Create reusable custom roles and managed users."
      />

      <AdministrationWorkspace activeTab={activeTab}>
        <div className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Unable to load Create Roles</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="success">
              <AlertTitle>Creation complete</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-4" aria-label="Loading role creation data" aria-busy="true">
              <Skeleton className="h-9 w-80 max-w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          ) : (
            <>
              {canManageRoles && (
                <div hidden={activeTab !== 'create-role'}>
                  <CreateCustomRoleForm
                    permissions={permissions}
                    properties={properties}
                    onCreated={handleRoleCreated}
                  />
                </div>
              )}
              {canManageUsers && (
                <div hidden={activeTab !== 'create-user'}>
                  <CreateManagedUserForm
                    roles={roles}
                    selectedRoleId={selectedRoleId}
                    onSelectedRoleChange={setSelectedRoleId}
                    canCreateRoles={canManageRoles}
                    onCreateNewRole={() => router.push('/roles/create')}
                    onCreated={handleUserCreated}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </AdministrationWorkspace>
    </div>
  )
}
