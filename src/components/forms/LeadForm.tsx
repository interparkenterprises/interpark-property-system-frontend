'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AxiosError } from 'axios'
import { FileClock } from 'lucide-react'
import type { Lead, Property } from '@/types'
import { leadsAPI, propertiesAPI } from '@/lib/api'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FormActions } from '@/components/ui/form-actions'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface LeadFormProps {
  lead?: Lead
  onSuccess?: () => void
  onCancel?: () => void
}

interface LeadFormData {
  name: string
  email: string
  phone: string
  address: string
  idNumber: string
  companyName: string
  natureOfLead: string
  notes: string
  propertyId: string
}

const NO_PROPERTY_VALUE = '__no_property__'

const getDraftKey = (leadId?: string) =>
  leadId ? `lead_form_draft_${leadId}` : 'lead_form_draft_new'

const getInitialFormData = (lead?: Lead): LeadFormData => ({
  name: lead?.name ?? '',
  email: lead?.email ?? '',
  phone: lead?.phone ?? '',
  address: lead?.address ?? '',
  idNumber: lead?.idNumber ?? '',
  companyName: lead?.companyName ?? '',
  natureOfLead: lead?.natureOfLead ?? '',
  notes: lead?.notes ?? '',
  propertyId: lead?.propertyId ?? '',
})

export default function LeadForm({ lead, onSuccess, onCancel }: LeadFormProps) {
  const { isManagedUser, getAccessiblePropertyIds } = useGlobalPermissions()
  const draftKey = getDraftKey(lead?.id)
  const [formData, setFormData] = useState<LeadFormData>(() => getInitialFormData(lead))
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasDraft, setHasDraft] = useState(false)

  const fetchProperties = useCallback(async () => {
    try {
      let data = await propertiesAPI.getAll()

      if (isManagedUser) {
        const accessibleIds = getAccessiblePropertyIds()
        data = data.filter((property) => accessibleIds.includes(property.id))
      }

      setProperties(data)
    } catch (fetchError) {
      console.error('Error fetching properties:', fetchError)
    }
  }, [getAccessiblePropertyIds, isManagedUser])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void fetchProperties()

      try {
        const savedDraft = localStorage.getItem(draftKey)
        if (savedDraft) {
          setFormData(JSON.parse(savedDraft) as LeadFormData)
          setHasDraft(true)
          return
        }
      } catch (draftError) {
        console.error('Error loading draft:', draftError)
      }

      setFormData(getInitialFormData(lead))
      setHasDraft(false)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [draftKey, fetchProperties, lead])

  const saveDraft = (data: LeadFormData) => {
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

  const updateField = (name: keyof LeadFormData, value: string) => {
    const newFormData = { ...formData, [name]: value }
    setFormData(newFormData)
    saveDraft(newFormData)
    if (!hasDraft) setHasDraft(true)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateField(event.target.name as keyof LeadFormData, event.target.value)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Name and phone are required fields.')
      setLoading(false)
      return
    }

    try {
      const payload: Partial<Lead> = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        idNumber: formData.idNumber.trim() || undefined,
        companyName: formData.companyName.trim() || undefined,
        natureOfLead: formData.natureOfLead.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        propertyId: formData.propertyId || undefined,
      }

      if (lead) {
        await leadsAPI.update(lead.id, payload)
      } else {
        await leadsAPI.create(payload)
      }

      clearDraft()
      onSuccess?.()
    } catch (submitError) {
      const apiError = submitError as AxiosError<{ message?: string }>
      setError(apiError.response?.data?.message || 'Failed to save lead')
    } finally {
      setLoading(false)
    }
  }

  const handleClearDraft = () => {
    if (!window.confirm('Are you sure you want to clear the saved draft? This action cannot be undone.')) return

    setFormData(getInitialFormData(lead))
    clearDraft()
  }

  const submitLabel = lead ? 'Update Lead' : 'Create Lead'
  const propertyDescription = isManagedUser && properties.length === 0
    ? "You don't have access to any properties. Please contact an administrator."
    : 'Optional. Associate this lead with an available property.'

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
          <Button type="button" variant="ghost" size="sm" onClick={handleClearDraft}>
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
        title="Contact details"
        description="Record the lead's primary identity and contact information."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Name"
            name="name"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            label="ID Number"
            name="idNumber"
            type="text"
            value={formData.idNumber}
            onChange={handleChange}
          />
        </div>
      </FormSection>

      <FormSection
        title="Lead details"
        description="Add company, enquiry, and property information when applicable."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Company Name"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
          />
          <Input
            label="Address"
            name="address"
            autoComplete="street-address"
            value={formData.address}
            onChange={handleChange}
          />
          <Input
            label="Nature of Lead"
            name="natureOfLead"
            value={formData.natureOfLead}
            onChange={handleChange}
          />
          <FormField label="Property" htmlFor="lead-property" description={propertyDescription}>
            <Select
              value={formData.propertyId || NO_PROPERTY_VALUE}
              onValueChange={(value) => updateField('propertyId', value === NO_PROPERTY_VALUE ? '' : value)}
            >
              <SelectTrigger id="lead-property">
                <SelectValue placeholder="Select property (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROPERTY_VALUE}>No property selected</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Notes"
        description="Capture any additional context useful to the property team."
        footer={
          <FormActions>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={loading}>
              {loading ? 'Saving lead...' : submitLabel}
            </Button>
          </FormActions>
        }
      >
        <Textarea
          label="Notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={5}
          className="min-h-32"
        />
      </FormSection>
    </form>
  )
}
