'use client'

import { useEffect, useMemo, useState } from 'react'
import { Banknote, Building2, CalendarDays, ChevronLeft, ChevronRight, CreditCard, FileCheck2, Percent, UserRound } from 'lucide-react'
import type { ActivationRequest, CreateActivationRequest, UpdateActivationRequest } from '@/types'
import { activationsAPI } from '@/lib/api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ActivationDetailsSection,
  CompanyInformationSection,
  FinancialDetailsSection,
  ManagerInformationSection,
  PaymentDetailsSection,
  VatInformationSection,
} from './activation/ActivationFormSections'
import type { ActivationChangeHandler, ActivationFormData, ActivationSectionId } from './activation/types'

interface ActivationFormProps {
  propertyId: string
  propertyName?: string
  activation?: ActivationRequest | null
  onSuccess: () => void
  onCancel: () => void
}

const requiredFields: Array<keyof ActivationFormData> = ['companyName', 'postalAddress', 'telephone', 'contactPerson', 'designation', 'email', 'mobileNo', 'startDate', 'setupTime', 'endDate', 'tearDownTime', 'activationType']
const fieldSections: Partial<Record<keyof ActivationFormData, ActivationSectionId>> = {
  companyName: 'company', postalAddress: 'company', telephone: 'company', contactPerson: 'company', alternativeContact: 'company', designation: 'company', email: 'company', mobileNo: 'company',
  activationType: 'activation', startDate: 'activation', setupTime: 'activation', endDate: 'activation', tearDownTime: 'activation', description: 'activation', expectedVisitors: 'activation', soundSystem: 'activation',
  licenseFeePerDay: 'financial', numberOfDays: 'financial', proposedBudget: 'financial',
  vatType: 'vat', vat: 'vat',
  bankName: 'payment', bankBranch: 'payment', accountName: 'payment', accountNumber: 'payment', swiftCode: 'payment', paybillNumber: 'payment', mpesaAccount: 'payment',
  managerName: 'manager', managerDesignation: 'manager',
}

export default function ActivationForm({ propertyId, propertyName, activation, onSuccess, onCancel }: ActivationFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<ActivationSectionId>('company')
  const [manualOverrides, setManualOverrides] = useState({ numberOfDays: false, proposedBudget: false })
  const [formData, setFormData] = useState<ActivationFormData>(() => createInitialData(activation))
  const showManagerInformation = !activation || activation.status === 'DRAFT'

  const sections = useMemo(() => {
    const values: Array<{ id: ActivationSectionId; title: string; icon: React.ComponentType<{ className?: string }> }> = [
      { id: 'company', title: 'Company Information', icon: Building2 },
      { id: 'activation', title: 'Activation Details', icon: CalendarDays },
      { id: 'financial', title: 'Financial Details', icon: Banknote },
      { id: 'vat', title: 'VAT Information', icon: Percent },
      { id: 'payment', title: 'Payment Details', icon: CreditCard },
    ]
    if (showManagerInformation) values.push({ id: 'manager', title: 'Manager Information', icon: UserRound })
    return values
  }, [showManagerInformation])

  useEffect(() => {
    if (manualOverrides.numberOfDays || !formData.startDate || !formData.endDate) return
    const days = calculateDaysBetween(formData.startDate, formData.endDate)
    if (days === null) return
    const timer = window.setTimeout(() => setFormData((current) => current.numberOfDays === String(days) ? current : { ...current, numberOfDays: String(days) }), 0)
    return () => window.clearTimeout(timer)
  }, [formData.endDate, formData.startDate, manualOverrides.numberOfDays])

  useEffect(() => {
    if (manualOverrides.proposedBudget) return
    const feePerDay = Number.parseFloat(formData.licenseFeePerDay)
    const days = formData.numberOfDays === '' ? null : Number.parseInt(formData.numberOfDays)
    const billingDays = calculateBillingDays(days)
    if (!feePerDay || feePerDay <= 0 || billingDays <= 0) return
    const budget = (feePerDay * billingDays).toFixed(2)
    const timer = window.setTimeout(() => setFormData((current) => current.proposedBudget === budget ? current : { ...current, proposedBudget: budget }), 0)
    return () => window.clearTimeout(timer)
  }, [formData.licenseFeePerDay, formData.numberOfDays, manualOverrides.proposedBudget])

  const vatDetails = useMemo(() => calculateVatDetails(formData), [formData])

  const handleChange: ActivationChangeHandler = (event) => {
    const { name, value, type } = event.target
    if (name === 'numberOfDays' || name === 'proposedBudget') setManualOverrides((current) => ({ ...current, [name]: true }))
    setFormData((current) => ({ ...current, [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value }))
  }

  const resetOverride = (field: 'numberOfDays' | 'proposedBudget') => setManualOverrides((current) => ({ ...current, [field]: false }))
  const revealField = (field: keyof ActivationFormData, section = fieldSections[field]) => {
    if (section) setActiveSection(section)
    window.setTimeout(() => document.querySelector<HTMLElement>(`[name="${field}"]`)?.focus(), 0)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const missingFields = requiredFields.filter((field) => {
      const value = formData[field]
      return !value || (typeof value === 'string' && value.trim() === '')
    })
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.map(formatFieldName).join(', ')}`)
      revealField(missingFields[0])
      setLoading(false)
      return
    }

    const invalidControl = event.currentTarget.querySelector<HTMLElement>(':invalid')
    if (invalidControl) {
      const field = invalidControl.getAttribute('name') as keyof ActivationFormData | null
      setError(`Please enter a valid ${field ? formatFieldName(field) : 'value'}.`)
      if (field) revealField(field)
      setLoading(false)
      return
    }

    if (calculateDaysBetween(formData.startDate, formData.endDate) === null) {
      setError('End date must be on or after start date')
      revealField('endDate', 'activation')
      setLoading(false)
      return
    }

    const vatValue = Number.parseFloat(formData.vat)
    if (Number.isNaN(vatValue) || vatValue < 0 || vatValue > 100) {
      setError('VAT percentage must be between 0 and 100')
      revealField('vat', 'vat')
      setLoading(false)
      return
    }

    try {
      const data = createPayload(formData, vatValue)
      if (activation) await activationsAPI.update(activation.id, data)
      else await activationsAPI.create({ ...data, propertyId } as CreateActivationRequest)
      onSuccess()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to save activation request')
      console.error('Error saving activation:', requestError)
    } finally {
      setLoading(false)
    }
  }

  const activeIndex = sections.findIndex((section) => section.id === activeSection)
  const previousSection = activeIndex > 0 ? sections[activeIndex - 1] : null
  const nextSection = activeIndex < sections.length - 1 ? sections[activeIndex + 1] : null

  return (
    <form onSubmit={handleSubmit} className="min-w-0" noValidate>
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"><FileCheck2 className="size-4" aria-hidden="true" />Activation Forms</div>
          <CardTitle className="mt-2">{activation ? 'Edit Activation Request' : 'Create Activation Request'}</CardTitle>
          <CardDescription>{propertyName || activation?.property?.name || 'Current property'} · Complete the request across {sections.length} sections.</CardDescription>
        </CardHeader>

        {error && <div className="px-4 pt-4 sm:px-5"><Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert></div>}

        <CardContent className="p-4 sm:p-5">
          <Tabs orientation="vertical" value={activeSection} onValueChange={(value) => setActiveSection(value as ActivationSectionId)} className="flex-col gap-4 md:flex-row md:gap-6">
            <TabsList aria-label="Activation request sections" className="max-h-52 w-full overflow-y-auto md:max-h-none md:w-60 md:overflow-visible">
              {sections.map(({ id, title, icon: Icon }) => <TabsTrigger key={id} value={id} className="min-h-9 justify-start gap-2 px-3"><Icon className="size-4" aria-hidden="true" />{title}</TabsTrigger>)}
            </TabsList>

            <div className="min-w-0 flex-1">
              <TabsContent value="company"><CompanyInformationSection data={formData} onChange={handleChange} /></TabsContent>
              <TabsContent value="activation"><ActivationDetailsSection data={formData} onChange={handleChange} onSoundSystemChange={(checked) => setFormData((current) => ({ ...current, soundSystem: checked }))} /></TabsContent>
              <TabsContent value="financial"><FinancialDetailsSection data={formData} onChange={handleChange} overrides={manualOverrides} onResetOverride={resetOverride} /></TabsContent>
              <TabsContent value="vat"><VatInformationSection data={formData} onChange={handleChange} details={vatDetails} /></TabsContent>
              <TabsContent value="payment"><PaymentDetailsSection data={formData} onChange={handleChange} /></TabsContent>
              {showManagerInformation && <TabsContent value="manager"><ManagerInformationSection data={formData} onChange={handleChange} /></TabsContent>}

              <div className="mt-4 flex items-center justify-between gap-3">
                <Button type="button" variant="outline" disabled={!previousSection} onClick={() => previousSection && setActiveSection(previousSection.id)}><ChevronLeft className="size-4" />Previous</Button>
                <span className="text-xs text-muted-foreground">Section {activeIndex + 1} of {sections.length}</span>
                <Button type="button" variant="outline" disabled={!nextSection} onClick={() => nextSection && setActiveSection(nextSection.id)}>Next<ChevronRight className="size-4" /></Button>
              </div>
            </div>
          </Tabs>
        </CardContent>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/20 px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>{activation ? 'Update Activation Request' : 'Create Activation Request'}</Button>
        </div>
      </Card>
    </form>
  )
}

function createInitialData(activation?: ActivationRequest | null): ActivationFormData {
  return {
    companyName: activation?.companyName || '', postalAddress: activation?.postalAddress || '', telephone: activation?.telephone || '', contactPerson: activation?.contactPerson || '', alternativeContact: activation?.alternativeContact || '', designation: activation?.designation || '', email: activation?.email || '', mobileNo: activation?.mobileNo || '',
    activationType: activation?.activationType || 'OFFICE_SPACE', startDate: activation?.startDate?.split('T')[0] || '', setupTime: activation?.setupTime || '9:00 AM', endDate: activation?.endDate?.split('T')[0] || '', tearDownTime: activation?.tearDownTime || '5:00 PM', description: activation?.description || '', expectedVisitors: activation?.expectedVisitors?.toString() || '', soundSystem: activation?.soundSystem || false,
    licenseFeePerDay: activation?.licenseFeePerDay?.toString() || '', numberOfDays: activation?.numberOfDays?.toString() || '', proposedBudget: activation?.proposedBudget?.toString() || '',
    vatType: activation?.vatType || 'INCLUSIVE', vat: activation?.vat?.toString() || '16',
    bankName: activation?.bankName || '', bankBranch: activation?.bankBranch || '', accountName: activation?.accountName || '', accountNumber: activation?.accountNumber || '', swiftCode: activation?.swiftCode || '', paybillNumber: activation?.paybillNumber || '', mpesaAccount: activation?.mpesaAccount || '',
    managerName: activation?.managerName || '', managerDesignation: activation?.managerDesignation || '',
  }
}

function createPayload(formData: ActivationFormData, vatValue: number): UpdateActivationRequest {
  return {
    companyName: formData.companyName.trim(), postalAddress: formData.postalAddress.trim(), telephone: formData.telephone.trim(), contactPerson: formData.contactPerson.trim(), alternativeContact: formData.alternativeContact.trim() || undefined, designation: formData.designation.trim(), email: formData.email.trim(), mobileNo: formData.mobileNo.trim(),
    activationType: formData.activationType, startDate: formData.startDate, setupTime: formData.setupTime.trim(), endDate: formData.endDate, tearDownTime: formData.tearDownTime.trim(), description: formData.description.trim() || undefined, expectedVisitors: formData.expectedVisitors ? Number.parseInt(formData.expectedVisitors) : undefined, soundSystem: formData.soundSystem,
    licenseFeePerDay: formData.licenseFeePerDay ? Number.parseFloat(formData.licenseFeePerDay) : undefined, numberOfDays: formData.numberOfDays !== '' ? Number.parseInt(formData.numberOfDays) : undefined, proposedBudget: formData.proposedBudget ? Number.parseFloat(formData.proposedBudget) : undefined,
    vatType: formData.vatType, vat: vatValue,
    bankName: formData.bankName.trim() || undefined, bankBranch: formData.bankBranch.trim() || undefined, accountName: formData.accountName.trim() || undefined, accountNumber: formData.accountNumber.trim() || undefined, swiftCode: formData.swiftCode.trim() || undefined, paybillNumber: formData.paybillNumber.trim() || undefined, mpesaAccount: formData.mpesaAccount.trim() || undefined,
    managerName: formData.managerName.trim() || undefined, managerDesignation: formData.managerDesignation.trim() || undefined,
  }
}

function calculateDaysBetween(startDate: string, endDate: string): number | null {
  if (!startDate || !endDate) return null
  const start = new Date(startDate)
  const end = new Date(endDate)
  const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  if (endDateOnly < startDateOnly) return null
  return Math.round((endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24))
}

function calculateBillingDays(numberOfDays: number | null): number {
  if (numberOfDays === null || numberOfDays === undefined) return 0
  return numberOfDays === 0 ? 1 : numberOfDays + 1
}

function calculateVatDetails(formData: ActivationFormData) {
  const amount = Number.parseFloat(formData.proposedBudget) || Number.parseFloat(formData.licenseFeePerDay) || 0
  const rate = Number.parseFloat(formData.vat) || 0
  if (!amount || !rate || formData.vatType === 'NOT_APPLICABLE') return { baseAmount: amount, vatAmount: 0, totalAmount: amount }
  if (formData.vatType === 'INCLUSIVE') {
    const vatAmount = (amount * rate) / (100 + rate)
    return { baseAmount: amount - vatAmount, vatAmount, totalAmount: amount }
  }
  const vatAmount = (amount * rate) / 100
  return { baseAmount: amount, vatAmount, totalAmount: amount + vatAmount }
}

function formatFieldName(field: keyof ActivationFormData) { return field.replace(/([A-Z])/g, ' $1').toLowerCase() }
