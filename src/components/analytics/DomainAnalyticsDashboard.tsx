'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { propertiesAPI } from '@/lib/api';
import { analyticsAPI, toAnalyticsApiFailure } from '@/lib/analyticsApi';
import type { Property } from '@/types';
import type { AnalyticsApiFailure, AnalyticsFilters as Filters, DomainAnalytics } from '@/types/analytics';
import { AnalyticsFilters } from './AnalyticsFilters';
import { AnalyticsPageHeader } from './AnalyticsNavigation';
import { AnalyticsEmpty, AnalyticsError, AnalyticsLoading, AnalyticsUnauthorized } from './AnalyticsStates';
import { ChartPanel, DataQualityNotices, exactMoneyTitle, formatCompactMoney, formatMoney, Freshness, KpiCard } from './AnalyticsWidgets';

type Domain = 'bill-invoices' | 'service-providers' | 'commissions' | 'demand-letters' | 'tenants' | 'other-income' | 'employees' | 'invoices';

const config: Record<Domain, { 
  title: string; 
  endpoint: string; 
  apiMethod: string;
  property: boolean; 
  permission?: string; 
  roles?: boolean; 
  drill: string; 
  labels: Record<string, string>;
  isComprehensive?: boolean;
  hasLifecycle?: boolean;
}> = {
  'invoices': { 
    title: 'Comprehensive Invoice Analytics', 
    endpoint: 'invoices/comprehensive', 
    apiMethod: 'getComprehensiveInvoiceAnalytics',
    property: true, 
    permission: 'VIEW_PAYMENT_REPORTS', 
    drill: '/properties', 
    isComprehensive: true,
    labels: { 
      totalInvoices: 'Total Invoices',
      totalAmount: 'Total Amount',
      totalPaid: 'Total Paid',
      totalOutstanding: 'Total Outstanding',
      totalOverdue: 'Total Overdue',
      overallCollectionRate: 'Overall Collection Rate'
    } 
  },
  'bill-invoices': { 
    title: 'Bill invoice analytics', 
    endpoint: 'bill-invoices/summary', 
    apiMethod: 'getBillInvoiceAnalytics',
    property: true, 
    permission: 'VIEW_BILL_INVOICES', 
    drill: '/properties', 
    labels: { 
      invoiceCount: 'Bill invoices', 
      billed: 'Total billed', 
      paid: 'Amount paid', 
      outstanding: 'Outstanding', 
      overdueBillBalance: 'Overdue bill balance', 
      collectionRate: 'Collection rate' 
    } 
  },
  'service-providers': { 
    title: 'Service provider analytics', 
    endpoint: 'service-providers/summary', 
    apiMethod: 'getServiceProviderAnalytics',
    property: true, 
    permission: 'VIEW_SERVICE_PROVIDERS', 
    drill: '/properties', 
    labels: { 
      providerCount: 'Providers', 
      contractedCharges: 'Contracted charges', 
      averageContractedCharge: 'Average contracted charge' 
    } 
  },
  commissions: { 
    title: 'Commission analytics', 
    endpoint: 'commissions/summary', 
    apiMethod: 'getCommissionAnalytics',
    property: true, 
    permission: 'VIEW_COMMISSIONS', 
    drill: '/myIncome', 
    labels: { 
      commissionCount: 'Commissions', 
      totalCommission: 'Total commission', 
      paidCommission: 'Paid commission', 
      pendingCommission: 'Pending / processing' 
    } 
  },
  'demand-letters': { 
    title: 'Demand letter analytics', 
    endpoint: 'demand-letters/summary', 
    apiMethod: 'getDemandLetterAnalytics',
    property: true, 
    permission: 'VIEW_DEMAND_LETTERS', 
    drill: '/payments', 
    labels: { 
      letterCount: 'Demand letters', 
      documentSnapshotAmount: 'Document snapshot amount', 
      partialPaymentRecorded: 'Partial payment recorded', 
      settledCount: 'Settled', 
      escalatedCount: 'Escalated' 
    } 
  },
  tenants: { 
    title: 'Tenant Analytics', 
    endpoint: 'tenants/insights', 
    apiMethod: 'getTenantAnalytics',
    property: true, 
    permission: 'VIEW_TENANTS', 
    drill: '/properties', 
    hasLifecycle: true,
    labels: { 
      currentTenants: 'Current tenants', 
      currentRentRoll: 'Current rent roll', 
      averageRent: 'Average rent', 
      depositsHeld: 'Deposits held' 
    } 
  },
  'other-income': { 
    title: 'Other income analytics', 
    endpoint: 'other-income/summary', 
    apiMethod: 'getOtherIncomeAnalytics',
    property: false, 
    roles: true, 
    drill: '/myIncome/other', 
    labels: { 
      invoiceCount: 'Income documents', 
      invoicedAmount: 'Invoiced amount', 
      paidDocumentAmount: 'Paid document value', 
      vatAmount: 'VAT amount' 
    } 
  },
  employees: { 
    title: 'Employee and salary analytics', 
    endpoint: 'employees/summary', 
    apiMethod: 'getEmployeeAnalytics',
    property: false, 
    roles: true, 
    drill: '/employees', 
    labels: { 
      employeeCount: 'Employees', 
      activeEmployees: 'Active employees', 
      configuredSalaryTotal: 'Configured salaries', 
      averageConfiguredSalary: 'Average configured salary', 
      salaryPaidInRange: 'Salary paid in range' 
    } 
  },
};

const moneyKeys = /amount|paid|billed|outstanding|arrears|rent|deposit|salary|commission|charge|total|overdue|collection/i;
const dateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const initial = (): Filters => { 
  const now = new Date(); 
  return { 
    dateFrom: dateString(new Date(now.getFullYear(), now.getMonth() - 5, 1)), 
    dateTo: dateString(now), 
    asOf: dateString(now), 
    grain: 'month' 
  }; 
};

const colors = ['#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#22d3ee', '#f97316'];
const tooltipStyle = { background: '#0f172a', border: '1px solid #475569', borderRadius: 10, color: '#fff' };

// Map domain to API method
const getApiMethod = (domain: Domain): keyof typeof analyticsAPI => {
  const mapping: Record<Domain, keyof typeof analyticsAPI> = {
    'invoices': 'getComprehensiveInvoiceAnalytics',
    'bill-invoices': 'getBillInvoiceAnalytics',
    'service-providers': 'getServiceProviderAnalytics',
    commissions: 'getCommissionAnalytics',
    'demand-letters': 'getDemandLetterAnalytics',
    tenants: 'getTenantAnalytics',
    'other-income': 'getOtherIncomeAnalytics',
    employees: 'getEmployeeAnalytics'
  };
  return mapping[domain];
};

// Helper to extract trend data from different response structures
const extractTrendData = (data: any): any[] => {
  if (!data) return [];
  
  if (data.rentInvoices?.trend) {
    return data.rentInvoices.trend;
  }
  if (data.billInvoices?.trend) {
    return data.billInvoices.trend;
  }
  if (data.trend) {
    return data.trend;
  }
  return [];
};

// Helper to extract status distribution from different response structures
const extractStatusDistribution = (data: any): any[] => {
  if (!data) return [];
  
  if (data.rentInvoices?.byStatus) {
    const statusObj = data.rentInvoices.byStatus;
    return Object.entries(statusObj).map(([key, value]: [string, any]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      count: value.count || 0,
      amount: value.amount || value.paidAmount || value.unpaidAmount || value.totalDue || 0
    }));
  }
  if (data.billInvoices?.byStatus) {
    return data.billInvoices.byStatus;
  }
  if (data.statusDistribution) {
    return data.statusDistribution;
  }
  return [];
};

// Helper to extract category distribution from different response structures
const extractCategoryDistribution = (data: any): any[] => {
  if (!data) return [];
  
  if (data.billInvoices?.byType) {
    return data.billInvoices.byType;
  }
  if (data.categoryDistribution) {
    return data.categoryDistribution;
  }
  return [];
};

// Helper to extract property breakdown with both Rent and Bill amounts
const extractPropertyBreakdown = (data: any): any[] => {
  if (!data) return [];
  
  const propertyMap = new Map();
  
  // Get rent invoice property data
  if (data.rentInvoices?.byProperty && Array.isArray(data.rentInvoices.byProperty)) {
    data.rentInvoices.byProperty.forEach((item: any) => {
      const id = item.propertyId || item.property?.id;
      if (!id) return;
      
      if (!propertyMap.has(id)) {
        propertyMap.set(id, {
          propertyId: id,
          propertyName: item.propertyName || item.property?.name || 'Unknown Property',
          rentAmount: item.amount || item.billed || item.paid || 0,
          rentCount: item.count || 0,
          billAmount: 0,
          billCount: 0,
          totalAmount: 0,
          totalCount: 0
        });
      } else {
        const existing = propertyMap.get(id);
        existing.rentAmount += item.amount || item.billed || item.paid || 0;
        existing.rentCount += item.count || 0;
      }
    });
  }
  
  // Get bill invoice property data
  if (data.billInvoices?.byProperty && Array.isArray(data.billInvoices.byProperty)) {
    data.billInvoices.byProperty.forEach((item: any) => {
      const id = item.propertyId || item.property?.id;
      if (!id) return;
      
      if (!propertyMap.has(id)) {
        propertyMap.set(id, {
          propertyId: id,
          propertyName: item.propertyName || item.property?.name || 'Unknown Property',
          rentAmount: 0,
          rentCount: 0,
          billAmount: item.amount || item.billed || item.paid || 0,
          billCount: item.count || 0,
          totalAmount: 0,
          totalCount: 0
        });
      } else {
        const existing = propertyMap.get(id);
        existing.billAmount += item.amount || item.billed || item.paid || 0;
        existing.billCount += item.count || 0;
      }
    });
  }
  
  // Calculate totals and convert to array
  const result = Array.from(propertyMap.values()).map(item => ({
    ...item,
    totalAmount: item.rentAmount + item.billAmount,
    totalCount: item.rentCount + item.billCount
  }));
  
  // Sort by total amount (highest first)
  return result.sort((a, b) => b.totalAmount - a.totalAmount);
};

// Helper to get rent invoice summary from comprehensive data
const getRentInvoiceSummary = (data: any): any => {
  if (!data?.summary?.rentInvoices) return null;
  return data.summary.rentInvoices;
};

// Helper to get bill invoice summary from comprehensive data
const getBillInvoiceSummary = (data: any): any => {
  if (!data?.summary?.billInvoices) return null;
  return data.summary.billInvoices;
};

// Helper to extract lifecycle data from tenant response - FIXED
const extractLifecycleData = (data: any): any => {
  if (!data) return null;
  
  // The data might be in data.summary or directly at root
  const summary = data.summary || data;
  
  // Check if this is tenant lifecycle data (has these specific fields)
  if (summary.totalTenants !== undefined || summary.activeTenants !== undefined) {
    return {
      summary: {
        totalTenants: summary.totalTenants || 0,
        activeTenants: summary.activeTenants || 0,
        churnedTenants: summary.churnedTenants || 0,
        retentionRate: summary.retentionRate || 0,
        averageRent: summary.averageRent || 0,
        totalDeposits: summary.totalDeposits || 0
      },
      tenantsWithArrears: data.tenantsWithArrears || 0,
      payingTenants: data.payingTenants || 0,
      averageInvoiceBalance: data.averageInvoiceBalance || 0,
      newTenantsTrend: data.newTenantsTrend || []
    };
  }
  return null;
};

export default function DomainAnalyticsDashboard({ domain }: { domain: Domain }) {
  const definition = config[domain]; 
  const auth = useAuth();
  const authorized = definition.roles ? auth.isAdmin || auth.isManager : auth.isAdmin || auth.isManager || auth.hasPermission(definition.permission || '');
  const [draft, setDraft] = useState<Filters>(initial); 
  const [filters, setFilters] = useState<Filters>(initial);
  const [properties, setProperties] = useState<Property[]>([]); 
  const [response, setResponse] = useState<{ data: any; meta: any } | null>(null);
  const [lifecycleData, setLifecycleData] = useState<any>(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<AnalyticsApiFailure | null>(null);

  useEffect(() => { 
    if (authorized && definition.property) {
      propertiesAPI.getAll()
        .then(result => setProperties(Array.isArray(result) ? result : []))
        .catch(() => setProperties([])); 
    }
  }, [authorized, definition.property]);

  const load = useCallback(async () => {
    if (!authorized) { 
      setLoading(false); 
      return; 
    }
    setLoading(true); 
    setError(null);
    try {
      // For tenants domain, fetch both insights and lifecycle data
      if (domain === 'tenants' && definition.hasLifecycle) {
        const [insightsResult, lifecycleResult] = await Promise.all([
          analyticsAPI.getTenantAnalytics(definition.property ? filters : { ...filters, propertyId: undefined, landlordId: undefined }),
          analyticsAPI.getTenantLifecycleAnalytics(definition.property ? filters : { ...filters, propertyId: undefined, landlordId: undefined })
        ]);
        setResponse({ data: insightsResult.data, meta: insightsResult.meta });
        setLifecycleData(lifecycleResult.data);
      } else {
        const apiMethod = getApiMethod(domain);
        const apiFn = analyticsAPI[apiMethod] as (filters: Filters) => Promise<any>;
        const result = await apiFn(definition.property ? filters : { ...filters, propertyId: undefined, landlordId: undefined });
        setResponse({ data: result.data, meta: result.meta });
        setLifecycleData(null);
      }
    } catch (e) {
      setResponse(null); 
      setLifecycleData(null);
      setError(toAnalyticsApiFailure(e));
    } finally { 
      setLoading(false); 
    }
  }, [authorized, definition.property, definition.hasLifecycle, domain, filters]);

  useEffect(() => { load(); }, [load]);

  // Extract data based on response structure
  const summary = response?.data?.summary || {};
  const trendData = extractTrendData(response?.data);
  const statusData = extractStatusDistribution(response?.data);
  const categoryData = extractCategoryDistribution(response?.data);
  const propertyData = extractPropertyBreakdown(response?.data);

  // For comprehensive invoice analytics, get breakdown data
  const rentInvoiceSummary = getRentInvoiceSummary(response?.data);
  const billInvoiceSummary = getBillInvoiceSummary(response?.data);
  const performance = response?.data?.performance;
  const aging = response?.data?.aging;

  // For tenants, get lifecycle data
  const lifecycle = extractLifecycleData(lifecycleData);

  // Check if this is comprehensive invoice analytics
  const isComprehensive = definition.isComprehensive || false;
  const isTenants = domain === 'tenants';

  // Debug log to see what data is coming through
  useEffect(() => {
    if (isTenants && lifecycleData) {
      console.log('Lifecycle Data:', lifecycleData);
      console.log('Extracted Lifecycle:', lifecycle);
    }
  }, [isTenants, lifecycleData, lifecycle]);

  return (
    <div className="space-y-6 text-white">
      <AnalyticsPageHeader 
        title={definition.title} 
        description={`Live database metrics${definition.property ? ' restricted to accessible properties.' : ` at ${response?.data.scope?.toLowerCase() || 'authorized'} scope; no property attribution is inferred.`}`} 
      />
      {!authorized ? (
        <AnalyticsUnauthorized detail={`You do not have permission to view ${definition.title.toLowerCase()}.`} />
      ) : (
        <>
          <AnalyticsFilters 
            value={draft} 
            properties={definition.property ? properties : []} 
            showProperty={definition.property} 
            disabled={loading} 
            onChange={setDraft} 
            onApply={() => setFilters({ 
              ...draft,
              asOf: draft.dateTo || dateString(new Date()),
              propertyId: definition.property ? draft.propertyId : undefined 
            })} 
          />
          {loading ? (
            <AnalyticsLoading />
          ) : error ? (
            <AnalyticsError message={error.message} backendUnavailable={error.backendUnavailable} retry={load} />
          ) : response ? (
            <>
              <DataQualityNotices values={[response.meta.dataQuality]} />
              
              {/* Summary KPIs - Only show non-object values */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Object.entries(summary).map(([key, value]) => {
                  const monetary = moneyKeys.test(key);
                  if (typeof value === 'object' && value !== null) return null;
                  return (
                    <KpiCard 
                      key={key} 
                      label={definition.labels[key] || key.replace(/([A-Z])/g, ' $1').trim()} 
                      value={monetary ? formatCompactMoney(value as number) : value == null ? 'Not available' : Number(value).toLocaleString('en-KE')} 
                      fullValueTitle={monetary ? exactMoneyTitle(value as number) : undefined} 
                      href={definition.drill} 
                    />
                  );
                })}
              </div>

              {/* Tenant Lifecycle Section */}
              {isTenants && lifecycle && (
                <>
                  <h2 className="text-xl font-semibold text-white">Tenant Lifecycle Overview</h2>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard 
                      label="Total Tenants" 
                      value={lifecycle.summary.totalTenants.toLocaleString()} 
                      detail="All tenant records" 
                      tone="sky" 
                    />
                    <KpiCard 
                      label="Active Tenants" 
                      value={lifecycle.summary.activeTenants.toLocaleString()} 
                      detail="Currently occupied" 
                      tone="emerald" 
                    />
                    <KpiCard 
                      label="Churned Tenants" 
                      value={lifecycle.summary.churnedTenants.toLocaleString()} 
                      detail="No longer active" 
                      tone="rose" 
                    />
                    <KpiCard 
                      label="Retention Rate" 
                      value={lifecycle.summary.retentionRate !== null ? `${lifecycle.summary.retentionRate}%` : 'N/A'} 
                      detail="Active / Total tenants" 
                      tone="amber" 
                    />
                    <KpiCard 
                      label="Average Rent" 
                      value={formatCompactMoney(lifecycle.summary.averageRent)} 
                      detail="Average monthly rent" 
                      tone="sky" 
                    />
                    <KpiCard 
                      label="Total Deposits" 
                      value={formatCompactMoney(lifecycle.summary.totalDeposits)} 
                      detail="All deposits held" 
                      tone="emerald" 
                    />
                    <KpiCard 
                      label="Tenants with Arrears" 
                      value={lifecycle.tenantsWithArrears.toLocaleString()} 
                      detail="Have overdue balance" 
                      tone="rose" 
                    />
                    <KpiCard 
                      label="Paying Tenants" 
                      value={lifecycle.payingTenants.toLocaleString()} 
                      detail="Have made payments" 
                      tone="amber" 
                    />
                    <KpiCard 
                      label="Average Invoice Balance" 
                      value={formatCompactMoney(lifecycle.averageInvoiceBalance)} 
                      detail="Per tenant" 
                      tone="sky" 
                    />
                  </div>

                  {/* New Tenants Trend Chart */}
                  {lifecycle.newTenantsTrend && lifecycle.newTenantsTrend.length > 0 && (
                    <ChartPanel title="New Tenants Trend" subtitle="New tenant additions over time">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lifecycle.newTenantsTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                          <XAxis dataKey="period" stroke="#94a3b8"/>
                          <YAxis stroke="#94a3b8"/>
                          <Tooltip contentStyle={tooltipStyle} formatter={(value) => Number(value).toLocaleString()}/>
                          <Bar dataKey="count" name="New Tenants" fill="#38bdf8" radius={[4, 4, 0, 0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartPanel>
                  )}
                </>
              )}

              {/* Rent vs Bill Invoice Breakdown */}
              {isComprehensive && (rentInvoiceSummary || billInvoiceSummary) && (
                <>
                  <h2 className="text-xl font-semibold text-white">Rent vs Bill Invoice Breakdown</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-5 shadow-xl">
                      <h3 className="text-lg font-semibold text-sky-400">Rent Invoices</h3>
                      {rentInvoiceSummary ? (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm text-slate-400">Count</p>
                            <p className="text-xl font-bold text-white">{rentInvoiceSummary.count || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Amount</p>
                            <p className="text-xl font-bold text-white">{formatCompactMoney(rentInvoiceSummary.amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Paid</p>
                            <p className="text-xl font-bold text-emerald-400">{formatCompactMoney(rentInvoiceSummary.paid)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Outstanding</p>
                            <p className="text-xl font-bold text-amber-400">{formatCompactMoney(rentInvoiceSummary.outstanding)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Overdue</p>
                            <p className="text-xl font-bold text-rose-400">{formatCompactMoney(rentInvoiceSummary.overdue)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Collection Rate</p>
                            <p className="text-xl font-bold text-white">{rentInvoiceSummary.collectionRate !== null && rentInvoiceSummary.collectionRate !== undefined ? `${rentInvoiceSummary.collectionRate}%` : 'N/A'}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-slate-400">No rent invoice data available</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 shadow-xl">
                      <h3 className="text-lg font-semibold text-emerald-400">Bill Invoices</h3>
                      {billInvoiceSummary ? (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm text-slate-400">Count</p>
                            <p className="text-xl font-bold text-white">{billInvoiceSummary.count || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Amount</p>
                            <p className="text-xl font-bold text-white">{formatCompactMoney(billInvoiceSummary.amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Paid</p>
                            <p className="text-xl font-bold text-emerald-400">{formatCompactMoney(billInvoiceSummary.paid)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Outstanding</p>
                            <p className="text-xl font-bold text-amber-400">{formatCompactMoney(billInvoiceSummary.outstanding)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Overdue</p>
                            <p className="text-xl font-bold text-rose-400">{formatCompactMoney(billInvoiceSummary.overdue)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Collection Rate</p>
                            <p className="text-xl font-bold text-white">{billInvoiceSummary.collectionRate !== null && billInvoiceSummary.collectionRate !== undefined ? `${billInvoiceSummary.collectionRate}%` : 'N/A'}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-slate-400">No bill invoice data available</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Performance Metrics */}
              {performance && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {performance.paymentVelocity && (
                    <KpiCard 
                      label="Avg Days to Pay" 
                      value={performance.paymentVelocity.overall !== null && performance.paymentVelocity.overall !== undefined ? `${performance.paymentVelocity.overall} days` : 'N/A'} 
                      detail="Overall average payment velocity" 
                      tone="sky" 
                    />
                  )}
                  {performance.onTimePaymentRate && (
                    <KpiCard 
                      label="On-Time Payment Rate" 
                      value={performance.onTimePaymentRate.rentInvoices !== null && performance.onTimePaymentRate.rentInvoices !== undefined ? `${performance.onTimePaymentRate.rentInvoices}%` : 'N/A'} 
                      detail="Rent invoices paid on time" 
                      tone="emerald" 
                    />
                  )}
                  {performance.averageInvoiceAmount && (
                    <KpiCard 
                      label="Avg Rent Invoice Amount" 
                      value={performance.averageInvoiceAmount.rentInvoices !== null && performance.averageInvoiceAmount.rentInvoices !== undefined ? formatCompactMoney(performance.averageInvoiceAmount.rentInvoices) : 'N/A'} 
                      detail="Average rent invoice amount" 
                      tone="amber" 
                    />
                  )}
                  {performance.averageInvoiceAmount?.billInvoices !== null && performance.averageInvoiceAmount?.billInvoices !== undefined && (
                    <KpiCard 
                      label="Avg Bill Invoice Amount" 
                      value={performance.averageInvoiceAmount.billInvoices !== null && performance.averageInvoiceAmount.billInvoices !== undefined ? formatCompactMoney(performance.averageInvoiceAmount.billInvoices) : 'N/A'} 
                      detail="Average bill invoice amount" 
                      tone="rose" 
                    />
                  )}
                </div>
              )}

              {/* Aging Buckets */}
              {aging && aging.combined && aging.combined.length > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5 shadow-xl">
                  <h2 className="text-lg font-semibold text-white">Aging Summary</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-5">
                    {aging.combined.map((bucket: any) => (
                      <div key={bucket.label} className="rounded-lg border border-slate-600 bg-slate-900/50 p-3 text-center">
                        <p className="text-sm text-slate-400">{bucket.label}</p>
                        <p className="text-lg font-bold text-white">{formatCompactMoney(bucket.amount)}</p>
                        <p className="text-xs text-slate-400">{bucket.count} invoice(s)</p>
                      </div>
                    ))}
                  </div>
                  {aging.rentInvoices && aging.rentInvoices.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-slate-400">Rent Aging</p>
                      <div className="mt-2 grid grid-cols-5 gap-2">
                        {aging.rentInvoices.map((bucket: any) => (
                          <div key={bucket.label} className="rounded bg-slate-900/30 p-2 text-center">
                            <p className="text-xs text-slate-400">{bucket.label}</p>
                            <p className="text-sm font-semibold text-sky-400">{formatCompactMoney(bucket.amount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {aging.billInvoices && aging.billInvoices.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-slate-400">Bill Aging</p>
                      <div className="mt-2 grid grid-cols-5 gap-2">
                        {aging.billInvoices.map((bucket: any) => (
                          <div key={bucket.label} className="rounded bg-slate-900/30 p-2 text-center">
                            <p className="text-xs text-slate-400">{bucket.label}</p>
                            <p className="text-sm font-semibold text-emerald-400">{formatCompactMoney(bucket.amount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-6 xl:grid-cols-2">
                <ChartPanel title="Trend" subtitle="Values grouped by the selected date grain">
                  {trendData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                        <XAxis dataKey="period" stroke="#94a3b8"/>
                        <YAxis stroke="#94a3b8"/>
                        <Tooltip contentStyle={tooltipStyle} formatter={v => formatMoney(Number(v))}/>
                        <Line dataKey="amount" stroke="#38bdf8" strokeWidth={3}/>
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <AnalyticsEmpty title="No data for selected period" detail="No records matched the selected date and property filters."/>
                  )}
                </ChartPanel>
                <ChartPanel title="Status distribution">
                  {statusData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} dataKey="count" nameKey="label" innerRadius={55} outerRadius={90}>
                          {statusData.map((x: any, i: number) => (
                            <Cell key={x.label} fill={colors[i % colors.length]}/>
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle}/>
                        <Legend/>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <AnalyticsEmpty title="No status data available" detail="This domain has no status dimension, or no status records matched the selected filters."/>
                  )}
                </ChartPanel>
              </div>
              <div className="grid gap-6 xl:grid-cols-2">
                <ChartPanel title="Category distribution">
                  {categoryData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                        <XAxis dataKey="label" stroke="#94a3b8"/>
                        <YAxis stroke="#94a3b8"/>
                        <Tooltip contentStyle={tooltipStyle} formatter={v => formatMoney(Number(v))}/>
                        <Bar dataKey="amount" fill="#34d399"/>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <AnalyticsEmpty title="No category data available" detail="This domain has no category dimension, or no category records matched the selected filters."/>
                  )}
                </ChartPanel>
                {definition.property && (
                  <ChartPanel title="Top properties" subtitle="Highest to lowest value in the selected range">
                    {propertyData.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={propertyData.slice(0, 10)} layout="vertical">
                          <XAxis type="number" stroke="#94a3b8"/>
                          <YAxis type="category" dataKey="propertyName" width={110} stroke="#94a3b8"/>
                          <Tooltip contentStyle={tooltipStyle} formatter={v => formatMoney(Number(v))}/>
                          <Bar dataKey="totalAmount" name="Total Amount" fill="#a78bfa"/>
                          <Bar dataKey="rentAmount" name="Rent Amount" fill="#38bdf8"/>
                          <Bar dataKey="billAmount" name="Bill Amount" fill="#34d399"/>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <AnalyticsEmpty title="No property records matched" detail="Try another date range or choose all accessible properties."/>
                    )}
                  </ChartPanel>
                )}
              </div>

              {/* Property comparison and drill-down with Rent and Bill amounts */}
              {definition.property && propertyData.length > 0 && (
                <section className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
                  <h2 className="text-lg font-semibold">Property comparison and drill-down</h2>
                  <p className="mt-1 text-sm text-slate-400">Showing Rent Invoice and Bill Invoice amounts by property</p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-slate-400">
                        <tr>
                          <th className="p-3">Property</th>
                          <th className="p-3 text-right">Rent Invoices</th>
                          <th className="p-3 text-right">Bill Invoices</th>
                          <th className="p-3 text-right">Total Amount</th>
                          <th className="p-3 text-right">Total Records</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {propertyData.map((row: any) => {
                          const propertyName = row.propertyName || 'Unknown Property';
                          const rentAmount = row.rentAmount || 0;
                          const billAmount = row.billAmount || 0;
                          const totalAmount = row.totalAmount || 0;
                          const totalCount = row.totalCount || 0;
                          const propertyId = row.propertyId || 'unknown';
                          
                          return (
                            <tr key={propertyId} className="border-t border-slate-700 hover:bg-slate-700/40">
                              <td className="p-3 font-medium">{propertyName}</td>
                              <td className="p-3 text-right text-sky-400">{formatMoney(rentAmount)}</td>
                              <td className="p-3 text-right text-emerald-400">{formatMoney(billAmount)}</td>
                              <td className="p-3 text-right font-bold text-white">{formatMoney(totalAmount)}</td>
                              <td className="p-3 text-right">{totalCount}</td>
                              <td className="p-3 text-right">
                                <Link className="text-sky-300 hover:underline" href={`/properties/${propertyId}`}>Open property</Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {propertyData.length > 0 && (
                    <p className="mt-3 text-xs text-slate-400">
                      Top property by total amount: {propertyData[0]?.propertyName || 'N/A'} · Bottom: {propertyData[propertyData.length - 1]?.propertyName || 'N/A'}
                    </p>
                  )}
                </section>
              )}
              <Freshness generatedAt={response.meta.generatedAt} definition={response.meta.definitionsVersion}/>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}