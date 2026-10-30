'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CreateTodoRequest, TaskPriority, ToDo, UpdateTodoRequest } from '@/types'
import { authAPI, managedUsersAPI, todosAPI } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface TodoFormProps {
  todo?: ToDo
  onSuccess?: () => void
  onCancel?: () => void
}

interface AssignableUser {
  id: string
  name: string
  email: string
}

export default function TodoForm({ todo, onSuccess, onCancel }: TodoFormProps) {
  const { isAdmin, isManager, userId } = useAuth()
  const [formData, setFormData] = useState({
    title: todo?.title ?? '',
    description: todo?.description ?? '',
    dueDate: todo?.dueDate?.split('T')[0] ?? '',
    priority: todo?.priority ?? 'MEDIUM' as TaskPriority,
    assignedUserId: '',
  })
  const [availableUsers, setAvailableUsers] = useState<AssignableUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isManagerOrAdmin = isAdmin || isManager

  const fetchAvailableUsers = useCallback(async () => {
    try {
      if (isAdmin) {
        const users = await authAPI.getAllUsers()
        setAvailableUsers(users
          .filter((user) => user.id !== userId && user.isApproved !== false)
          .map(({ id, name, email }) => ({ id, name, email })))
      } else if (isManager) {
        const users = await managedUsersAPI.getAll()
        setAvailableUsers(users.map(({ id, name, email }) => ({ id, name, email })))
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }, [isAdmin, isManager, userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isManagerOrAdmin && !todo) void fetchAvailableUsers()
  }, [fetchAvailableUsers, isManagerOrAdmin, todo])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (todo) {
        const updateData: UpdateTodoRequest = {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          ...(formData.dueDate ? { dueDate: formData.dueDate } : {}),
        }
        await todosAPI.update(todo.id, updateData)
      } else {
        const createData: CreateTodoRequest = {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          ...(formData.dueDate ? { dueDate: formData.dueDate } : {}),
          ...(isManagerOrAdmin && formData.assignedUserId ? { assignedUserId: formData.assignedUserId } : {}),
        }
        await todosAPI.create(createData)
      }
      onSuccess?.()
    } catch (requestError) {
      const responseMessage = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(responseMessage || 'Failed to save todo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div role="alert" className="rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <FormSection title="Task details" description="Describe the work, its urgency, and when it is due.">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input label="Title" required value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} placeholder="Enter a concise task title" />
          </div>
          <div className="md:col-span-2">
            <Textarea label="Description" value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the work that needs to be completed" rows={5} />
          </div>
          <Input label="Due date" type="date" value={formData.dueDate} onChange={(event) => setFormData((current) => ({ ...current, dueDate: event.target.value }))} />
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData((current) => ({ ...current, priority: value as TaskPriority }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormSection>

      {!todo && isManagerOrAdmin && (
        <FormSection title="Assignment" description="Assign the task to yourself or an available team member.">
          <div className="space-y-1.5">
            <Label>Assign to</Label>
            <Select value={formData.assignedUserId || 'self'} onValueChange={(value) => setFormData((current) => ({ ...current, assignedUserId: value === 'self' ? '' : value }))} disabled={loadingUsers}>
              <SelectTrigger><SelectValue placeholder={loadingUsers ? 'Loading users…' : 'Select assignee'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Myself</SelectItem>
                {availableUsers.map((user) => <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>)}
              </SelectContent>
            </Select>
            {!loadingUsers && availableUsers.length === 0 && <p className="text-xs text-muted-foreground">No other eligible users are available.</p>}
          </div>
        </FormSection>
      )}

      {!todo && !isManagerOrAdmin && <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">A manager must approve a self-created task before work can begin.</div>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" loading={loading}>{todo ? 'Save changes' : 'Create task'}</Button>
      </div>
    </form>
  )
}
