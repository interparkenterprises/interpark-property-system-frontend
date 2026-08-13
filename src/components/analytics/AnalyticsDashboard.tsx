'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { propertiesAPI } from '@/lib/api';
import { analyticsAPI, toAnalyticsApiFailure } from '@/lib/analyticsApi';
import type { Property } from '@/types';
import type {
  AnalyticsApiFailure, AnalyticsFilters as FilterValues, AnalyticsMeta, AnalyticsOverview,
  CollectionTrendPoint, OccupancySummary, PropertyRevenue, ReceivablesStatusDistribution,
  ReceivablesSummary, ReceivablesTrendPoint, TenantsSummary
} from '@/types/analytics';
import { AnalyticsFilters } from './AnalyticsFilters';
import { AnalyticsPageHeader } from './AnalyticsNavigation';
import { AnalyticsError, AnalyticsLoading, AnalyticsUnauthorized } from './AnalyticsStates';
import {
  ChartPanel, CollectionsTrendChart, DataQualityNotices, exactMoneyTitle, formatCompactMoney, formatPercent,
  Freshness, KpiCard, ReceivablesTrendChart, RevenueByPropertyChart, RevenueTable,
  StatusDistributionChart
} from './AnalyticsWidgets';

type Mode = 'overview' | 'rent' | 'occupancy';

interface DashboardData {
  overview?: AnalyticsOverview;
  receivables?: ReceivablesSummary;
  occupancy?: OccupancySummary;
  tenants?: TenantsSummary;
  collections?: CollectionTrendPoint[];
  receivablesTrend?: ReceivablesTrendPoint[];
  status?: ReceivablesStatusDistribution;
  revenue?: PropertyRevenue[];
  meta: AnalyticsMeta[];
}

const dateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const initialFilters = (): FilterValues => {
  const now = new Date();
  return { 
    dateFrom: dateString(new Date(now.getFullYear(), now.getMonth(), 1)), 
    dateTo: dateString(now), 
    asOf: dateString(now), 
    grain: 'month' 
  };
};

export default function AnalyticsDashboard({ mode }: { mode: Mode }) {
  const auth = useAuth();
  const [draftFilters, setDraftFilters] = useState<FilterValues>(initialFilters);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [properties, setProperties] = useState<Property[]>([]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AnalyticsApiFailure | null>(null);

  const canPayments = auth.isAdmin || auth.isManager || auth.hasPermission('VIEW_PAYMENT_REPORTS');
  const canArrears = auth.isAdmin || auth.isManager || auth.hasPermission('VIEW_ARREARS');
  const canUnits = auth.isAdmin || auth.isManager || auth.hasPermission('VIEW_UNITS');
  const canTenants = auth.isAdmin || auth.isManager || auth.hasPermission('VIEW_TENANTS');
  const authorized = mode === 'rent' ? canPayments && canArrears : mode === 'occupancy' ? canUnits && canTenants : canPayments && canArrears && canUnits && canTenants;

  useEffect(() => {
    if (!authorized) return;
    propertiesAPI.getAll().then(result => setProperties(Array.isArray(result) ? result : [])).catch(() => setProperties([]));
  }, [authorized]);

  const load = useCallback(async () => {
    if (!authorized) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      if (mode === 'occupancy') {
        const [occupancy, tenants] = await Promise.all([
          analyticsAPI.getOccupancySummary(filters), 
          analyticsAPI.getTenantsSummary(filters)
        ]);
        setData({ 
          occupancy: occupancy.data, 
          tenants: tenants.data, 
          meta: [occupancy.meta, tenants.meta] 
        });
      } else {
        // For overview and rent modes - use the new comprehensive endpoints
        if (mode === 'overview') {
          const overviewData = await analyticsAPI.getOverview(filters);
          // Also fetch additional data for charts
          const [collections, receivablesTrend, status, revenue] = await Promise.all([
            analyticsAPI.getCollectionsTrend(filters),
            analyticsAPI.getReceivablesTrend(filters),
            analyticsAPI.getStatusDistribution(filters),
            analyticsAPI.getRevenueByProperty(filters)
          ]);
          setData({
            overview: overviewData.data,
            collections: collections.data.series,
            receivablesTrend: receivablesTrend.data.series,
            status: status.data,
            revenue: revenue.data.properties,
            meta: [overviewData.meta, collections.meta, receivablesTrend.meta, status.meta, revenue.meta]
          });
        } else {
          // Rent mode - use rent invoice analytics
          const [rentData, collections, receivablesTrend, status, revenue] = await Promise.all([
            analyticsAPI.getRentInvoiceAnalytics(filters),
            analyticsAPI.getCollectionsTrend(filters),
            analyticsAPI.getReceivablesTrend(filters),
            analyticsAPI.getStatusDistribution(filters),
            analyticsAPI.getRevenueByProperty(filters)
          ]);
          setData({
            receivables: rentData.data.summary,
            collections: collections.data.series,
            receivablesTrend: receivablesTrend.data.series,
            status: rentData.data.statusDistribution || status.data,
            revenue: revenue.data.properties,
            meta: [rentData.meta, collections.meta, receivablesTrend.meta, status.meta, revenue.meta]
          });
        }
      }
    } catch (requestError) {
      setData(null); 
      setError(toAnalyticsApiFailure(requestError));
    } finally { 
      setLoading(false); 
    }
  }, [authorized, filters, mode]);

  useEffect(() => { load(); }, [load]);

  const summary = data?.overview?.receivables || data?.receivables;
  const occupancy = data?.overview?.occupancy || data?.occupancy;
  const tenants = data?.overview?.tenants || data?.tenants;
  const title = mode === 'rent' ? 'Rent analytics' : mode === 'occupancy' ? 'Occupancy analytics' : 'Analytics overview';
  const description = mode === 'rent' ? 'Invoice-based receivables and recorded cash collections.' : mode === 'occupancy' ? 'Current occupied and vacant unit snapshot.' : 'Reliable existing-data metrics across rent and occupancy.';
  const hasFinancialRecords = Boolean(summary && (summary.invoiceCount > 0 || summary.openInvoiceCount > 0));
  const meta = data?.meta[0];
  const notices = useMemo(() => data?.meta.map(item => item.dataQuality) || [], [data]);

  return (
    <div className="space-y-6 text-white">
      <AnalyticsPageHeader title={title} description={description} />
      {!authorized ? (
        <AnalyticsUnauthorized detail="This view requires the matching payment, arrears, unit, and tenant permissions enforced by the analytics API." />
      ) : (
        <>
          <AnalyticsFilters 
            value={draftFilters} 
            properties={properties} 
            disabled={loading} 
            onChange={setDraftFilters} 
            onApply={() => setFilters({ ...draftFilters, asOf: draftFilters.dateTo ?? dateString(new Date()) })} 
          />
          {loading ? (
            <AnalyticsLoading />
          ) : error ? (
            <AnalyticsError message={error.message} backendUnavailable={error.backendUnavailable} retry={load} />
          ) : data ? (
            <>
              {notices.length > 0 && <DataQualityNotices values={notices} />}
              {mode !== 'occupancy' && summary && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard label="Billed rent account" value={formatCompactMoney(summary.billed)} fullValueTitle={exactMoneyTitle(summary.billed)} detail={`${summary.invoiceCount} invoice(s) due in range`} tone="sky" />
                  <KpiCard label="Allocated rent-account collections" value={formatCompactMoney(summary.paid)} fullValueTitle={exactMoneyTitle(summary.paid)} detail="Invoice amountPaid; not cash-date totals" tone="emerald" />
                  <KpiCard label="Invoice collection rate" value={formatPercent(summary.collectionRate)} detail="Allocated collections ÷ billed" tone="amber" />
                  <KpiCard label="Outstanding rent" value={formatCompactMoney(summary.outstanding)} fullValueTitle={exactMoneyTitle(summary.outstanding)} detail={`${summary.openInvoiceCount} open invoice(s)`} tone="rose" />
                  <KpiCard label="Rent arrears" value={formatCompactMoney(summary.arrears)} fullValueTitle={exactMoneyTitle(summary.arrears)} detail={`Positive balances past due as of ${filters.asOf}`} tone="rose" />
                </div>
              )}
              {(mode === 'overview' || mode === 'occupancy') && occupancy && tenants && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard label="Current occupancy rate" value={formatPercent(occupancy.occupancyRate)} detail={`${occupancy.totalUnits} current unit(s)`} tone="sky" />
                  <KpiCard label="Occupied units" value={occupancy.occupiedUnits.toLocaleString()} href="/properties" tone="emerald" />
                  <KpiCard label="Vacant units" value={occupancy.vacantUnits.toLocaleString()} href="/properties" tone="amber" />
                  <KpiCard label="Current tenant records" value={tenants.currentTenants.toLocaleString()} href="/properties" tone="sky" />
                </div>
              )}
              {mode !== 'occupancy' && data.collections && data.receivablesTrend && data.status && (
                <div className="grid gap-6 xl:grid-cols-2">
                  <ChartPanel title="Recorded collection trend" subtitle="PaymentReport cash by datePaid; credit and prepaid rows excluded">
                    <CollectionsTrendChart data={data.collections} />
                  </ChartPanel>
                  <ChartPanel title="Receivables trend" subtitle="Invoice values grouped by due date">
                    <ReceivablesTrendChart data={data.receivablesTrend} />
                  </ChartPanel>
                  <ChartPanel title="Paid, partial and unpaid invoices" subtitle="Invoice counts; cancelled invoices excluded">
                    <StatusDistributionChart data={data.status} />
                  </ChartPanel>
                  <ChartPanel title="Allocated collections by property" subtitle="Top properties ranked by Invoice.amountPaid">
                    <RevenueByPropertyChart data={data.revenue || []} />
                  </ChartPanel>
                </div>
              )}
              {mode !== 'occupancy' && data.revenue && (
                <section className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5 shadow-xl">
                  <div className="mb-4 flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-sky-400" />
                    <div>
                      <h2 className="text-lg font-semibold">Revenue by property</h2>
                      <p className="text-sm text-slate-400">Backend-calculated invoice metrics for the active scope.</p>
                    </div>
                  </div>
                  <RevenueTable data={data.revenue} />
                </section>
              )}
              {mode !== 'occupancy' && !hasFinancialRecords && !data.collections?.length && !data.revenue?.length && (
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-slate-300">
                  No supported financial records matched this range. Values above are supported empty-dataset results, not placeholders.
                </div>
              )}
              {meta && <Freshness generatedAt={meta.generatedAt} definition={meta.definitionsVersion} />}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}