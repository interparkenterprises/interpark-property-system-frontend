// ========== CORE TYPES ==========

export type AnalyticsGrain = 'day' | 'week' | 'month';

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  asOf: string;
  grain: AnalyticsGrain;
  propertyId?: string;
  landlordId?: string;
}

// ========== METRIC DEFINITIONS (NEW) ==========
// Backend publishes machine-readable definitions per endpoint via
// meta.definitions. The frontend reads these to render tooltips without
// hardcoding strings.

export type MetricAxis = 'dueDate' | 'issueDate' | 'datePaid' | 'asOf' | 'lifetime';
export type MetricBasis = 'invoice' | 'cash' | 'ratio' | 'count' | 'duration';

export interface MetricDefinition {
  label: string;
  description: string;
  axis: MetricAxis;
  basis: MetricBasis;
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
  // NEW: per-endpoint metric definitions
  definitions: Record<string, MetricDefinition>;
  dataQuality: Record<string, boolean | number | string | null>;
}

export interface AnalyticsResponse<T> {
  success: true;
  data: T;
  meta: AnalyticsMeta;
}

export interface AnalyticsApiFailure {
  status?: number;
  message: string;
  backendUnavailable: boolean;
}

// ========== TENANT LIFECYCLE TYPES ==========

export type TenantLifecycleStatus = 'ACTIVE' | 'LEFT';

export type TenantLeftReason =
  | 'LEASE_EXPIRED'
  | 'VOLUNTARY'
  | 'EVICTED'
  | 'NON_PAYMENT'
  | 'TRANSFERRED'
  | 'DECEASED'
  | 'OTHER'
  | 'UNSPECIFIED';

export interface TenantListFilters {
  status?: TenantLifecycleStatus | 'ALL';
  includeLeft?: boolean;
}

export interface LifecycleMetadata {
  status: TenantLifecycleStatus;
  isActive: boolean;
  leftAt: string | null;
  leftReason: TenantLeftReason | null;
  tenureDays: number | null;
}

// ========== RECEIVABLES & OCCUPANCY ==========

export interface ArrearsByTenantStatus {
  activeTenants: number;
  formerTenants: number;
  total: number;
}

export interface ReceivablesSummary {
  billed: number;
  paid: number;
  outstanding: number;
  arrears: number;
  collectionRate: number | null;
  invoiceCount: number;
  openInvoiceCount: number;
  // NEW: cash-date metric alongside the invoice-cohort metrics.
  // Populated by /receivables/summary and /overview. Absent on endpoints
  // that only compute invoice-based receivables.
  cashCollectedInPeriod?: number;
  cashTransactionCount?: number;
  arrearsByTenantStatus?: ArrearsByTenantStatus;
}

export interface OccupancySummary {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupiedWithTenant: number;
  occupiedWithoutTenant: number;
  vacantWithTenant: number;
  occupancyRate: number | null;
}

export interface TenantsSummary {
  currentTenants: number;
  formerTenants: number;
  totalTenantsEver: number;
  churnRate: number | null;
  currentRentRoll: number;
  averageRent: number;
  depositsHeld: number;
  byLeftReason: Record<string, number>;
}

/**
 * CHANGED: the backend now always returns the full tenants block from
 * /overview — same shape as TenantsSummary. Kept as a named alias so
 * existing imports keep working, but every field is now required.
 */
export type OverviewTenantsBlock = TenantsSummary;

export interface AnalyticsOverview {
  receivables: ReceivablesSummary;
  occupancy: OccupancySummary;
  tenants: OverviewTenantsBlock;
}

// ========== COHORT VS CASH (NEW) ==========
// Single-call comparison of invoice-cohort receivables vs cash-date collections.
// Answers "why doesn't `paid` match my PaymentReport sum?".

export interface CohortVsCash {
  cohort: {
    billed: number;
    allocated: number;
    collectionRate: number | null;
    invoiceCount: number;
  };
  cash: {
    collected: number;
    transactionCount: number;
    excludedCredit: number;
    excludedPrepaid: number;
  };
  snapshot: {
    outstanding: number;
    arrears: number;
    openInvoiceCount: number;
    asOf: string;
  };
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
export type CohortVsCashResponse = AnalyticsResponse<CohortVsCash>;

// ========== DOMAIN ANALYTICS (Legacy) ==========

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

// ========== INVOICE ANALYTICS TYPES ==========

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

/**
 * CHANGED: backend now normalizes aging detail rows to a single shape.
 * `invoiceNumber` and `totalDue` are always populated (with fallbacks to
 * `billReferenceNumber` / `grandTotal` for bill invoices).
 * `kind` tells the client which detail page to route to.
 */
export interface AgingDetail {
  id: string;
  invoiceNumber: string | null;
  totalDue: number;
  balance: number;
  status: string;
  dueDate: string;
  kind: 'RENT' | 'BILL';
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

// ========== TENANT LIFECYCLE ANALYTICS ==========

export interface TenantLifecycleAnalytics {
  summary: {
    totalTenants: number;
    activeTenants: number;
    churnedTenants: number;
    cumulativeRetentionRate: number | null;
    periodRetentionRate: number | null;
    averageRent: number;
    totalDeposits: number;
    averageTenureDays: number | null;
  };
  tenantsWithArrears: number;
  formerTenantsWithArrears: number;
  totalTenantsWithArrears: number;
  payingTenants: number;
  averageInvoiceBalance: number | null;
  newTenantsTrend: DomainTrendPoint[];
  churnTrend: DomainTrendPoint[];
  churnByReason: Record<string, number>;
}

// ========== TENANT CHURN ANALYTICS ==========

export interface ChurnedTenant {
  id: string;
  name: string;
  property: string | null;
  unitNo: string | null;
  rent: number;
  joinedAt: string;
  /** Raw DB value — may be null on legacy rows marked LEFT before leftAt existed. */
  leftAt: string | null;
  /**
   * NEW: always populated. Falls back to `updatedAt` on the backend when
   * `leftAt` is null, so use this for display and tenure math.
   */
  effectiveLeftAt: string;
  leftReason: TenantLeftReason | null;
  tenureDays: number | null;
}

export interface TenantChurnAnalytics {
  summary: {
    churnedTenants: number;
    activeTenants: number;
    totalTenantsEver: number;
    churnRate: number | null;
    averageTenureDays: number | null;
    rentLostToChurn: number;
  };
  byReason: Record<string, number>;
  trend: DomainTrendPoint[];
  byProperty: DomainPropertyPoint[];
  churnedTenants: ChurnedTenant[];
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
    formerTenantsOnOccupiedUnits: number;
    leftTenantsMissingLeftAt: number;
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
    hasMissingLeftAt: boolean;
  };
}

// ========== PERFORMANCE ANALYTICS TYPES ==========

export interface OverdueTask {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
}

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