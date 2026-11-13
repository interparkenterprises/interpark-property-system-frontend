import type { ManagedUser, PropertyAccess, UserAccessDetails } from '@/types'

export type StatusFilter = 'all' | 'active' | 'inactive'
export type PropertyPermissionKey = 'VIEW' | 'EDIT' | 'DELETE' | 'EXPORT'

export type ManagedUserRecord = ManagedUser & {
  userAssignments?: Array<{
    isActive?: boolean
    role?: {
      id: string
      name: string
      propertyAccess?: Array<{ propertyId: string; property?: { id: string; name: string } }>
    } | null
  }>
  userPropertyAccess?: Array<{
    id: string
    propertyId?: string
    isActive?: boolean
    property?: { id: string; name: string } | null
  }>
}

export interface KnownProperty { id: string; name: string }

export const PROPERTY_PERMISSION_OPTIONS: Array<{ key: PropertyPermissionKey; label: string }> = [
  { key: 'VIEW', label: 'View' },
  { key: 'EDIT', label: 'Edit' },
  { key: 'DELETE', label: 'Delete' },
  { key: 'EXPORT', label: 'Export' },
]

export function formatUserDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

export function getPropertyPermissions(property: Pick<PropertyAccess, 'canView' | 'canEdit' | 'canDelete' | 'canExport'>) {
  const permissions: PropertyPermissionKey[] = []
  if (property.canView) permissions.push('VIEW')
  if (property.canEdit) permissions.push('EDIT')
  if (property.canDelete) permissions.push('DELETE')
  if (property.canExport) permissions.push('EXPORT')
  return permissions
}

export function getCustomRoleName(user: ManagedUserRecord) {
  if (user.customRole?.name) return user.customRole.name
  return user.userAssignments?.find((assignment) => assignment.isActive !== false && assignment.role?.name)?.role?.name
    || user.userAssignments?.find((assignment) => assignment.role?.name)?.role?.name
    || ''
}

export function getPropertyPreview(user: ManagedUserRecord) {
  const properties = new Map<string, string>()
  user.propertyAccess?.filter((item) => item.isActive !== false).forEach((item) => properties.set(item.id, item.name))
  user.userPropertyAccess?.filter((item) => item.isActive !== false).forEach((item) => {
    const id = item.property?.id || item.propertyId || item.id
    properties.set(id, item.property?.name || 'Unnamed property')
  })
  user.userAssignments?.filter((item) => item.isActive !== false).forEach((item) => {
    item.role?.propertyAccess?.forEach((entry) => {
      const id = entry.property?.id || entry.propertyId
      properties.set(id, entry.property?.name || 'Inherited property')
    })
  })
  return Array.from(properties.values())
}

export function collectKnownProperties(users: ManagedUserRecord[], details?: UserAccessDetails | null) {
  const properties = new Map<string, KnownProperty>()
  users.forEach((user) => {
    user.propertyAccess?.forEach((property) => properties.set(property.id, { id: property.id, name: property.name }))
    user.userPropertyAccess?.forEach((entry) => {
      const id = entry.property?.id || entry.propertyId
      if (id) properties.set(id, { id, name: entry.property?.name || 'Unnamed property' })
    })
  })
  details?.currentAccess.properties?.forEach((property) => properties.set(property.id, { id: property.id, name: property.name }))
  details?.currentAccess.role?.defaultProperties?.forEach((property) => properties.set(property.id, property))
  return Array.from(properties.values()).sort((a, b) => a.name.localeCompare(b.name))
}
