'use client'

import type { TenantLeftReason } from '@/types'
import { TENANT_LEFT_REASON_LABELS } from '@/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface MarkTenantLeftDialogProps {
  open: boolean
  tenantName: string
  reason: TenantLeftReason | ''
  error: string | null
  loading: boolean
  onReasonChange: (reason: TenantLeftReason | '') => void
  onClose: () => void
  onConfirm: () => void
}

export function MarkTenantLeftDialog({ open, tenantName, reason, error, loading, onReasonChange, onClose, onConfirm }: MarkTenantLeftDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !loading) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark tenant as left?</DialogTitle>
          <DialogDescription>
            {tenantName} will be marked as LEFT. Payment history, invoices, and documents will remain available for historical records.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-5 py-5">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <label className="block space-y-2 text-sm font-medium text-foreground" htmlFor="tenant-left-reason">
            <span>Reason for leaving <span className="font-normal text-muted-foreground">(optional)</span></span>
            <select
              id="tenant-left-reason"
              value={reason}
              onChange={(event) => onReasonChange(event.target.value as TenantLeftReason | '')}
              disabled={loading}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">Not specified</option>
              {(Object.keys(TENANT_LEFT_REASON_LABELS) as TenantLeftReason[]).map((value) => (
                <option key={value} value={value}>{TENANT_LEFT_REASON_LABELS[value]}</option>
              ))}
            </select>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" loading={loading} onClick={onConfirm}>Mark as Left</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
