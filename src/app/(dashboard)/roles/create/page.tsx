'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { customRolesAPI, managedUsersAPI, permissionsAPI, propertiesAPI } from '@/lib/api'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import type { CustomRole, Permission, Property } from '@/types'

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
  const { canManageRoles, canManageUsers, user } = useGlobalPermissions()

  const initialTab: CreateTab = canManageRoles ? 'role' : 'user'
  const [activeTab, setActiveTab] = useState<CreateTab>(initialTab)

  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<CustomRole[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  // Role form state
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])

  // User form state
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)

  useEffect(() => {
    setActiveTab(canManageRoles ? 'role' : 'user')
  }, [canManageRoles])

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null)
        setIsLoadingData(true)

        const requests: Promise<any>[] = []

        // Load permissions (needed for role creation)
        if (canManageRoles) {
          requests.push(permissionsAPI.getAll())
        } else {
          requests.push(Promise.resolve([]))
        }

        // Load roles (needed for user creation)
        if (canManageRoles || canManageUsers) {
          requests.push(customRolesAPI.getAll())
        } else {
          requests.push(Promise.resolve([]))
        }

        // Load properties (needed for role creation - to assign property access)
        if (canManageRoles) {
          // For MANAGER users, only get properties they manage
          // For ADMIN, get all properties
          if (user?.role === 'MANAGER' && user?.id) {
            requests.push(propertiesAPI.getManagerProperties(user.id))
          } else {
            requests.push(propertiesAPI.getAll())
          }
        } else {
          requests.push(Promise.resolve([]))
        }

        const [permissionsData, rolesData, propertiesData] = await Promise.all(requests)

        setPermissions(permissionsData || [])
        setRoles(rolesData || [])
        setProperties(propertiesData || [])
      } catch (err: any) {
        setError(err?.message || 'Failed to load form data.')
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [canManageRoles, canManageUsers, user])

  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 3500)
    return () => clearTimeout(timer)
  }, [successMessage])

  // Clear generated password when form is reset
  useEffect(() => {
    if (!userName && !userEmail && !selectedRoleId) {
      setGeneratedPassword(null)
      setShowPassword(false)
    }
  }, [userName, userEmail, selectedRoleId])

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

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!roleName.trim()) {
      setError('Custom role name is required.')
      return
    }

    if (selectedPropertyIds.length === 0) {
      setError('Please select at least one property for this role.')
      return
    }

    try {
      setIsCreatingRole(true)
      setError(null)

      await customRolesAPI.create({
        name: roleName.trim(),
        description: roleDescription.trim() || undefined,
        permissionIds: selectedPermissionIds,
        propertyIds: selectedPropertyIds,
      } as any)

      setSuccessMessage('Custom role created successfully.')
      setRoleName('')
      setRoleDescription('')
      setSelectedPermissionIds([])
      setSelectedPropertyIds([])

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

    if (!userName.trim()) {
      setError('Full name is required.')
      return
    }

    if (!userEmail.trim()) {
      setError('Email address is required.')
      return
    }

    if (!selectedRoleId) {
      setError('Please select a custom role for this user.')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userEmail.trim())) {
      setError('Please enter a valid email address.')
      return
    }

    try {
      setIsCreatingUser(true)
      setError(null)
      setGeneratedPassword(null)

      const response = await managedUsersAPI.create({
        name: userName.trim(),
        email: userEmail.trim(),
        roleId: selectedRoleId,
        expiresAt: expiresAt || undefined,
      })

      setSuccessMessage(`User created successfully! A temporary password has been sent to ${userEmail}.`)
      
      // Store the generated password for display (in case email fails)
      if (response.temporaryPassword) {
        setGeneratedPassword(response.temporaryPassword)
      }
      
      // Show role inheritance info
      const propertyCount = response.data?.role?.propertyAccessCount || 0
      if (propertyCount > 0) {
        setSuccessMessage(prev => `${prev} User will have access to ${propertyCount} property(ies) via the selected role.`)
      }

      // Reset form
      setUserName('')
      setUserEmail('')
      setSelectedRoleId('')
      setExpiresAt('')
      
      // Refresh roles list in case new roles were added elsewhere
      const updatedRoles = await customRolesAPI.getAll()
      setRoles(updatedRoles)
    } catch (err: any) {
      setError(err?.message || 'Failed to create managed user.')
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleResetUserForm = () => {
    setUserName('')
    setUserEmail('')
    setSelectedRoleId('')
    setExpiresAt('')
    setGeneratedPassword(null)
    setShowPassword(false)
    setError(null)
  }

  const getSelectedRoleProperties = () => {
    const selectedRole = roles.find(r => r.id === selectedRoleId)
    if (!selectedRole) return 0
    // Assuming role has propertyAccess array
    return (selectedRole as any).propertyAccess?.length || 0
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
              className="inline-flex cursor-pointer items-center rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-black-800"
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

      {/* Temporary password display (fallback if email fails) */}
      {generatedPassword && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50/80 backdrop-blur-sm p-4">
          <p className="text-sm font-semibold text-yellow-800">Important: Temporary Password</p>
          <p className="mt-1 text-sm text-yellow-700">
            If the welcome email was not received, please provide this temporary password to the user:
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded bg-yellow-100 px-3 py-1.5 text-sm font-mono text-yellow-800">
              {generatedPassword}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(generatedPassword)
                setSuccessMessage('Password copied to clipboard!')
              }}
              className="rounded-lg bg-yellow-100 px-3 py-1.5 text-xs font-medium text-yellow-800 hover:bg-yellow-200"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="rounded-lg bg-yellow-100 px-3 py-1.5 text-xs font-medium text-yellow-800 hover:bg-yellow-200"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {showPassword && (
            <p className="mt-2 text-xs text-yellow-700 break-all">
              Full password: {generatedPassword}
            </p>
          )}
          <p className="mt-2 text-xs text-yellow-700">
            This password will only be shown once. Please save it securely.
          </p>
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
                  Build a reusable role by assigning permissions and selecting accessible properties.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Role Name <span className="text-red-500">*</span>
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

              {/* Properties Section */}
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Property Access <span className="text-red-500">*</span>
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Select which properties this role will have access to.
                      Selected: <span className="font-semibold">{selectedPropertyIds.length}</span> / {properties.length}
                    </p>
                  </div>
                  
                  {properties.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllProperties}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {selectedPropertyIds.length === properties.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>

                {properties.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50/80 p-4 text-sm text-yellow-800">
                    <p>No properties available. You need to create properties before creating roles.</p>
                    <Link href="/properties/create" className="mt-2 inline-block text-blue-600 hover:underline">
                      Create a Property →
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {properties.map((property) => (
                      <label
                        key={property.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/20 bg-white/5 p-3 transition hover:bg-white/20"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPropertyIds.includes(property.id)}
                          onChange={() => toggleProperty(property.id)}
                          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">{property.name}</p>
                          {property.address && (
                            <p className="text-xs text-slate-600 truncate">{property.address}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Permissions Section */}
              <div>
                <h3 className="text-lg font-bold text-slate-800">Assign Permissions</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Selected permissions: <span className="font-semibold">{selectedPermissionIds.length}</span>
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
                    setSelectedPropertyIds([])
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
                  Add a managed user. A temporary password will be automatically generated and sent to their email.
                  Property access is inherited from the selected custom role.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name <span className="text-red-500">*</span>
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
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-slate-800 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Custom Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select a role...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} {(role as any).propertyAccess?.length ? `(${(role as any).propertyAccess.length} properties)` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedRoleId && (
                    <p className="mt-1 text-xs text-emerald-600">
                      ✓ User will inherit access to {getSelectedRoleProperties()} property(ies) from this role
                    </p>
                  )}
                  {roles.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No custom roles available. Please create a custom role first.
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Role Expiration (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-xs text-slate-600">
                    Leave empty for no expiration. The user's role access will automatically expire after this date.
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4">
                <h4 className="text-sm font-semibold text-blue-800">How it works</h4>
                <ul className="mt-2 space-y-1 text-xs text-blue-700">
                  <li>• A temporary password will be generated and sent to the user's email</li>
                  <li>• The user will inherit ALL property access from the selected role</li>
                  <li>• Permissions (view/edit/export) are defined by the role&apos;s settings</li>
                  <li>• You can grant additional property access later using the &quot;Grant Access&quot; feature</li>
                </ul>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetUserForm}
                  className="inline-flex cursor-pointer items-center rounded-xl border border-blue-300 bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50/80"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={isCreatingUser || !selectedRoleId || roles.length === 0}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingUser ? <Spinner /> : null}
                  Create User & Send Invite
                </button>
              </div>
            </form>
          ) : null}
        </>
      )}
    </div>
  )
}