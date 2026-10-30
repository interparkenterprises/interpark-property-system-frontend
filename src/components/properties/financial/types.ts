import type {
  ArrearsItem,
  Income,
  PropertyBillsPaymentReportResponse,
  PropertyCollectionStatement,
  PropertyRentPaymentReportResponse,
  Tenant,
} from '@/types'

export type CollectionStatementData = PropertyCollectionStatement
export type RentReportData = PropertyRentPaymentReportResponse['data']
export type BillsReportData = PropertyBillsPaymentReportResponse['data'] & {
  summary: PropertyBillsPaymentReportResponse['data']['summary'] & {
    totalCredit?: number
  }
}
export type OverdueTenant = Tenant & {
  overdueDetails?: {
    daysOverdue?: number
    periodText?: string
  }
}

export interface GroupedIncome {
  tenantId: string
  tenantName: string
  tenantContact: string
  unitName: string
  totalAmount: number
  incomes: Income[]
}

export interface GroupedArrears {
  tenantId: string
  tenantName: string
  tenantContact: string
  unitName: string
  totalArrears: number
  totalPaid: number
  items: ArrearsItem[]
}

export interface RentReportFilters {
  dateFrom: string
  dateTo: string
  status: string
  page: number
  limit: number
}

export interface BillsReportFilters {
  dateFrom: string
  dateTo: string
  billType: string
  status: string
  page: number
  limit: number
}
