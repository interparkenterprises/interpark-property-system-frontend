'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, Pencil, RotateCcw, Trash2, X } from 'lucide-react'
import type { ToDo } from '@/types'
import { todosAPI } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useBreadcrumbAction, useBreadcrumbOverride } from '@/components/layout/BreadcrumbContext'
import TodoForm from '@/components/forms/TodoForm'
import { TodoActionDialog, type TodoAction } from '@/components/todos/TodoActionDialog'
import { TodoDetails } from '@/components/todos/TodoDetails'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { ClipboardX } from 'lucide-react'

export default function TodoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { userId, isAdmin, isManager } = useAuth()
  const todoId = params.id as string
  const [todo, setTodo] = useState<ToDo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [action, setAction] = useState<TodoAction>(null)
  const [actionValue, setActionValue] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useBreadcrumbOverride(`/todos/${todoId}`, loading ? 'Loading…' : todo?.title ?? 'To-do details')
  useBreadcrumbAction(editing ? 'Edit' : null)

  const fetchTodo = useCallback(async () => {
    try {
      setTodo(await todosAPI.getById(todoId))
    } catch (error) {
      console.error('Error fetching todo:', error)
      setTodo(null)
    } finally {
      setLoading(false)
    }
  }, [todoId])

  // The detail route loads its record from the API after the dynamic id is available.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchTodo() }, [fetchTodo])

  const closeAction = () => {
    setAction(null)
    setActionValue('')
  }

  const confirmAction = async () => {
    if (!todo || !action) return
    setActionLoading(true)
    try {
      if (action === 'complete') await todosAPI.markAsComplete(todo.id, actionValue || undefined)
      if (action === 'reject') await todosAPI.rejectTask(todo.id, actionValue)
      if (action === 'delete') {
        await todosAPI.delete(todo.id)
        router.push('/todos')
        return
      }
      closeAction()
      await fetchTodo()
    } catch (error) {
      console.error(`Error performing ${action} action:`, error)
    } finally {
      setActionLoading(false)
    }
  }

  const approve = async () => {
    setActionLoading(true)
    try { await todosAPI.approveTask(todoId); await fetchTodo() } catch (error) { console.error('Error approving todo:', error) } finally { setActionLoading(false) }
  }

  const reopen = async () => {
    setActionLoading(true)
    try { await todosAPI.update(todoId, { status: 'PENDING' }); await fetchTodo() } catch (error) { console.error('Error reopening todo:', error) } finally { setActionLoading(false) }
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl space-y-5"><Skeleton className="h-10 w-64" /><Skeleton className="h-28" /><div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div></div>
  }

  if (!todo) {
    return <EmptyState icon={ClipboardX} title="Task not found" description="This task does not exist or is no longer available." action={<Button onClick={() => router.push('/todos')}>Back to tasks</Button>} />
  }

  const canApprove = todo.status === 'PENDING_APPROVAL' && (isAdmin || (isManager && (todo.assignedById === userId || todo.isSelfCreated)))
  const canComplete = todo.userId === userId && (todo.status === 'PENDING' || todo.status === 'IN_PROGRESS')
  const canEdit = isAdmin || isManager || todo.userId === userId
  const canDelete = isAdmin || isManager || todo.userId === userId
  const canReopen = todo.status === 'COMPLETED' && todo.userId === userId

  if (editing) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Edit task"
          description={todo.title}
          actions={<Button variant="outline" onClick={() => setEditing(false)}><ArrowLeft className="h-4 w-4" />Back to task</Button>}
        />
        <TodoForm todo={todo} onSuccess={() => { setEditing(false); void fetchTodo() }} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="ghost" className="-ml-2" onClick={() => router.push('/todos')}><ArrowLeft className="h-4 w-4" />Back to tasks</Button>
      <PageHeader
        title={todo.title}
        description="Review the task, assignment, status, and recorded completion details."
        actions={<>
          {canComplete && <Button onClick={() => setAction('complete')}><Check className="h-4 w-4" />Mark complete</Button>}
          {canApprove && <Button onClick={() => void approve()} loading={actionLoading}><Check className="h-4 w-4" />Approve</Button>}
          {canApprove && <Button variant="destructive" onClick={() => setAction('reject')} disabled={actionLoading}><X className="h-4 w-4" />Reject</Button>}
          {canReopen && <Button variant="outline" onClick={() => void reopen()} loading={actionLoading}><RotateCcw className="h-4 w-4" />Reopen</Button>}
          {canEdit && <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button>}
          {canDelete && <Button variant="destructive" onClick={() => setAction('delete')}><Trash2 className="h-4 w-4" />Delete</Button>}
        </>}
      />
      <TodoDetails todo={todo} currentUserId={userId ?? undefined} />
      <TodoActionDialog action={action} taskTitle={todo.title} value={actionValue} loading={actionLoading} onValueChange={setActionValue} onClose={closeAction} onConfirm={() => void confirmAction()} />
    </div>
  )
}
