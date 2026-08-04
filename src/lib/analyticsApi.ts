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
} from '@/types/analytics';

const params = (filters: AnalyticsFilters) => ({
  dateFrom: filters.dateFrom,
  dateTo: filters.dateTo,
  asOf: filters.asOf,
  grain: filters.grain,
  ...(filters.propertyId ? { propertyId: filters.propertyId } : {}),
  ...(filters.landlordId ? { landlordId: filters.landlordId } : {}),
});

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
};
