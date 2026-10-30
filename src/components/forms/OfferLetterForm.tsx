'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileClock, ShieldX } from 'lucide-react'
import type { Lead, Property, Unit } from '@/types'
import { leadsAPI, offerLettersAPI, propertiesAPI, unitsAPI } from '@/lib/api'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import {
  OfferAdditionalInformation,
  OfferBasicInformation,
  OfferCommercialTerms,
  OfferFinancialTerms,
  OfferLeaseTerms,
} from '@/components/offers/form/OfferFormSections'
import {
  emptyOfferFormData,
  type OfferFormData,
  type OfferFormSection,
  type OfferSubmissionPayload,
} from '@/components/offers/form/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { FormActions } from '@/components/ui/form-actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface OfferLetterFormProps {
  offerId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const getDraftKey = (offerId?: string) => offerId ? `offer_form_draft_${offerId}` : 'offer_form_draft_new'

export default function OfferLetterForm({ offerId, onSuccess, onCancel }: OfferLetterFormProps) {
  const router = useRouter()
  const {
    isManager,
    isManagedUser,
    getAccessiblePropertyIds,
    canViewLeads,
    canViewProperties,
  } = useGlobalPermissions()
  const [formData, setFormData] = useState<OfferFormData>(emptyOfferFormData)
  const [properties, setProperties] = useState<Property[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [activeTab, setActiveTab] = useState<OfferFormSection>('basic')
  const [isMixedUse, setIsMixedUse] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [loading, setLoading] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [unitsLoading, setUnitsLoading] = useState(false)
  const [optionsError, setOptionsError] = useState('')
  const [formError, setFormError] = useState('')
  const [clearDraftOpen, setClearDraftOpen] = useState(false)

  const draftKey = getDraftKey(offerId)

  const saveDraft = useCallback((data: OfferFormData) => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }, [draftKey])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey)
      setHasDraft(false)
    } catch (error) {
      console.error('Error clearing draft:', error)
    }
  }, [draftKey])

  const fetchOptions = useCallback(async () => {
    setOptionsLoading(true)
    setOptionsError('')
    const [propertyResult, leadResult] = await Promise.allSettled([
      propertiesAPI.getAll(),
      leadsAPI.getAll(),
    ])

    if (propertyResult.status === 'fulfilled') {
      let data = propertyResult.value
      if (isManagedUser) {
        const accessibleIds = getAccessiblePropertyIds()
        data = data.filter((property) => accessibleIds.includes(property.id))
      }
      setProperties(data)
    } else {
      console.error('Failed to fetch properties:', propertyResult.reason)
      setProperties([])
      setOptionsError('Properties could not be loaded. Please retry before creating the offer.')
    }

    if (leadResult.status === 'fulfilled') {
      let data = leadResult.value
      if (isManagedUser) {
        const accessibleIds = getAccessiblePropertyIds()
        data = data.filter((lead) => lead.propertyId && accessibleIds.includes(lead.propertyId))
      } else if (isManager && offerId === undefined) {
        const userId = localStorage.getItem('userId')
        data = data.filter((lead) => lead.createdById === userId)
      }
      setLeads(data)
    } else {
      console.error('Failed to fetch leads:', leadResult.reason)
      setLeads([])
      setOptionsError((current) => current || 'Leads could not be loaded. Please retry before creating the offer.')
    }
    setOptionsLoading(false)
  }, [getAccessiblePropertyIds, isManagedUser, isManager, offerId])

  const fetchUnits = useCallback(async (propertyId: string, selectedUnitId: string) => {
    setUnitsLoading(true)
    try {
      let data = await unitsAPI.getByProperty(propertyId)
      if (isManagedUser && !getAccessiblePropertyIds().includes(propertyId)) data = []
      const vacantUnits = data.filter((unit) => unit.status === 'VACANT')
      setUnits(vacantUnits)
      setSelectedUnit(vacantUnits.find((unit) => unit.id === selectedUnitId) ?? null)
    } catch (error) {
      console.error('Failed to fetch units:', error)
      setUnits([])
      setSelectedUnit(null)
    } finally {
      setUnitsLoading(false)
    }
  }, [getAccessiblePropertyIds, isManagedUser])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void fetchOptions()
      try {
        const savedDraft = localStorage.getItem(draftKey)
        if (savedDraft) {
          setFormData({ ...emptyOfferFormData(), ...(JSON.parse(savedDraft) as Partial<OfferFormData>) })
          setHasDraft(true)
        }
      } catch (error) {
        console.error('Error loading draft:', error)
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [draftKey, fetchOptions])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const property = properties.find((candidate) => candidate.id === formData.propertyId) ?? null
      setSelectedProperty(property)
      setIsMixedUse(property?.usage === 'MIXED_USE')
      if (formData.propertyId) void fetchUnits(formData.propertyId, formData.unitId)
      else {
        setUnits([])
        setSelectedUnit(null)
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [fetchUnits, formData.propertyId, formData.unitId, properties])

  useEffect(() => {
    if (!selectedUnit) return
    const frame = window.requestAnimationFrame(() => {
      setFormData((current) => {
        if (current.unitId !== selectedUnit.id) return current
        const next: OfferFormData = {
          ...current,
          rentAmount: selectedUnit.rentAmount.toString(),
          rentPerSqFt: selectedUnit.rentType === 'PER_SQFT' && selectedUnit.calculationInfo?.ratePerSqFt
            ? selectedUnit.calculationInfo.ratePerSqFt.toString()
            : current.rentPerSqFt,
          deposit: selectedUnit.rentAmount ? (selectedUnit.rentAmount * 2).toString() : current.deposit,
          ...(selectedUnit.unitType === 'COMMERCIAL' ? { useOfPremises: selectedUnit.usage || 'Commercial Space' } : {}),
        }
        saveDraft(next)
        return next
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [saveDraft, selectedUnit])

  const showCommercial = selectedProperty?.usage === 'COMMERCIAL'
    || (isMixedUse && formData.letterType === 'COMMERCIAL')
    || selectedUnit?.unitType === 'COMMERCIAL'
  const showResidentialFrequency = selectedProperty?.usage === 'RESIDENTIAL'
    || (isMixedUse && formData.letterType === 'RESIDENTIAL')
    || selectedUnit?.unitType === 'RESIDENTIAL'

  useEffect(() => {
    if (activeTab !== 'commercial' || showCommercial) return
    const frame = window.requestAnimationFrame(() => setActiveTab('basic'))
    return () => window.cancelAnimationFrame(frame)
  }, [activeTab, showCommercial])

  const updateField = (name: keyof OfferFormData, value: string) => {
    let next = { ...formData, [name]: value }
    if (name === 'propertyId' && formData.propertyId !== value) {
      next = { ...next, unitId: '', rentAmount: '', rentPerSqFt: '', deposit: '' }
      setSelectedUnit(null)
    } else if (name === 'unitId') {
      setSelectedUnit(units.find((unit) => unit.id === value) ?? null)
    }
    setFormData(next)
    saveDraft(next)
    setHasDraft(true)
    setFormError('')
  }

  const validate = () => {
    if (!formData.leadId || !formData.propertyId || (isMixedUse && !formData.letterType)) {
      setActiveTab('basic')
      return 'Select the required lead, property, and letter type before creating the offer.'
    }
    if (!formData.rentAmount || !formData.deposit) {
      setActiveTab('financial')
      return 'Enter the required rent amount and deposit.'
    }
    if (!formData.leaseTerm.trim()) {
      setActiveTab('lease')
      return 'Enter the required lease term.'
    }
    return ''
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setLoading(true)
    setFormError('')
    const payload: OfferSubmissionPayload = {
      leadId: formData.leadId,
      propertyId: formData.propertyId,
      unitId: formData.unitId || undefined,
      rentAmount: formData.rentAmount ? Number.parseFloat(formData.rentAmount) : undefined,
      deposit: formData.deposit ? Number.parseFloat(formData.deposit) : undefined,
      leaseTerm: formData.leaseTerm || undefined,
      serviceCharge: formData.serviceCharge ? Number.parseFloat(formData.serviceCharge) : undefined,
      escalationRate: formData.escalationRate ? Number.parseFloat(formData.escalationRate) : undefined,
      expiryDate: formData.expiryDate || undefined,
      additionalTerms: formData.additionalTerms || undefined,
      notes: formData.notes || undefined,
    }
    if (!formData.letterType && selectedUnit) payload.letterType = selectedUnit.unitType === 'COMMERCIAL' ? 'COMMERCIAL' : 'RESIDENTIAL'
    else if (formData.letterType) payload.letterType = formData.letterType
    if (formData.rentPerSqFt) payload.rentPerSqFt = Number.parseFloat(formData.rentPerSqFt)
    if (formData.serviceChargePerSqFt) payload.serviceChargePerSqFt = Number.parseFloat(formData.serviceChargePerSqFt)
    if (formData.useOfPremises) payload.useOfPremises = formData.useOfPremises
    if (formData.fitOutPeriodMonths) payload.fitOutPeriodMonths = Number.parseInt(formData.fitOutPeriodMonths)
    if (formData.depositMonths) payload.depositMonths = Number.parseInt(formData.depositMonths)
    if (formData.advanceRentMonths) payload.advanceRentMonths = Number.parseInt(formData.advanceRentMonths)
    if (formData.escalationFrequency) payload.escalationFrequency = formData.escalationFrequency

    try {
      if (isMixedUse && formData.letterType) {
        await offerLettersAPI.createMixedUse({ ...payload, letterType: formData.letterType })
      } else {
        await offerLettersAPI.create(payload)
      }
      clearDraft()
      if (onSuccess) onSuccess()
      else {
        router.push('/offers')
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to create offer letter:', error)
      setFormError(error instanceof Error ? error.message : 'Failed to create offer letter. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const confirmClearDraft = () => {
    setFormData(emptyOfferFormData())
    setSelectedProperty(null)
    setSelectedUnit(null)
    setUnits([])
    setIsMixedUse(false)
    setActiveTab('basic')
    setClearDraftOpen(false)
    clearDraft()
  }

  if (!canViewProperties || !canViewLeads) {
    return <EmptyState icon={ShieldX} title="Access denied" description="You don't have permission to select the properties or leads required to create an offer letter." className="min-h-64" />
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl space-y-4">
      {hasDraft && (
        <Alert variant="info" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <FileClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div><AlertTitle>Draft saved</AlertTitle><AlertDescription>Your changes are being automatically saved.</AlertDescription></div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setClearDraftOpen(true)}>Clear draft</Button>
        </Alert>
      )}
      {optionsError && <Alert variant="destructive"><AlertTitle>Unable to load form options</AlertTitle><AlertDescription>{optionsError}</AlertDescription><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void fetchOptions()}>Retry</Button></Alert>}
      {formError && <Alert variant="destructive"><AlertTitle>Offer could not be created</AlertTitle><AlertDescription>{formError}</AlertDescription></Alert>}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OfferFormSection)} orientation="vertical" className="flex-col gap-4 lg:flex-row lg:gap-6">
        <TabsList className="w-full lg:w-56">
          <TabsTrigger value="basic">1. Basic Information</TabsTrigger>
          <TabsTrigger value="financial">2. Financial Terms</TabsTrigger>
          {showCommercial && <TabsTrigger value="commercial">3. Commercial Terms</TabsTrigger>}
          <TabsTrigger value="lease">{showCommercial ? '4' : '3'}. Lease Terms</TabsTrigger>
          <TabsTrigger value="additional">{showCommercial ? '5' : '4'}. Additional Information</TabsTrigger>
        </TabsList>
        <div className="min-w-0 flex-1">
          <TabsContent value="basic"><OfferBasicInformation formData={formData} onFieldChange={updateField} leads={leads} properties={properties} units={units} selectedProperty={selectedProperty} selectedUnit={selectedUnit} isMixedUse={isMixedUse} optionsLoading={optionsLoading} unitsLoading={unitsLoading} isManagedUser={isManagedUser} /></TabsContent>
          <TabsContent value="financial"><OfferFinancialTerms formData={formData} onFieldChange={updateField} selectedUnit={selectedUnit} /></TabsContent>
          {showCommercial && <TabsContent value="commercial"><OfferCommercialTerms formData={formData} onFieldChange={updateField} selectedUnit={selectedUnit} /></TabsContent>}
          <TabsContent value="lease"><OfferLeaseTerms formData={formData} onFieldChange={updateField} showResidentialFrequency={showResidentialFrequency} /></TabsContent>
          <TabsContent value="additional"><OfferAdditionalInformation formData={formData} onFieldChange={updateField} /></TabsContent>
        </div>
      </Tabs>

      <div className="rounded-lg border border-border bg-card px-5 py-4">
        <FormActions>
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" loading={loading}>{loading ? 'Creating offer...' : 'Create Offer Letter'}</Button>
        </FormActions>
      </div>

      <Dialog open={clearDraftOpen} onOpenChange={setClearDraftOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Clear saved draft?</DialogTitle><DialogDescription>This resets every offer field and permanently removes the saved draft.</DialogDescription></DialogHeader>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setClearDraftOpen(false)}>Cancel</Button><Button type="button" variant="destructive" onClick={confirmClearDraft}>Clear draft</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
