import Link from 'next/link'
import { CalendarDays, Check, Eye, RotateCcw, Trash2, X } from 'lucide-react'
import type { ToDo } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ClipboardList } from 'lucide-react'
import { formatTodoDate, getTodoPriorityAppearance, getTodoStatusAppearance, TODO_PRIORITY_LABELS, TODO_STATUS_LABELS } from './todo-ui'

interface TodoListProps {
  todos: ToDo[]
  userId?: string
  canComplete: (todo: ToDo) => boolean
  canApprove: (todo: ToDo) => boolean
  canReopen: (todo: ToDo) => boolean
  canDelete: (todo: ToDo) => boolean
  onComplete: (todo: ToDo) => void
  onApprove: (todo: ToDo) => void
  onReject: (todo: ToDo) => void
  onReopen: (todo: ToDo) => void
  onDelete: (todo: ToDo) => void
}

export function TodoList({ todos, userId, canComplete, canApprove, canReopen, canDelete, onComplete, onApprove, onReject, onReopen, onDelete }: TodoListProps) {
  if (!todos.length) {
    return <EmptyState icon={ClipboardList} title="No tasks found" description="Adjust the filters or create your first task." />
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHead>
            <TableHeader>Task</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Priority</TableHeader>
            <TableHeader>Due date</TableHeader>
            <TableHeader>Assignment</TableHeader>
            <TableHeader className="text-right">Actions</TableHeader>
          </TableHead>
          <TableBody>
            {todos.map((todo) => (
              <TableRow key={todo.id}>
                <TableCell className="min-w-72 whitespace-normal">
                  <Link href={`/todos/${todo.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                    {todo.title}
                  </Link>
                  {todo.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{todo.description}</p>}
                  {todo.completionNotes && todo.status === 'PENDING_APPROVAL' && <p className="mt-1 text-xs text-primary">Notes: {todo.completionNotes}</p>}
                  {todo.rejectionReason && todo.status === 'REJECTED' && <p className="mt-1 text-xs text-destructive">Reason: {todo.rejectionReason}</p>}
                </TableCell>
                <TableCell>
                  <StatusBadge appearance={getTodoStatusAppearance(todo.status)}>{TODO_STATUS_LABELS[todo.status]}</StatusBadge>
                </TableCell>
                <TableCell>
                  <StatusBadge appearance={getTodoPriorityAppearance(todo.priority)}>{TODO_PRIORITY_LABELS[todo.priority]}</StatusBadge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {formatTodoDate(todo.dueDate)}
                  </span>
                </TableCell>
                <TableCell className="min-w-44 whitespace-normal text-sm">
                  <div>{todo.user?.id !== userId ? todo.user?.name ?? 'Current user' : 'You'}</div>
                  {todo.assignedBy && todo.assignedBy.id !== userId && <div className="text-xs text-muted-foreground">By {todo.assignedBy.name}</div>}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {canComplete(todo) && <Button size="icon" variant="ghost" title="Complete" aria-label={`Complete ${todo.title}`} onClick={() => onComplete(todo)}><Check className="h-4 w-4 text-success" /></Button>}
                    {canApprove(todo) && <Button size="icon" variant="ghost" title="Approve" aria-label={`Approve ${todo.title}`} onClick={() => onApprove(todo)}><Check className="h-4 w-4 text-success" /></Button>}
                    {canApprove(todo) && <Button size="icon" variant="ghost" title="Reject" aria-label={`Reject ${todo.title}`} onClick={() => onReject(todo)}><X className="h-4 w-4 text-destructive" /></Button>}
                    {canReopen(todo) && <Button size="icon" variant="ghost" title="Reopen" aria-label={`Reopen ${todo.title}`} onClick={() => onReopen(todo)}><RotateCcw className="h-4 w-4 text-warning" /></Button>}
                    <Link href={`/todos/${todo.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" title="View" aria-label={`View ${todo.title}`}><Eye className="h-4 w-4" /></Link>
                    {canDelete(todo) && <Button size="icon" variant="ghost" title="Delete" aria-label={`Delete ${todo.title}`} onClick={() => onDelete(todo)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
