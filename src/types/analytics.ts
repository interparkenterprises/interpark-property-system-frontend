// types/analytics.ts
export type AnalyticsGrain = 'day' | 'week' | 'month';

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  asOf: string;
  grain: AnalyticsGrain;
  propertyId?: string;
  landlordId?: string;
}

export interface AnalyticsMeta {
  generatedAt: string;
  timezone: 'Africa/Nairobi';
  currency: 'KES';
  filters: {
    dateFrom: string | null;
    dateTo: string | null;
    asOf: string;
    grain: string;
    propertyId?: string;
    landlordId?: string;
  };
  accessiblePropertyIds: string[];
  freshness: 'live' | 'cached' | 'snapshot';
  definitionsVersion: string;
  dataQuality: Record<string, boolean | number | string | null>;
}

export interface AnalyticsResponse<T> {
  success: true;
  data: T;
  meta: AnalyticsMeta;
}

export interface ReceivablesSummary {
  billed: number;
  paid: number;
  outstanding: number;
  arrears: number;
  collectionRate: number | null;
  invoiceCount: number;
  openInvoiceCount: number;
}

export interface OccupancySummary {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number | null;
}

export interface TenantsSummary {
  currentTenants: number;
}

export interface AnalyticsOverview {
  receivables: ReceivablesSummary;
  occupancy: OccupancySummary;
  tenants: TenantsSummary;
}

export interface ReceivablesStatusDistribution {
  paid: { count: number; amount: number };
  partial: { count: number; paidAmount: number; unpaidAmount: number; totalDue: number };
  unpaid: { count: number; amount: number };
  overdue: { count: number; amount: number };
}

export interface ReceivablesTrendPoint {
  period: string;
  billed: number;
  paid: number;
  outstanding: number;
  invoiceCount: number;
  collectionRate: number | null;
}

export interface CollectionTrendPoint {
  period: string;
  collected: number;
  transactionCount: number;
}

export interface PropertyRevenue {
  propertyId: string;
  propertyName: string;
  billed: number;
  paid: number;
  outstanding: number;
  invoiceCount: number;
  collectionRate: number | null;
}

export type ReceivablesTrendResponse = AnalyticsResponse<{ series: ReceivablesTrendPoint[] }>;
export type CollectionsTrendResponse = AnalyticsResponse<{ series: CollectionTrendPoint[] }>;
export type RevenueByPropertyResponse = AnalyticsResponse<{ properties: PropertyRevenue[] }>;

export interface AnalyticsApiFailure {
  status?: number;
  message: string;
  backendUnavailable: boolean;
}

export interface DomainDistributionItem { 
  label: string; 
  count: number; 
  amount: number;
}

export interface DomainTrendPoint { 
  period: string; 
  count: number; 
  amount: number;
}

export interface DomainPropertyPoint { 
  propertyId: string; 
  propertyName: string; 
  count: number; 
  amount: number;
}

export interface DomainAnalytics {
  scope?: 'ORGANIZATION' | 'MANAGER';
  summary: Record<string, number | null>;
  trend: DomainTrendPoint[];
  byProperty: DomainPropertyPoint[] | null;
  statusDistribution: DomainDistributionItem[];
  categoryDistribution: DomainDistributionItem[];
  paymentDistribution?: DomainDistributionItem[];
}

// ========== NEW INVOICE ANALYTICS TYPES ==========

export interface AgingBucket {
  label: string;
  count: number;
  amount: number;
}

export interface InvoicePerformanceMetrics {
  paymentVelocity: {
    rentInvoices: number | null;
    billInvoices: number | null;
    overall: number | null;
  };
  onTimePaymentRate: {
    rentInvoices: number | null;
    billInvoices: number | null;
  };
  averageInvoiceAmount: {
    rentInvoices: number | null;
    billInvoices: number | null;
  };
}

export interface RentInvoiceSummary {
  count: number;
  amount: number;
  paid: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  collectionRate: number | null;
}

export interface BillInvoiceSummary {
  count: number;
  amount: number;
  paid: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  collectionRate: number | null;
}

export interface ComprehensiveInvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  overallCollectionRate: number | null;
  rentInvoices: RentInvoiceSummary;
  billInvoices: BillInvoiceSummary;
}

export interface ComprehensiveInvoiceAnalytics {
  summary: ComprehensiveInvoiceSummary;
  performance: InvoicePerformanceMetrics;
  aging: {
    rentInvoices: AgingBucket[];
    billInvoices: AgingBucket[];
    combined: AgingBucket[];
  };
  rentInvoices: {
    byStatus: ReceivablesStatusDistribution;
    trend: ReceivablesTrendPoint[];
    byProperty: PropertyRevenue[];
  };
  billInvoices: {
    byStatus: DomainDistributionItem[];
    byType: DomainDistributionItem[];
    trend: DomainTrendPoint[];
    byProperty: DomainPropertyPoint[];
  };
}

export interface RentInvoiceAnalytics {
  summary: ReceivablesSummary;
  statusDistribution: ReceivablesStatusDistribution;
  trend: ReceivablesTrendPoint[];
  byProperty: PropertyRevenue[];
  aging: AgingBucket[];
  performance: {
    averageDaysToPay: number | null;
    paidInvoices: number;
    totalInvoices: number;
    paymentVelocity: number | null;
  };
}

export interface BillInvoiceAnalyticsDetailed {
  summary: {
    totalBillInvoices: number;
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
    totalOverdue: number;
    collectionRate: number | null;
    overdueCount: number;
  };
  byStatus: DomainDistributionItem[];
  byType: DomainDistributionItem[];
  trend: DomainTrendPoint[];
  byProperty: DomainPropertyPoint[];
  aging: AgingBucket[];
  breakdown: {
    water: {
      totalBillInvoices: number;
      totalAmount: number;
      totalPaid: number;
      totalOutstanding: number;
      totalOverdue: number;
      collectionRate: number | null;
      overdueCount: number;
      invoices: number;
      averageUnits: number | null;
      averageChargePerUnit: number | null;
    };
    electricity: {
      totalBillInvoices: number;
      totalAmount: number;
      totalPaid: number;
      totalOutstanding: number;
      totalOverdue: number;
      collectionRate: number | null;
      overdueCount: number;
      invoices: number;
      averageUnits: number | null;
      averageChargePerUnit: number | null;
    };
  };
}

export interface InvoiceAgingReport {
  summary: {
    totalOutstanding: number;
    rentOutstanding: number;
    billOutstanding: number;
    rentCount: number;
    billCount: number;
  };
  aging: {
    rentInvoices: AgingBucket[];
    billInvoices: AgingBucket[];
    combined: AgingBucket[];
  };
  details: {
    current: AgingDetail[];
    '1-30': AgingDetail[];
    '31-60': AgingDetail[];
    '61-90': AgingDetail[];
    '90+': AgingDetail[];
  };
}

export interface AgingDetail {
  id: string;
  invoiceNumber?: string;
  totalDue?: number;
  balance: number;
  status: string;
  dueDate: string;
}

export interface InvoiceReconciliationReport {
  summary: {
    totalRentInvoices: number;
    totalBillInvoices: number;
    totalPaymentReports: number;
    unallocatedPayments: number;
    partiallyAllocatedInvoices: number;
    totalUnallocatedAmount: number;
  };
  details: {
    unallocatedPayments: UnallocatedPayment[];
    partiallyAllocatedInvoices: PartiallyAllocatedInvoice[];
  };
  reconciliationStatus: {
    fullyReconciled: number;
    needsReview: number;
  };
}

export interface UnallocatedPayment {
  id: string;
  amount: number;
  date: string;
  status: string;
}

export interface PartiallyAllocatedInvoice {
  id: string;
  number: string;
  totalDue: number;
  amountPaid: number;
  balance: number;
  status: string;
}

// ========== BILL ANALYTICS TYPES ==========

export interface BillAnalytics {
  summary: {
    totalBills: number;
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
    totalOverdue: number;
    collectionRate: number | null;
    overdueCount: number;
  };
  byType: DomainDistributionItem[];
  byStatus: DomainDistributionItem[];
  trend: DomainTrendPoint[];
  overdue: OverdueBill[];
}

export interface OverdueBill {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
}

// ========== TENANT LIFECYCLE TYPES ==========

export interface TenantLifecycleAnalytics {
  summary: {
    totalTenants: number;
    activeTenants: number;
    churnedTenants: number;
    retentionRate: number | null;
    averageRent: number;
    totalDeposits: number;
  };
  tenantsWithArrears: number;
  payingTenants: number;
  averageInvoiceBalance: number | null;
  newTenantsTrend: DomainTrendPoint[];
}

// ========== LEAD ANALYTICS TYPES ==========

export interface LeadAnalytics {
  summary: {
    totalLeads: number;
    convertedLeads: number;
    activeLeads: number;
    conversionRate: number | null;
    averageConversionDays: number | null;
    conversionValue: number;
    averageConversionValue: number | null;
  };
  bySource: DomainDistributionItem[];
  byStatus: DomainDistributionItem[];
  trend: DomainTrendPoint[];
  propertyBreakdown: DomainPropertyPoint[];
}

// ========== DATA QUALITY TYPES ==========

export interface DataQualityAnalytics {
  summary: {
    totalInvoices: number;
    totalBills: number;
    totalTenants: number;
    totalUnits: number;
    totalPayments: number;
  };
  dataQuality: {
    orphanedInvoices: number;
    inconsistentTenants: number;
    orphanedUnits: number;
    missingPaymentAllocations: number;
    duplicateRecords: {
      invoices: string[];
      bills: string[];
    };
  };
  issues: {
    hasOrphanedInvoices: boolean;
    hasInconsistentTenants: boolean;
    hasOrphanedUnits: boolean;
    hasMissingPaymentAllocations: boolean;
    hasDuplicateRecords: boolean;
  };
}

// ========== PERFORMANCE ANALYTICS TYPES ==========

export interface PerformanceAnalytics {
  summary: {
    reportSubmissionRate: number | null;
    taskCompletionRate: number | null;
    overdueTasks: number;
    highPriorityTasks: number;
    averageTaskCompletionDays: number | null;
  };
  dailyReportTrend: DomainTrendPoint[];
  taskTrend: DomainTrendPoint[];
  byStatus: DomainDistributionItem[];
  byPriority: DomainDistributionItem[];
  overdueTasks: OverdueTask[];
}

export interface OverdueTask {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
}

// ========== VAT ANALYTICS TYPES ==========

export interface VATAnalytics {
  summary: {
    vatCollected: number;
    vatOnBills: number;
    vatEligibleTenants: number;
    vatInvoices: number;
    vatBillInvoices: number;
  };
  invoiceVAT: {
    totalVAT: number;
    vatInvoices: number;
    vatCollected: number;
  };
  billVAT: {
    totalVAT: number;
    vatBillInvoices: number;
    vatPaid: number;
  };
  tenantVATStatus: {
    vatEligible: number;
    withholdingTaxEligible: number;
    exemptTenants: number;
  };
}

// ========== BILL INVOICE ANALYTICS (Legacy) ==========

export interface BillInvoiceAnalytics {
  summary: {
    invoiceCount: number;
    billed: number;
    paid: number;
    outstanding: number;
    overdueBillBalance: number;
    collectionRate: number | null;
  };
  trend: DomainTrendPoint[];
  byProperty: DomainPropertyPoint[];
  statusDistribution: DomainDistributionItem[];
  categoryDistribution: DomainDistributionItem[];
}