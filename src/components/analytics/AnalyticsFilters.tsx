'use client';

import type { FormEvent } from 'react';
import { Building2 } from 'lucide-react';
import type { Property } from '@/types';
import type { AnalyticsFilters as FilterValues } from '@/types/analytics';
import { Button } from '@/components/ui/button';
import { DateRangePicker, todayInNairobi } from '@/components/ui/date-range-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AnalyticsFilters({
  value,
  properties,
  showProperty = true,
  disabled,
  onChange,
  onApply,
}: {
  value: FilterValues;
  properties: Property[];
  disabled?: boolean;
  showProperty?: boolean;
  onChange: (value: FilterValues) => void;
  onApply: () => void;
}) {
  const fallbackDate = todayInNairobi();
  const dateTo = value.dateTo || value.asOf || fallbackDate;
  const dateFrom = value.dateFrom || dateTo;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onApply();
  };

  return (
    <form className="flex min-w-0 flex-wrap items-center justify-end gap-2" onSubmit={submit}>
      <DateRangePicker
        value={{ from: dateFrom, to: dateTo }}
        disabled={disabled}
        aria-label="Analytics reporting period"
        onChange={range => onChange({ ...value, dateFrom: range.from, dateTo: range.to, asOf: range.to })}
      />

      {showProperty && (
        <div className="flex min-w-0 items-center gap-2">
          <Label htmlFor="analytics-property" className="sr-only">Property</Label>
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Select value={value.propertyId || 'all'} disabled={disabled || properties.length === 0} onValueChange={propertyId => onChange({ ...value, propertyId: propertyId === 'all' ? undefined : propertyId })}>
            <SelectTrigger id="analytics-property" aria-label="Property" className="w-60 max-w-[80vw]"><SelectValue placeholder="All accessible properties" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All accessible properties</SelectItem>{properties.map(property => <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <Button type="submit" disabled={disabled}>Apply filters</Button>
    </form>
  );
}
