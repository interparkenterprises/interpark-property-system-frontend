import type { Permission, Property } from '@/types'
import type { CustomRoleRecord } from '@/components/administration/create/create-role-types'
import { getRolePermission } from '@/components/administration/create/create-role-types'

export type RoleRecord = CustomRoleRecord

export function rolePermissions(role: RoleRecord): Permission[] {
  return role.permissions.map(getRolePermission).filter((permission) => Boolean(permission?.id))
}

export function rolePropertyIds(role: RoleRecord) {
  return (role.propertyAccess || [])
    .map((access) => access.propertyId || access.property?.id)
    .filter((id): id is string => Boolean(id))
}

export function roleProperties(role: RoleRecord): Property[] {
  return (role.propertyAccess || [])
    .map((access) => access.property)
    .filter((property): property is NonNullable<typeof property> => Boolean(property)) as Property[]
}

export function formatRoleDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium' }).format(date)
}

export function formatRoleDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
