'use client'

import { AlertTriangle, CheckCircle2, Trash2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export type TodoAction = 'complete' | 'reject' | 'delete' | null

interface TodoActionDialogProps {
  action: TodoAction
  taskTitle: string
  value: string
  loading: boolean
  onValueChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}

const content = {
  complete: {
    title: 'Complete task',
    description: 'Submit this task for approval. You can include completion notes for the reviewer.',
    confirm: 'Complete task',
    icon: CheckCircle2,
  },
  reject: {
    title: 'Reject task',
    description: 'Explain why this task is being rejected so the assignee knows what needs attention.',
    confirm: 'Reject task',
    icon: XCircle,
  },
  delete: {
    title: 'Delete task',
    description: 'This permanently removes the task and cannot be undone.',
    confirm: 'Delete task',
    icon: Trash2,
  },
} as const

export function TodoActionDialog({ action, taskTitle, value, loading, onValueChange, onClose, onConfirm }: TodoActionDialogProps) {
  if (!action) return null
  const details = content[action]
  const Icon = details.icon
  const destructive = action === 'reject' || action === 'delete'

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={destructive ? 'rounded-md bg-destructive/10 p-2 text-destructive' : 'rounded-md bg-success/10 p-2 text-success'}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle>{details.title}</DialogTitle>
              <DialogDescription className="mt-1">{details.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 px-5 py-5">
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm font-medium text-foreground">
            {taskTitle}
          </div>
          {action === 'complete' && (
            <Textarea
              label="Completion notes"
              helperText="Optional"
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              placeholder="Summarize the completed work"
            />
          )}
          {action === 'reject' && (
            <Textarea
              label="Rejection reason"
              required
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              placeholder="Explain why the task is being rejected"
            />
          )}
          {action === 'delete' && (
            <div className="flex gap-2 rounded-md border border-warning/25 bg-warning/10 p-3 text-sm text-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              Confirm that you want to permanently delete this task.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            loading={loading}
            disabled={action === 'reject' && !value.trim()}
            onClick={onConfirm}
          >
            {details.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
