'use client'

import { useEffect, useState } from 'react'
import type { AxiosError } from 'axios'
import type { Landlord } from '@/types'
import { landlordsAPI } from '@/lib/api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FormActions } from '@/components/ui/form-actions'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface LandlordFormProps {
  landlord?: Landlord
  onSuccess?: () => void
  onCancel?: () => void
}

export default function LandlordForm({ landlord, onSuccess, onCancel }: LandlordFormProps) {
  const [formData, setFormData] = useState(() => ({
    name: landlord?.name ?? '',
    email: landlord?.email ?? '',
    phone: landlord?.phone ?? '',
    address: landlord?.address ?? '',
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!landlord) return

    const frame = window.requestAnimationFrame(() => {
      setFormData({
        name: landlord.name,
        email: landlord.email ?? '',
        phone: landlord.phone ?? '',
        address: landlord.address ?? '',
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [landlord])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (landlord) {
        await landlordsAPI.update(landlord.id, formData)
      } else {
        await landlordsAPI.create(formData)
      }
      onSuccess?.()
    } catch (err) {
      const apiError = err as AxiosError<{ message?: string }>
      setError(apiError.response?.data?.message || 'Failed to save landlord')
    } finally {
      setLoading(false)
    }
  }

  const submitLabel = landlord ? 'Update Landlord' : 'Create Landlord'

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FormSection
        title="Landlord information"
        description="Enter the landlord's contact details. Only the name is required."
        footer={
          <FormActions>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={loading}>
              {loading ? 'Saving landlord...' : submitLabel}
            </Button>
          </FormActions>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Name"
            name="name"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            helperText="Use the landlord's full name or registered company name."
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            helperText="Optional. Used for landlord correspondence."
          />

          <Input
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={handleChange}
            helperText="Optional. Include the country code when available."
          />

          <div className="md:col-span-2">
            <Textarea
              label="Address"
              name="address"
              autoComplete="street-address"
              value={formData.address}
              onChange={handleChange}
              rows={4}
              helperText="Optional. Enter the landlord's mailing or business address."
              className="min-h-28"
            />
          </div>
        </div>
      </FormSection>
    </form>
  )
}
