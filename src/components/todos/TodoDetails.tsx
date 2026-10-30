import { CalendarDays, CheckCircle2, Clock3, FileText, Info, UserRound, UsersRound } from 'lucide-react'
import type { ToDo } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DetailItem, DetailList } from '@/components/ui/detail-list'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatTodoDate, getTodoPriorityAppearance, getTodoStatusAppearance, TODO_PRIORITY_LABELS, TODO_STATUS_LABELS } from './todo-ui'

const statusDescriptions = {
  PENDING: 'This task is ready to be started.',
  IN_PROGRESS: 'Work on this task is currently in progress.',
  PENDING_APPROVAL: 'The task was submitted and is waiting for manager review.',
  COMPLETED: 'The task was reviewed and completed.',
  OVERDUE: 'The task has passed its due date.',
  REJECTED: 'The task was rejected and may require more work.',
}

interface TodoDetailsProps {
  todo: ToDo
  currentUserId?: string
}

export function TodoDetails({ todo, currentUserId }: TodoDetailsProps) {
  const assignmentMessage = todo.isSelfCreated
    ? todo.status === 'PENDING_APPROVAL'
      ? 'This self-created task is waiting for manager approval.'
      : todo.status === 'REJECTED'
        ? 'This self-created task was rejected. Review the reason provided.'
        : 'This task was created by its assignee.'
    : todo.assignedById && todo.assignedById !== currentUserId
      ? `This task was assigned by ${todo.assignedBy?.name ?? 'a manager'} and may require approval when completed.`
      : null

  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge appearance={getTodoStatusAppearance(todo.status)}>{TODO_STATUS_LABELS[todo.status]}</StatusBadge>
              <StatusBadge appearance={getTodoPriorityAppearance(todo.priority)}>{TODO_PRIORITY_LABELS[todo.priority]} priority</StatusBadge>
              {todo.isSelfCreated && <StatusBadge appearance="info">Self-created</StatusBadge>}
            </div>
            <p className="mt-2 text-sm text-foreground">{statusDescriptions[todo.status]}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Task information</CardTitle>
              <CardDescription>The task description, priority, and important dates.</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailList>
                <DetailItem label="Description" icon={<FileText className="h-4 w-4" />}>
                  <span className="whitespace-pre-wrap">{todo.description || 'No description provided.'}</span>
                </DetailItem>
                <DetailItem label="Priority"><StatusBadge appearance={getTodoPriorityAppearance(todo.priority)}>{TODO_PRIORITY_LABELS[todo.priority]}</StatusBadge></DetailItem>
                <DetailItem label="Due date" icon={<CalendarDays className="h-4 w-4" />}>{formatTodoDate(todo.dueDate, true)}</DetailItem>
                <DetailItem label="Created" icon={<Clock3 className="h-4 w-4" />}>{formatTodoDate(todo.createdAt, true)}</DetailItem>
                {todo.updatedAt !== todo.createdAt && <DetailItem label="Last updated">{formatTodoDate(todo.updatedAt, true)}</DetailItem>}
                {todo.completedAt && <DetailItem label="Completed">{formatTodoDate(todo.completedAt, true)}</DetailItem>}
              </DetailList>
            </CardContent>
          </Card>

          {(todo.completionNotes || todo.rejectionReason) && (
            <Card>
              <CardHeader>
                <CardTitle>Completion and review</CardTitle>
                <CardDescription>Notes recorded during completion or review.</CardDescription>
              </CardHeader>
              <CardContent>
                <DetailList>
                  {todo.completionNotes && <DetailItem label="Completion notes"><span className="whitespace-pre-wrap">{todo.completionNotes}</span></DetailItem>}
                  {todo.rejectionReason && <DetailItem label="Rejection reason"><span className="whitespace-pre-wrap text-destructive">{todo.rejectionReason}</span></DetailItem>}
                </DetailList>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
              <CardDescription>People responsible for this task and its review.</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailList>
                <DetailItem label="Assigned to" icon={<UserRound className="h-4 w-4" />}>
                  <div>{todo.user?.name ?? 'Current user'}</div>
                  {todo.user?.email && <div className="text-xs text-muted-foreground">{todo.user.email}</div>}
                </DetailItem>
                {todo.assignedBy && (
                  <DetailItem label="Assigned by" icon={<UsersRound className="h-4 w-4" />}>
                    <div>{todo.assignedBy.name}</div><div className="text-xs text-muted-foreground">{todo.assignedBy.email}</div>
                  </DetailItem>
                )}
                {todo.approvedBy && (
                  <DetailItem label="Approved by" icon={<CheckCircle2 className="h-4 w-4" />}>
                    <div>{todo.approvedBy.name}</div>{todo.approvedAt && <div className="text-xs text-muted-foreground">{formatTodoDate(todo.approvedAt, true)}</div>}
                  </DetailItem>
                )}
                {todo.reviewedBy && (
                  <DetailItem label="Reviewed by">
                    <div>{todo.reviewedBy.name}</div>{todo.reviewedAt && <div className="text-xs text-muted-foreground">{formatTodoDate(todo.reviewedAt, true)}</div>}
                  </DetailItem>
                )}
              </DetailList>
            </CardContent>
          </Card>

          {assignmentMessage && (
            <Card>
              <CardContent className="flex gap-3 p-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm leading-6 text-muted-foreground">{assignmentMessage}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
