import type { Tenant, TenantFreezePeriod } from '@/types'
import { toNairobiDateKey } from '@/lib/calendarDate'

export type TenantFreezeState = 'active' | 'scheduled' | 'completed' | 'none'

const dateKey = (value: string | Date) => {
  if (value instanceof Date) return toNairobiDateKey(value)
  return value.slice(0, 10)
}

export function freezePeriodContains(period: TenantFreezePeriod, value: string | Date = new Date()) {
  const target = dateKey(value)
  return dateKey(period.startDate) <= target && (!period.endDate || dateKey(period.endDate) >= target)
}

export function getEffectiveFreeze(tenant: Pick<Tenant, 'isFrozen' | 'freezePeriods'>, value: string | Date = new Date()) {
  const target = dateKey(value)
  const periods = tenant.freezePeriods ?? []
  const activePeriod = periods.find((period) => freezePeriodContains(period, target))
  if (activePeriod) return { state: 'active' as const, period: activePeriod, isFrozen: true }

  const scheduledPeriod = periods
    .filter((period) => dateKey(period.startDate) > target)
    .sort((a, b) => dateKey(a.startDate).localeCompare(dateKey(b.startDate)))[0]
  if (scheduledPeriod) return { state: 'scheduled' as const, period: scheduledPeriod, isFrozen: false }

  // Some list responses expose only the denormalized flag. Keep it as a
  // presentation fallback, never as the source for period-specific decisions.
  if (periods.length === 0 && tenant.isFrozen) return { state: 'active' as const, period: undefined, isFrozen: true }
  return { state: 'none' as const, period: undefined, isFrozen: false }
}
