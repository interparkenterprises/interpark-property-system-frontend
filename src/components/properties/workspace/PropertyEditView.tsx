'use client'

import type { Property } from '@/types'
import PropertyForm from '@/components/forms/PropertyForm'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SectionHeader } from '@/components/ui/section-header'

interface PropertyEditViewProps {
  property: Property
  onSuccess: () => void
  onCancel: () => void
}

export function PropertyEditView({ property, onSuccess, onCancel }: PropertyEditViewProps) {
  return (
    <PermissionGuard
      module="properties"
      action="edit"
      fallback={
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="text-lg font-semibold text-foreground">Access denied</h2>
            <p className="mt-1 text-sm text-muted-foreground">You do not have permission to edit this property.</p>
            <Button className="mt-4" variant="outline" onClick={onCancel}>Go Back</Button>
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader className="border-b border-border">
          <SectionHeader
            title="Edit Property"
            description="Update property information."
            actions={<Button variant="outline" onClick={onCancel}>Cancel</Button>}
          />
        </CardHeader>
        <CardContent className="pt-5">
          <PropertyForm property={property} onSuccess={onSuccess} onCancel={onCancel} />
        </CardContent>
      </Card>
    </PermissionGuard>
  )
}
