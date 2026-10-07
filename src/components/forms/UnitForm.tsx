'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AxiosError } from 'axios'
import { FileClock } from 'lucide-react'
import type { Property, RentType, Unit, UnitStatus, UnitType } from '@/types'
import { propertiesAPI, unitsAPI } from '@/lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FormActions } from '@/components/ui/form-actions'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UnitFormProps {
  unit?: Unit
  onSuccess?: () => void
  onCancel?: () => void
  defaultPropertyId?: string
}

interface UnitFormData {
  propertyId: string
  unitNo: string
  floor: string
  unitType: UnitType
  usage: string
  bedrooms: number
  bathrooms: number
  sizeSqFt: number
  type: string
  status: UnitStatus
  rentType: RentType
  rentAmount: number
}

const EMPTY_PROPERTY_VALUE = '__select_property__'

const rentTypes: Array<{ value: RentType; label: string }> = [
  { value: 'FIXED', label: 'Fixed Total Amount' },
  { value: 'PER_SQFT', label: 'Per Sq Ft' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'PER_ROOM', label: 'Per Room' },
  { value: 'PER_OCCUPANT', label: 'Per Occupant' },
  { value: 'PERCENT_OF_REVENUE', label: 'Percentage of Revenue' },
  { value: 'GRADUATED', label: 'Graduated' },
  { value: 'INDEXED', label: 'Indexed' },
  { value: 'TIERED', label: 'Tiered' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'NEGOTIATED', label: 'Negotiated' },
  { value: 'PARTIAL_SUBSIDY', label: 'Partial Subsidy' },
  { value: 'VARIABLE', label: 'Variable' },
]

const getDraftKey = (unitId?: string, defaultPropertyId?: string) =>
  unitId
    ? `unit_form_draft_${unitId}`
    : `unit_form_draft_new_${defaultPropertyId || 'default'}`

const getInitialFormData = (unit?: Unit, defaultPropertyId?: string): UnitFormData => ({
  propertyId: unit?.propertyId ?? defaultPropertyId ?? '',
  unitNo: unit?.unitNo ?? '',
  floor: unit?.floor ?? '',
  unitType: unit?.unitType ?? 'RESIDENTIAL',
  usage: unit?.usage ?? '',
  bedrooms: unit?.bedrooms ?? 0,
  bathrooms: unit?.bathrooms ?? 0,
  sizeSqFt: unit?.sizeSqFt ?? 0,
  type: unit?.type ?? '',
  status: unit?.status ?? 'VACANT',
  rentType: unit?.rentType ?? 'FIXED',
  rentAmount: unit?.rentAmount ?? 0,
})

export default function UnitForm({ unit, onSuccess, onCancel, defaultPropertyId }: UnitFormProps) {
  const draftKey = getDraftKey(unit?.id, defaultPropertyId)
  const [formData, setFormData] = useState<UnitFormData>(() => getInitialFormData(unit, defaultPropertyId))
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasDraft, setHasDraft] = useState(false)

  const fetchProperties = useCallback(async () => {
    try {
      setProperties(await propertiesAPI.getAll())
    } catch (fetchError) {
      console.error('Error fetching properties:', fetchError)
    }
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!defaultPropertyId) void fetchProperties()

      try {
        const savedDraft = localStorage.getItem(draftKey)
        if (savedDraft) {
          setFormData(JSON.parse(savedDraft) as UnitFormData)
          setHasDraft(true)
          return
        }
      } catch (draftError) {
        console.error('Error loading draft:', draftError)
      }

      setFormData(getInitialFormData(unit, defaultPropertyId))
      setHasDraft(false)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [defaultPropertyId, draftKey, fetchProperties, unit])

  const saveDraft = (data: UnitFormData) => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(data))
    } catch (draftError) {
      console.error('Error saving draft:', draftError)
    }
  }

  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey)
      setHasDraft(false)
    } catch (draftError) {
      console.error('Error clearing draft:', draftError)
    }
  }

  const updateField = <Key extends keyof UnitFormData>(name: Key, value: UnitFormData[Key]) => {
    const nextFormData = { ...formData, [name]: value }
    setFormData(nextFormData)
    saveDraft(nextFormData)
    if (!hasDraft) setHasDraft(true)
    setError('')
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value } = event.target
    const nextValue = type === 'number' ? (value ? Number.parseFloat(value) : 0) : value
    updateField(name as keyof UnitFormData, nextValue)
  }

  const handleClearDraft = () => {
    if (!window.confirm('Are you sure you want to clear the saved draft? This action cannot be undone.')) return

    setFormData(getInitialFormData(unit, defaultPropertyId))
    setError('')
    clearDraft()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.propertyId) {
      setError('Property is required.')
      setLoading(false)
      return
    }
    if (formData.sizeSqFt <= 0) {
      setError('Size must be greater than 0.')
      setLoading(false)
      return
    }
    if (formData.rentAmount <= 0) {
      setError('Rent amount must be greater than 0.')
      setLoading(false)
      return
    }
    if (formData.unitType === 'RESIDENTIAL' && (formData.bedrooms < 0 || formData.bathrooms < 0)) {
      setError('Bedrooms and bathrooms must be 0 or greater.')
      setLoading(false)
      return
    }

    try {
      const payload: Partial<Unit> = {
        propertyId: formData.propertyId,
        sizeSqFt: Number(formData.sizeSqFt),
        rentType: formData.rentType,
        rentAmount: Number(formData.rentAmount),
        unitType: formData.unitType,
        status: formData.status,
      }

      if (formData.unitNo) payload.unitNo = formData.unitNo
      if (formData.floor) payload.floor = formData.floor
      if (formData.type) payload.type = formData.type

      if (formData.unitType === 'RESIDENTIAL') {
        payload.bedrooms = Number(formData.bedrooms)
        payload.bathrooms = Number(formData.bathrooms)
      } else if (formData.unitType === 'COMMERCIAL') {
        if (formData.usage) payload.usage = formData.usage
        payload.bedrooms = undefined
        payload.bathrooms = undefined
      }

      if (unit) {
        await unitsAPI.update(unit.id, payload)
      } else {
        await unitsAPI.create(payload)
      }

      clearDraft()
      onSuccess?.()
    } catch (submitError) {
      const apiError = submitError as AxiosError<{ message?: string }>
      console.error('Error saving unit:', submitError)
      setError(apiError.response?.data?.message || apiError.message || 'Failed to save unit')
    } finally {
      setLoading(false)
    }
  }

  const submitLabel = unit ? 'Update Unit' : 'Create Unit'

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-4">
      {hasDraft && (
        <Alert variant="info" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <FileClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <AlertTitle>Draft saved</AlertTitle>
              <AlertDescription>Your changes are being automatically saved.</AlertDescription>
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleClearDraft} disabled={loading}>
            Clear Draft
          </Button>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FormSection
        title="Unit details"
        description="Identify the unit and set its property, type, and availability."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {!defaultPropertyId && (
            <FormField label="Property" htmlFor="unit-property" required>
              <Select
                value={formData.propertyId || EMPTY_PROPERTY_VALUE}
                onValueChange={(value) => updateField('propertyId', value === EMPTY_PROPERTY_VALUE ? '' : value)}
                required
              >
                <SelectTrigger id="unit-property" aria-required="true">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_PROPERTY_VALUE}>Select Property</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          <Input
            label="Unit Number"
            name="unitNo"
            value={formData.unitNo}
            onChange={handleInputChange}
            placeholder="e.g., 7, A-12, Ground Floor"
          />

          <Input
            label="Floor"
            name="floor"
            value={formData.floor}
            onChange={handleInputChange}
            placeholder="e.g., 3rd Floor, Ground Floor, Basement"
          />

          <FormField label="Unit Type" htmlFor="unit-type" required>
            <Select
              value={formData.unitType}
              onValueChange={(value) => updateField('unitType', value as UnitType)}
              required
            >
              <SelectTrigger id="unit-type" aria-required="true">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                <SelectItem value="COMMERCIAL">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Status" htmlFor="unit-status" required>
            <Select
              value={formData.status}
              onValueChange={(value) => updateField('status', value as UnitStatus)}
              required
            >
              <SelectTrigger id="unit-status" aria-required="true">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VACANT">Vacant</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Unit configuration"
        description="Record the unit's capacity, usage, size, and description."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {formData.unitType === 'COMMERCIAL' ? (
            <div className="md:col-span-2">
              <Input
                label="Business Usage Type"
                name="usage"
                value={formData.usage}
                onChange={handleInputChange}
                placeholder="e.g., Boutique, Cosmetic shop, Bank, Restaurant"
                helperText="Optional. Describe the type of business planned for this commercial unit."
              />
            </div>
          ) : (
            <>
              <Input
                label="Bedrooms"
                name="bedrooms"
                type="number"
                min={0}
                value={formData.bedrooms}
                onChange={handleInputChange}
                placeholder="1"
              />
              <Input
                label="Bathrooms"
                name="bathrooms"
                type="number"
                min={0}
                step={0.5}
                value={formData.bathrooms}
                onChange={handleInputChange}
                placeholder="1"
              />
            </>
          )}

          <Input
            label="Size (Sq Ft)"
            name="sizeSqFt"
            type="number"
            min={0}
            value={formData.sizeSqFt}
            onChange={handleInputChange}
            placeholder="500"
            required
          />

          <Input
            label="Unit Type Description"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            placeholder="e.g., Studio, 1BR, Office, Retail Space"
          />
        </div>
      </FormSection>

      <FormSection
        title="Rent details"
        description="Set the rent calculation method and the current amount."
        footer={
          <FormActions>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={loading}>
              {loading ? 'Saving unit...' : submitLabel}
            </Button>
          </FormActions>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Rent Type" htmlFor="unit-rent-type" required>
            <Select
              value={formData.rentType}
              onValueChange={(value) => updateField('rentType', value as RentType)}
              required
            >
              <SelectTrigger id="unit-rent-type" aria-required="true">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rentTypes.map((rentType) => (
                  <SelectItem key={rentType.value} value={rentType.value}>
                    {rentType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <Input
            label="Rent Amount (Ksh)"
            name="rentAmount"
            type="number"
            min={0}
            step={0.01}
            value={formData.rentAmount}
            onChange={handleInputChange}
            placeholder="15000"
            required
          />
        </div>
      </FormSection>
    </form>
  )
}
