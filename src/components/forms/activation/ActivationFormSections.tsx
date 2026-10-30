'use client'

import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/Switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { ActivationChangeHandler, ActivationFormData, ActivationManualOverrides, ActivationVatDetails } from './types'

interface CommonSectionProps { data: ActivationFormData; onChange: ActivationChangeHandler }
interface SectionShellProps { title: string; description: string; children: React.ReactNode }

function SectionShell({ title, description, children }: SectionShellProps) {
  return <section className="space-y-6 rounded-lg border border-border bg-card p-4 sm:p-5"><div><h3 className="text-base font-semibold text-foreground">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{children}</section>
}

export function CompanyInformationSection({ data, onChange }: CommonSectionProps) {
  return (
    <SectionShell title="Company Information" description="Record the company and primary contact details for this request.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input name="companyName" value={data.companyName} onChange={onChange} label="Company name" required placeholder="Enter company name" /></div>
        <div className="sm:col-span-2"><Textarea name="postalAddress" value={data.postalAddress} onChange={onChange} label="Postal address" required rows={2} placeholder="Enter company postal address" /></div>
        <Input type="tel" name="telephone" value={data.telephone} onChange={onChange} label="Telephone" required placeholder="Company telephone number" />
        <Input type="tel" name="alternativeContact" value={data.alternativeContact} onChange={onChange} label="Alternative contact" placeholder="Alternative contact number" />
        <Input name="contactPerson" value={data.contactPerson} onChange={onChange} label="Contact person" required placeholder="Enter contact person name" />
        <Input name="designation" value={data.designation} onChange={onChange} label="Designation" required placeholder="For example: Marketing Manager" />
        <Input type="email" name="email" value={data.email} onChange={onChange} label="Email address" required placeholder="email@example.com" />
        <Input type="tel" name="mobileNo" value={data.mobileNo} onChange={onChange} label="Mobile number" required placeholder="+254 XXX XXX XXX" />
      </div>
    </SectionShell>
  )
}

interface ActivationDetailsSectionProps extends CommonSectionProps { onSoundSystemChange: (checked: boolean) => void }

export function ActivationDetailsSection({ data, onChange, onSoundSystemChange }: ActivationDetailsSectionProps) {
  return (
    <SectionShell title="Activation Details" description="Define the activation type, operating schedule and expected requirements.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="activationType" value={data.activationType} onChange={onChange} label="Activation type" required placeholder="Product launch, exhibition or pop-up store" list="activation-types-suggestions" />
        <datalist id="activation-types-suggestions">
          {['OFFICE_SPACE','RETAIL_SPACE','WAREHOUSE','EVENT_SPACE','POP_UP_STORE','SHOWROOM','PRODUCT_LAUNCH','PROMOTIONAL_EVENT','EXHIBITION','MARKETING_CAMPAIGN','BRAND_ACTIVATION','TRADE_SHOW','ROADSHOW','SAMPLE_DISTRIBUTION','MEDIA_EVENT','CORPORATE_EVENT','FITNESS_CLASS','WORKSHOP','SEMINAR','CONFERENCE','OTHER'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
        </datalist>
        <Input type="date" name="startDate" value={data.startDate} onChange={onChange} label="Start date" required />
        <Input name="setupTime" value={data.setupTime} onChange={onChange} label="Setup time" required placeholder="For example: 9:00 AM" />
        <Input type="date" name="endDate" value={data.endDate} onChange={onChange} label="End date" required />
        <Input name="tearDownTime" value={data.tearDownTime} onChange={onChange} label="Tear-down time" required placeholder="For example: 5:00 PM" />
        <Input type="number" min={0} name="expectedVisitors" value={data.expectedVisitors} onChange={onChange} label="Expected visitors" placeholder="Estimated number of visitors" />
        <div className="sm:col-span-2"><Textarea name="description" value={data.description} onChange={onChange} label="Description" rows={4} placeholder="Describe the activation or exhibition" /></div>
        <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/20 p-3 sm:col-span-2">
          <div><Label htmlFor="sound-system">Sound system required</Label><p className="mt-1 text-xs text-muted-foreground">Indicate whether the activation requires amplified sound equipment.</p></div>
          <Switch id="sound-system" name="soundSystem" checked={data.soundSystem} onCheckedChange={onSoundSystemChange} />
        </div>
      </div>
    </SectionShell>
  )
}

interface FinancialDetailsSectionProps extends CommonSectionProps {
  overrides: ActivationManualOverrides
  onResetOverride: (field: 'numberOfDays' | 'proposedBudget') => void
}

export function FinancialDetailsSection({ data, onChange, overrides, onResetOverride }: FinancialDetailsSectionProps) {
  return (
    <SectionShell title="Financial Details" description="Enter the daily fee and confirm the calculated duration and proposed budget.">
      <div className="grid gap-4 lg:grid-cols-3">
        <Input type="number" min={0} step="0.01" name="licenseFeePerDay" value={data.licenseFeePerDay} onChange={onChange} label="License fee per day (KES)" placeholder="0.00" />
        <CalculatedInput label="Number of days" name="numberOfDays" value={data.numberOfDays} onChange={onChange} overridden={overrides.numberOfDays} onReset={() => onResetOverride('numberOfDays')} helper={overrides.numberOfDays ? 'Manually overridden. Restore calculation from the selected dates.' : 'Calculated from start and end dates. Enter 0 for a same-day activation.'} />
        <CalculatedInput label="Proposed budget (KES)" name="proposedBudget" value={data.proposedBudget} onChange={onChange} overridden={overrides.proposedBudget} onReset={() => onResetOverride('proposedBudget')} helper={overrides.proposedBudget ? 'Manually overridden. Restore the fee × billing-days calculation.' : 'Calculated from the license fee and inclusive billing days.'} step="0.01" />
      </div>
    </SectionShell>
  )
}

function CalculatedInput({ label, name, value, onChange, overridden, onReset, helper, step }: { label: string; name: string; value: string; onChange: ActivationChangeHandler; overridden: boolean; onReset: () => void; helper: string; step?: string }) {
  return <div className="space-y-1.5"><div className="flex items-center justify-between gap-2"><Label htmlFor={name}>{label}</Label>{overridden && <Button type="button" variant="link" size="sm" onClick={onReset}><RotateCcw className="size-3.5" />Auto-calculate</Button>}</div><Input id={name} type="number" min={0} step={step} name={name} value={value} onChange={onChange} className={cn(overridden && 'border-warning focus-visible:border-warning focus-visible:ring-warning/20')} /><p className="text-xs text-muted-foreground">{helper}</p></div>
}

interface VatInformationSectionProps extends CommonSectionProps { details: ActivationVatDetails }

export function VatInformationSection({ data, onChange, details }: VatInformationSectionProps) {
  return (
    <SectionShell title="VAT Information" description="Confirm the VAT treatment and review the resulting amount breakdown.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="vatType" required>VAT type</Label><select id="vatType" name="vatType" value={data.vatType} onChange={onChange} required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"><option value="INCLUSIVE">VAT Inclusive</option><option value="EXCLUSIVE">VAT Exclusive</option><option value="NOT_APPLICABLE">VAT Not Applicable</option></select><p className="text-xs text-muted-foreground">{data.vatType === 'INCLUSIVE' ? 'VAT is already included in the prices.' : data.vatType === 'EXCLUSIVE' ? 'VAT will be added to the prices.' : 'No VAT will be applied.'}</p></div>
        <Input type="number" min={0} max={100} step="0.1" name="vat" value={data.vat} onChange={onChange} label="VAT percentage (%)" required helperText="The standard VAT rate in Kenya is 16%." />
      </div>
      {(data.proposedBudget || data.licenseFeePerDay) && <div className="rounded-md border border-border bg-muted/20 p-4"><h4 className="text-sm font-semibold text-foreground">VAT calculation</h4><dl className="mt-3 space-y-2 text-sm"><AmountRow label="Base amount" value={details.baseAmount} /><AmountRow label={`VAT (${data.vat}%) ${data.vatType === 'INCLUSIVE' ? '(included)' : data.vatType === 'EXCLUSIVE' ? '(exclusive)' : ''}`} value={details.vatAmount} /><AmountRow label="Total amount" value={details.totalAmount} strong /></dl><p className="mt-3 text-xs text-muted-foreground">{data.vatType === 'INCLUSIVE' && details.vatAmount > 0 ? `KES ${details.vatAmount.toFixed(2)} VAT is already included in the total amount.` : data.vatType === 'EXCLUSIVE' && details.vatAmount > 0 ? `KES ${details.vatAmount.toFixed(2)} VAT will be added to the base amount.` : data.vatType === 'NOT_APPLICABLE' ? 'No VAT will be applied to this activation.' : null}</p></div>}
    </SectionShell>
  )
}

function AmountRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) { return <div className={cn('flex items-center justify-between gap-4', strong && 'border-t border-border pt-2 font-semibold')}><dt className="text-muted-foreground">{label}</dt><dd className="text-right text-foreground">KES {value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd></div> }

export function PaymentDetailsSection({ data, onChange }: CommonSectionProps) {
  return (
    <SectionShell title="Payment Details" description="Capture the optional bank and M-Pesa payment instructions for the request.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="bankName" value={data.bankName} onChange={onChange} label="Bank name" placeholder="For example: Standard Chartered" />
        <Input name="bankBranch" value={data.bankBranch} onChange={onChange} label="Bank branch" placeholder="For example: Westlands" />
        <Input name="accountName" value={data.accountName} onChange={onChange} label="Account name" placeholder="Account holder name" />
        <Input name="accountNumber" value={data.accountNumber} onChange={onChange} label="Account number" placeholder="Bank account number" />
        <Input name="swiftCode" value={data.swiftCode} onChange={onChange} label="SWIFT code" placeholder="For example: SCBLKENX" />
      </div>
      <div className="border-t border-border pt-5"><h4 className="text-sm font-semibold text-foreground">M-Pesa payment details</h4><div className="mt-4 grid gap-4 sm:grid-cols-2"><Input name="paybillNumber" value={data.paybillNumber} onChange={onChange} label="Paybill number" placeholder="For example: 123456" /><Input name="mpesaAccount" value={data.mpesaAccount} onChange={onChange} label="M-Pesa account number" placeholder="M-Pesa account number" /></div></div>
    </SectionShell>
  )
}

export function ManagerInformationSection({ data, onChange }: CommonSectionProps) {
  return (
    <SectionShell title="Manager Information" description="This information is used for the manager's signature when the request is submitted.">
      <div className="grid gap-4 sm:grid-cols-2"><Input name="managerName" value={data.managerName} onChange={onChange} label="Manager's name" placeholder="Manager's full name" /><Input name="managerDesignation" value={data.managerDesignation} onChange={onChange} label="Manager's designation" placeholder="For example: Property Manager" /></div>
    </SectionShell>
  )
}
