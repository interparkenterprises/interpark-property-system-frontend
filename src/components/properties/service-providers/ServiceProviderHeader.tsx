import { Building2, Edit, Upload, X } from 'lucide-react'
import type { ServiceProvider } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ServiceProviderHeaderProps {
  provider: ServiceProvider
  editing: boolean
  uploadingDocument: boolean
  onEdit: () => void
  onToggleUpload: () => void
}

function formatEnumLabel(value: string) {
  return value.replaceAll('_', ' ')
}

export function ServiceProviderHeader({
  provider,
  editing,
  uploadingDocument,
  onEdit,
  onToggleUpload,
}: ServiceProviderHeaderProps) {
  return (
    <Card>
      <CardContent className="flex min-w-0 flex-col gap-5 pt-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{provider.name}</h1>
              <Badge variant="secondary">{formatEnumLabel(provider.chargeFrequency)}</Badge>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {provider.property?.name || 'Property unavailable'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4" aria-hidden="true" />
              Edit Provider
            </Button>
          )}
          <Button onClick={onToggleUpload}>
            {uploadingDocument ? <X className="h-4 w-4" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
            {uploadingDocument ? 'Cancel Upload' : 'Upload Document'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
