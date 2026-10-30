import { Building2, MapPin } from 'lucide-react'
import type { Property } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export function PropertyFinancialHeader({ property }: { property: Property }) {
  return (
    <Card>
      <CardContent className="flex min-w-0 flex-col gap-4 pt-5 sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold text-foreground sm:text-2xl">{property.name}</h1>
            {property.form && <Badge variant="secondary">{property.form.replaceAll('_', ' ')}</Badge>}
          </div>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{property.address}</span>
            {property.lrNumber && <span className="shrink-0">· LR {property.lrNumber}</span>}
          </p>
        </div>
        <div className="shrink-0 text-sm font-medium text-muted-foreground">Financial Details</div>
      </CardContent>
    </Card>
  )
}
