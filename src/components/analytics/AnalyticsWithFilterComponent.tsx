// AnalyticsFilters.tsx
'use client';

import { useState } from 'react';
import type { Property } from '@/types';
import type { AnalyticsFilters as FilterValues } from '@/types/analytics';

interface AnalyticsFiltersProps {
  value: FilterValues;
  properties: Property[];
  disabled: boolean;
  onChange: (filters: FilterValues) => void;
  onApply: () => void;
}

export function AnalyticsFilters({ 
  value, 
  properties, 
  disabled, 
  onChange, 
  onApply 
}: AnalyticsFiltersProps) {
  // Your filter UI implementation here
  return (
    <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date range inputs */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Date From</label>
          <input
            type="date"
            value={value.dateFrom}
            onChange={(e) => onChange({ ...value, dateFrom: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Date To</label>
          <input
            type="date"
            value={value.dateTo}
            onChange={(e) => onChange({ ...value, dateTo: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Property</label>
          <select
            value={value.propertyId || ''}
            onChange={(e) => onChange({ ...value, propertyId: e.target.value || undefined })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            disabled={disabled}
          >
            <option value="">All Properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={onApply}
            disabled={disabled}
            className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}