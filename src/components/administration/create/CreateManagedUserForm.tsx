'use client'

import { useMemo, useState } from 'react'
import { Copy, Eye, EyeOff, Plus } from 'lucide-react'
import { managedUsersAPI } from '@/lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormActions } from '@/components/ui/form-actions'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SelectedRolePreview } from './SelectedRolePreview'
import type { CustomRoleRecord } from './create-role-types'

interface CreateManagedUserFormProps {
  roles: CustomRoleRecord[]
  selectedRoleId: string
  onSelectedRoleChange: (roleId: string) => void
  canCreateRoles: boolean
  onCreateNewRole: () => void
  onCreated: (message: string) => void
}

export function CreateManagedUserForm({
  roles,
  selectedRoleId,
  onSelectedRoleChange,
  canCreateRoles,
  onCreateNewRole,
  onCreated,
}: CreateManagedUserFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState<string>()
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId),
    [roles, selectedRoleId],
  )

  const reset = () => {
    setName('')
    setEmail('')
    setExpiresAt('')
    onSelectedRoleChange('')
    setErrors({})
    setSubmitError(undefined)
    setTemporaryPassword(undefined)
    setShowPassword(false)
    setCopied(false)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!name.trim()) nextErrors.name = 'Full name is required.'
    if (!email.trim()) nextErrors.email = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!selectedRoleId) nextErrors.role = 'Select a custom role.'
    setErrors(nextErrors)
    setSubmitError(undefined)
    if (Object.keys(nextErrors).length) return

    try {
      setSubmitting(true)
      setTemporaryPassword(undefined)
      setShowPassword(false)
      const response = await managedUsersAPI.create({
        name: name.trim(),
        email: email.trim(),
        roleId: selectedRoleId,
        expiresAt: expiresAt || undefined,
      })
      const propertyCount = response.data?.role?.propertyAccessCount || 0
      const createdEmail = email.trim()
      setName('')
      setEmail('')
      setExpiresAt('')
      onSelectedRoleChange('')
      if (response.temporaryPassword) setTemporaryPassword(response.temporaryPassword)
      onCreated(`User created successfully. Credentials were sent to ${createdEmail}. The assigned role provides access to ${propertyCount} propert${propertyCount === 1 ? 'y' : 'ies'}.`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create managed user.')
    } finally {
      setSubmitting(false)
    }
  }

  const copyPassword = async () => {
    if (!temporaryPassword) return
    try {
      await navigator.clipboard.writeText(temporaryPassword)
      setCopied(true)
    } catch {
      setSubmitError('The password could not be copied. Reveal it and copy it manually.')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {submitError && (
        <Alert variant="destructive">
          <AlertTitle>User could not be created</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      {temporaryPassword && (
        <Alert variant="warning">
          <AlertTitle>Temporary password</AlertTitle>
          <AlertDescription>
            This credential is held only in this page&apos;s memory. Copy it securely before leaving if the welcome email was not received.
          </AlertDescription>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              {showPassword ? temporaryPassword : '••••••••••••'}
            </code>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowPassword((visible) => !visible)}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPassword ? 'Hide' : 'Reveal'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => void copyPassword()}>
              <Copy className="h-4 w-4" />{copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create Managed User</CardTitle>
          <CardDescription>Create an account whose permissions and properties are inherited from a custom role.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Full Name"
              required
              error={errors.name}
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setErrors((current) => ({ ...current, name: '' }))
              }}
              placeholder="e.g. John Doe"
            />
            <Input
              label="Email Address"
              type="email"
              required
              error={errors.email}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setErrors((current) => ({ ...current, email: '' }))
              }}
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="managed-user-role" className="text-sm font-medium">Custom Role <span className="text-destructive">*</span></label>
              {canCreateRoles && (
                <Button type="button" variant="link" size="sm" onClick={onCreateNewRole}>
                  <Plus className="h-4 w-4" />Create New Role
                </Button>
              )}
            </div>
            <Select value={selectedRoleId} onValueChange={(value) => {
              onSelectedRoleChange(value)
              setErrors((current) => ({ ...current, role: '' }))
            }}>
              <SelectTrigger id="managed-user-role" aria-invalid={Boolean(errors.role)}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
            {!roles.length && <p className="text-xs text-warning">No custom roles are available. Create a role first.</p>}
          </div>

          <Input
            label="Role Expiration"
            type="datetime-local"
            helperText="Optional. Leave empty for access without an expiration date."
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />

          {selectedRole && <SelectedRolePreview role={selectedRole} />}
        </CardContent>
      </Card>

      <FormActions className="rounded-lg border border-border bg-card p-4">
        <Button type="button" variant="outline" onClick={reset} disabled={submitting}>Reset</Button>
        <Button type="submit" loading={submitting} disabled={!roles.length}>Create Managed User</Button>
      </FormActions>
    </form>
  )
}
