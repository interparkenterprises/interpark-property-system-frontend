'use client'

import { useState } from 'react'
import { ShieldX } from 'lucide-react'
import { useRouter } from 'next/navigation'
import LeadForm from '@/components/forms/LeadForm'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export default function CreateLeadPage() {
  const router = useRouter()
  const { canCreateLead } = useGlobalPermissions()
  const [success, setSuccess] = useState(false)

  const handleSuccess = () => {
    setSuccess(true)
    setTimeout(() => {
      router.push('/leads')
    }, 2000)
  }

  const handleCancel = () => {
    router.back()
  }

  if (!canCreateLead) {
    return (
      <div className="max-w-4xl space-y-6 pb-4">
        <PageHeader
          title="Create Lead"
          description="Add a new lead and associate them with a property when applicable."
        />
        <EmptyState
          icon={ShieldX}
          title="Access Denied"
          description="You don't have permission to create leads. Please contact an administrator."
          className="min-h-64"
          action={<Button onClick={handleCancel}>Go Back</Button>}
        />
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-4xl space-y-6 pb-4">
        <PageHeader
          title="Create Lead"
          description="Add a new lead and associate them with a property when applicable."
        />
        <Alert variant="success">
          <AlertTitle>Lead created successfully</AlertTitle>
          <AlertDescription>Redirecting to the leads page...</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Create Lead"
        description="Add a new lead and associate them with a property when applicable."
      />
      <LeadForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  )
}
