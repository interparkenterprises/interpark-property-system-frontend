'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, Plus } from 'lucide-react'
import type { GetTodosQueryParams, ManagedUser, TaskPriority, ToDo, ToDoStatus, TodoStatistics } from '@/types'
import { authAPI, managedUsersAPI, todosAPI } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { TodoActionDialog, type TodoAction } from '@/components/todos/TodoActionDialog'
import { TodoList } from '@/components/todos/TodoList'
import { TodoStatsDialog } from '@/components/todos/TodoStatsDialog'
import { Button, buttonStyles } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/ui/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface AvailableUser {
  id: string
  name: string
  email: string
}

export default function TodosPage() {
  const { isAdmin, isManager, userId } = useAuth()
  const [todos, setTodos] = useState<ToDo[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ToDoStatus | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [stats, setStats] = useState<TodoStatistics | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [selectedStatsUser, setSelectedStatsUser] = useState('')
  const [statsUsers, setStatsUsers] = useState<AvailableUser[]>([])
  const [action, setAction] = useState<TodoAction>(null)
  const [actionTodo, setActionTodo] = useState<ToDo | null>(null)
  const [actionValue, setActionValue] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const isManagerOrAdmin = isAdmin || isManager

  const fetchTodos = useCallback(async () => {
    try {
      const params: GetTodosQueryParams = {
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        ...(priorityFilter !== 'ALL' ? { priority: priorityFilter } : {}),
        ...(selectedUserId && isManagerOrAdmin ? { userId: selectedUserId } : {}),
      }
      setTodos(await todosAPI.getAll(params))
    } catch (error) {
      console.error('Error fetching todos:', error)
    } finally {
      setLoading(false)
    }
  }, [isManagerOrAdmin, priorityFilter, selectedUserId, statusFilter])

  const fetchUsers = useCallback(async () => {
    if (!isManagerOrAdmin) return
    try {
      if (isAdmin) {
        const users = await authAPI.getAllUsers()
        const mapped = users.map(({ id, name, email }) => ({ id, name, email }))
        setStatsUsers(mapped)
        setAvailableUsers(mapped.filter((user) => user.id !== userId))
      } else {
        const users = await managedUsersAPI.getAll()
        const mapped = users.map((user: ManagedUser) => ({ id: user.id, name: user.name, email: user.email }))
        setAvailableUsers(mapped)
        setStatsUsers([{ id: userId ?? '', name: 'My stats', email: '' }, ...mapped].filter((user) => user.id))
      }
    } catch (error) {
      console.error('Error fetching task users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }, [isAdmin, isManagerOrAdmin, userId])

  // The route owns these client-side API requests and refreshes them when its filters change.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchTodos() }, [fetchTodos])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchUsers() }, [fetchUsers])

  const fetchStats = async (targetUserId?: string) => {
    const targetId = targetUserId || selectedUserId || userId || ''
    setSelectedStatsUser(targetId)
    setStatsOpen(true)
    setStatsLoading(true)
    try {
      setStats(await todosAPI.getStats(targetId || undefined))
    } catch (error) {
      console.error('Error fetching task statistics:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const openAction = (nextAction: Exclude<TodoAction, null>, todo: ToDo) => {
    setAction(nextAction)
    setActionTodo(todo)
    setActionValue('')
  }

  const closeAction = () => {
    setAction(null)
    setActionTodo(null)
    setActionValue('')
  }

  const confirmAction = async () => {
    if (!actionTodo || !action) return
    setActionLoading(true)
    try {
      if (action === 'complete') await todosAPI.markAsComplete(actionTodo.id, actionValue || undefined)
      if (action === 'reject') await todosAPI.rejectTask(actionTodo.id, actionValue)
      if (action === 'delete') await todosAPI.delete(actionTodo.id)
      closeAction()
      await fetchTodos()
    } catch (error) {
      console.error(`Error performing ${action} action:`, error)
    } finally {
      setActionLoading(false)
    }
  }

  const approve = async (todo: ToDo) => {
    try { await todosAPI.approveTask(todo.id); await fetchTodos() } catch (error) { console.error('Error approving todo:', error) }
  }

  const reopen = async (todo: ToDo) => {
    try { await todosAPI.update(todo.id, { status: 'PENDING' }); await fetchTodos() } catch (error) { console.error('Error reopening todo:', error) }
  }

  const canApprove = (todo: ToDo) => todo.status === 'PENDING_APPROVAL' && (isAdmin || (isManager && (todo.assignedById === userId || todo.isSelfCreated)))
  const canComplete = (todo: ToDo) => todo.userId === userId && (todo.status === 'PENDING' || todo.status === 'IN_PROGRESS')
  const canDelete = (todo: ToDo) => isAdmin || (isManager ? todo.assignedById === userId || todo.userId === userId : todo.userId === userId)
  const canReopen = (todo: ToDo) => todo.status === 'COMPLETED' && todo.userId === userId

  return (
    <div className="space-y-6">
      <PageHeader
        title="To-do list"
        description="Track assigned work, approvals, due dates, and completed tasks."
        actions={<>
          <Button variant="outline" onClick={() => void fetchStats()}><BarChart3 className="h-4 w-4" />View stats</Button>
          <Link href="/todos/create" className={buttonStyles()}><Plus className="h-4 w-4" />Add task</Link>
        </>}
      />

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ToDoStatus | 'ALL')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem><SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending approval</SelectItem><SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | 'ALL')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All priorities</SelectItem><SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isManagerOrAdmin && (
            <div className="space-y-1.5">
              <Label>{isAdmin ? 'User' : 'Managed user'}</Label>
              <Select value={selectedUserId || 'self'} onValueChange={(value) => setSelectedUserId(value === 'self' ? '' : value)} disabled={loadingUsers}>
                <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                <SelectContent><SelectItem value="self">My tasks</SelectItem>{availableUsers.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? <div className="space-y-3"><Skeleton className="h-14" />{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20" />)}</div> : (
        <TodoList
          todos={todos} userId={userId ?? undefined} canComplete={canComplete} canApprove={canApprove} canReopen={canReopen} canDelete={canDelete}
          onComplete={(todo) => openAction('complete', todo)} onApprove={(todo) => void approve(todo)} onReject={(todo) => openAction('reject', todo)}
          onReopen={(todo) => void reopen(todo)} onDelete={(todo) => openAction('delete', todo)}
        />
      )}

      <TodoStatsDialog
        open={statsOpen} stats={stats} loading={statsLoading} selectedUserId={selectedStatsUser} currentUserId={userId ?? undefined}
        users={statsUsers} canSelectUser={isManagerOrAdmin} onOpenChange={setStatsOpen} onUserChange={(id) => void fetchStats(id)}
      />
      <TodoActionDialog action={action} taskTitle={actionTodo?.title ?? ''} value={actionValue} loading={actionLoading} onValueChange={setActionValue} onClose={closeAction} onConfirm={() => void confirmAction()} />
    </div>
  )
}
