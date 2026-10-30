'use client'

import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type PropertyFinancialTab =
  | 'income'
  | 'commissions'
  | 'arrears'
  | 'payments'
  | 'UpcomingPayments'
  | 'rentReport'
  | 'billsReport'

export interface FinancialTabDefinition {
  id: PropertyFinancialTab
  label: string
}

interface PropertyFinancialNavigationProps {
  value: PropertyFinancialTab
  onValueChange: (value: PropertyFinancialTab) => void
  tabs: FinancialTabDefinition[]
  children: ReactNode
}

export function PropertyFinancialNavigation({ value, onValueChange, tabs, children }: PropertyFinancialNavigationProps) {
  return (
    <Tabs
      orientation="vertical"
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as PropertyFinancialTab)}
      className="min-w-0 flex-col gap-4 lg:flex-row lg:gap-6"
    >
      <TabsList
        aria-label="Property financial sections"
        className="max-h-52 w-full overflow-y-auto lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:w-60 lg:overflow-y-auto"
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="min-h-9 justify-start px-3 text-left">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="min-w-0 pt-0">
          {tab.id === value ? children : null}
        </TabsContent>
      ))}
    </Tabs>
  )
}
