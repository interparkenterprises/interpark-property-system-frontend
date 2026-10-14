import type { AnalyticsFilters } from '@/types/analytics'
import type { AnalyticsDomain, DomainConfig } from './types'

export const domainConfig: Record<AnalyticsDomain, DomainConfig> = {
  invoices: {
    title: 'Comprehensive Invoice Analytics', apiMethod: 'getComprehensiveInvoiceAnalytics', property: true,
    permission: 'VIEW_PAYMENT_REPORTS', drill: '/properties', isComprehensive: true,
    blurb: 'Rent and bill invoices in one view: totals, collection performance, aging buckets, and per-property breakdowns.',
    labels: { totalInvoices: 'Total Invoices', totalAmount: 'Total Amount', totalPaid: 'Total Paid', totalOutstanding: 'Total Outstanding', totalOverdue: 'Total Overdue', overallCollectionRate: 'Overall Collection Rate' },
  },
  'bill-invoices': {
    title: 'Bill invoice analytics', apiMethod: 'getBillInvoiceAnalytics', property: true,
    permission: 'VIEW_BILL_INVOICES', drill: '/properties',
    blurb: 'Utility and service bill invoices. Overdue bill balances are utility receivables — not rent arrears.',
    labels: { invoiceCount: 'Bill invoices', billed: 'Total billed', paid: 'Amount paid', outstanding: 'Outstanding', overdueBillBalance: 'Overdue bill balance', collectionRate: 'Collection rate' },
  },
  tenants: {
    title: 'Tenant Analytics', apiMethod: 'getTenantAnalytics', property: true,
    permission: 'VIEW_TENANTS', drill: '/properties', hasLifecycle: true,
    blurb: 'Tenant base, rent roll and deposits, combined with lifecycle retention, arrears exposure and move-in trends.',
    labels: { currentTenants: 'Current tenants', currentRentRoll: 'Current rent roll', averageRent: 'Average rent', depositsHeld: 'Deposits held' },
  },
  'service-providers': {
    title: 'Service provider analytics', apiMethod: 'getServiceProviderAnalytics', property: true,
    permission: 'VIEW_SERVICE_PROVIDERS', drill: '/properties',
    blurb: 'Contracted charges per provider. These are configured contract values, not invoices, payments, or actual expenses.',
    labels: { providerCount: 'Providers', contractedCharges: 'Contracted charges', averageContractedCharge: 'Average contracted charge' },
  },
  commissions: {
    title: 'Commission analytics', apiMethod: 'getCommissionAnalytics', property: true,
    permission: 'VIEW_COMMISSIONS', drill: '/myIncome',
    blurb: 'Commission accruals and payouts. “Pending / processing” is earned but not yet paid out.',
    labels: { commissionCount: 'Commissions', totalCommission: 'Total commission', paidCommission: 'Paid commission', pendingCommission: 'Pending / processing' },
  },
  'demand-letters': {
    title: 'Demand letter analytics', apiMethod: 'getDemandLetterAnalytics', property: true,
    permission: 'VIEW_DEMAND_LETTERS', drill: '/payments',
    blurb: 'Demand-letter activity. Amounts are document snapshots at issue time — current arrears still come from rent invoices.',
    labels: { letterCount: 'Demand letters', documentSnapshotAmount: 'Document snapshot amount', partialPaymentRecorded: 'Partial payment recorded', settledCount: 'Settled', escalatedCount: 'Escalated' },
  },
  'other-income': {
    title: 'Other income analytics', apiMethod: 'getOtherIncomeAnalytics', property: false,
    roles: true, drill: '/myIncome/other',
    blurb: 'Non-rent income documents. “Paid” is the value of documents marked PAID — partial cash collection is unavailable.',
    labels: { invoiceCount: 'Income documents', invoicedAmount: 'Invoiced amount', paidDocumentAmount: 'Paid document value', vatAmount: 'VAT amount' },
  },
  employees: {
    title: 'Employee and salary analytics', apiMethod: 'getEmployeeAnalytics', property: false,
    roles: true, drill: '/employees',
    blurb: 'Headcount and salary facts. Configured salaries are not normalized across pay frequencies — treat totals as configured, not annualized.',
    labels: { employeeCount: 'Employees', activeEmployees: 'Active employees', configuredSalaryTotal: 'Configured salaries', averageConfiguredSalary: 'Average configured salary', salaryPaidInRange: 'Salary paid in range' },
  },
}

export const dateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const initialDomainFilters = (): AnalyticsFilters => {
  const now = new Date()
  return {
    dateFrom: dateString(new Date(now.getFullYear(), now.getMonth() - 5, 1)),
    dateTo: dateString(now),
    asOf: dateString(now),
    grain: 'month',
  }
}

export const moneyMetricPattern = /amount|paid|billed|outstanding|arrears|rent|deposit|salary|commission|charge|overdue/i
