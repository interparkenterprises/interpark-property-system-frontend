export interface EditRoleDraft {
  name: string
  description: string
  permissionIds: string[]
  propertyIds: string[]
  baseUpdatedAt: string
}

export function getEditRoleDraftKey(userId: string, roleId: string) {
  return `edit_custom_role_draft_${userId}_${roleId}`
}

export function parseEditRoleDraft(
  value: unknown,
  availablePermissionIds: ReadonlySet<string>,
  availablePropertyIds: ReadonlySet<string>,
): EditRoleDraft | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<EditRoleDraft>
  if (
    typeof candidate.name !== 'string'
    || typeof candidate.description !== 'string'
    || typeof candidate.baseUpdatedAt !== 'string'
  ) return null

  return {
    name: candidate.name,
    description: candidate.description,
    permissionIds: stringIds(candidate.permissionIds).filter((id) => availablePermissionIds.has(id)),
    propertyIds: stringIds(candidate.propertyIds).filter((id) => availablePropertyIds.has(id)),
    baseUpdatedAt: candidate.baseUpdatedAt,
  }
}

function stringIds(value: unknown) {
  return Array.isArray(value) ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string'))) : []
}
