import axios from 'axios';
import api from '@/lib/api';
import type {
  AnalyticsFilters,
  AnalyticsOverview,
  AnalyticsResponse,
  AnalyticsApiFailure,
  CollectionsTrendResponse,
  OccupancySummary,
  ReceivablesStatusDistribution,
  ReceivablesSummary,
  ReceivablesTrendResponse,
  RevenueByPropertyResponse,
  TenantsSummary,
  DomainAnalytics,
  ComprehensiveInvoiceAnalytics,
  RentInvoiceAnalytics,
  BillInvoiceAnalyticsDetailed,
  InvoiceAgingReport,
  InvoiceReconciliationReport,
  BillAnalytics,
  TenantLifecycleAnalytics,
  LeadAnalytics,
  DataQualityAnalytics,
  PerformanceAnalytics,
  VATAnalytics,
  BillInvoiceAnalytics,
} from '@/types/analytics';

const params = (filters: AnalyticsFilters) => {
  const result: Record<string, any> = {
    asOf: filters.asOf,
    grain: filters.grain,
  };
  
  // Only include date filters if they exist
  if (filters.dateFrom) {
    result.dateFrom = filters.dateFrom;
  }
  if (filters.dateTo) {
    result.dateTo = filters.dateTo;
  }
  if (filters.propertyId) {
    result.propertyId = filters.propertyId;
  }
  if (filters.landlordId) {
    result.landlordId = filters.landlordId;
  }
  
  return result;
};

export const toAnalyticsApiFailure = (error: unknown): AnalyticsApiFailure => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return {
        message: 'The analytics backend is unavailable. Confirm the backend is running and NEXT_PUBLIC_API_URL points to it.',
        backendUnavailable: true,
      };
    }
    return {
      status: error.response.status,
      message: error.response.data?.message || 'Analytics could not be loaded.',
      backendUnavailable: false,
    };
  }
  return {
    message: error instanceof Error ? error.message : 'Analytics could not be loaded.',
    backendUnavailable: false,
  };
};

export const analyticsAPI = {
  // ========== EXISTING ANALYTICS ==========
  getOverview: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<AnalyticsOverview>>('analytics/overview', { params: params(filters) })).data,
  
  getReceivablesSummary: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<ReceivablesSummary>>('analytics/receivables/summary', { params: params(filters) })).data,
  
  getStatusDistribution: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<ReceivablesStatusDistribution>>('analytics/receivables/status-distribution', { params: params(filters) })).data,
  
  getReceivablesTrend: async (filters: AnalyticsFilters): Promise<ReceivablesTrendResponse> =>
    (await api.get('analytics/receivables/trend', { params: params(filters) })).data,
  
  getCollectionsTrend: async (filters: AnalyticsFilters): Promise<CollectionsTrendResponse> =>
    (await api.get('analytics/collections/trend', { params: params(filters) })).data,
  
  getRevenueByProperty: async (filters: AnalyticsFilters): Promise<RevenueByPropertyResponse> =>
    (await api.get('analytics/revenue/by-property', { params: params(filters) })).data,
  
  getOccupancySummary: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<OccupancySummary>>('analytics/occupancy/summary', { params: params(filters) })).data,
  
  getTenantsSummary: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<TenantsSummary>>('analytics/tenants/summary', { params: params(filters) })).data,

  // ========== DOMAIN ANALYTICS (Legacy) ==========
  getDomain: async (domain: string, filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<DomainAnalytics>>(`analytics/${domain}`, { params: params(filters) })).data,

  // ========== BILL INVOICE ANALYTICS (Legacy) ==========
  getBillInvoiceAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<BillInvoiceAnalytics>>('analytics/bill-invoices/summary', { params: params(filters) })).data,

  // ========== SERVICE PROVIDER ANALYTICS ==========
  getServiceProviderAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<DomainAnalytics>>('analytics/service-providers/summary', { params: params(filters) })).data,

  // ========== COMMISSION ANALYTICS ==========
  getCommissionAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<DomainAnalytics>>('analytics/commissions/summary', { params: params(filters) })).data,

  // ========== DEMAND LETTER ANALYTICS ==========
  getDemandLetterAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<DomainAnalytics>>('analytics/demand-letters/summary', { params: params(filters) })).data,

  // ========== TENANT ANALYTICS ==========
  getTenantAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<DomainAnalytics>>('analytics/tenants/insights', { params: params(filters) })).data,

  // ========== OTHER INCOME ANALYTICS ==========
  getOtherIncomeAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<DomainAnalytics>>('analytics/other-income/summary', { params: params(filters) })).data,

  // ========== EMPLOYEE ANALYTICS ==========
  getEmployeeAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<DomainAnalytics>>('analytics/employees/summary', { params: params(filters) })).data,

  // ========== NEW COMPREHENSIVE INVOICE ANALYTICS ==========
  getComprehensiveInvoiceAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<ComprehensiveInvoiceAnalytics>>('analytics/invoices/comprehensive', { params: params(filters) })).data,

  // ========== RENT INVOICE ANALYTICS ==========
  getRentInvoiceAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<RentInvoiceAnalytics>>('analytics/invoices/rent', { params: params(filters) })).data,

  // ========== BILL INVOICE ANALYTICS (Detailed) ==========
  getBillInvoiceAnalyticsDetailed: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<BillInvoiceAnalyticsDetailed>>('analytics/invoices/bill', { params: params(filters) })).data,

  // ========== INVOICE AGING REPORT ==========
  getInvoiceAgingReport: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<InvoiceAgingReport>>('analytics/invoices/aging', { params: params(filters) })).data,

  // ========== INVOICE RECONCILIATION REPORT ==========
  getInvoiceReconciliationReport: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<InvoiceReconciliationReport>>('analytics/invoices/reconciliation', { params: params(filters) })).data,

  // ========== BILL ANALYTICS ==========
  getBillAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<BillAnalytics>>('analytics/bills/summary', { params: params(filters) })).data,

  // ========== TENANT LIFECYCLE ANALYTICS ==========
  getTenantLifecycleAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<TenantLifecycleAnalytics>>('analytics/tenants/lifecycle', { params: params(filters) })).data,

  // ========== LEAD ANALYTICS ==========
  getLeadAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<LeadAnalytics>>('analytics/leads/summary', { params: params(filters) })).data,

  // ========== DATA QUALITY ANALYTICS ==========
  getDataQualityAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<DataQualityAnalytics>>('analytics/data-quality', { params: params(filters) })).data,

  // ========== PERFORMANCE ANALYTICS ==========
  getPerformanceAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<PerformanceAnalytics>>('analytics/performance', { params: params(filters) })).data,

  // ========== VAT ANALYTICS ==========
  getVATAnalytics: async (filters: AnalyticsFilters) =>
    (await api.get<AnalyticsResponse<VATAnalytics>>('analytics/vat/summary', { params: params(filters) })).data,
};