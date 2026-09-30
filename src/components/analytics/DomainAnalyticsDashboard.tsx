'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { propertiesAPI } from '@/lib/api';
import { analyticsAPI, toAnalyticsApiFailure } from '@/lib/analyticsApi';
import type { Property } from '@/types';
import type {
  AnalyticsApiFailure, AnalyticsFilters as Filters, AnalyticsMeta, AgingBucket,
  BillInvoiceSummary, DomainDistributionItem, DomainPropertyPoint,
  DomainTrendPoint, InvoicePerformanceMetrics, RentInvoiceSummary, TenantLifecycleAnalytics,
} from '@/types/analytics';
import { AnalyticsFilters } from './AnalyticsFilters';
import { AnalyticsPageHeader } from './AnalyticsNavigation';
import { AnalyticsEmpty, AnalyticsError, AnalyticsLoading, AnalyticsUnauthorized } from './AnalyticsStates';
import {
  ChartPanel, DataQualityNotices, DomainDonut, exactMoneyTitle, Explain, formatCompactMoney,
  formatMoney, formatNumber, formatPercent, Freshness, KpiCard,
} from './AnalyticsWidgets';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

type Domain = 'bill-invoices' | 'service-providers' | 'commissions' | 'demand-letters' | 'tenants' | 'other-income' | 'employees' | 'invoices';

interface DomainConfig {
  title: string;
  apiMethod: keyof typeof analyticsAPI;
  property: boolean;
  permission?: string;
  roles?: boolean;
  drill: string;
  labels: Record<string, string>;
  isComprehensive?: boolean;
  hasLifecycle?: boolean;
  blurb: string;
}

const config: Record<Domain, DomainConfig> = {
  invoices: {
    title: 'Comprehensive Invoice Analytics',
    apiMethod: 'getComprehensiveInvoiceAnalytics',
    property: true, permission: 'VIEW_PAYMENT_REPORTS', drill: '/properties', isComprehensive: true,
    blurb: 'Rent and bill invoices in one view: totals, collection performance, aging buckets, and per-property breakdowns.',
    labels: {
      totalInvoices: 'Total Invoices', totalAmount: 'Total Amount', totalPaid: 'Total Paid',
      totalOutstanding: 'Total Outstanding', totalOverdue: 'Total Overdue', overallCollectionRate: 'Overall Collection Rate',
    },
  },
  'bill-invoices': {
    title: 'Bill invoice analytics',
    apiMethod: 'getBillInvoiceAnalytics',
    property: true, permission: 'VIEW_BILL_INVOICES', drill: '/properties',
    blurb: 'Utility and service bill invoices. Overdue bill balances are utility receivables — not rent arrears.',
    labels: {
      invoiceCount: 'Bill invoices', billed: 'Total billed', paid: 'Amount paid', outstanding: 'Outstanding',
      overdueBillBalance: 'Overdue bill balance', collectionRate: 'Collection rate',
    },
  },
  'service-providers': {
    title: 'Service provider analytics',
    apiMethod: 'getServiceProviderAnalytics',
    property: true, permission: 'VIEW_SERVICE_PROVIDERS', drill: '/properties',
    blurb: 'Contracted charges per provider. These are configured contract values, not invoices, payments, or actual expenses.',
    labels: { providerCount: 'Providers', contractedCharges: 'Contracted charges', averageContractedCharge: 'Average contracted charge' },
  },
  commissions: {
    title: 'Commission analytics',
    apiMethod: 'getCommissionAnalytics',
    property: true, permission: 'VIEW_COMMISSIONS', drill: '/myIncome',
    blurb: 'Commission accruals and payouts. “Pending / processing” is earned but not yet paid out.',
    labels: { commissionCount: 'Commissions', totalCommission: 'Total commission', paidCommission: 'Paid commission', pendingCommission: 'Pending / processing' },
  },
  'demand-letters': {
    title: 'Demand letter analytics',
    apiMethod: 'getDemandLetterAnalytics',
    property: true, permission: 'VIEW_DEMAND_LETTERS', drill: '/payments',
    blurb: 'Demand-letter activity. Amounts are document snapshots at issue time — current arrears still come from rent invoices.',
    labels: {
      letterCount: 'Demand letters', documentSnapshotAmount: 'Document snapshot amount',
      partialPaymentRecorded: 'Partial payment recorded', settledCount: 'Settled', escalatedCount: 'Escalated',
    },
  },
  tenants: {
    title: 'Tenant Analytics',
    apiMethod: 'getTenantAnalytics',
    property: true, permission: 'VIEW_TENANTS', drill: '/properties', hasLifecycle: true,
    blurb: 'Tenant base, rent roll and deposits, combined with lifecycle retention, arrears exposure and move-in trends.',
    labels: { currentTenants: 'Current tenants', currentRentRoll: 'Current rent roll', averageRent: 'Average rent', depositsHeld: 'Deposits held' },
  },
  'other-income': {
    title: 'Other income analytics',
    apiMethod: 'getOtherIncomeAnalytics',
    property: false, roles: true, drill: '/myIncome/other',
    blurb: 'Non-rent income documents. “Paid” is the value of documents marked PAID — partial cash collection is unavailable.',
    labels: { invoiceCount: 'Income documents', invoicedAmount: 'Invoiced amount', paidDocumentAmount: 'Paid document value', vatAmount: 'VAT amount' },
  },
  employees: {
    title: 'Employee and salary analytics',
    apiMethod: 'getEmployeeAnalytics',
    property: false, roles: true, drill: '/employees',
    blurb: 'Headcount and salary facts. Configured salaries are not normalized across pay frequencies — treat totals as configured, not annualized.',
    labels: {
      employeeCount: 'Employees', activeEmployees: 'Active employees', configuredSalaryTotal: 'Configured salaries',
      averageConfiguredSalary: 'Average configured salary', salaryPaidInRange: 'Salary paid in range',
    },
  },
};

const moneyKeys = /amount|paid|billed|outstanding|arrears|rent|deposit|salary|commission|charge|total|overdue|collection/i;

const dateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const initial = (): Filters => {
  const now = new Date();
  return { dateFrom: dateString(new Date(now.getFullYear(), now.getMonth() - 5, 1)), dateTo: dateString(now), asOf: dateString(now), grain: 'month' };
};

const tooltipStyle = { background: '#0f172a', border: '1px solid #475569', borderRadius: 10, color: '#fff', fontSize: 12 };
const axisStroke = '#94a3b8';

// ========== RESPONSE SHAPES ==========
// Local structural types for the fields this dashboard reads, so we avoid `any`
// while staying compatible with every domain endpoint's response.

interface StatusDistributionShape { count?: number; paidAmount?: number; unpaidAmount?: number; totalDue?: number; amount?: number }

interface ComprehensiveShape {
  summary: Record<string, unknown> & {
    rentInvoices?: RentInvoiceSummary;
    billInvoices?: BillInvoiceSummary;
  };
  performance?: InvoicePerformanceMetrics;
  aging?: { rentInvoices: AgingBucket[]; billInvoices: AgingBucket[]; combined: AgingBucket[] };
  rentInvoices?: {
    byStatus: Record<string, StatusDistributionShape>;
    trend: DomainTrendPoint[];
    byProperty: DomainPropertyPoint[];
  };
  billInvoices?: {
    byStatus: DomainDistributionItem[];
    byType: DomainDistributionItem[];
    trend: DomainTrendPoint[];
    byProperty: DomainPropertyPoint[];
  };
  trend?: DomainTrendPoint[];
  statusDistribution?: DomainDistributionItem[];
  categoryDistribution?: DomainDistributionItem[];
  scope?: string;
}

interface DashboardShape {
  summary: Record<string, unknown>;
  trend?: DomainTrendPoint[];
  byProperty?: DomainPropertyPoint[] | null;
  statusDistribution?: DomainDistributionItem[];
  categoryDistribution?: DomainDistributionItem[];
  scope?: string;
  rentInvoices?: ComprehensiveShape['rentInvoices'];
  billInvoices?: ComprehensiveShape['billInvoices'];
  performance?: InvoicePerformanceMetrics;
  aging?: ComprehensiveShape['aging'];
}

interface LifecycleView {
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
  payingTenants: number;
  averageInvoiceBalance: number | null;
  newTenantsTrend: DomainTrendPoint[];
}

// ========== EXTRACTION HELPERS ==========

const extractTrendData = (data: DashboardShape | null): DomainTrendPoint[] => {
  if (!data) return [];
  if (data.rentInvoices?.trend?.length) return data.rentInvoices.trend;
  if (data.billInvoices?.trend?.length) return data.billInvoices.trend;
  return data.trend ?? [];
};

const extractStatusDistribution = (data: DashboardShape | null): DomainDistributionItem[] => {
  if (!data) return [];
  if (data.rentInvoices?.byStatus) {
    return Object.entries(data.rentInvoices.byStatus).map(([key, value]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      count: value.count ?? 0,
      amount: value.amount ?? value.paidAmount ?? value.unpaidAmount ?? value.totalDue ?? 0,
    }));
  }
  if (data.billInvoices?.byStatus?.length) return data.billInvoices.byStatus;
  return data.statusDistribution ?? [];
};

const extractCategoryDistribution = (data: DashboardShape | null): DomainDistributionItem[] => {
  if (!data) return [];
  if (data.billInvoices?.byType?.length) return data.billInvoices.byType;
  return data.categoryDistribution ?? [];
};

interface PropertyBreakdownRow {
  propertyId: string;
  propertyName: string;
  rentAmount: number;
  rentCount: number;
  billAmount: number;
  billCount: number;
  totalAmount: number;
  totalCount: number;
}

/** Merges rent-invoice and bill-invoice per-property rows into one comparison set. */
const extractPropertyBreakdown = (data: DashboardShape | null): PropertyBreakdownRow[] => {
  if (!data) return [];
  const propertyMap = new Map<string, PropertyBreakdownRow>();
  const ensure = (id: string, name: string): PropertyBreakdownRow => {
    let row = propertyMap.get(id);
    if (!row) {
      row = { propertyId: id, propertyName: name, rentAmount: 0, rentCount: 0, billAmount: 0, billCount: 0, totalAmount: 0, totalCount: 0 };
      propertyMap.set(id, row);
    }
    return row;
  };
  const merge = (items: DomainPropertyPoint[] | undefined, kind: 'rent' | 'bill') => {
    items?.forEach(item => {
      const id = item.propertyId;
      if (!id) return;
      const row = ensure(id, item.propertyName || 'Unknown Property');
      if (kind === 'rent') { row.rentAmount += item.amount ?? 0; row.rentCount += item.count ?? 0; }
      else { row.billAmount += item.amount ?? 0; row.billCount += item.count ?? 0; }
    });
  };
  merge(data.rentInvoices?.byProperty, 'rent');
  merge(data.billInvoices?.byProperty, 'bill');
  merge(data.byProperty ?? undefined, 'rent');

  return Array.from(propertyMap.values())
    .map(row => ({ ...row, totalAmount: row.rentAmount + row.billAmount, totalCount: row.rentCount + row.billCount }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
};

const toLifecycleView = (data: TenantLifecycleAnalytics | null): LifecycleView | null => {
  if (!data?.summary) return null;
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
  };
};

export default function DomainAnalyticsDashboard({ domain }: { domain: Domain }) {
  const definition = config[domain];
  const auth = useAuth();
  const authorized = definition.roles
    ? auth.isAdmin || auth.isManager
    : auth.isAdmin || auth.isManager || auth.hasPermission(definition.permission || '');

  const [draft, setDraft] = useState<Filters>(initial);
  const [filters, setFilters] = useState<Filters>(initial);
  const [properties, setProperties] = useState<Property[]>([]);
  const [response, setResponse] = useState<{ data: DashboardShape; meta: AnalyticsMeta } | null>(null);
  const [lifecycleData, setLifecycleData] = useState<TenantLifecycleAnalytics | null>(null);
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
    if (!authorized) { setLoading(false); return; }
    setLoading(true); setError(null);
    const scoped = definition.property ? filters : { ...filters, propertyId: undefined, landlordId: undefined };
    try {
      if (domain === 'tenants' && definition.hasLifecycle) {
        const [insightsResult, lifecycleResult] = await Promise.all([
          analyticsAPI.getTenantAnalytics(scoped),
          analyticsAPI.getTenantLifecycleAnalytics(scoped),
        ]);
        setResponse({ data: insightsResult.data as DashboardShape, meta: insightsResult.meta });
        setLifecycleData(lifecycleResult.data);
      } else {
        const apiFn = analyticsAPI[definition.apiMethod] as (f: Filters) => Promise<{ data: unknown; meta: AnalyticsMeta }>;
        const result = await apiFn(scoped);
        setResponse({ data: result.data as DashboardShape, meta: result.meta });
        setLifecycleData(null);
      }
    } catch (e) {
      setResponse(null);
      setLifecycleData(null);
      setError(toAnalyticsApiFailure(e));
    } finally {
      setLoading(false);
    }
  }, [authorized, definition, domain, filters]);

  useEffect(() => { load(); }, [load]);

  const summary = response?.data.summary ?? {};
  const trendData = useMemo(() => extractTrendData(response?.data ?? null), [response]);
  const statusData = useMemo(() => extractStatusDistribution(response?.data ?? null), [response]);
  const categoryData = useMemo(() => extractCategoryDistribution(response?.data ?? null), [response]);
  const propertyData = useMemo(() => extractPropertyBreakdown(response?.data ?? null), [response]);
  const compSummary = response?.data.summary as ComprehensiveShape['summary'] | undefined;
  const rentInvoiceSummary = compSummary?.rentInvoices ?? null;
  const billInvoiceSummary = compSummary?.billInvoices ?? null;
  const performance = response?.data.performance;
  const aging = response?.data.aging;
  const lifecycle = useMemo(() => toLifecycleView(lifecycleData), [lifecycleData]);

  return (
    <div className="space-y-6 text-white">
      <AnalyticsPageHeader
        title={definition.title}
        description={`${definition.blurb} ${definition.property ? 'Restricted to accessible properties.' : `Shown at ${response?.data.scope?.toLowerCase() || 'authorized'} scope; no property attribution is inferred.`}`}
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
              propertyId: definition.property ? draft.propertyId : undefined,
            })}
          />
          {loading ? (
            <AnalyticsLoading />
          ) : error ? (
            <AnalyticsError message={error.message} backendUnavailable={error.backendUnavailable} retry={load} />
          ) : response ? (
            <>
              <DataQualityNotices values={[response.meta.dataQuality]} />

              {/* Summary KPIs — scalar summary fields only */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Object.entries(summary).map(([key, raw]) => {
                  if (typeof raw === 'object' && raw !== null) return null;
                  const value = (raw as number | null | undefined) ?? null;
                  const monetary = moneyKeys.test(key);
                  return (
                    <KpiCard
                      key={key}
                      label={definition.labels[key] || key.replace(/([A-Z])/g, ' $1').trim()}
                      value={monetary ? formatCompactMoney(value) : value == null ? 'Not available' : Number(value).toLocaleString('en-KE')}
                      fullValueTitle={monetary ? exactMoneyTitle(value) : undefined}
                      href={definition.drill}
                    />
                  );
                })}
              </div>

              {/* Tenant lifecycle section */}
              {domain === 'tenants' && lifecycle && (
                <>
                  <h2 className="text-xl font-semibold text-white">Tenant lifecycle overview</h2>
                  <Explain title="Reading the lifecycle numbers">
                    Retention is shown two ways: <strong className="text-slate-300">cumulative</strong> covers every tenant
                    record ever, while <strong className="text-slate-300">period</strong> covers only the selected window.
                    “Paying tenants” have recorded payments; “tenants with arrears” currently hold a past-due balance.
                  </Explain>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard label="Total tenants" value={lifecycle.summary.totalTenants.toLocaleString()} detail="All tenant records" tone="sky" />
                    <KpiCard label="Active tenants" value={lifecycle.summary.activeTenants.toLocaleString()} detail="Currently active" tone="emerald" />
                    <KpiCard label="Churned tenants" value={lifecycle.summary.churnedTenants.toLocaleString()} detail="No longer active" tone="rose" />
                    <KpiCard label="Retention rate" value={formatPercent(lifecycle.summary.cumulativeRetentionRate)} detail="Cumulative (lifetime)" tone="amber"
                      tooltip={`Period retention for this window: ${formatPercent(lifecycle.summary.periodRetentionRate)}`} />
                    <KpiCard label="Average rent" value={formatCompactMoney(lifecycle.summary.averageRent)} detail={`Avg tenure ${lifecycle.summary.averageTenureDays ?? '—'} days`} tone="sky" />
                    <KpiCard label="Total deposits" value={formatCompactMoney(lifecycle.summary.totalDeposits)} detail="All deposits held" tone="emerald" />
                    <KpiCard label="Tenants with arrears" value={lifecycle.tenantsWithArrears.toLocaleString()} detail="Currently past due" tone="rose" />
                    <KpiCard label="Paying tenants" value={lifecycle.payingTenants.toLocaleString()} detail="Have recorded payments" tone="amber" />
                    <KpiCard label="Average invoice balance" value={formatCompactMoney(lifecycle.averageInvoiceBalance)} detail="Across arrears holders" tone="sky" />
                  </div>

                  {lifecycle.newTenantsTrend.length > 0 && (
                    <ChartPanel title="New tenants trend" subtitle="Tenant additions per period">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lifecycle.newTenantsTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="period" stroke={axisStroke} tick={{ fontSize: 12 }} tickLine={false} />
                          <YAxis stroke={axisStroke} tick={{ fontSize: 12 }} allowDecimals={false} tickLine={false} width={40} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatNumber(Number(value))} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                          <Bar dataKey="count" name="New tenants" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartPanel>
                  )}
                </>
              )}

              {/* Rent vs bill breakdown (comprehensive invoices) */}
              {definition.isComprehensive && (rentInvoiceSummary || billInvoiceSummary) && (
                <>
                  <h2 className="text-xl font-semibold text-white">Rent vs bill invoice breakdown</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InvoiceSummaryCard
                      title="Rent invoices" toneClass="border-sky-500/30 bg-sky-950/20" headingClass="text-sky-400"
                      data={rentInvoiceSummary}
                    />
                    <InvoiceSummaryCard
                      title="Bill invoices" toneClass="border-emerald-500/30 bg-emerald-950/20" headingClass="text-emerald-400"
                      data={billInvoiceSummary}
                    />
                  </div>
                </>
              )}

              {/* Performance metrics */}
              {performance && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard label="Avg days to pay" value={performance.paymentVelocity.overall != null ? `${performance.paymentVelocity.overall} days` : 'N/A'}
                    detail="Overall payment velocity" tone="sky"
                    tooltip="Average days between invoice issue and full payment. Lower is better cash flow." />
                  <KpiCard label="On-time payment rate" value={formatPercent(performance.onTimePaymentRate.rentInvoices)}
                    detail="Rent invoices paid on time" tone="emerald" />
                  <KpiCard label="Avg rent invoice" value={formatCompactMoney(performance.averageInvoiceAmount.rentInvoices)} detail="Average amount" tone="amber" />
                  {performance.averageInvoiceAmount.billInvoices != null && (
                    <KpiCard label="Avg bill invoice" value={formatCompactMoney(performance.averageInvoiceAmount.billInvoices)} detail="Average amount" tone="rose" />
                  )}
                </div>
              )}

              {/* Aging buckets */}
              {aging?.combined?.length ? (
                <section className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5 shadow-xl">
                  <h2 className="flex items-center text-lg font-semibold text-white">Aging summary</h2>
                  <p className="mt-1 text-sm text-slate-400">How long outstanding balances have been unpaid — older buckets need faster follow-up.</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-5">
                    {aging.combined.map(bucket => (
                      <div key={bucket.label} className="rounded-lg border border-slate-600 bg-slate-900/50 p-3 text-center">
                        <p className="text-sm text-slate-400">{bucket.label}</p>
                        <p className="text-lg font-bold text-white">{formatCompactMoney(bucket.amount)}</p>
                        <p className="text-xs text-slate-400">{bucket.count} invoice(s)</p>
                      </div>
                    ))}
                  </div>
                  {aging.rentInvoices?.length ? (
                    <div className="mt-4">
                      <p className="text-sm text-slate-400">Rent aging</p>
                      <div className="mt-2 grid grid-cols-5 gap-2">
                        {aging.rentInvoices.map(bucket => (
                          <div key={bucket.label} className="rounded bg-slate-900/30 p-2 text-center">
                            <p className="text-xs text-slate-400">{bucket.label}</p>
                            <p className="text-sm font-semibold text-sky-400">{formatCompactMoney(bucket.amount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {aging.billInvoices?.length ? (
                    <div className="mt-4">
                      <p className="text-sm text-slate-400">Bill aging</p>
                      <div className="mt-2 grid grid-cols-5 gap-2">
                        {aging.billInvoices.map(bucket => (
                          <div key={bucket.label} className="rounded bg-slate-900/30 p-2 text-center">
                            <p className="text-xs text-slate-400">{bucket.label}</p>
                            <p className="text-sm font-semibold text-emerald-400">{formatCompactMoney(bucket.amount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              <div className="grid gap-6 xl:grid-cols-2">
                <ChartPanel title="Trend" subtitle="Values grouped by the selected date grain">
                  {trendData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="period" stroke={axisStroke} tick={{ fontSize: 12 }} tickLine={false} />
                        <YAxis stroke={axisStroke} tick={{ fontSize: 12 }} tickLine={false} width={58} />
                        <Tooltip contentStyle={tooltipStyle} formatter={v => formatMoney(Number(v))} />
                        <Line dataKey="amount" name="Amount" stroke="#38bdf8" strokeWidth={3} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <AnalyticsEmpty title="No data for selected period" detail="No records matched the selected date and property filters." />
                  )}
                </ChartPanel>
                <ChartPanel title="Status distribution" subtitle="Counts by record status">
                  {statusData.length ? <DomainDonut data={statusData} centerLabel="records" /> : (
                    <AnalyticsEmpty title="No status data available" detail="This domain has no status dimension, or no status records matched the selected filters." />
                  )}
                </ChartPanel>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <ChartPanel title="Category distribution" subtitle="Amounts by category">
                  {categoryData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="label" stroke={axisStroke} tick={{ fontSize: 12 }} tickLine={false} />
                        <YAxis stroke={axisStroke} tick={{ fontSize: 12 }} tickLine={false} width={58} />
                        <Tooltip contentStyle={tooltipStyle} formatter={v => formatMoney(Number(v))} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                        <Bar dataKey="amount" name="Amount" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <AnalyticsEmpty title="No category data available" detail="This domain has no category dimension, or no category records matched the selected filters." />
                  )}
                </ChartPanel>
                {definition.property && (
                  <ChartPanel title="Top properties" subtitle="Highest to lowest value in the selected range">
                    {propertyData.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={propertyData.slice(0, 10)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                          <XAxis type="number" stroke={axisStroke} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="propertyName" width={110} stroke={axisStroke} tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={tooltipStyle} formatter={v => formatMoney(Number(v))} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                          <Bar dataKey="totalAmount" name="Total amount" fill="#a78bfa" radius={[0, 5, 5, 0]} maxBarSize={16} />
                          <Bar dataKey="rentAmount" name="Rent amount" fill="#38bdf8" radius={[0, 5, 5, 0]} maxBarSize={16} />
                          <Bar dataKey="billAmount" name="Bill amount" fill="#34d399" radius={[0, 5, 5, 0]} maxBarSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <AnalyticsEmpty title="No property records matched" detail="Try another date range or choose all accessible properties." />
                    )}
                  </ChartPanel>
                )}
              </div>

              {definition.property && propertyData.length > 0 && (
                <section className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
                  <h2 className="text-lg font-semibold">Property comparison and drill-down</h2>
                  <p className="mt-1 text-sm text-slate-400">Rent invoice and bill invoice amounts by property</p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-slate-400">
                        <tr>
                          <th className="p-3">Property</th><th className="p-3 text-right">Invoice amount</th>
                          <th className="p-3 text-right">Bill amount</th><th className="p-3 text-right">Total amount</th>
                          <th className="p-3 text-right">Total records</th><th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {propertyData.map(row => (
                          <tr key={row.propertyId} className="border-t border-slate-700 hover:bg-slate-700/40">
                            <td className="p-3 font-medium">{row.propertyName}</td>
                            <td className="p-3 text-right text-sky-400">{formatMoney(row.rentAmount)}</td>
                            <td className="p-3 text-right text-emerald-400">{formatMoney(row.billAmount)}</td>
                            <td className="p-3 text-right font-bold text-white">{formatMoney(row.totalAmount)}</td>
                            <td className="p-3 text-right">{row.totalCount}</td>
                            <td className="p-3 text-right">
                              <Link className="text-sky-300 hover:underline" href={`/properties/${row.propertyId}`}>Open property</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    Top property by total amount: {propertyData[0]?.propertyName ?? 'N/A'} · Bottom: {propertyData[propertyData.length - 1]?.propertyName ?? 'N/A'}
                  </p>
                </section>
              )}
              <Freshness generatedAt={response.meta.generatedAt} definition={response.meta.definitionsVersion} />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

function InvoiceSummaryCard({ title, toneClass, headingClass, data }: {
  title: string;
  toneClass: string;
  headingClass: string;
  data: RentInvoiceSummary | BillInvoiceSummary | null;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-xl ${toneClass}`}>
      <h3 className={`text-lg font-semibold ${headingClass}`}>{title}</h3>
      {data ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div><p className="text-sm text-slate-400">Count</p><p className="text-xl font-bold text-white">{data.count}</p></div>
          <div><p className="text-sm text-slate-400">Amount</p><p className="text-xl font-bold text-white">{formatCompactMoney(data.amount)}</p></div>
          <div><p className="text-sm text-slate-400">Paid</p><p className="text-xl font-bold text-emerald-400">{formatCompactMoney(data.paid)}</p></div>
          <div><p className="text-sm text-slate-400">Outstanding</p><p className="text-xl font-bold text-amber-400">{formatCompactMoney(data.outstanding)}</p></div>
          <div><p className="text-sm text-slate-400">Overdue</p><p className="text-xl font-bold text-rose-400">{formatCompactMoney(data.overdue)}</p></div>
          <div><p className="text-sm text-slate-400">Collection rate</p><p className="text-xl font-bold text-white">{formatPercent(data.collectionRate)}</p></div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">No {title.toLowerCase()} data available</p>
      )}
    </div>
  );
}