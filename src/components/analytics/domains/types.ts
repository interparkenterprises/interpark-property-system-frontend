import type {
  AgingBucket,
  AnalyticsMeta,
  BillInvoiceSummary,
  DomainDistributionItem,
  DomainPropertyPoint,
  DomainTrendPoint,
  InvoicePerformanceMetrics,
  RentInvoiceSummary,
} from '@/types/analytics'

export type AnalyticsDomain =
  | 'invoices'
  | 'bill-invoices'
  | 'tenants'
  | 'service-providers'
  | 'commissions'
  | 'demand-letters'
  | 'other-income'
  | 'employees'

export interface DomainConfig {
  title: string
  apiMethod: string
  property: boolean
  permission?: string
  roles?: boolean
  drill: string
  labels: Record<string, string>
  isComprehensive?: boolean
  hasLifecycle?: boolean
  blurb: string
}

export interface StatusDistributionShape {
  count?: number
  paidAmount?: number
  unpaidAmount?: number
  totalDue?: number
  amount?: number
}

export interface ComprehensiveShape {
  summary: Record<string, unknown> & {
    rentInvoices?: RentInvoiceSummary
    billInvoices?: BillInvoiceSummary
  }
  performance?: InvoicePerformanceMetrics
  aging?: { rentInvoices: AgingBucket[]; billInvoices: AgingBucket[]; combined: AgingBucket[] }
  rentInvoices?: {
    byStatus: Record<string, StatusDistributionShape>
    trend: DomainTrendPoint[]
    byProperty: DomainPropertyPoint[]
  }
  billInvoices?: {
    byStatus: DomainDistributionItem[]
    byType: DomainDistributionItem[]
    trend: DomainTrendPoint[]
    byProperty: DomainPropertyPoint[]
  }
  trend?: DomainTrendPoint[]
  statusDistribution?: DomainDistributionItem[]
  categoryDistribution?: DomainDistributionItem[]
  scope?: string
}

export interface DomainDashboardData {
  summary: Record<string, unknown>
  trend?: DomainTrendPoint[]
  byProperty?: DomainPropertyPoint[] | null
  statusDistribution?: DomainDistributionItem[]
  categoryDistribution?: DomainDistributionItem[]
  scope?: string
  rentInvoices?: ComprehensiveShape['rentInvoices']
  billInvoices?: ComprehensiveShape['billInvoices']
  performance?: InvoicePerformanceMetrics
  aging?: ComprehensiveShape['aging']
}

export interface DomainResponse {
  data: DomainDashboardData
  meta: AnalyticsMeta
}

export interface LifecycleView {
  summary: {
    totalTenants: number
    activeTenants: number
    churnedTenants: number
    cumulativeRetentionRate: number | null
    periodRetentionRate: number | null
    averageRent: number
    totalDeposits: number
    averageTenureDays: number | null
  }
  tenantsWithArrears: number
  payingTenants: number
  averageInvoiceBalance: number | null
  newTenantsTrend: DomainTrendPoint[]
}

export interface PropertyBreakdownRow {
  propertyId: string
  propertyName: string
  rentAmount: number
  rentCount: number
  billAmount: number
  billCount: number
  totalAmount: number
  totalCount: number
}
