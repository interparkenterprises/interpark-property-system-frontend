'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { customRolesAPI, managedUsersAPI, permissionsAPI } from '@/lib/api'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import type { CustomRole, Permission } from '@/types'

type CreateTab = 'role' | 'user'

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

export default function CreateRoleAndUserPage() {
  const { canManageRoles, canManageUsers } = useGlobalPermissions()

  const initialTab: CreateTab = canManageRoles ? 'role' : 'user'
  const [activeTab, setActiveTab] = useState<CreateTab>(initialTab)

  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<CustomRole[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])

  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [userRole, setUserRole] = useState('USER')
  const [customRoleId, setCustomRoleId] = useState('')

  useEffect(() => {
    setActiveTab(canManageRoles ? 'role' : 'user')
  }, [canManageRoles])

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null)
        setIsLoadingData(true)

        const requests: Promise<any>[] = []

        if (canManageRoles || canManageUsers) {
          requests.push(customRolesAPI.getAll())
        } else {
          requests.push(Promise.resolve([]))
        }

        if (canManageRoles) {
          requests.push(permissionsAPI.getAll())
        } else {
          requests.push(Promise.resolve([]))
        }

        const [rolesData, permissionsData] = await Promise.all(requests)

        setRoles(rolesData || [])
        setPermissions(permissionsData || [])
      } catch (err: any) {
        setError(err?.message || 'Failed to load form data.')
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [canManageRoles, canManageUsers])

  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 3500)
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

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!roleName.trim()) {
      setError('Custom role name is required.')
      return
    }

    try {
      setIsCreatingRole(true)
      setError(null)

      await customRolesAPI.create({
        name: roleName.trim(),
        description: roleDescription.trim() || undefined,
        permissionIds: selectedPermissionIds,
      })

      setSuccessMessage('Custom role created successfully.')
      setRoleName('')
      setRoleDescription('')
      setSelectedPermissionIds([])

      const updatedRoles = await customRolesAPI.getAll()
      setRoles(updatedRoles)
    } catch (err: any) {
      setError(err?.message || 'Failed to create custom role.')
    } finally {
      setIsCreatingRole(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userName.trim() || !userEmail.trim() || !userPassword.trim()) {
      setError('Name, email, and password are required.')
      return
    }

    try {
      setIsCreatingUser(true)
      setError(null)

      await managedUsersAPI.create({
        name: userName.trim(),
        email: userEmail.trim(),
        password: userPassword,
        role: userRole,
        customRoleId: customRoleId || undefined,
      })

      setSuccessMessage('Managed user created successfully.')
      setUserName('')
      setUserEmail('')
      setUserPassword('')
      setUserRole('USER')
      setCustomRoleId('')
    } catch (err: any) {
      setError(err?.message || 'Failed to create managed user.')
    } finally {
      setIsCreatingUser(false)
    }
  }

  if (!canManageRoles && !canManageUsers) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 backdrop-blur-sm p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-red-800">Access Denied</h1>
        <p className="mt-3 text-red-700">
          You do not have permission to create roles or users.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Create Custom Role & User</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create reusable custom roles and add managed users from one page.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {canManageUsers && (
            <Link
              href="/users"
              className="inline-flex cursor-pointer items-center rounded-xl border border-blue-300 bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50/80"
            >
              View Users
            </Link>
          )}

          {canManageRoles && (
            <Link
              href="/roles"
              className="inline-flex cursor-pointer items-center rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800"
            >
              View Roles
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 backdrop-blur-sm px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 backdrop-blur-sm px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      )}

      {(canManageRoles && canManageUsers) && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('role')}
            className={`inline-flex cursor-pointer items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'role'
                ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'border border-blue-300 bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-blue-50/80'
            }`}
          >
            Create Custom Role
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('user')}
            className={`inline-flex cursor-pointer items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'user'
                ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'border border-blue-300 bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-blue-50/80'
            }`}
          >
            Create Managed User
          </button>
        </div>
      )}

      {isLoadingData ? (
        <div className="rounded-2xl bg-white/20 backdrop-blur-md p-10 text-center shadow-lg ring-1 ring-white/30">
          <div className="flex items-center justify-center gap-3 text-slate-700">
            <Spinner className="w-5 h-5" />
            Loading form data...
          </div>
        </div>
      ) : (
        <>
          {(activeTab === 'role' && canManageRoles) || (canManageRoles && !canManageUsers) ? (
            <form
              onSubmit={handleCreateRole}
              className="space-y-6 rounded-2xl bg-white/20 backdrop-blur-md p-6 shadow-lg ring-1 ring-white/30"
            >
              <div className="border-b border-white/20 pb-4">
                <h2 className="text-xl font-bold text-slate-800">Create Custom Role</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Build a reusable role by assigning any combination of available permissions.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Leasing Supervisor"
                    className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-slate-800 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>
                  <input
                    type="text"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Short role description"
                    className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-slate-800 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">Assign Permissions</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Selected permissions: <span className="font-semibold text-slate-200">{selectedPermissionIds.length}</span>
                </p>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                    <div
                      key={category}
                      className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-4"
                    >
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                        {category}
                      </h4>

                      <div className="mt-3 space-y-3">
                        {categoryPermissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/20 bg-white/5 p-3 transition hover:bg-white/20"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissionIds.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />

                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {permission.name}
                              </p>
                              <p className="text-xs font-medium text-slate-600">{permission.code}</p>
                              {permission.description ? (
                                <p className="mt-1 text-xs text-slate-600">
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
                  onClick={() => {
                    setRoleName('')
                    setRoleDescription('')
                    setSelectedPermissionIds([])
                  }}
                  className="inline-flex cursor-pointer items-center rounded-xl border border-blue-300 bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50/80"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={isCreatingRole}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingRole ? <Spinner /> : null}
                  Create Role
                </button>
              </div>
            </form>
          ) : null}

          {(activeTab === 'user' && canManageUsers) || (!canManageRoles && canManageUsers) ? (
            <form
              onSubmit={handleCreateUser}
              className="space-y-6 rounded-2xl bg-white/20 backdrop-blur-md p-6 shadow-lg ring-1 ring-white/30"
            >
              <div className="border-b border-white/20 pb-4">
                <h2 className="text-xl font-bold text-slate-800">Create Managed User</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Add a managed user and optionally attach a custom role.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-slate-800 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-slate-800 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-slate-800 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    System Role
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="USER">Managed User</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Custom Role (Optional)
                  </label>
                  <select
                    value={customRoleId}
                    onChange={(e) => setCustomRoleId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">None — use system role only</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-600">
                    Attaching a custom role grants additional permissions on top of the system role.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUserName('')
                    setUserEmail('')
                    setUserPassword('')
                    setUserRole('USER')
                    setCustomRoleId('')
                  }}
                  className="inline-flex cursor-pointer items-center rounded-xl border border-blue-300 bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50/80"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingUser ? <Spinner /> : null}
                  Create User
                </button>
              </div>
            </form>
          ) : null}
        </>
      )}
    </div>
  )
}