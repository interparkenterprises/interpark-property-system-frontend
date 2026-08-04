'use client';

import type { FormEvent } from 'react';
import type { Property } from '@/types';
import type { AnalyticsFilters as FilterValues, AnalyticsGrain } from '@/types/analytics';
import { Button } from '@/components/ui/button';

export function AnalyticsFilters({ value, properties, disabled, onChange, onApply }: {
  value: FilterValues;
  properties: Property[];
  disabled?: boolean;
  onChange: (value: FilterValues) => void;
  onApply: () => void;
}) {
  const submit = (event: FormEvent) => { event.preventDefault(); onApply(); };
  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4 shadow-xl">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.4fr_auto] xl:items-end">
        <label className="text-sm font-medium text-slate-200">From
          <input type="date" value={value.dateFrom} max={value.dateTo} onChange={event => onChange({ ...value, dateFrom: event.target.value })} className="mt-1 block h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-white" required />
        </label>
        <label className="text-sm font-medium text-slate-200">To / as of
          <input type="date" value={value.dateTo} min={value.dateFrom} onChange={event => onChange({ ...value, dateTo: event.target.value, asOf: event.target.value })} className="mt-1 block h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-white" required />
        </label>
        <label className="text-sm font-medium text-slate-200">Grain
          <select value={value.grain} onChange={event => onChange({ ...value, grain: event.target.value as AnalyticsGrain })} className="mt-1 block h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-white">
            <option value="day">Day</option><option value="week">Week</option><option value="month">Month</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-200">Property
          <select value={value.propertyId || ''} onChange={event => onChange({ ...value, propertyId: event.target.value || undefined })} className="mt-1 block h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-white">
            <option value="">All accessible properties</option>
            {properties.map(property => <option key={property.id} value={property.id}>{property.name}</option>)}
          </select>
        </label>
        <Button type="submit" disabled={disabled} className="h-10 bg-[#0078a3] hover:bg-[#005478]">Apply filters</Button>
      </div>
    </form>
  );
}
