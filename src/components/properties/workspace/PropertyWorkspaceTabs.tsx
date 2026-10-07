'use client'

import type { ReactNode } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type PropertyWorkspaceTab = 'overview' | 'units' | 'tenants' | 'providers' | 'reports' | 'activations'

interface PropertyWorkspaceTabsProps {
  value: PropertyWorkspaceTab
  onValueChange: (value: PropertyWorkspaceTab) => void
  canViewUnits: boolean
  canViewTenants: boolean
  canViewProviders: boolean
  canViewReports: boolean
  canViewActivations: boolean
  children: ReactNode
}

export function PropertyWorkspaceTabs({
  value,
  onValueChange,
  canViewUnits,
  canViewTenants,
  canViewProviders,
  canViewReports,
  canViewActivations,
  children,
}: PropertyWorkspaceTabsProps) {
  return (
    <Tabs value={value} onValueChange={(nextValue) => onValueChange(nextValue as PropertyWorkspaceTab)}>
      <TabsList aria-label="Property workspace">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        {canViewUnits && <TabsTrigger value="units">Units</TabsTrigger>}
        {canViewTenants && <TabsTrigger value="tenants">Tenants</TabsTrigger>}
        {canViewProviders && <TabsTrigger value="providers">Service Providers</TabsTrigger>}
        {canViewReports && <TabsTrigger value="reports">Managers DOR</TabsTrigger>}
        {canViewActivations && <TabsTrigger value="activations">Activation Forms</TabsTrigger>}
      </TabsList>
      {children}
    </Tabs>
  )
}
