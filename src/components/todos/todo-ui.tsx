import type { TaskPriority, ToDoStatus } from '@/types'

export const TODO_STATUS_LABELS: Record<ToDoStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  PENDING_APPROVAL: 'Pending approval',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
  REJECTED: 'Rejected',
}

export const TODO_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

export function getTodoStatusAppearance(status: ToDoStatus) {
  if (status === 'COMPLETED') return 'success' as const
  if (status === 'OVERDUE' || status === 'REJECTED') return 'destructive' as const
  if (status === 'PENDING' || status === 'PENDING_APPROVAL') return 'warning' as const
  return 'info' as const
}

export function getTodoPriorityAppearance(priority: TaskPriority) {
  if (priority === 'URGENT') return 'destructive' as const
  if (priority === 'HIGH') return 'warning' as const
  if (priority === 'MEDIUM') return 'info' as const
  return 'neutral' as const
}

export function formatTodoDate(value?: string, includeTime = false) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'

  return new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(date)
}
