'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, ShieldX } from 'lucide-react'
import OfferLetterForm from '@/components/forms/OfferLetterForm'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export default function CreateOfferPage() {
  const router = useRouter()
  const { canCreateOffer } = useGlobalPermissions()

  if (!canCreateOffer) {
    return (
      <EmptyState
        icon={ShieldX}
        title="Access denied"
        description="You don't have permission to create offer letters."
        className="min-h-64"
        action={<Button variant="outline" onClick={() => router.push('/offers')}>Back to offers</Button>}
      />
    )
  }

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader
        title="Create Offer Letter"
        description="Prepare an offer for a prospective tenant using the existing property and lease terms."
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/offers')}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to offers
          </Button>
        }
      />
      <OfferLetterForm
        onSuccess={() => {
          router.push('/offers')
          router.refresh()
        }}
        onCancel={() => router.push('/offers')}
      />
    </div>
  )
}
