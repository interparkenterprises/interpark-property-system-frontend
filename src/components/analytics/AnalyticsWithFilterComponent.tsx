// AnalyticsWithFilterComponent.tsx
//
// DEPRECATED: this file duplicated AnalyticsFilters with an older, less
// accessible UI (no grain control, no presets, mismatched styling) and
// exported a second component with the same name, which caused import
// ambiguity. It now re-exports the canonical implementation.
//
// Prefer importing directly:
//   import { AnalyticsFilters } from './AnalyticsFilters';
//
// TODO: delete this file once no route imports from it.

'use client';

export { AnalyticsFilters } from './AnalyticsFilters';
export { AnalyticsFilters as default } from './AnalyticsFilters';