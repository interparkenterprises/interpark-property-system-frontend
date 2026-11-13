import type { CustomRole, Permission } from '@/types'

export type RoleSection = 'information' | 'properties' | `permission:${string}`

export type CustomRoleRecord = Omit<CustomRole, 'permissions'> & {
  propertyAccess?: Array<{
    propertyId?: string
    property?: { id: string; name: string } | null
  }>
  permissions: Array<Permission | { permission?: Permission }>
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
      canManagerLogin?: boolean
      isActive?: boolean
    } | null
  }>
}

export function getRolePermission(entry: CustomRoleRecord['permissions'][number]) {
  return 'permission' in entry && entry.permission ? entry.permission : entry as Permission
}

export function permissionSection(category: string): RoleSection {
  return `permission:${category}`
}

export function categoryFromSection(section: RoleSection) {
  return section.startsWith('permission:') ? section.slice('permission:'.length) : null
}

export function formatCategory(category: string) {
  return category
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
