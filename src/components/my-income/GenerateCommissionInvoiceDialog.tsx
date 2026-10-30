'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export interface CommissionInvoiceFormData {
  description: string; vatRate: number; bankName: string; accountName: string; accountNumber: string
  branch: string; bankCode: string; swiftCode: string; currency: string
}

interface GenerateCommissionInvoiceDialogProps {
  open: boolean; onOpenChange: (open: boolean) => void; values: CommissionInvoiceFormData
  onChange: (values: CommissionInvoiceFormData) => void; onSubmit: () => void; submitting: boolean
}

export function GenerateCommissionInvoiceDialog({ open, onOpenChange, values, onChange, onSubmit, submitting }: GenerateCommissionInvoiceDialogProps) {
  const update = <Key extends keyof CommissionInvoiceFormData>(key: Key, value: CommissionInvoiceFormData[Key]) => onChange({ ...values, [key]: value })
  return (
    <Dialog open={open} onOpenChange={next => { if (!submitting) onOpenChange(next) }}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={event => { event.preventDefault(); onSubmit() }}>
          <DialogHeader><DialogTitle>Generate commission invoice</DialogTitle><DialogDescription>Create the invoice linked to this commission using the existing tax and banking details.</DialogDescription></DialogHeader>
          <div className="max-h-[calc(90dvh-9rem)] space-y-5 overflow-y-auto px-5 py-5">
            <FormField label="Description" required><Textarea required rows={3} value={values.description} onChange={e => update('description', e.target.value)} disabled={submitting} /></FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="VAT rate (%)"><Input type="number" min="0" max="100" step="0.01" value={values.vatRate} onChange={e => update('vatRate', Number.parseFloat(e.target.value) || 0)} disabled={submitting} /></FormField>
              <FormField label="Currency"><Input value={values.currency} onChange={e => update('currency', e.target.value.toUpperCase())} disabled={submitting} /></FormField>
              <FormField label="Bank name" required><Input required value={values.bankName} onChange={e => update('bankName', e.target.value)} disabled={submitting} /></FormField>
              <FormField label="Account name" required><Input required value={values.accountName} onChange={e => update('accountName', e.target.value)} disabled={submitting} /></FormField>
              <FormField label="Account number" required><Input required value={values.accountNumber} onChange={e => update('accountNumber', e.target.value)} disabled={submitting} /></FormField>
              <FormField label="Branch" optional><Input value={values.branch} onChange={e => update('branch', e.target.value)} disabled={submitting} /></FormField>
              <FormField label="Bank code" optional><Input value={values.bankCode} onChange={e => update('bankCode', e.target.value)} disabled={submitting} /></FormField>
              <FormField label="SWIFT code" optional><Input value={values.swiftCode} onChange={e => update('swiftCode', e.target.value)} disabled={submitting} /></FormField>
            </div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button><Button type="submit" loading={submitting} disabled={submitting}>{submitting ? 'Generating…' : 'Generate invoice'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
