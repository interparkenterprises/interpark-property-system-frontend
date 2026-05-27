'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { managedUsersAPI, customRolesAPI } from '@/lib/api'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import type { ManagedUser, UserAccessDetails, CustomRole, PropertyAccess } from '@/types'

type StatusFilter = 'all' | 'active' | 'inactive'

type PropertyPermissionKey = 'VIEW' | 'EDIT' | 'DELETE' | 'EXPORT'

type ManagedUserRecord = ManagedUser & {
  userAssignments?: Array<{
    id: string
    isActive?: boolean
    role?: {
      id: string
      name: string
      description?: string
      propertyAccess?: Array<{
        propertyId: string
        property?: {
          id: string
          name: string
        }
        isActive?: boolean
      }>
      permissions?: Array<{
        permission: {
          code: string
        }
      }>
    } | null
    expiresAt?: string | null
  }>
  userPropertyAccess?: Array<{
    id: string
    propertyId?: string
    isActive?: boolean
    canView?: boolean
    canEdit?: boolean
    canDelete?: boolean
    canExport?: boolean
    expiresAt?: string | null
    property?: {
      id: string
      name: string
      address?: string
    } | null
  }>
}

type KnownProperty = {
  id: string
  name: string
}

const PROPERTY_PERMISSION_OPTIONS: Array<{
  key: PropertyPermissionKey
  label: string
}> = [
  { key: 'VIEW', label: 'View' },
  { key: 'EDIT', label: 'Edit' },
  { key: 'DELETE', label: 'Delete' },
  { key: 'EXPORT', label: 'Export' },
]

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}

function formatDate(date?: string | null) {
  if (!date) return '—'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleString()
}

function titleCasePermission(value: PropertyPermissionKey) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function getPropertyPermissionIds(property: {
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canExport?: boolean
}): PropertyPermissionKey[] {
  const permissions: PropertyPermissionKey[] = []
  if (property.canView) permissions.push('VIEW')
  if (property.canEdit) permissions.push('EDIT')
  if (property.canDelete) permissions.push('DELETE')
  if (property.canExport) permissions.push('EXPORT')
  return permissions
}

function getEffectiveCustomRoleName(user: ManagedUserRecord) {
  if (user.customRole?.name) return user.customRole.name

  const activeAssignment =
    user.userAssignments?.find((assignment) => assignment.isActive !== false && assignment.role?.name) ||
    user.userAssignments?.find((assignment) => assignment.role?.name)

  return activeAssignment?.role?.name || ''
}

// Updated to include role-inherited properties
function getEffectivePropertyEntries(user: ManagedUserRecord) {
  // Direct property access (manually granted)
  const directPropertyAccess = (user.userPropertyAccess || [])
    .filter(access => access.isActive !== false)
    .map((entry) => ({
      id: entry.property?.id || entry.propertyId || entry.id,
      name: entry.property?.name || 'Unnamed property',
      canView: entry.canView || false,
      canEdit: entry.canEdit || false,
      canDelete: entry.canDelete || false,
      canExport: entry.canExport || false,
      isActive: entry.isActive,
      expiresAt: entry.expiresAt,
      source: 'direct' as const
    }))

  // Role-inherited property access
  const roleInheritedProperties = (user.userAssignments || [])
    .filter(assignment => assignment.isActive !== false && assignment.role)
    .flatMap(assignment => {
      const roleProperties = (assignment.role as any)?.propertyAccess || []
      const rolePermissions = (assignment.role as any)?.permissions || []
      
      // Check what permissions the role has
      const hasEdit = rolePermissions.some((p: any) => 
        p.permission?.code === 'EDIT_PROPERTY' || p.permission?.code === 'MANAGE_PROPERTIES'
      )
      const hasDelete = rolePermissions.some((p: any) => 
        p.permission?.code === 'DELETE_PROPERTY'
      )
      const hasExport = rolePermissions.some((p: any) => 
        p.permission?.code === 'EXPORT_DATA'
      )
      
      return roleProperties.map((prop: any) => ({
        id: prop.propertyId || prop.property?.id,
        name: prop.property?.name || 'Inherited property',
        canView: true, // Role always has view access to its properties
        canEdit: hasEdit,
        canDelete: hasDelete,
        canExport: hasExport,
        isActive: true,
        expiresAt: null,
        source: 'role' as const
      }))
    })

  // Also check propertyAccess from the base ManagedUser type
  const basePropertyAccess = (user.propertyAccess || [])
    .filter(access => access.isActive !== false)
    .map((property) => ({
      id: property.id,
      name: property.name,
      canView: property.canView,
      canEdit: property.canEdit,
      canDelete: property.canDelete,
      canExport: property.canExport,
      isActive: property.isActive,
      expiresAt: property.expiresAt,
      source: 'direct' as const
    }))

  // Merge all property sources
  const allProperties = [...directPropertyAccess, ...roleInheritedProperties, ...basePropertyAccess]
  
  // Deduplicate by property id
  const unique = new Map<string, typeof allProperties[number]>()
  allProperties.forEach((item) => {
    if (!item.id) return
    if (!unique.has(item.id)) {
      unique.set(item.id, item)
    }
  })

  return Array.from(unique.values())
}

function getPropertiesPreview(user: ManagedUserRecord) {
  const properties = getEffectivePropertyEntries(user)
  if (!properties.length) return []

  // Return unique property names
  const uniqueNames = new Set(properties.map((property) => property.name).filter(Boolean))
  return Array.from(uniqueNames)
}

export default function UsersPage() {
  const { canManageUsers } = useGlobalPermissions()

  const [users, setUsers] = useState<ManagedUserRecord[]>([])
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [actionKey, setActionKey] = useState<string | null>(null)

  const [selectedAccess, setSelectedAccess] = useState<UserAccessDetails | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string>('')
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false)
  const [isAccessLoading, setIsAccessLoading] = useState(false)

  const [propertyPermissionDrafts, setPropertyPermissionDrafts] = useState<
    Record<string, PropertyPermissionKey[]>
  >({})
  const [grantPropertyId, setGrantPropertyId] = useState('')
  const [manualPropertyId, setManualPropertyId] = useState('')
  const [grantPermissions, setGrantPermissions] = useState<PropertyPermissionKey[]>(['VIEW'])
  
  // State for role switching
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [isSwitchingRole, setIsSwitchingRole] = useState(false)

  const initializeAccessEditorState = useCallback((details: UserAccessDetails) => {
    const nextDrafts: Record<string, PropertyPermissionKey[]> = {}

    details.currentAccess.properties?.forEach((property) => {
      nextDrafts[property.id] = getPropertyPermissionIds(property)
    })

    setPropertyPermissionDrafts(nextDrafts)
    setGrantPropertyId('')
    setManualPropertyId('')
    setGrantPermissions(['VIEW'])
    setSelectedRoleId(details.currentAccess.role?.id || '')
  }, [])

  const loadUsers = useCallback(
    async (refresh = false) => {
      if (!canManageUsers) return

      try {
        setError(null)
        if (refresh) {
          setIsRefreshing(true)
        } else {
          setIsLoading(true)
        }

        const params: { role?: string; isActive?: boolean } = {}

        if (roleFilter) {
          params.role = roleFilter
        }

        const data = (await managedUsersAPI.getAll(params)) as ManagedUserRecord[]

        const enhancedUsers = data.map((user) => ({
          ...user,
          isActive: user.isActive !== undefined ? user.isActive : user.canManagerLogin,
        }))

        setUsers(enhancedUsers)
      } catch (err: any) {
        setError(err?.message || 'Failed to load managed users.')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [canManageUsers, roleFilter]
  )

  const loadCustomRoles = useCallback(async () => {
    try {
      const roles = await customRolesAPI.getAll()
      setCustomRoles(roles)
    } catch (err: any) {
      console.error('Failed to load custom roles:', err)
    }
  }, [])

  const reloadSelectedAccess = useCallback(
    async (userId: string, refreshUsers = true) => {
      const details = await managedUsersAPI.getAccessDetails(userId)
      setSelectedAccess(details)
      initializeAccessEditorState(details)
      if (refreshUsers) {
        await loadUsers(true)
      }
    },
    [initializeAccessEditorState, loadUsers]
  )

  useEffect(() => {
    loadUsers()
    loadCustomRoles()
  }, [loadUsers, loadCustomRoles])

  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [successMessage])

  const handleSwitchRole = async () => {
    if (!selectedAccess || !selectedRoleId) return

    const confirmed = window.confirm(
      `Are you sure you want to change ${selectedAccess.user.name}'s role? This will update their permissions based on the new role.`
    )
    if (!confirmed) return

    const currentActionKey = `switch-role-${selectedAccess.user.id}`

    try {
      setActionKey(currentActionKey)
      setIsSwitchingRole(true)
      setError(null)
      setSuccessMessage(null)

      await managedUsersAPI.updateAccess(selectedAccess.user.id, {
        roleId: selectedRoleId
      })

      setSuccessMessage(`Role changed successfully for ${selectedAccess.user.name}.`)
      await reloadSelectedAccess(selectedAccess.user.id, true)
    } catch (err: any) {
      setError(err?.message || 'Failed to switch role.')
    } finally {
      setActionKey(null)
      setIsSwitchingRole(false)
    }
  }

  const filteredUsers = useMemo(() => {
    let filtered = [...users]

    if (statusFilter === 'active') {
      filtered = filtered.filter((user) => user.canManagerLogin === true)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((user) => user.canManagerLogin === false)
    }

    const term = searchTerm.trim().toLowerCase()
    if (term) {
      filtered = filtered.filter((user) => {
        const name = user.name?.toLowerCase() || ''
        const email = user.email?.toLowerCase() || ''
        const role = user.role?.toLowerCase() || ''
        const customRole = getEffectiveCustomRoleName(user).toLowerCase()
        const propertyNames = getPropertiesPreview(user).join(' ').toLowerCase()

        return (
          name.includes(term) ||
          email.includes(term) ||
          role.includes(term) ||
          customRole.includes(term) ||
          propertyNames.includes(term)
        )
      })
    }

    return filtered
  }, [users, searchTerm, statusFilter])

  const summary = useMemo(() => {
    const active = users.filter((user) => user.canManagerLogin === true).length
    const inactive = users.filter((user) => user.canManagerLogin === false).length
    const customRolesCount = users.filter((user) => Boolean(getEffectiveCustomRoleName(user))).length

    return {
      total: users.length,
      active,
      inactive,
      customRoles: customRolesCount,
    }
  }, [users])

  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(users.map((user) => user.role).filter(Boolean)))
  }, [users])

  const knownProperties = useMemo(() => {
    const map = new Map<string, KnownProperty>()

    const register = (id?: string, name?: string) => {
      if (!id) return
      map.set(id, {
        id,
        name: name || 'Unnamed property',
      })
    }

    users.forEach((user) => {
      getEffectivePropertyEntries(user).forEach((property) => {
        register(property.id, property.name)
      })

      user.userPropertyAccess?.forEach((entry) => {
        register(entry.property?.id || entry.propertyId, entry.property?.name)
      })
    })

    selectedAccess?.currentAccess.properties?.forEach((property) => {
      register(property.id, property.name)
    })

    selectedAccess?.currentAccess.role?.defaultProperties?.forEach((property) => {
      register(property.id, property.name)
    })

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [users, selectedAccess])

  const availableGrantProperties = useMemo(() => {
    // Get IDs of properties that are currently active (not revoked)
    const activePropertyIds = new Set(
      selectedAccess?.currentAccess.properties
        ?.filter(property => property.isActive === true)
        .map((property) => property.id) || []
    )
    
    // Get IDs of properties inherited from role
    const rolePropertyIds = new Set(
      selectedAccess?.currentAccess.role?.defaultProperties?.map((property) => property.id) || []
    )

    // Available properties = all known properties minus active ones minus role ones
    // Revoked properties (inactive) will appear here for re-granting
    return knownProperties.filter((property) => 
      !activePropertyIds.has(property.id) && !rolePropertyIds.has(property.id)
    )
  }, [knownProperties, selectedAccess])

  const toggleDraftPermission = (propertyId: string, permission: PropertyPermissionKey) => {
    setPropertyPermissionDrafts((prev) => {
      const current = prev[propertyId] || []
      const next = current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]

      return {
        ...prev,
        [propertyId]: next,
      }
    })
  }

  const toggleGrantPermission = (permission: PropertyPermissionKey) => {
    setGrantPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission]
    )
  }

  const handleEnableUser = async (user: ManagedUserRecord) => {
    if (user.canManagerLogin === true) {
      setError(`${user.name} is already enabled.`)
      return
    }

    const confirmed = window.confirm(`Are you sure you want to enable ${user.name}?`)
    if (!confirmed) return

    const currentActionKey = `enable-${user.id}`

    try {
      setActionKey(currentActionKey)
      setError(null)
      setSuccessMessage(null)

      await managedUsersAPI.enable(user.id)
      setSuccessMessage(`${user.name} enabled successfully.`)

      await loadUsers(true)
    } catch (err: any) {
      setError(err?.message || `Failed to enable ${user.name}.`)
    } finally {
      setActionKey(null)
    }
  }

  const handleDisableUser = async (user: ManagedUserRecord) => {
    if (user.canManagerLogin === false) {
      setError(`${user.name} is already disabled.`)
      return
    }

    const confirmed = window.confirm(`Are you sure you want to disable ${user.name}?`)
    if (!confirmed) return

    const currentActionKey = `disable-${user.id}`

    try {
      setActionKey(currentActionKey)
      setError(null)
      setSuccessMessage(null)

      await managedUsersAPI.disable(user.id)
      setSuccessMessage(`${user.name} disabled successfully.`)

      await loadUsers(true)
    } catch (err: any) {
      setError(err?.message || `Failed to disable ${user.name}.`)
    } finally {
      setActionKey(null)
    }
  }

  const handleDeleteUser = async (user: ManagedUserRecord) => {
    const confirmed = window.confirm(`Delete ${user.name}? This action cannot be undone.`)
    if (!confirmed) return

    const currentActionKey = `delete-${user.id}`

    try {
      setActionKey(currentActionKey)
      setError(null)
      setSuccessMessage(null)

      await managedUsersAPI.delete(user.id)
      setSuccessMessage(`${user.name} deleted successfully.`)

      if (selectedAccess?.user.id === user.id) {
        setSelectedAccess(null)
        setIsAccessModalOpen(false)
      }

      await loadUsers(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user.')
    } finally {
      setActionKey(null)
    }
  }

  const handleViewAccess = async (user: ManagedUserRecord) => {
    try {
      setIsAccessLoading(true)
      setSelectedUserName(user.name)
      setError(null)

      const details = await managedUsersAPI.getAccessDetails(user.id)
      setSelectedAccess(details)
      initializeAccessEditorState(details)
      setIsAccessModalOpen(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch user access details.')
    } finally {
      setIsAccessLoading(false)
    }
  }

  const handleSavePropertyPermissions = async (propertyId: string, propertyName: string) => {
    if (!selectedAccess) return

    const currentActionKey = `save-property-${propertyId}`

    try {
      setActionKey(currentActionKey)
      setError(null)
      setSuccessMessage(null)

      // Convert permission keys to the format expected by backend
      const permissions = propertyPermissionDrafts[propertyId] || []
      
      await managedUsersAPI.updatePropertyPermissions(selectedAccess.user.id, propertyId, {
        permissions: permissions,
      })

      setSuccessMessage(`Permissions updated for ${propertyName}.`)
      await reloadSelectedAccess(selectedAccess.user.id)
    } catch (err: any) {
      console.error('Save permissions error:', err)
      setError(err?.message || `Failed to update permissions for ${propertyName}. Please check if the property access exists.`)
    } finally {
      setActionKey(null)
    }
  }

  const handleRevokePropertyAccess = async (propertyId: string, propertyName: string) => {
    if (!selectedAccess) return

    // Check if property is inherited from role
    const isInherited = selectedAccess.currentAccess.role?.defaultProperties?.some(
      p => p.id === propertyId
    )

    if (isInherited) {
      setError(`Cannot revoke "${propertyName}" because it is inherited from the user's role. Update the role permissions instead.`)
      return
    }

    const confirmed = window.confirm(
      `Revoke ${selectedAccess.user.name}'s access to ${propertyName}? This property will become available for re-granting.`
    )
    if (!confirmed) return

    const currentActionKey = `revoke-property-${propertyId}`

    try {
      setActionKey(currentActionKey)
      setError(null)
      setSuccessMessage(null)

      await managedUsersAPI.revokePropertyAccess(selectedAccess.user.id, propertyId)

      setSuccessMessage(`Access revoked for ${propertyName}. You can now grant it again from the "Grant More Property Access" section.`)
      
      // Reload access details to get updated state
      await reloadSelectedAccess(selectedAccess.user.id)
    } catch (err: any) {
      setError(err?.message || `Failed to revoke access for ${propertyName}.`)
    } finally {
      setActionKey(null)
    }
  }

  const handleReGrantPropertyAccess = async (propertyId: string, propertyName: string) => {
    if (!selectedAccess) return

    const currentActionKey = `regrant-property-${propertyId}`

    try {
      setActionKey(currentActionKey)
      setError(null)
      setSuccessMessage(null)

      // Re-grant with VIEW permission as default
      await managedUsersAPI.grantPropertyAccess(selectedAccess.user.id, {
        propertyIds: [propertyId],
        canEdit: false,
        canExport: false,
      })

      setSuccessMessage(`Access re-granted for ${propertyName}.`)
      await reloadSelectedAccess(selectedAccess.user.id)
    } catch (err: any) {
      setError(err?.message || `Failed to re-grant access for ${propertyName}.`)
    } finally {
      setActionKey(null)
    }
  }

  const handleGrantPropertyAccess = async () => {
    if (!selectedAccess) return

    const propertyId = grantPropertyId || manualPropertyId.trim()

    if (!propertyId) {
      setError('Select a property or enter a property ID to grant access.')
      return
    }

    // Check if property is already inherited from role
    const isInherited = selectedAccess.currentAccess.role?.defaultProperties?.some(
      p => p.id === propertyId
    )

    if (isInherited) {
      setError('This property is already accessible through the user\'s role. No need to grant separately.')
      return
    }

    // Check if property is already active
    const isAlreadyActive = selectedAccess.currentAccess.properties?.some(
      p => p.id === propertyId && p.isActive === true
    )

    if (isAlreadyActive) {
      setError('This property is already actively granted to the user.')
      return
    }

    if (grantPermissions.length === 0) {
      setError('Select at least one permission before granting access.')
      return
    }

    const currentActionKey = `grant-property-${selectedAccess.user.id}`

    try {
      setActionKey(currentActionKey)
      setError(null)
      setSuccessMessage(null)

      // Send as propertyIds array to match backend expectation
      await managedUsersAPI.grantPropertyAccess(selectedAccess.user.id, {
        propertyIds: [propertyId],
        canEdit: grantPermissions.includes('EDIT'),
        canExport: grantPermissions.includes('EXPORT'),
      })

      setSuccessMessage('Property access granted successfully.')
      await reloadSelectedAccess(selectedAccess.user.id)
      
      // Clear form
      setGrantPropertyId('')
      setManualPropertyId('')
      setGrantPermissions(['VIEW'])
    } catch (err: any) {
      setError(err?.message || 'Failed to grant property access.')
    } finally {
      setActionKey(null)
    }
  }

  if (!canManageUsers) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-red-800">Access Denied</h1>
        <p className="mt-3 text-red-700">You do not have permission to manage users.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">User Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage users, inspect access details, grant and revoke property access, and
            update property-level permissions.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => loadUsers(true)}
            disabled={isRefreshing}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-300 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? <Spinner /> : null}
            Refresh
          </button>

          <Link
            href="/roles/create"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800"
          >
            Create User / Role
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 backdrop-blur-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 backdrop-blur-sm">
          {successMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white/20 p-5 shadow-lg ring-1 ring-white/30 backdrop-blur-md">
          <p className="text-sm font-semibold text-blue-900">Total Users</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{summary.total}</p>
        </div>
        <div className="rounded-2xl bg-white/20 p-5 shadow-lg ring-1 ring-white/30 backdrop-blur-md">
          <p className="text-sm font-semibold text-emerald-900">Active</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{summary.active}</p>
        </div>
        <div className="rounded-2xl bg-white/20 p-5 shadow-lg ring-1 ring-white/30 backdrop-blur-md">
          <p className="text-sm font-semibold text-amber-900">Inactive</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{summary.inactive}</p>
        </div>
        <div className="rounded-2xl bg-white/20 p-5 shadow-lg ring-1 ring-white/30 backdrop-blur-md">
          <p className="text-sm font-semibold text-sky-900">With Custom Roles</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{summary.customRoles}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white/20 p-5 shadow-lg ring-1 ring-white/30 backdrop-blur-md">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Search</label>
            <input
              type="text"
              placeholder="Search by name, email, role, custom role, property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-slate-800 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Roles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white/10 shadow-lg ring-1 ring-white/30 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/20">
            <thead className="bg-linear-to-r from-blue-200/30 to-indigo-200/30 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-800">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-800">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-800">
                  Custom Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-800">
                  Properties
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-800">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-800">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-800">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/20">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="flex items-center justify-center gap-3 text-slate-700">
                      <Spinner className="h-5 w-5" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-slate-600">
                    No managed users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const enableKey = `enable-${user.id}`
                  const disableKey = `disable-${user.id}`
                  const deleteKey = `delete-${user.id}`
                  const isActive = user.canManagerLogin === true
                  const customRoleName = getEffectiveCustomRoleName(user)
                  const propertyNames = getPropertiesPreview(user)

                  return (
                    <tr
                      key={user.id}
                      className={`${
                        index % 2 === 0 ? 'bg-white/5' : 'bg-blue-500/5'
                      } transition-all duration-200 hover:bg-white/20`}
                    >
                      <td className="px-6 py-4 align-top">
                        <div>
                          <p className="text-base font-bold text-slate-800">{user.name}</p>
                          <p className="text-sm font-medium text-slate-700">{user.email}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <span className="inline-flex rounded-full bg-blue-200/80 px-3 py-1 text-xs font-semibold text-blue-900 backdrop-blur-sm">
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-4 align-top">
                        {customRoleName ? (
                          <span className="inline-flex rounded-full bg-indigo-200/80 px-3 py-1 text-xs font-semibold text-indigo-900 backdrop-blur-sm">
                            {customRoleName}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-600">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 align-top">
                        {propertyNames.length ? (
                          <div className="flex max-w-xs flex-wrap gap-2">
                            {propertyNames.slice(0, 2).map((propertyName) => (
                              <span
                                key={`${user.id}-${propertyName}`}
                                className="inline-flex rounded-full bg-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-800 backdrop-blur-sm"
                              >
                                {propertyName}
                              </span>
                            ))}
                            {propertyNames.length > 2 ? (
                              <span className="inline-flex rounded-full bg-slate-300/80 px-3 py-1 text-xs font-semibold text-slate-800 backdrop-blur-sm">
                                +{propertyNames.length - 2} more
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-600">No properties assigned</span>
                        )}
                      </td>

                      <td className="px-6 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
                            isActive
                              ? 'bg-emerald-200/80 text-emerald-900'
                              : 'bg-amber-200/80 text-amber-900'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-6 py-4 align-top text-sm text-slate-200">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewAccess(user)}
                            disabled={isAccessLoading}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-300 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-blue-50/80 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isAccessLoading && selectedUserName === user.name ? <Spinner /> : null}
                            Access
                          </button>

                          {!isActive ? (
                            <button
                              type="button"
                              onClick={() => handleEnableUser(user)}
                              disabled={actionKey === enableKey}
                              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actionKey === enableKey ? <Spinner /> : null}
                              Enable
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDisableUser(user)}
                              disabled={actionKey === disableKey}
                              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actionKey === disableKey ? <Spinner /> : null}
                              Disable
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            disabled={actionKey === deleteKey}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionKey === deleteKey ? <Spinner /> : null}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAccessModalOpen && selectedAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-linear-to-br from-sky-900/95 to-blue-900/95 shadow-2xl backdrop-blur-md">
            {/* Sticky header - stays at top while scrolling */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sky-700 bg-linear-to-r from-sky-800/50 to-blue-800/50 px-6 py-4 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-bold text-slate-200">User Access Details</h2>
                <p className="text-sm text-slate-300">{selectedAccess.user.name}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAccessModalOpen(false)}
                className="inline-flex cursor-pointer items-center rounded-lg border border-sky-600 bg-sky-800/80 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-sky-700/80"
              >
                Close
              </button>
            </div>

            {/* Scrollable content area */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(92vh - 73px)' }}>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl bg-linear-to-br from-sky-800/60 to-indigo-800/60 p-4 ring-1 ring-sky-700 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-slate-300">User</p>
                    <p className="mt-1 text-base font-bold text-slate-200">
                      {selectedAccess.user.name}
                    </p>
                    <p className="text-sm font-medium text-slate-300">
                      {selectedAccess.user.email}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-linear-to-br from-indigo-800/60 to-purple-800/60 p-4 ring-1 ring-sky-700 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-slate-300">Assigned Role</p>
                    <p className="mt-1 font-bold text-slate-200">
                      {selectedAccess.currentAccess.role?.name || 'No custom role'}
                    </p>
                    <p className="text-sm text-slate-300">
                      {selectedAccess.currentAccess.isEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-linear-to-br from-cyan-800/60 to-blue-800/60 p-4 ring-1 ring-sky-700 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-slate-300">Manager Login</p>
                    <p className="mt-1 font-bold text-slate-200">
                      {selectedAccess.user.canManagerLogin ? 'Allowed' : 'Not allowed'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-linear-to-br from-blue-800/60 to-sky-800/60 p-4 ring-1 ring-sky-700 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-slate-300">Property Access</p>
                    <p className="mt-1 font-bold text-slate-200">
                      {selectedAccess.currentAccess.properties?.filter(p => p.isActive === true).length || 0} active properties
                    </p>
                    <p className="text-xs text-slate-400">
                      + {selectedAccess.currentAccess.role?.defaultProperties?.length || 0} inherited from role
                    </p>
                  </div>
                </div>

                {/* Role Switching Section */}
                <div className="rounded-2xl border border-sky-700 bg-linear-to-br from-sky-800/40 to-indigo-800/40 p-5 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-slate-200">Switch User Role</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Change the role assigned to this user. This will update their permissions based on the new role.
                  </p>
                  
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Select New Role
                      </label>
                      <select
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(e.target.value)}
                        className="w-full rounded-xl border border-sky-700 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Select a role...</option>
                        {customRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name} {selectedAccess.currentAccess.role?.id === role.id && '(Current)'}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleSwitchRole}
                        disabled={!selectedRoleId || selectedRoleId === selectedAccess.currentAccess.role?.id || isSwitchingRole || actionKey === `switch-role-${selectedAccess.user.id}`}
                        className="w-full inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionKey === `switch-role-${selectedAccess.user.id}` ? <Spinner /> : null}
                        Switch Role
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-700 bg-linear-to-br from-sky-800/40 to-indigo-800/40 p-5 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-slate-200">Role Permissions</h3>
                  {selectedAccess.currentAccess.role?.permissions?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedAccess.currentAccess.role.permissions.map((permission) => (
                        <span
                          key={permission.code}
                          className="inline-flex rounded-full bg-sky-700/80 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-sky-600 backdrop-blur-sm"
                        >
                          {permission.code}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-300">No role permissions assigned.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-sky-700 bg-linear-to-br from-sky-800/40 to-indigo-800/40 p-5 backdrop-blur-sm">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-200">Grant More Property Access</h3>
                      <p className="mt-1 text-sm text-slate-300">
                        Select a property you manage to grant additional access to this user.
                      </p>
                      <p className="mt-1 text-xs text-amber-300">
                        Note: Properties inherited from the role cannot be granted separately.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Available Properties (You Manage)
                      </label>
                      <select
                        value={grantPropertyId}
                        onChange={(e) => setGrantPropertyId(e.target.value)}
                        className="w-full rounded-xl border border-sky-700 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Select a property</option>
                        {availableGrantProperties.map((property) => (
                          <option key={property.id} value={property.id}>
                            {property.name}
                          </option>
                        ))}
                      </select>
                      {availableGrantProperties.length === 0 && (
                        <p className="mt-2 text-xs text-slate-400">
                          No additional properties available to grant. All properties you manage are either already assigned or inherited from the role.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Or Enter Property ID Manually
                      </label>
                      <input
                        type="text"
                        value={manualPropertyId}
                        onChange={(e) => setManualPropertyId(e.target.value)}
                        placeholder="Paste property ID if not in the list"
                        className="w-full rounded-xl border border-sky-700 bg-white/80 px-4 py-2.5 text-sm text-slate-800 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <p className="mt-2 text-xs text-slate-400">
                        Note: You can only grant access to properties you manage.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-3 text-sm font-semibold text-slate-300">
                      Permissions to grant
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {PROPERTY_PERMISSION_OPTIONS.map((permission) => (
                        <label
                          key={`grant-${permission.key}`}
                          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-sky-700 bg-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/20"
                        >
                          <input
                            type="checkbox"
                            checked={grantPermissions.includes(permission.key)}
                            onChange={() => toggleGrantPermission(permission.key)}
                            className="h-4 w-4 rounded border-sky-600 text-blue-600 focus:ring-blue-500"
                          />
                          {permission.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={handleGrantPropertyAccess}
                      disabled={actionKey === `grant-property-${selectedAccess.user.id}`}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionKey === `grant-property-${selectedAccess.user.id}` ? <Spinner /> : null}
                      Grant Access
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-700 bg-linear-to-br from-sky-800/40 to-indigo-800/40 p-5 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-slate-200">Current Property Access</h3>

                  {/* Show inherited properties first */}
                  {selectedAccess.currentAccess.role?.defaultProperties && selectedAccess.currentAccess.role.defaultProperties.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-semibold text-slate-300 mb-2">Inherited from Role:</h4>
                      <div className="space-y-2">
                        {selectedAccess.currentAccess.role.defaultProperties.map((property) => (
                          <div
                            key={property.id}
                            className="rounded-xl border border-sky-700/50 bg-slate-900/20 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-slate-200">{property.name}</p>
                                <p className="text-xs text-slate-400">Inherited from role {selectedAccess.currentAccess.role?.name}</p>
                              </div>
                              <span className="inline-flex rounded-full bg-blue-200/80 px-2 py-1 text-xs font-semibold text-blue-900">
                                Role Default
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show active directly granted properties */}
                  {(() => {
                    const activeProperties = selectedAccess.currentAccess.properties?.filter(p => p.isActive === true) || []
                    const revokedPropertiesList = selectedAccess.currentAccess.properties?.filter(p => p.isActive === false) || []

                    return (
                      <>
                        {activeProperties.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-md font-semibold text-slate-300 mb-2">Directly Granted:</h4>
                            <div className="space-y-4">
                              {activeProperties.map((property) => {
                                const saveKey = `save-property-${property.id}`
                                const revokeKey = `revoke-property-${property.id}`
                                const draftPermissions = propertyPermissionDrafts[property.id] || []

                                return (
                                  <div
                                    key={property.id}
                                    className="rounded-2xl border border-sky-700 bg-slate-900/30 p-4"
                                  >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                          <h4 className="text-base font-bold text-slate-200">
                                            {property.name}
                                          </h4>
                                          <span className="inline-flex rounded-full bg-emerald-200/80 px-3 py-1 text-xs font-semibold text-emerald-900">
                                            Active
                                          </span>
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-300">
                                          <span>Granted: {formatDate(property.grantedAt)}</span>
                                          <span>Expires: {formatDate(property.expiresAt)}</span>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSavePropertyPermissions(property.id, property.name)
                                          }
                                          disabled={actionKey === saveKey}
                                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          {actionKey === saveKey ? <Spinner /> : null}
                                          Save Permissions
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRevokePropertyAccess(property.id, property.name)
                                          }
                                          disabled={actionKey === revokeKey}
                                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          {actionKey === revokeKey ? <Spinner /> : null}
                                          Revoke Access
                                        </button>
                                      </div>
                                    </div>

                                    <div className="mt-4">
                                      <p className="mb-3 text-sm font-semibold text-slate-300">
                                        Property Permissions
                                      </p>

                                      <div className="flex flex-wrap gap-3">
                                        {PROPERTY_PERMISSION_OPTIONS.map((permission) => (
                                          <label
                                            key={`${property.id}-${permission.key}`}
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-sky-700 bg-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/20"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={draftPermissions.includes(permission.key)}
                                              onChange={() =>
                                                toggleDraftPermission(property.id, permission.key)
                                              }
                                              className="h-4 w-4 rounded border-sky-600 text-blue-600 focus:ring-blue-500"
                                            />
                                            {titleCasePermission(permission.key)}
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Show revoked properties section */}
                        {revokedPropertiesList.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-md font-semibold text-slate-300 mb-2">Revoked Access (Available for Re-grant):</h4>
                            <div className="space-y-2">
                              {revokedPropertiesList.map((property) => {
                                const regrantKey = `regrant-property-${property.id}`

                                return (
                                  <div
                                    key={property.id}
                                    className="rounded-xl border border-sky-700/50 bg-amber-900/20 p-3"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-bold text-slate-200">{property.name}</p>
                                        <p className="text-xs text-slate-400">
                                          Revoked on: {formatDate(property.grantedAt)}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleReGrantPropertyAccess(property.id, property.name)}
                                        disabled={actionKey === regrantKey}
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {actionKey === regrantKey ? <Spinner className="w-3 h-3" /> : null}
                                        Grant Access Again
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {!activeProperties.length && !revokedPropertiesList.length && (
                          <p className="mt-3 text-sm text-slate-300">No directly granted property access.</p>
                        )}
                      </>
                    )
                  })()}
                </div>

                {selectedAccess.auditHistory && selectedAccess.auditHistory.length > 0 && (
                  <div className="rounded-2xl border border-sky-700 bg-linear-to-br from-sky-800/40 to-indigo-800/40 p-5 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-slate-200">Recent Audit History</h3>
                    <div className="mt-4 space-y-3">
                      {selectedAccess.auditHistory.slice(0, 10).map((entry: any, index: number) => (
                        <div
                          key={entry.id || index}
                          className="rounded-xl bg-slate-800/50 px-4 py-3 text-sm text-slate-300 ring-1 ring-sky-700 backdrop-blur-sm"
                        >
                          <p className="font-bold text-slate-200">{entry.action || 'Activity'}</p>
                          <p className="text-slate-300">
                            {entry.createdAt ? formatDate(entry.createdAt) : formatDate(entry.timestamp)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}