import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface RoleActionDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function RoleActionDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onOpenChange,
}: RoleActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={destructive ? 'destructive' : 'default'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
