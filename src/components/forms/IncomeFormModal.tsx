'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { otherIncomeAPI } from '@/lib/api'
import type { CreateOtherIncomeRequest, OtherIncome, OtherIncomeCategory, UpdateOtherIncomeRequest, VATType } from '@/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface OtherIncomeFormData {
  title: string; description: string; amount: number; vatRate: number; vatType: VATType
  category: OtherIncomeCategory; subCategory: string; clientName: string; clientEmail: string
  clientPhone: string; clientAddress: string; clientCompany: string; dueDate: string; bankName: string
  accountName: string; accountNumber: string; branch: string; bankCode: string; swiftCode: string; currency: string
}

interface IncomeFormModalProps {
  isOpen: boolean; onClose: () => void; onSuccess: () => void
  editingIncome?: OtherIncome | null; managerId: string
}

const STORAGE_KEY = 'otherIncomeFormData'
const initialFormData = (): OtherIncomeFormData => ({
  title: '', description: '', amount: 0, vatRate: 16, vatType: 'EXCLUSIVE', category: 'CONSULTANCY',
  subCategory: '', clientName: '', clientEmail: '', clientPhone: '', clientAddress: '', clientCompany: '',
  dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], bankName: '', accountName: '',
  accountNumber: '', branch: '', bankCode: '', swiftCode: '', currency: 'KES',
})

function valuesFromIncome(income: OtherIncome): OtherIncomeFormData {
  return {
    title: income.title, description: income.description || '', amount: income.amount, vatRate: income.vatRate || 0,
    vatType: income.vatType, category: income.category, subCategory: income.subCategory || '', clientName: income.clientName,
    clientEmail: income.clientEmail || '', clientPhone: income.clientPhone || '', clientAddress: income.clientAddress || '',
    clientCompany: income.clientCompany || '', dueDate: income.dueDate ? income.dueDate.split('T')[0] : '',
    bankName: income.bankName || '', accountName: income.accountName || '', accountNumber: income.accountNumber || '',
    branch: income.branch || '', bankCode: income.bankCode || '', swiftCode: income.swiftCode || '', currency: income.currency || 'KES',
  }
}

export default function IncomeFormModal({ isOpen, onClose, onSuccess, editingIncome = null, managerId }: IncomeFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<OtherIncomeFormData>(initialFormData())

  useEffect(() => {
    if (!isOpen) return
    const frame = window.requestAnimationFrame(() => {
      setError(null)
      if (editingIncome) {
        setFormData(valuesFromIncome(editingIncome))
        return
      }
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) { setFormData(initialFormData()); return }
      try {
        const parsed = JSON.parse(saved)
        setFormData({ ...initialFormData(), ...parsed, title: '', description: '' })
      } catch {
        setFormData(initialFormData())
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [editingIncome, isOpen])

  useEffect(() => {
    if (!isOpen || editingIncome) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
  }, [editingIncome, formData, isOpen])

  const update = <Key extends keyof OtherIncomeFormData>(key: Key, value: OtherIncomeFormData[Key]) => setFormData(current => ({ ...current, [key]: value }))
  const calculated = formData.amount > 0
    ? otherIncomeAPI.calculateVat(formData.amount, formData.vatRate, formData.vatType)
    : { vatAmount: 0, totalAmount: formData.amount }
  const formatCurrency = (amount: number) => {
    try { return new Intl.NumberFormat('en-KE', { style: 'currency', currency: formData.currency || 'KES', maximumFractionDigits: 2 }).format(amount) }
    catch { return `${formData.currency || 'KES'} ${amount.toLocaleString()}` }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const requestData: CreateOtherIncomeRequest = {
        title: formData.title, description: formData.description || undefined, amount: formData.amount,
        vatRate: formData.vatType !== 'NOT_APPLICABLE' ? formData.vatRate : undefined, vatType: formData.vatType,
        category: formData.category, subCategory: formData.subCategory || undefined, clientName: formData.clientName,
        clientEmail: formData.clientEmail || undefined, clientPhone: formData.clientPhone || undefined,
        clientAddress: formData.clientAddress || undefined, clientCompany: formData.clientCompany || undefined,
        dueDate: formData.dueDate || undefined, bankName: formData.bankName || undefined,
        accountName: formData.accountName || undefined, accountNumber: formData.accountNumber || undefined,
        branch: formData.branch || undefined, bankCode: formData.bankCode || undefined, swiftCode: formData.swiftCode || undefined,
        currency: formData.currency || 'KES', managerId,
      }
      if (editingIncome) {
        const updateData: UpdateOtherIncomeRequest = {
          title: requestData.title,
          description: requestData.description,
          amount: requestData.amount,
          vatRate: requestData.vatRate,
          vatType: requestData.vatType,
          category: requestData.category,
          subCategory: requestData.subCategory,
          clientName: requestData.clientName,
          clientEmail: requestData.clientEmail,
          clientPhone: requestData.clientPhone,
          clientAddress: requestData.clientAddress,
          clientCompany: requestData.clientCompany,
          dueDate: requestData.dueDate,
          bankName: requestData.bankName,
          accountName: requestData.accountName,
          accountNumber: requestData.accountNumber,
          branch: requestData.branch,
          bankCode: requestData.bankCode,
          swiftCode: requestData.swiftCode,
          currency: requestData.currency,
        }
        await otherIncomeAPI.update(editingIncome.id, updateData)
        alert('Income updated successfully!')
      } else {
        await otherIncomeAPI.create(requestData)
        alert('Income created successfully!')
      }
      onSuccess()
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save income')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open && !loading) onClose() }}>
      <DialogContent className="max-w-4xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editingIncome ? 'Edit other income' : 'Create other income'}</DialogTitle>
            <DialogDescription>{editingIncome ? 'Update the existing income invoice information.' : 'Record other income and its invoice details.'}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(90dvh-9rem)] space-y-6 overflow-y-auto px-5 py-5">
            {error && <Alert variant="destructive"><AlertTitle>Income could not be saved</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Income information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Title" required><Input required value={formData.title} onChange={e => update('title', e.target.value)} disabled={loading} placeholder="e.g. Property Valuation Services" /></FormField>
                <FormField label="Category" required>
                  <Select value={formData.category} onValueChange={value => update('category', value as OtherIncomeCategory)} disabled={loading}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{otherIncomeAPI.getCategories().map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}</SelectContent></Select>
                </FormField>
                <FormField label="Subcategory" optional><Input value={formData.subCategory} onChange={e => update('subCategory', e.target.value)} disabled={loading} /></FormField>
                <FormField label="Description" optional className="sm:col-span-2"><Textarea rows={3} value={formData.description} onChange={e => update('description', e.target.value)} disabled={loading} /></FormField>
              </div>
            </section>

            <section className="space-y-4 border-t border-border pt-5">
              <h3 className="text-sm font-semibold text-foreground">Amount and VAT</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="Amount" required><Input type="number" required min="0" step="0.01" value={formData.amount} onChange={e => update('amount', Number.parseFloat(e.target.value) || 0)} disabled={loading} /></FormField>
                <FormField label="VAT type"><Select value={formData.vatType} onValueChange={value => update('vatType', value as VATType)} disabled={loading}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{otherIncomeAPI.getVatTypes().map(vat => <SelectItem key={vat.value} value={vat.value}>{vat.label}</SelectItem>)}</SelectContent></Select></FormField>
                <FormField label="VAT rate (%)"><Input type="number" min="0" max="100" step="0.01" value={formData.vatRate} onChange={e => update('vatRate', Number.parseFloat(e.target.value) || 0)} disabled={loading || formData.vatType === 'NOT_APPLICABLE'} /></FormField>
              </div>
              <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm sm:grid-cols-3">
                <div><span className="text-muted-foreground">Base amount</span><p className="mt-1 font-medium tabular-nums">{formatCurrency(formData.amount)}</p></div>
                <div><span className="text-muted-foreground">VAT amount</span><p className="mt-1 font-medium tabular-nums">{formatCurrency(calculated.vatAmount)}</p></div>
                <div><span className="text-muted-foreground">Total</span><p className="mt-1 font-semibold tabular-nums">{formatCurrency(calculated.totalAmount)}</p></div>
              </div>
            </section>

            <section className="space-y-4 border-t border-border pt-5">
              <h3 className="text-sm font-semibold text-foreground">Client information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Client name" required><Input required value={formData.clientName} onChange={e => update('clientName', e.target.value)} disabled={loading} /></FormField>
                <FormField label="Client company" optional><Input value={formData.clientCompany} onChange={e => update('clientCompany', e.target.value)} disabled={loading} /></FormField>
                <FormField label="Email" optional><Input type="email" value={formData.clientEmail} onChange={e => update('clientEmail', e.target.value)} disabled={loading} /></FormField>
                <FormField label="Phone" optional><Input value={formData.clientPhone} onChange={e => update('clientPhone', e.target.value)} disabled={loading} /></FormField>
                <FormField label="Address" optional className="sm:col-span-2"><Input value={formData.clientAddress} onChange={e => update('clientAddress', e.target.value)} disabled={loading} /></FormField>
              </div>
            </section>

            <section className="space-y-4 border-t border-border pt-5">
              <h3 className="text-sm font-semibold text-foreground">Payment and banking details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Due date" optional><Input type="date" value={formData.dueDate} onChange={e => update('dueDate', e.target.value)} disabled={loading} /></FormField>
                <FormField label="Currency"><Input value={formData.currency} onChange={e => update('currency', e.target.value.toUpperCase())} disabled={loading} /></FormField>
                <FormField label="Bank name" optional className="sm:col-span-2"><Input value={formData.bankName} onChange={e => update('bankName', e.target.value)} disabled={loading} /></FormField>
                <FormField label="Account name" optional><Input value={formData.accountName} onChange={e => update('accountName', e.target.value)} disabled={loading} /></FormField>
                <FormField label="Account number" optional><Input value={formData.accountNumber} onChange={e => update('accountNumber', e.target.value)} disabled={loading} /></FormField>
                <FormField label="Branch" optional><Input value={formData.branch} onChange={e => update('branch', e.target.value)} disabled={loading} /></FormField>
                <FormField label="Bank code" optional><Input value={formData.bankCode} onChange={e => update('bankCode', e.target.value)} disabled={loading} /></FormField>
                <FormField label="SWIFT code" optional className="sm:col-span-2"><Input value={formData.swiftCode} onChange={e => update('swiftCode', e.target.value)} disabled={loading} /></FormField>
              </div>
            </section>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button><Button type="submit" loading={loading} disabled={loading}>{loading ? (editingIncome ? 'Updating…' : 'Creating…') : editingIncome ? 'Update income' : 'Create income'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
