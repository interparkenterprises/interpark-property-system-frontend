'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { FinancialTabDefinition, PropertyFinancialTab } from '../PropertyFinancialNavigation'

export function useFinancialTabState(accessibleTabs: FinancialTabDefinition[]) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedTab, setSelectedTab] = useState<PropertyFinancialTab>(
    () => (searchParams.get('tab') as PropertyFinancialTab | null) ?? 'income',
  )

  const requestedTab = searchParams.get('tab') as PropertyFinancialTab | null
  const activeTab = requestedTab && accessibleTabs.some((tab) => tab.id === requestedTab)
    ? requestedTab
    : accessibleTabs.some((tab) => tab.id === selectedTab)
      ? selectedTab
      : accessibleTabs[0]?.id ?? 'income'

  const selectTab = (nextTab: PropertyFinancialTab) => {
    setSelectedTab(nextTab)
    const nextSearchParams = new URLSearchParams(searchParams.toString())
    nextSearchParams.set('tab', nextTab)
    router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false })
  }

  return { activeTab, selectTab }
}
