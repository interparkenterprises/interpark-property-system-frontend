'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LandlordForm from '@/components/forms/LandlordForm'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'

export default function CreateLandlordPage() {
  const router = useRouter()
  const [success, setSuccess] = useState(false)

  const handleSuccess = () => {
    setSuccess(true)
    setTimeout(() => {
      router.push('/dashboard/landlords')
    }, 2000)
  }

  const handleCancel = () => {
    router.back()
  }

  if (success) {
    return (
      <div className="max-w-4xl space-y-6 pb-4">
        <PageHeader
          title="Create Landlord"
          description="Add a new landlord to the property management system."
        />
        <Alert variant="success">
          <AlertTitle>Landlord created successfully</AlertTitle>
          <AlertDescription>Redirecting to the landlords page...</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6 pb-4">
      <PageHeader
        title="Create Landlord"
        description="Add a new landlord to the property management system."
      />
      <LandlordForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  )
}
