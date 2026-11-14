'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { AnalyticsFilters, AnalyticsGrain } from '@/types/analytics'

const filterKeys = ['dateFrom', 'dateTo', 'asOf', 'grain', 'propertyId', 'landlordId'] as const
const grains: AnalyticsGrain[] = ['day', 'week', 'month']
const isoDate = /^\d{4}-\d{2}-\d{2}$/

function readFilters(query: URLSearchParams, defaults: AnalyticsFilters): AnalyticsFilters {
  const dateFrom = query.get('dateFrom')
  const dateTo = query.get('dateTo')
  const asOf = query.get('asOf')
  const grain = query.get('grain') as AnalyticsGrain | null
  const propertyId = query.get('propertyId') || undefined
  const landlordId = query.get('landlordId') || undefined

  return {
    ...defaults,
    dateFrom: dateFrom && isoDate.test(dateFrom) ? dateFrom : defaults.dateFrom,
    dateTo: dateTo && isoDate.test(dateTo) ? dateTo : defaults.dateTo,
    asOf: asOf && isoDate.test(asOf) ? asOf : dateTo && isoDate.test(dateTo) ? dateTo : defaults.asOf,
    grain: grain && grains.includes(grain) ? grain : defaults.grain,
    propertyId,
    landlordId,
  }
}

export function useSharedAnalyticsFilters(defaultFilters: () => AnalyticsFilters) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const urlFilters = useMemo(
    () => readFilters(new URLSearchParams(search), defaultFilters()),
    [defaultFilters, search],
  )
  const [draftState, setDraftState] = useState(() => ({ source: search, value: urlFilters }))
  const [appliedState, setAppliedState] = useState(() => ({ source: search, value: urlFilters }))
  const draftFilters = draftState.source === search ? draftState.value : urlFilters
  const filters = appliedState.source === search ? appliedState.value : urlFilters
  const setDraftFilters = useCallback((value: AnalyticsFilters) => {
    setDraftState({ source: search, value })
  }, [search])

  const applyFilters = useCallback(() => {
    const next: AnalyticsFilters = {
      ...draftFilters,
      asOf: draftFilters.dateTo || draftFilters.asOf,
    }
    setAppliedState({ source: search, value: next })

    const query = new URLSearchParams(search)
    filterKeys.forEach(key => {
      const value = next[key]
      if (value) query.set(key, String(value))
      else query.delete(key)
    })
    const nextSearch = query.toString()
    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, { scroll: false })
  }, [draftFilters, pathname, router, search])

  return { draftFilters, filters, setDraftFilters, applyFilters }
}
