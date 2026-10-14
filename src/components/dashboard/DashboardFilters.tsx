import { Building2 } from 'lucide-react'
import type { Property } from '@/types'
import type { DashboardFiltersValue } from './types'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface DashboardFiltersProps {
  value: DashboardFiltersValue
  properties: Property[]
  disabled?: boolean
  onChange: (value: DashboardFiltersValue) => void
}

export function DashboardFilters({ value, properties, disabled, onChange }: DashboardFiltersProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
        <DateRangePicker
          value={{ from: value.dateFrom, to: value.dateTo }}
          disabled={disabled}
          aria-label="Reporting period"
          onChange={range => onChange({ ...value, dateFrom: range.from, dateTo: range.to })}
        />

        <div className="flex min-w-0 items-center gap-2">
          <Label htmlFor="dashboard-property" className="sr-only">Property</Label>
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Select
            value={value.propertyId || 'all'}
            disabled={disabled || properties.length === 0}
            onValueChange={propertyId => onChange({ ...value, propertyId: propertyId === 'all' ? undefined : propertyId })}
          >
            <SelectTrigger id="dashboard-property" aria-label="Property" className="w-60 max-w-[80vw]"><SelectValue placeholder="All accessible properties" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accessible properties</SelectItem>
              {properties.map(property => (
                <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
    </div>
  )
}
