'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle2 } from 'lucide-react'
import PropertyForm from '@/components/forms/PropertyForm'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'

export default function CreatePropertyPage() {
  const router = useRouter()
  const [success, setSuccess] = useState(false)

  const handleSuccess = () => {
    setSuccess(true)
    window.setTimeout(() => router.push('/properties'), 2000)
  }

  if (success) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Alert variant="success" className="items-start">
          <CheckCircle2 className="mt-0.5 h-5 w-5" aria-hidden="true" />
          <div>
            <AlertTitle>Property created</AlertTitle>
            <AlertDescription>The property was saved successfully. Redirecting to the properties list…</AlertDescription>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-6 pb-6">
      <PageHeader
        title="Create New Property"
        description="Register the property, payment details, image, and landlord relationship."
        leading={<div className="rounded-lg bg-primary/10 p-2 text-primary"><Building2 className="h-5 w-5" aria-hidden="true" /></div>}
      />
      <PropertyForm onSuccess={handleSuccess} onCancel={() => router.back()} />
    </div>
  )
}
