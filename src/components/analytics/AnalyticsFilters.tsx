'use client';

import type { FormEvent } from 'react';
import type { Property } from '@/types';
import type { AnalyticsFilters as FilterValues, AnalyticsGrain } from '@/types/analytics';
import { Button } from '@/components/ui/button';

const dateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

type PresetKey = 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear';

const presetLabel: Record<PresetKey, string> = {
  thisMonth: 'This month',
  lastMonth: 'Last month',
  last3Months: 'Last 3 months',
  thisYear: 'This year',
};

const presetRange = (key: PresetKey): { dateFrom: string; dateTo: string } => {
  const now = new Date();
  switch (key) {
    case 'lastMonth': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { dateFrom: dateString(from), dateTo: dateString(to) };
    }
    case 'last3Months':
      return { dateFrom: dateString(new Date(now.getFullYear(), now.getMonth() - 2, 1)), dateTo: dateString(now) };
    case 'thisYear':
      return { dateFrom: dateString(new Date(now.getFullYear(), 0, 1)), dateTo: dateString(now) };
    default:
      return { dateFrom: dateString(new Date(now.getFullYear(), now.getMonth(), 1)), dateTo: dateString(now) };
  }
};

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
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onApply();
  };

  const applyPreset = (key: PresetKey) => {
    const range = presetRange(key);
    onChange({ ...value, ...range, asOf: range.dateTo });
  };

  const inputClass = 'mt-1 block h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-white focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 disabled:opacity-50';

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4 shadow-xl">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Quick ranges</span>
        {(Object.keys(presetLabel) as PresetKey[]).map(key => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => applyPreset(key)}
            className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-sky-400/60 hover:text-white disabled:opacity-50"
          >
            {presetLabel[key]}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.4fr_auto] xl:items-end">
        <label className="text-sm font-medium text-slate-200">
          From
          <input type="date" value={value.dateFrom || ''} max={value.dateTo} disabled={disabled}
            onChange={event => onChange({ ...value, dateFrom: event.target.value })} className={inputClass} />
        </label>
        <label className="text-sm font-medium text-slate-200">
          To / as of
          <input type="date" value={value.dateTo || ''} min={value.dateFrom} disabled={disabled}
            onChange={event => onChange({ ...value, dateTo: event.target.value, asOf: event.target.value })} className={inputClass} />
        </label>
        <label className="text-sm font-medium text-slate-200">
          Grain
          <select value={value.grain} disabled={disabled}
            onChange={event => onChange({ ...value, grain: event.target.value as AnalyticsGrain })} className={inputClass}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </label>
        {showProperty && (
          <label className="text-sm font-medium text-slate-200">
            Property
            <select value={value.propertyId || ''} disabled={disabled}
              onChange={event => onChange({ ...value, propertyId: event.target.value || undefined })} className={inputClass}>
              <option value="">All accessible properties</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>{property.name}</option>
              ))}
            </select>
          </label>
        )}
        <Button type="submit" disabled={disabled} className="h-10 bg-[#0078a3] hover:bg-[#005478]">
          Apply filters
        </Button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        “To / as of” drives both the reporting window and the point-in-time snapshot (arrears, occupancy).
      </p>
    </form>
  );
}