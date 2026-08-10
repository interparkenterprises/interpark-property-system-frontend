export type AnalyticsGrain = 'day' | 'week' | 'month';

export interface AnalyticsFilters {
  dateFrom: string;
  dateTo: string;
  asOf: string;
  grain: AnalyticsGrain;
  propertyId?: string;
  landlordId?: string;
}

export interface AnalyticsMeta {
  generatedAt: string;
  timezone: 'Africa/Nairobi';
  currency: 'KES';
  filters: AnalyticsFilters;
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

export interface DomainDistributionItem { label: string; count: number; amount: number }
export interface DomainTrendPoint { period: string; count: number; amount: number }
export interface DomainPropertyPoint { propertyId: string; propertyName: string; count: number; amount: number }
export interface DomainAnalytics {
  scope?: 'ORGANIZATION' | 'MANAGER';
  summary: Record<string, number | null>;
  trend: DomainTrendPoint[];
  byProperty: DomainPropertyPoint[] | null;
  statusDistribution: DomainDistributionItem[];
  categoryDistribution: DomainDistributionItem[];
  paymentDistribution?: DomainDistributionItem[];
}
