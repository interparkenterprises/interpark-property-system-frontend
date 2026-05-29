'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { customRolesAPI, permissionsAPI, propertiesAPI } from '@/lib/api'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import type { CustomRole, Permission, Property } from '@/types'

type RolePermissionRecord =
  | Permission
  | {
      id?: string
      permissionId?: string
      grantedAt?: string
      permission?: Permission
    }

type CustomRoleRecord = CustomRole & {
  permissions: RolePermissionRecord[]
  propertyAccess?: Array<{
    id: string
    propertyId?: string
    isActive?: boolean
    createdAt?: string
    property?: {
      id: string
      name: string
      address?: string
      lrNumber?: string
      form?: string
      usage?: string
    } | null
  }>
  assignments?: Array<{
    id: string
    userId?: string
    assignedAt?: string
    expiresAt?: string | null
    isActive?: boolean
    user?: {
      id: string
      name: string
      email: string
    } | null
  }>
}

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

function getPermissionId(permission: RolePermissionRecord) {
  return (permission as any)?.permission?.id || (permission as any)?.permissionId || (permission as any)?.id || ''
}

function getPermissionCode(permission: RolePermissionRecord) {
  return (
    (permission as any)?.permission?.code ||
    (permission as any)?.code ||
    (permission as any)?.permission?.name ||
    (permission as any)?.name ||
    'UNKNOWN_PERMISSION'
  )
}

function getPermissionName(permission: RolePermissionRecord) {
  return (
    (permission as any)?.permission?.name ||
    (permission as any)?.name ||
    (permission as any)?.permission?.code ||
    (permission as any)?.code ||
    'Unnamed permission'
  )
}

function getPermissionDescription(permission: RolePermissionRecord) {
  return (permission as any)?.permission?.description || (permission as any)?.description || ''
}

function getPermissionCategory(permission: RolePermissionRecord) {
  return (permission as any)?.permission?.category || (permission as any)?.category || 'OTHER'
}

export default function RolesPage() {
  const { canManageRoles, user } = useGlobalPermissions()

  const [roles, setRoles] = useState<CustomRoleRecord[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [actionKey, setActionKey] = useState<string | null>(null)

  const [selectedRole, setSelectedRole] = useState<CustomRoleRecord | null>(null)

  const [editingRole, setEditingRole] = useState<CustomRoleRecord | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])

  const loadData = useCallback(
    async (refresh = false) => {
      if (!canManageRoles) return

      try {
        setError(null)
        if (refresh) {
          setIsRefreshing(true)
        } else {
          setIsLoading(true)
        }

        const [rolesData, permissionsData, propertiesData] = await Promise.all([
          customRolesAPI.getAll(),
          permissionsAPI.getAll(),
          propertiesAPI.getAll(),
        ])

        setRoles(rolesData as CustomRoleRecord[])
        setPermissions(permissionsData)
        setProperties(propertiesData)
      } catch (err: any) {
        setError(err?.message || 'Failed to load role data.')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [canManageRoles]
  )

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [successMessage])

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((acc, permission) => {
      const key = permission.category || 'OTHER'
      if (!acc[key]) acc[key] = []
      acc[key].push(permission)
      return acc
    }, {})
  }, [permissions])

  const totalAssignedPermissions = useMemo(() => {
    return roles.reduce((sum, role) => sum + (role.permissions?.length || 0), 0)
  }, [roles])

  const totalAssignments = useMemo(() => {
    return roles.reduce((sum, role) => sum + (role.assignments?.length || 0), 0)
  }, [roles])

  const openRoleDetails = (role: CustomRoleRecord) => {
    setSelectedRole(role)
  }

  const closeRoleDetails = () => {
    setSelectedRole(null)
  }

  const openEditModal = (role: CustomRoleRecord) => {
    setSelectedRole(null)
    setEditingRole(role)
    setEditName(role.name)
    setEditDescription(role.description || '')
    setSelectedPermissionIds(role.permissions.map((permission) => getPermissionId(permission)).filter(Boolean))
    
    // Extract current property IDs from the role's property access
    const currentPropertyIds = (role.propertyAccess || [])
      .map((access) => access.propertyId)
      .filter((id): id is string => Boolean(id))
    setSelectedPropertyIds(currentPropertyIds)
  }

  const closeEditModal = () => {
    setEditingRole(null)
    setEditName('')
    setEditDescription('')
    setSelectedPermissionIds([])
    setSelectedPropertyIds([])
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const toggleProperty = (propertyId: string) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    )
  }

  const toggleAllProperties = () => {
    if (selectedPropertyIds.length === properties.length) {
      setSelectedPropertyIds([])
    } else {
      setSelectedPropertyIds(properties.map(p => p.id))
    }
  }

  const handleUpdateRole = async () => {
    if (!editingRole) return

    if (!editName.trim()) {
      setError('Role name is required.')
      return
    }

    if (selectedPropertyIds.length === 0) {
      setError('Please select at least one property for this role.')
      return
    }

    try {
      setActionKey(`update-${editingRole.id}`)
      setError(null)
      setSuccessMessage(null)

      await customRolesAPI.update(editingRole.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        permissionIds: selectedPermissionIds,
        propertyIds: selectedPropertyIds,
      })

      setSuccessMessage('Role updated successfully.')
      closeEditModal()
      await loadData(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to update role.')
    } finally {
      setActionKey(null)
    }
  }

  const handleDeleteRole = async (role: CustomRoleRecord) => {
    const confirmed = window.confirm(
      `Delete custom role "${role.name}"? This action cannot be undone.`
    )
    if (!confirmed) return

    try {
      setActionKey(`delete-${role.id}`)
      setError(null)
      setSuccessMessage(null)

      await customRolesAPI.delete(role.id)
      setSuccessMessage('Role deleted successfully.')

      if (selectedRole?.id === role.id) {
        closeRoleDetails()
      }

      await loadData(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to delete role.')
    } finally {
      setActionKey(null)
    }
  }

  if (!canManageRoles) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-red-800">Access Denied</h1>
        <p className="mt-3 text-red-700">You do not have permission to manage roles.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Role Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            View, inspect, edit, and remove custom roles with full permission and property details.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-300 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? <Spinner /> : null}
            Refresh
          </button>

          <Link
            href="/roles/create"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-600 bg-blue-300 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-white hover:text-blue-600"
          >
            Create Custom Role / User
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
          <p className="text-sm font-semibold text-blue-900">Custom Roles</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{roles.length}</p>
        </div>
        <div className="rounded-2xl bg-white/20 p-5 shadow-lg ring-1 ring-white/30 backdrop-blur-md">
          <p className="text-sm font-semibold text-emerald-900">Available Permissions</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{permissions.length}</p>
        </div>
        <div className="rounded-2xl bg-white/20 p-5 shadow-lg ring-1 ring-white/30 backdrop-blur-md">
          <p className="text-sm font-semibold text-sky-900">Assigned Permissions</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{totalAssignedPermissions}</p>
        </div>
        <div className="rounded-2xl bg-white/20 p-5 shadow-lg ring-1 ring-white/30 backdrop-blur-md">
          <p className="text-sm font-semibold text-indigo-900">Role Assignments</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{totalAssignments}</p>
        </div>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="rounded-2xl bg-white/20 p-10 text-center shadow-lg ring-1 ring-white/30 backdrop-blur-md">
            <div className="flex items-center justify-center gap-3 text-slate-700">
              <Spinner className="h-5 w-5" />
              Loading roles...
            </div>
          </div>
        ) : roles.length === 0 ? (
          <div className="rounded-2xl bg-white/20 p-10 text-center shadow-lg ring-1 ring-white/30 backdrop-blur-md">
            <h2 className="text-xl font-semibold text-slate-800">No Custom Roles Yet</h2>
            <p className="mt-2 text-sm text-slate-600">
              Create your first custom role to assign granular permissions.
            </p>
            <div className="mt-6">
              <Link
                href="/roles/create"
                className="inline-flex cursor-pointer items-center rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800"
              >
                Create Role
              </Link>
            </div>
          </div>
        ) : (
          roles.map((role) => (
            <div
              key={role.id}
              role="button"
              tabIndex={0}
              onClick={() => openRoleDetails(role)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openRoleDetails(role)
                }
              }}
              className="cursor-pointer rounded-2xl bg-white/20 p-6 shadow-lg ring-1 ring-white/30 transition hover:bg-white/25 backdrop-blur-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-800">{role.name}</h2>
                    <span className="inline-flex rounded-full bg-blue-200/80 px-3 py-1 text-xs font-semibold text-blue-900 backdrop-blur-sm">
                      {role.permissions?.length || 0} permissions
                    </span>
                    <span className="inline-flex rounded-full bg-emerald-200/80 px-3 py-1 text-xs font-semibold text-emerald-900 backdrop-blur-sm">
                      {role.propertyAccess?.length || 0} properties
                    </span>
                    <span className="inline-flex rounded-full bg-indigo-200/80 px-3 py-1 text-xs font-semibold text-indigo-900 backdrop-blur-sm">
                      {role.assignments?.length || 0} assignments
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-700">
                    {role.description || 'No description provided.'}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                    <span>Created: {formatDate(role.createdAt)}</span>
                    <span>Updated: {formatDate(role.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditModal(role)
                    }}
                    className="inline-flex cursor-pointer items-center rounded-lg border border-blue-300 bg-white/80 backdrop-blur-sm px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-50/80"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteRole(role)
                    }}
                    disabled={actionKey === `delete-${role.id}`}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionKey === `delete-${role.id}` ? <Spinner /> : null}
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-5 border-t border-white/20 pt-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Permissions
                </h3>

                {role.permissions?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {role.permissions.slice(0, 5).map((permission) => (
                      <span
                        key={getPermissionId(permission)}
                        className="inline-flex rounded-full bg-slate-200/80 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-slate-800"
                        title={getPermissionDescription(permission) || getPermissionName(permission)}
                      >
                        {getPermissionCode(permission)}
                      </span>
                    ))}
                    {role.permissions.length > 5 && (
                      <span className="inline-flex rounded-full bg-slate-200/80 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-slate-800">
                        +{role.permissions.length - 5} more
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-600">No permissions assigned.</p>
                )}
              </div>

              {role.propertyAccess && role.propertyAccess.length > 0 && (
                <div className="mt-4 border-t border-white/20 pt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Properties
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {role.propertyAccess.slice(0, 3).map((access) => (
                      <span
                        key={access.id}
                        className="inline-flex rounded-full bg-emerald-100/80 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-emerald-800"
                      >
                        {access.property?.name || 'Unknown Property'}
                      </span>
                    ))}
                    {role.propertyAccess.length > 3 && (
                      <span className="inline-flex rounded-full bg-emerald-100/80 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-emerald-800">
                        +{role.propertyAccess.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Role Details Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-linear-to-br from-slate-900/95 to-blue-900/95 backdrop-blur-md shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-linear-to-r from-slate-800/50 to-blue-800/50 backdrop-blur-sm px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedRole.name}</h2>
                <p className="text-sm text-slate-300">
                  {selectedRole.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedRole)}
                  className="inline-flex cursor-pointer items-center rounded-lg border border-blue-500 bg-blue-600/80 backdrop-blur-sm px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700/80"
                >
                  Edit Role
                </button>
                <button
                  type="button"
                  onClick={closeRoleDetails}
                  className="inline-flex cursor-pointer items-center rounded-lg border border-slate-600 bg-slate-700/80 backdrop-blur-sm px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-600/80"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {/* Permissions Section */}
              <div>
                <h3 className="text-lg font-bold text-white">Permissions ({selectedRole.permissions?.length || 0})</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {selectedRole.permissions?.map((permission) => (
                    <div
                      key={getPermissionId(permission)}
                      className="rounded-xl border border-slate-600 bg-white/5 p-3"
                    >
                      <p className="font-semibold text-white">{getPermissionName(permission)}</p>
                      <p className="text-xs text-slate-300">{getPermissionCode(permission)}</p>
                      {getPermissionDescription(permission) && (
                        <p className="mt-1 text-xs text-slate-400">{getPermissionDescription(permission)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Property Access Section */}
              {selectedRole.propertyAccess && selectedRole.propertyAccess.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white">Property Access ({selectedRole.propertyAccess.length})</h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-600 text-left text-slate-300">
                        <tr>
                          <th className="pb-2">Property Name</th>
                          <th className="pb-2">Address</th>
                          <th className="pb-2">LR Number</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRole.propertyAccess.map((access) => (
                          <tr key={access.id} className="border-b border-slate-700/50">
                            <td className="py-2 text-white">{access.property?.name || '—'}</td>
                            <td className="py-2 text-slate-300">{access.property?.address || '—'}</td>
                            <td className="py-2 text-slate-300">{access.property?.lrNumber || '—'}</td>
                            <td className="py-2">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                                access.isActive 
                                  ? 'bg-emerald-500/20 text-emerald-300' 
                                  : 'bg-red-500/20 text-red-300'
                              }`}>
                                {access.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Assignments Section */}
              {selectedRole.assignments && selectedRole.assignments.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white">Assigned Users ({selectedRole.assignments.length})</h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-600 text-left text-slate-300">
                        <tr>
                          <th className="pb-2">User</th>
                          <th className="pb-2">Email</th>
                          <th className="pb-2">Assigned At</th>
                          <th className="pb-2">Expires At</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRole.assignments.map((assignment) => (
                          <tr key={assignment.id} className="border-b border-slate-700/50">
                            <td className="py-2 text-white">{assignment.user?.name || '—'}</td>
                            <td className="py-2 text-slate-300">{assignment.user?.email || '—'}</td>
                            <td className="py-2 text-slate-300">{formatDate(assignment.assignedAt)}</td>
                            <td className="py-2 text-slate-300">{formatDate(assignment.expiresAt)}</td>
                            <td className="py-2">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                                assignment.isActive 
                                  ? 'bg-emerald-500/20 text-emerald-300' 
                                  : 'bg-red-500/20 text-red-300'
                              }`}>
                                {assignment.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal with Properties Selection */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-linear-to-br from-sky-900/95 to-blue-900/95 backdrop-blur-md shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-sky-700 bg-linear-to-r from-sky-800/50 to-blue-800/50 backdrop-blur-sm px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-200">Edit Role</h2>
                <p className="text-sm text-slate-300">{editingRole.name}</p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="inline-flex cursor-pointer items-center rounded-lg border border-sky-600 bg-sky-800/80 backdrop-blur-sm px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-sky-700/80"
              >
                Close
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Role Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-sky-700 bg-white/80 px-4 py-2.5 text-sm text-slate-800 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter role name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded-xl border border-sky-700 bg-white/80 px-4 py-2.5 text-sm text-slate-800 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter role description"
                  />
                </div>
              </div>

              {/* Properties Section */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-200">
                      Property Access <span className="text-red-400">*</span>
                    </h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Select which properties this role will have access to.
                      Selected: <span className="font-semibold text-white">{selectedPropertyIds.length}</span> / {properties.length}
                    </p>
                  </div>
                  
                  {properties.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllProperties}
                      className="text-sm text-blue-300 hover:text-blue-100 font-medium transition"
                    >
                      {selectedPropertyIds.length === properties.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>

                {properties.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50/80 p-4 text-sm text-yellow-800">
                    <p>No properties available. You need to create properties before editing roles.</p>
                    <Link href="/properties/create" className="mt-2 inline-block text-blue-600 hover:underline">
                      Create a Property →
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {properties.map((property) => (
                      <label
                        key={property.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-sky-700 bg-white/5 p-3 transition hover:bg-white/20"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPropertyIds.includes(property.id)}
                          onChange={() => toggleProperty(property.id)}
                          className="h-4 w-4 cursor-pointer rounded border-sky-600 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-200">{property.name}</p>
                          {property.address && (
                            <p className="text-xs text-slate-400 truncate">{property.address}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Permissions Section */}
              <div>
                <h3 className="text-lg font-bold text-slate-200">Permissions</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Select the permissions you want to assign to this role.
                  Selected: <span className="font-semibold text-white">{selectedPermissionIds.length}</span>
                </p>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                    <div
                      key={category}
                      className="rounded-2xl border border-sky-700 bg-sky-800/40 backdrop-blur-sm p-4"
                    >
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                        {category}
                      </h4>

                      <div className="mt-3 space-y-3">
                        {categoryPermissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex cursor-pointer items-start gap-3 rounded-xl border border-sky-700 bg-white/5 p-3 transition hover:bg-white/20"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissionIds.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="mt-1 h-4 w-4 cursor-pointer rounded border-sky-600 text-blue-600 focus:ring-blue-500"
                            />

                            <div>
                              <p className="text-sm font-semibold text-slate-200">
                                {permission.name}
                              </p>
                              <p className="text-xs text-slate-300">{permission.code}</p>
                              {permission.description ? (
                                <p className="mt-1 text-xs text-slate-300">
                                  {permission.description}
                                </p>
                              ) : null}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="inline-flex cursor-pointer items-center rounded-xl border border-sky-600 bg-sky-800/80 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-sky-700/80"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUpdateRole}
                  disabled={actionKey === `update-${editingRole.id}` || selectedPropertyIds.length === 0}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionKey === `update-${editingRole.id}` ? <Spinner /> : null}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}