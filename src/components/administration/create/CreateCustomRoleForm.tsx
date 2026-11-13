'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FileClock } from 'lucide-react'
import type { CreateCustomRoleRequest, Permission, Property } from '@/types'
import { customRolesAPI } from '@/lib/api'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FormSectionFooter } from '@/components/ui/form-section-footer'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCreateRoleDraftKey, parseCreateRoleDraft, type CreateRoleDraft } from './create-role-draft'
import { RoleInformationSection } from './RoleInformationSection'
import { RolePermissionSection } from './RolePermissionSection'
import { RolePropertyAccessSection } from './RolePropertyAccessSection'
import type { CustomRoleRecord, RoleSection } from './create-role-types'
import { formatCategory, permissionSection } from './create-role-types'

interface CreateCustomRoleFormProps {
  permissions: Permission[]
  properties: Property[]
  onCreated: (role: CustomRoleRecord) => void
}

export function CreateCustomRoleForm({ permissions, properties, onCreated }: CreateCustomRoleFormProps) {
  const { user } = useGlobalPermissions()
  const [section, setSection] = useState<RoleSection>('information')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])
  const [propertySearch, setPropertySearch] = useState('')
  const [permissionSearch, setPermissionSearch] = useState('')
  const [nameError, setNameError] = useState<string>()
  const [propertyError, setPropertyError] = useState<string>()
  const [submitError, setSubmitError] = useState<string>()
  const [draftMessage, setDraftMessage] = useState<string>()
  const [draftError, setDraftError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const restoredDraftKey = useRef<string | null>(null)

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
      const category = permission.category || 'OTHER'
      groups[category] = [...(groups[category] || []), permission]
      return groups
    }, {})
  }, [permissions])

  const categories = useMemo(() => Object.keys(groupedPermissions).sort((a, b) => a.localeCompare(b)), [groupedPermissions])
  const sections = useMemo<RoleSection[]>(() => [
    'information',
    'properties',
    ...categories.map(permissionSection),
  ], [categories])
  const currentSection = sections.includes(section) ? section : sections[0]
  const draftKey = user?.id ? getCreateRoleDraftKey(user.id) : null

  useEffect(() => {
    if (!draftKey || restoredDraftKey.current === draftKey) return

    const frame = window.requestAnimationFrame(() => {
      restoredDraftKey.current = draftKey
      try {
        const savedDraft = localStorage.getItem(draftKey)
        if (!savedDraft) return

        const restored = parseCreateRoleDraft(
          JSON.parse(savedDraft) as unknown,
          new Set(properties.map((property) => property.id)),
          new Set(permissions.map((permission) => permission.id)),
        )
        if (!restored) return

        setName(restored.name)
        setDescription(restored.description)
        setSelectedPropertyIds(restored.propertyIds)
        setSelectedPermissionIds(restored.permissionIds)
        setDraftMessage('Your saved role draft was restored from this browser.')
      } catch (error) {
        console.error('Failed to restore custom role draft:', error)
        setDraftError('The saved role draft could not be restored.')
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [draftKey, permissions, properties])

  useEffect(() => {
    const propertyIds = new Set(properties.map((property) => property.id))
    const permissionIds = new Set(permissions.map((permission) => permission.id))
    const frame = window.requestAnimationFrame(() => {
      setSelectedPropertyIds((current) => current.filter((id) => propertyIds.has(id)))
      setSelectedPermissionIds((current) => current.filter((id) => permissionIds.has(id)))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [permissions, properties])

  useEffect(() => {
    if (sections.includes(section)) return
    const frame = window.requestAnimationFrame(() => setSection('information'))
    return () => window.cancelAnimationFrame(frame)
  }, [section, sections])

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((current) => current.includes(permissionId)
      ? current.filter((id) => id !== permissionId)
      : [...current, permissionId])
  }

  const toggleCategory = (category: string) => {
    const categoryIds = groupedPermissions[category].map((permission) => permission.id)
    const everySelected = categoryIds.every((id) => selectedPermissionIds.includes(id))
    setSelectedPermissionIds((current) => everySelected
      ? current.filter((id) => !categoryIds.includes(id))
      : Array.from(new Set([...current, ...categoryIds])))
  }

  const toggleProperty = (propertyId: string) => {
    setPropertyError(undefined)
    setSelectedPropertyIds((current) => current.includes(propertyId)
      ? current.filter((id) => id !== propertyId)
      : [...current, propertyId])
  }

  const reset = () => {
    setSection('information')
    setName('')
    setDescription('')
    setSelectedPermissionIds([])
    setSelectedPropertyIds([])
    setPropertySearch('')
    setPermissionSearch('')
    setNameError(undefined)
    setPropertyError(undefined)
    setSubmitError(undefined)
    setDraftMessage(undefined)
    setDraftError(undefined)
  }

  const saveDraft = () => {
    if (!draftKey) {
      setDraftError('Your draft could not be scoped to an authenticated account. Please sign in again.')
      return
    }

    const draft: CreateRoleDraft = {
      name,
      description,
      propertyIds: selectedPropertyIds,
      permissionIds: selectedPermissionIds,
    }

    try {
      localStorage.setItem(draftKey, JSON.stringify(draft))
      setDraftMessage('Your role draft was saved in this browser.')
      setDraftError(undefined)
    } catch (error) {
      console.error('Failed to save custom role draft:', error)
      setDraftError('Your role draft could not be saved in this browser.')
    }
  }

  const clearDraft = () => {
    if (!draftKey) return
    try {
      localStorage.removeItem(draftKey)
    } catch (error) {
      console.error('Failed to clear custom role draft:', error)
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setNameError(undefined)
    setPropertyError(undefined)
    setSubmitError(undefined)

    if (!name.trim()) {
      setNameError('Custom role name is required.')
      setSection('information')
      return
    }
    if (!selectedPropertyIds.length) {
      setPropertyError('Select at least one property for this role.')
      setSection('properties')
      return
    }

    const payload: CreateCustomRoleRequest & { propertyIds: string[] } = {
      name: name.trim(),
      description: description.trim() || undefined,
      permissionIds: selectedPermissionIds,
      propertyIds: selectedPropertyIds,
    }

    try {
      setSubmitting(true)
      const created = await customRolesAPI.create(payload)
      clearDraft()
      reset()
      onCreated(created as CustomRoleRecord)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create custom role.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {submitError && (
        <Alert variant="destructive">
          <AlertTitle>Role could not be created</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      {draftError && (
        <Alert variant="destructive">
          <AlertTitle>Draft could not be saved</AlertTitle>
          <AlertDescription>{draftError}</AlertDescription>
        </Alert>
      )}
      {draftMessage && (
        <Alert variant="info" className="flex gap-3">
          <FileClock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <AlertTitle>Draft saved</AlertTitle>
            <AlertDescription>{draftMessage}</AlertDescription>
          </div>
        </Alert>
      )}

      <Tabs
        value={currentSection}
        onValueChange={(value) => {
          setSection(value as RoleSection)
          setPermissionSearch('')
        }}
        orientation="vertical"
        className="flex-col md:flex-row"
      >
        <TabsList
          aria-label="Custom role form sections"
          className="h-auto w-full flex-row items-stretch overflow-x-auto md:w-64 md:flex-col md:overflow-visible"
        >
          <TabsTrigger value="information">Role Information</TabsTrigger>
          <TabsTrigger value="properties">
            Property Access
            <Badge variant="neutral">{selectedPropertyIds.length}</Badge>
          </TabsTrigger>
          {categories.length > 0 && <Separator className="hidden my-1 md:block" />}
          {categories.map((category) => {
            const categoryPermissions = groupedPermissions[category]
            const selected = categoryPermissions.filter((permission) => selectedPermissionIds.includes(permission.id)).length
            return (
              <TabsTrigger key={category} value={permissionSection(category)}>
                <span className="truncate">{formatCategory(category)}</span>
                <Badge variant="neutral">{selected}/{categoryPermissions.length}</Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <div className="min-w-0 flex-1">
          <TabsContent value="information">
            <RoleInformationSection
              name={name}
              description={description}
              nameError={nameError}
              onNameChange={(value) => {
                setName(value)
                setNameError(undefined)
              }}
              onDescriptionChange={setDescription}
            />
          </TabsContent>
          <TabsContent value="properties">
            <RolePropertyAccessSection
              properties={properties}
              selectedIds={selectedPropertyIds}
              error={propertyError}
              search={propertySearch}
              onSearchChange={setPropertySearch}
              onToggle={toggleProperty}
              onToggleAll={() => {
                setPropertyError(undefined)
                setSelectedPropertyIds(selectedPropertyIds.length === properties.length ? [] : properties.map((property) => property.id))
              }}
            />
          </TabsContent>
          {categories.map((category) => (
            <TabsContent key={category} value={permissionSection(category)}>
              <RolePermissionSection
                category={category}
                permissions={groupedPermissions[category]}
                selectedIds={selectedPermissionIds}
                search={permissionSearch}
                onSearchChange={setPermissionSearch}
                onToggle={togglePermission}
                onToggleCategory={() => toggleCategory(category)}
              />
            </TabsContent>
          ))}
        </div>
      </Tabs>

      <FormSectionFooter
        sections={sections}
        activeSection={currentSection}
        onSectionChange={(value) => {
          setSection(value)
          setPermissionSearch('')
        }}
        onCancel={reset}
        cancelLabel="Reset"
        onSaveDraft={saveDraft}
        disabled={submitting}
        finalAction={<Button type="submit" loading={submitting}>Create Role</Button>}
      />
    </form>
  )
}
