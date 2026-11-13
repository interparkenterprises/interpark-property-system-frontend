export interface CreateRoleDraft {
  name: string
  description: string
  propertyIds: string[]
  permissionIds: string[]
}

export function getCreateRoleDraftKey(userId: string) {
  return `create_custom_role_draft_${userId}`
}

export function parseCreateRoleDraft(
  value: unknown,
  availablePropertyIds: ReadonlySet<string>,
  availablePermissionIds: ReadonlySet<string>,
): CreateRoleDraft | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<CreateRoleDraft>
  if (typeof candidate.name !== 'string' || typeof candidate.description !== 'string') return null

  return {
    name: candidate.name,
    description: candidate.description,
    propertyIds: stringIds(candidate.propertyIds).filter((id) => availablePropertyIds.has(id)),
    permissionIds: stringIds(candidate.permissionIds).filter((id) => availablePermissionIds.has(id)),
  }
}

function stringIds(value: unknown) {
  return Array.isArray(value) ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string'))) : []
}
