'use client'

import Link from 'next/link'
import type { EmployeeStatus, PaymentFrequency } from '@/types'
import { Button, buttonStyles } from '@/components/ui/button'
import { FormActions } from '@/components/ui/form-actions'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export interface EmployeeFormValues {
  name: string
  phoneNumber: string
  email: string
  jobTitle: string
  jobDescription: string
  salaryAmount: number
  paymentFrequency: PaymentFrequency
  status: EmployeeStatus
}

interface EmployeeFormProps {
  values: EmployeeFormValues
  onChange: (values: EmployeeFormValues) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  cancelHref: string
  submitting: boolean
  submitLabel: string
  submittingLabel: string
}

export function EmployeeForm({ values, onChange, onSubmit, cancelHref, submitting, submitLabel, submittingLabel }: EmployeeFormProps) {
  const update = <Key extends keyof EmployeeFormValues>(key: Key, value: EmployeeFormValues[Key]) => {
    onChange({ ...values, [key]: value })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormSection title="Personal information" description="Basic identity and contact details for this employee.">
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Full name" htmlFor="employee-name" required>
            <Input id="employee-name" required value={values.name} onChange={event => update('name', event.target.value)} placeholder="Enter full name" />
          </FormField>
          <FormField label="Email" htmlFor="employee-email" optional>
            <Input id="employee-email" type="email" value={values.email} onChange={event => update('email', event.target.value)} placeholder="employee@example.com" />
          </FormField>
          <FormField label="Phone number" htmlFor="employee-phone" optional>
            <Input id="employee-phone" type="tel" value={values.phoneNumber} onChange={event => update('phoneNumber', event.target.value)} placeholder="+254XXXXXXXXX" />
          </FormField>
          <FormField label="Employment status" htmlFor="employee-status">
            <Select value={values.status} onValueChange={value => update('status', value as EmployeeStatus)}>
              <SelectTrigger id="employee-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Job information" description="Role and responsibility information shown on the employee record.">
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Job title" htmlFor="employee-job-title" required>
            <Input id="employee-job-title" required value={values.jobTitle} onChange={event => update('jobTitle', event.target.value)} placeholder="e.g. Property Manager" />
          </FormField>
          <FormField label="Job description" htmlFor="employee-job-description" optional className="md:col-span-2">
            <Textarea id="employee-job-description" rows={4} value={values.jobDescription} onChange={event => update('jobDescription', event.target.value)} placeholder="Brief description of the role and responsibilities" />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Compensation information" description="The configured salary and existing payment schedule.">
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Salary amount (KES)" htmlFor="employee-salary" required>
            <Input id="employee-salary" type="number" required min="0" step="0.01" value={values.salaryAmount || ''} onChange={event => update('salaryAmount', Number.parseFloat(event.target.value) || 0)} placeholder="0.00" />
          </FormField>
          <FormField label="Payment frequency" htmlFor="employee-payment-frequency" required>
            <Select value={values.paymentFrequency} onValueChange={value => update('paymentFrequency', value as PaymentFrequency)}>
              <SelectTrigger id="employee-payment-frequency"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="BI_WEEKLY">Bi-Weekly</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </FormSection>

      <FormActions className="border-t border-border pt-5">
        <Link href={cancelHref} className={buttonStyles({ variant: 'outline' })}>Cancel</Link>
        <Button type="submit" loading={submitting} disabled={submitting}>{submitting ? submittingLabel : submitLabel}</Button>
      </FormActions>
    </form>
  )
}
