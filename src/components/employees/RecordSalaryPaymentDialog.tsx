'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Employee, PaymentFrequency, PaymentMethod, RecordSalaryPaymentRequest } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatEmployeeCurrency } from './employeePresentation'

function periodForDate(frequency: PaymentFrequency, date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  if (frequency === 'MONTHLY') return `${year}-${month}`
  if (frequency === 'DAILY') return `${year}-${month}-${day}`
  if (frequency === 'WEEKLY') {
    const firstDayOfYear = new Date(year, 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
    return `${year}-W${String(weekNumber).padStart(2, '0')}`
  }
  const startDate = new Date(year, 0, 1)
  const dayOfYear = Math.floor((date.getTime() - startDate.getTime()) / 86400000)
  const biWeekNumber = Math.floor(dayOfYear / 14)
  const periodStart = new Date(year, 0, 1 + biWeekNumber * 14)
  const periodEnd = new Date(year, 0, 1 + (biWeekNumber + 1) * 14 - 1)
  const format = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  return `${format(periodStart)}_to_${format(periodEnd)}`
}

function periodHint(frequency: PaymentFrequency) {
  const hints: Record<PaymentFrequency, string> = {
    MONTHLY: 'YYYY-MM (e.g. 2026-05)',
    DAILY: 'YYYY-MM-DD (e.g. 2026-05-26)',
    WEEKLY: 'YYYY-WXX (e.g. 2026-W21)',
    BI_WEEKLY: 'YYYY-MM-DD_to_YYYY-MM-DD (e.g. 2026-05-01_to_2026-05-14)',
  }
  return hints[frequency]
}

function validPeriod(period: string, frequency: PaymentFrequency) {
  const patterns: Record<PaymentFrequency, RegExp> = {
    MONTHLY: /^\d{4}-\d{2}$/,
    DAILY: /^\d{4}-\d{2}-\d{2}$/,
    WEEKLY: /^\d{4}-W\d{2}$/,
    BI_WEEKLY: /^\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}$/,
  }
  return patterns[frequency].test(period)
}

function adjacentPeriod(current: string, frequency: PaymentFrequency, direction: -1 | 1) {
  if (frequency === 'MONTHLY') {
    const [year, month] = current.split('-').map(Number)
    return periodForDate(frequency, new Date(year, month - 1 + direction, 1))
  }
  if (frequency === 'DAILY') {
    const date = new Date(current)
    date.setDate(date.getDate() + direction)
    return periodForDate(frequency, date)
  }
  if (frequency === 'WEEKLY') {
    const [yearText, weekText] = current.split('-W')
    const year = Number(yearText)
    const week = Number(weekText) + direction
    if (week < 1) return `${year - 1}-W52`
    if (week > 52) return `${year + 1}-W01`
    return `${year}-W${String(week).padStart(2, '0')}`
  }
  const [startText] = current.split('_to_')
  const date = new Date(startText)
  date.setDate(date.getDate() + direction * 14)
  return periodForDate(frequency, date)
}

interface RecordSalaryPaymentDialogProps {
  employee: Employee
  open: boolean
  onOpenChange: (open: boolean) => void
  submitting: boolean
  onSubmit: (data: RecordSalaryPaymentRequest) => Promise<void>
}

export function RecordSalaryPaymentDialog({ employee, open, onOpenChange, submitting, onSubmit }: RecordSalaryPaymentDialogProps) {
  const currentPeriod = periodForDate(employee.paymentFrequency, new Date())
  const [data, setData] = useState<RecordSalaryPaymentRequest>({ amount: employee.salaryAmount, paymentPeriod: currentPeriod, paymentMethod: 'BANK_TRANSFER', transactionRef: '', notes: '' })
  const [periodError, setPeriodError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validPeriod(data.paymentPeriod, employee.paymentFrequency)) {
      setPeriodError(`Invalid format. Expected: ${periodHint(employee.paymentFrequency)}`)
      return
    }
    setPeriodError(null)
    await onSubmit(data)
  }

  const movePeriod = (direction: -1 | 1) => {
    setData(current => ({ ...current, paymentPeriod: adjacentPeriod(current.paymentPeriod, employee.paymentFrequency, direction) }))
    setPeriodError(null)
  }

  return (
    <Dialog open={open} onOpenChange={nextOpen => { if (!submitting) onOpenChange(nextOpen) }}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Record salary payment</DialogTitle>
            <DialogDescription>{employee.name} · {employee.paymentFrequency.toLowerCase().replace('_', '-')} salary · {formatEmployeeCurrency(employee.salaryAmount)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-5 py-5">
            <FormField label="Amount (KES)" htmlFor="salary-payment-amount" required description={`Expected salary: ${formatEmployeeCurrency(employee.salaryAmount)}`}>
              <Input id="salary-payment-amount" type="number" required min="0" step="0.01" value={data.amount} onChange={event => setData({ ...data, amount: Number.parseFloat(event.target.value) || 0 })} />
            </FormField>
            <FormField label="Payment period" htmlFor="salary-payment-period" required error={periodError ?? undefined} description={`Payment type: ${employee.paymentFrequency}. Format: ${periodHint(employee.paymentFrequency)}`}>
              <div className="flex flex-wrap gap-2">
                <Input id="salary-payment-period" required value={data.paymentPeriod} onChange={event => { setData({ ...data, paymentPeriod: event.target.value }); setPeriodError(null) }} className="min-w-0 flex-1" />
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="outline" onClick={() => movePeriod(-1)} title="Previous period"><ChevronLeft className="size-4" /><span className="sr-only">Previous period</span></Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { setData({ ...data, paymentPeriod: currentPeriod }); setPeriodError(null) }}>Current</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => movePeriod(1)} title="Next period"><ChevronRight className="size-4" /><span className="sr-only">Next period</span></Button>
                </div>
              </div>
            </FormField>
            <FormField label="Payment method" htmlFor="salary-payment-method" required>
              <Select value={data.paymentMethod} onValueChange={value => setData({ ...data, paymentMethod: value as PaymentMethod })}>
                <SelectTrigger id="salary-payment-method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="MPESA">M-PESA</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Transaction reference" htmlFor="salary-payment-reference" optional>
              <Input id="salary-payment-reference" value={data.transactionRef || ''} onChange={event => setData({ ...data, transactionRef: event.target.value })} placeholder="e.g. TRX-123456" />
            </FormField>
            <FormField label="Notes" htmlFor="salary-payment-notes" optional>
              <Textarea id="salary-payment-notes" rows={3} value={data.notes || ''} onChange={event => setData({ ...data, notes: event.target.value })} placeholder="Optional notes about this payment" />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" loading={submitting} disabled={submitting}>{submitting ? 'Processing payment…' : 'Record payment'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
