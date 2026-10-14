'use client'

import { useState } from 'react'
import AdminUserManagement from '@/components/admin/AdminUserManagement'
import { ArrearsSummary } from '@/components/dashboard/ArrearsSummary'
import { CollectionsChart } from '@/components/dashboard/CollectionsChart'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardQuickActions } from '@/components/dashboard/DashboardQuickActions'
import { FinancialSnapshot } from '@/components/dashboard/FinancialSnapshot'
import { PortfolioOverview } from '@/components/dashboard/PortfolioOverview'
import { PropertyAttentionTable } from '@/components/dashboard/PropertyAttentionTable'
import { useDashboardData } from '@/hooks/dashboard/useDashboardData'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function DashboardPage() {
  const dashboard = useDashboardData()
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  return (
    <div className="space-y-8 pb-12">
      <DashboardHeader
        userName={dashboard.user?.name}
        roleName={dashboard.roleName || dashboard.user?.role}
        isAdmin={dashboard.isAdmin}
        isManager={dashboard.isManager}
        assignedPropertyCount={dashboard.data.properties.length}
        generatedAt={dashboard.data.generatedAt}
        showAdminPanel={showAdminPanel}
        isRefreshingPermissions={dashboard.isRefreshingPermissions}
        isRefreshingData={dashboard.loading.portfolio || dashboard.loading.financial || dashboard.loading.collections || dashboard.loading.propertyAttention}
        filters={(
          <DashboardFilters
            value={dashboard.filters}
            properties={dashboard.data.properties}
            disabled={dashboard.loading.properties || dashboard.loading.portfolio || dashboard.loading.financial}
            onChange={dashboard.updateFilters}
          />
        )}
        onToggleAdminPanel={() => setShowAdminPanel(current => !current)}
        onRefreshData={dashboard.refreshData}
        onRefreshPermissions={dashboard.refreshPermissions}
      />

      {dashboard.permissionMessage && (
        <Alert variant={dashboard.permissionMessage.includes('successfully') ? 'success' : 'destructive'}>
          <AlertTitle>Permission refresh</AlertTitle>
          <AlertDescription>{dashboard.permissionMessage}</AlertDescription>
        </Alert>
      )}

      {dashboard.isAdmin && showAdminPanel && <AdminUserManagement />}

      <PortfolioOverview
        properties={dashboard.data.properties}
        landlordCount={dashboard.data.landlordCount}
        occupancy={dashboard.data.occupancy}
        tenants={dashboard.data.tenants}
        selectedPropertyId={dashboard.filters.propertyId}
        isManagedUser={dashboard.isManagedUser}
        showLandlords={dashboard.isAdmin || dashboard.isManager}
        canOpenProperties={dashboard.navigation.properties}
        canOpenOccupancy={dashboard.navigation.occupancy}
        canOpenTenants={dashboard.navigation.tenants}
        loading={dashboard.loading.properties || dashboard.loading.portfolio}
        error={dashboard.errors.properties || dashboard.errors.portfolio}
      />

      <FinancialSnapshot
        data={dashboard.data.financial}
        authorized={dashboard.authorization.financial}
        loading={dashboard.loading.financial}
        error={dashboard.errors.financial}
        canOpenRentAnalytics={dashboard.navigation.rent}
      />

      <DashboardQuickActions
        canCreateProperty={dashboard.canCreateProperty}
        canCreateOffer={dashboard.canCreateOffer}
        canViewCommissions={dashboard.canViewCommissions}
      />

      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <CollectionsChart
          data={dashboard.data.collections}
          authorized={dashboard.authorization.collections}
          loading={dashboard.loading.collections}
          error={dashboard.errors.collections}
        />
        <ArrearsSummary
          data={dashboard.data.financial}
          authorized={dashboard.authorization.arrears}
          loading={dashboard.loading.financial}
          error={dashboard.errors.financial}
        />
      </div>

      <PropertyAttentionTable
        data={dashboard.data.propertyRevenue}
        authorized={dashboard.authorization.collections}
        loading={dashboard.loading.propertyAttention}
        error={dashboard.errors.propertyAttention}
      />

      {dashboard.isManagedUser && (
        <Alert variant="info">
          <AlertTitle>Your access summary</AlertTitle>
          <AlertDescription>
            You are signed in as {dashboard.roleName || dashboard.user?.role || 'a managed user'} and currently have access to {dashboard.data.properties.length} properties. Use “Refresh permissions” after an administrator changes your access.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
