import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface UserActionDialogsProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function UserActionDialogs({ open, title, description, confirmLabel, destructive, loading, onConfirm, onOpenChange }: UserActionDialogsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button variant={destructive ? 'destructive' : 'default'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
