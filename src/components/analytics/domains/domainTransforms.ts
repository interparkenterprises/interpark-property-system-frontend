import type { DomainDistributionItem, DomainPropertyPoint, DomainTrendPoint, TenantLifecycleAnalytics } from '@/types/analytics'
import type { DomainDashboardData, LifecycleView, PropertyBreakdownRow } from './types'

export function extractTrendData(data: DomainDashboardData | null): DomainTrendPoint[] {
  if (!data) return []
  if (data.rentInvoices?.trend?.length) return data.rentInvoices.trend
  if (data.billInvoices?.trend?.length) return data.billInvoices.trend
  return data.trend ?? []
}

export function extractStatusDistribution(data: DomainDashboardData | null): DomainDistributionItem[] {
  if (!data) return []
  if (data.rentInvoices?.byStatus) {
    return Object.entries(data.rentInvoices.byStatus).map(([key, value]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      count: value.count ?? 0,
      amount: value.amount ?? value.paidAmount ?? value.unpaidAmount ?? value.totalDue ?? 0,
    }))
  }
  if (data.billInvoices?.byStatus?.length) return data.billInvoices.byStatus
  return data.statusDistribution ?? []
}

export function extractCategoryDistribution(data: DomainDashboardData | null): DomainDistributionItem[] {
  if (!data) return []
  if (data.billInvoices?.byType?.length) return data.billInvoices.byType
  return data.categoryDistribution ?? []
}

export function extractPropertyBreakdown(data: DomainDashboardData | null): PropertyBreakdownRow[] {
  if (!data) return []
  const propertyMap = new Map<string, PropertyBreakdownRow>()
  const ensure = (id: string, name: string) => {
    let row = propertyMap.get(id)
    if (!row) {
      row = { propertyId: id, propertyName: name, rentAmount: 0, rentCount: 0, billAmount: 0, billCount: 0, totalAmount: 0, totalCount: 0 }
      propertyMap.set(id, row)
    }
    return row
  }
  const merge = (items: DomainPropertyPoint[] | undefined, kind: 'rent' | 'bill') => {
    items?.forEach(item => {
      if (!item.propertyId) return
      const row = ensure(item.propertyId, item.propertyName || 'Unknown Property')
      if (kind === 'rent') {
        row.rentAmount += item.amount ?? 0
        row.rentCount += item.count ?? 0
      } else {
        row.billAmount += item.amount ?? 0
        row.billCount += item.count ?? 0
      }
    })
  }
  merge(data.rentInvoices?.byProperty, 'rent')
  merge(data.billInvoices?.byProperty, 'bill')
  merge(data.byProperty ?? undefined, 'rent')
  return Array.from(propertyMap.values())
    .map(row => ({ ...row, totalAmount: row.rentAmount + row.billAmount, totalCount: row.rentCount + row.billCount }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
}

export function toLifecycleView(data: TenantLifecycleAnalytics | null): LifecycleView | null {
  if (!data?.summary) return null
  return {
    summary: {
      totalTenants: data.summary.totalTenants ?? 0,
      activeTenants: data.summary.activeTenants ?? 0,
      churnedTenants: data.summary.churnedTenants ?? 0,
      cumulativeRetentionRate: data.summary.cumulativeRetentionRate ?? null,
      periodRetentionRate: data.summary.periodRetentionRate ?? null,
      averageRent: data.summary.averageRent ?? 0,
      totalDeposits: data.summary.totalDeposits ?? 0,
      averageTenureDays: data.summary.averageTenureDays ?? null,
    },
    tenantsWithArrears: data.tenantsWithArrears ?? 0,
    payingTenants: data.payingTenants ?? 0,
    averageInvoiceBalance: data.averageInvoiceBalance ?? null,
    newTenantsTrend: data.newTenantsTrend ?? [],
  }
}
