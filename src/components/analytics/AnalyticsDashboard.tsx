'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { propertiesAPI } from '@/lib/api';
import { analyticsAPI, toAnalyticsApiFailure } from '@/lib/analyticsApi';
import type { Property } from '@/types';
import type {
  AnalyticsApiFailure, AnalyticsFilters as FilterValues, AnalyticsMeta, AnalyticsOverview,
  CollectionTrendPoint, CohortVsCash, OccupancySummary, PropertyRevenue,
  ReceivablesStatusDistribution, ReceivablesSummary, ReceivablesTrendPoint, TenantsSummary,
} from '@/types/analytics';
import { AnalyticsFilters } from './AnalyticsFilters';
import { AnalyticsPageHeader } from './AnalyticsNavigation';
import { AnalyticsError, AnalyticsLoading, AnalyticsUnauthorized } from './AnalyticsStates';
import {
  ChartPanel, CollectionsTrendChart, CohortVsCashPanel, DataQualityNotices, DefinitionTip,
  exactMoneyTitle, Explain, formatCompactMoney, formatPercent, Freshness, KpiCard,
  LeftReasonChart, ReceivablesTrendChart, RevenueByPropertyChart, RevenueTable, StatusDistributionChart,
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
  cohortCash?: CohortVsCash;
  meta: AnalyticsMeta[];
}

const dateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const initialFilters = (): FilterValues => {
  const now = new Date();
  return {
    dateFrom: dateString(new Date(now.getFullYear(), now.getMonth(), 1)),
    dateTo: dateString(now),
    asOf: dateString(now),
    grain: 'month',
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
  const authorized =
    mode === 'rent'
      ? canPayments && canArrears
      : mode === 'occupancy'
        ? canUnits && canTenants
        : canPayments && canArrears && canUnits && canTenants;

  useEffect(() => {
    if (!authorized) return;
    propertiesAPI
      .getAll()
      .then(result => setProperties(Array.isArray(result) ? result : []))
      .catch(() => setProperties([]));
  }, [authorized]);

  const load = useCallback(async () => {
    if (!authorized) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (mode === 'occupancy') {
        const [occupancy, tenants] = await Promise.all([
          analyticsAPI.getOccupancySummary(filters),
          analyticsAPI.getTenantsSummary(filters),
        ]);
        setData({
          occupancy: occupancy.data,
          tenants: tenants.data,
          meta: [occupancy.meta, tenants.meta],
        });
      } else if (mode === 'overview') {
        const [overviewData, collections, receivablesTrend, status, revenue, cohortCash] = await Promise.all([
          analyticsAPI.getOverview(filters),
          analyticsAPI.getCollectionsTrend(filters),
          analyticsAPI.getReceivablesTrend(filters),
          analyticsAPI.getStatusDistribution(filters),
          analyticsAPI.getRevenueByProperty(filters),
          analyticsAPI.getCohortVsCash(filters),
        ]);
        setData({
          overview: overviewData.data,
          collections: collections.data.series,
          receivablesTrend: receivablesTrend.data.series,
          status: status.data,
          revenue: revenue.data.properties,
          cohortCash: cohortCash.data,
          meta: [overviewData.meta, collections.meta, receivablesTrend.meta, status.meta, revenue.meta, cohortCash.meta],
        });
      } else {
        const [rentData, collections, receivablesTrend, status, revenue, cohortCash] = await Promise.all([
          analyticsAPI.getRentInvoiceAnalytics(filters),
          analyticsAPI.getCollectionsTrend(filters),
          analyticsAPI.getReceivablesTrend(filters),
          analyticsAPI.getStatusDistribution(filters),
          analyticsAPI.getRevenueByProperty(filters),
          analyticsAPI.getCohortVsCash(filters),
        ]);
        setData({
          receivables: rentData.data.summary,
          collections: collections.data.series,
          receivablesTrend: receivablesTrend.data.series,
          status: rentData.data.statusDistribution || status.data,
          revenue: revenue.data.properties,
          cohortCash: cohortCash.data,
          meta: [rentData.meta, collections.meta, receivablesTrend.meta, status.meta, revenue.meta, cohortCash.meta],
        });
      }
    } catch (requestError) {
      setData(null);
      setError(toAnalyticsApiFailure(requestError));
    } finally {
      setLoading(false);
    }
  }, [authorized, filters, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.overview?.receivables || data?.receivables;
  const occupancy = data?.overview?.occupancy || data?.occupancy;

  // The backend now always returns the full tenants block from /overview
  // (same shape as TenantsSummary). The nullish fallbacks below only guard
  // against stale cached responses from before that change.
  const tenants = useMemo<TenantsSummary | undefined>(() => {
    const raw = data?.overview?.tenants || data?.tenants;
    if (!raw) return undefined;
    return {
      currentTenants: raw.currentTenants,
      formerTenants: raw.formerTenants,
      totalTenantsEver: raw.totalTenantsEver,
      churnRate: raw.churnRate ?? null,
      currentRentRoll: raw.currentRentRoll ?? 0,
      averageRent: raw.averageRent ?? 0,
      depositsHeld: raw.depositsHeld ?? 0,
      byLeftReason: raw.byLeftReason ?? {},
    };
  }, [data]);

  const title =
    mode === 'rent' ? 'Rent analytics' : mode === 'occupancy' ? 'Occupancy analytics' : 'Analytics overview';
  const description =
    mode === 'rent'
      ? 'Invoice-based receivables and recorded cash collections for rent invoices.'
      : mode === 'occupancy'
        ? 'Current occupied and vacant unit snapshot with tenant lifecycle.'
        : 'Reliable existing-data metrics across rent receivables, cash, and occupancy.';
  const hasFinancialRecords = Boolean(
    summary && (summary.invoiceCount > 0 || summary.openInvoiceCount > 0),
  );
  const meta = data?.meta[0];
  const definitions = meta?.definitions;
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
            onApply={() =>
              setFilters({ ...draftFilters, asOf: draftFilters.dateTo ?? dateString(new Date()) })
            }
          />
          {loading ? (
            <AnalyticsLoading />
          ) : error ? (
            <AnalyticsError message={error.message} backendUnavailable={error.backendUnavailable} retry={load} />
          ) : data ? (
            <>
              {notices.length > 0 && <DataQualityNotices values={notices} />}

              {mode === 'overview' && (
                <Explain title="How to read this dashboard">
                  <strong className="text-slate-300">Billed</strong> and <strong className="text-slate-300">paid</strong> follow
                  invoices due in the range; <strong className="text-slate-300">recorded collections</strong> follow the date money
                  was received. They answer different questions, so they will not match — the cohort-vs-cash panel below
                  reconciles them. Hover any ℹ icon for the exact backend definition of a metric.
                </Explain>
              )}

              {mode !== 'occupancy' && summary && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <KpiCard
                    label="Billed rent account"
                    value={formatCompactMoney(summary.billed)}
                    fullValueTitle={exactMoneyTitle(summary.billed)}
                    detail={`${summary.invoiceCount} invoice(s) due in range`}
                    tooltip="Invoice totals (incl. VAT where applicable) for invoices whose due date falls inside the selected range. Cancelled invoices are excluded."
                    tone="sky"
                  />
                  <KpiCard
                    label="Allocated collections"
                    value={formatCompactMoney(summary.paid)}
                    fullValueTitle={exactMoneyTitle(summary.paid)}
                    detail="Invoice amountPaid; not cash-date totals"
                    tooltip="Payments allocated to invoices in this due-date cohort. This is not the same as cash received during the period — see the cohort-vs-cash panel."
                    tone="emerald"
                  />
                  <KpiCard
                    label="Invoice collection rate"
                    value={formatPercent(summary.collectionRate)}
                    detail="Allocated collections ÷ billed"
                    tooltip="Allocated collections divided by billed amount for the cohort. Blank when nothing was billed in the range."
                    tone="amber"
                  />
                  <KpiCard
                    label="Outstanding rent"
                    value={formatCompactMoney(summary.outstanding)}
                    fullValueTitle={exactMoneyTitle(summary.outstanding)}
                    detail={`${summary.openInvoiceCount} open invoice(s)`}
                    tooltip="Remaining balance on invoices in the cohort, whether or not they are past due."
                    tone="rose"
                  />
                  <KpiCard
                    label="Rent arrears"
                    value={formatCompactMoney(summary.arrears)}
                    fullValueTitle={exactMoneyTitle(summary.arrears)}
                    detail={`Positive balances past due as of ${filters.asOf}`}
                    tooltip="Outstanding balances on invoices whose due date is before the as-of date. This is the number to act on."
                    tone="rose"
                  />
                </div>
              )}

              {mode !== 'occupancy' && summary?.arrearsByTenantStatus && (
                <>
                  <Explain title="Active vs former tenant arrears">
                    Former-tenant arrears is debt left behind by departed tenants — it usually needs a different
                    collection strategy (debt follow-up, deposit offsets) than active-tenant balances.
                  </Explain>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <KpiCard
                      label="Active-tenant arrears"
                      value={formatCompactMoney(summary.arrearsByTenantStatus.activeTenants)}
                      fullValueTitle={exactMoneyTitle(summary.arrearsByTenantStatus.activeTenants)}
                      detail="Current tenants with past-due balances"
                      tone="amber"
                    />
                    <KpiCard
                      label="Former-tenant arrears"
                      value={formatCompactMoney(summary.arrearsByTenantStatus.formerTenants)}
                      fullValueTitle={exactMoneyTitle(summary.arrearsByTenantStatus.formerTenants)}
                      detail="Debt left behind by departed tenants"
                      tone="rose"
                    />
                    <KpiCard
                      label="Total arrears"
                      value={formatCompactMoney(summary.arrearsByTenantStatus.total)}
                      fullValueTitle={exactMoneyTitle(summary.arrearsByTenantStatus.total)}
                      detail="Active + former tenants"
                      tone="rose"
                    />
                  </div>
                </>
              )}

              {(mode === 'overview' || mode === 'occupancy') && occupancy && tenants && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                      label="Current occupancy rate"
                      value={formatPercent(occupancy.occupancyRate)}
                      detail={`${occupancy.totalUnits} current unit(s)`}
                      tooltip="Occupied units ÷ total units, snapshot as of the as-of date."
                      tone="sky"
                    />
                    <KpiCard label="Occupied units" value={occupancy.occupiedUnits.toLocaleString()} href="/properties" tone="emerald"
                      detail={`${occupancy.occupiedWithoutTenant} without an ACTIVE tenant`} />
                    <KpiCard label="Vacant units" value={occupancy.vacantUnits.toLocaleString()} href="/properties" tone="amber"
                      detail={`${occupancy.vacantWithTenant} still linked to an ACTIVE tenant`} />
                    <KpiCard
                      label="Current tenant records"
                      value={tenants.currentTenants.toLocaleString()}
                      href="/properties"
                      tone="sky"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard label="Former tenants" value={tenants.formerTenants.toLocaleString()} detail="Total departed records" tone="rose" />
                    <KpiCard label="Total tenants ever" value={tenants.totalTenantsEver.toLocaleString()} detail="Active + former" tone="sky" />
                    <KpiCard label="Churn rate" value={formatPercent(tenants.churnRate)} detail="Left ÷ total ever" tone="amber"
                      tooltip="Share of all tenant records ever that have left. A lifetime measure, not a period churn rate." />
                    <KpiCard
                      label="Current rent roll"
                      value={formatCompactMoney(tenants.currentRentRoll)}
                      fullValueTitle={exactMoneyTitle(tenants.currentRentRoll)}
                      detail={`Avg ${formatCompactMoney(tenants.averageRent)} · deposits ${formatCompactMoney(tenants.depositsHeld)}`}
                      tone="emerald"
                    />
                  </div>

                  {tenants.byLeftReason && Object.keys(tenants.byLeftReason).length > 0 && (
                    <div className="grid gap-6 xl:grid-cols-2">
                      <ChartPanel
                        title="Why tenants left"
                        subtitle="Distribution of leftReason across former tenants"
                        tooltip="Counts by the recorded departure reason. UNSPECIFIED means the reason was never captured — a data-quality signal."
                      >
                        <LeftReasonChart data={tenants.byLeftReason} />
                      </ChartPanel>
                      <Explain title="Using the left-reason chart">
                        Large <strong className="text-slate-300">NON_PAYMENT</strong> or{' '}
                        <strong className="text-slate-300">EVICTED</strong> slices point to arrears-driven churn — pair this
                        with the former-tenant arrears figure above. A large{' '}
                        <strong className="text-slate-300">UNSPECIFIED</strong> slice means staff are not recording departure
                        reasons, so treat the breakdown as directional.
                      </Explain>
                    </div>
                  )}
                </>
              )}

              {mode !== 'occupancy' && data.cohortCash && (
                <CohortVsCashPanel data={data.cohortCash} />
              )}

              {mode !== 'occupancy' && data.collections && data.receivablesTrend && data.status && (
                <div className="grid gap-6 xl:grid-cols-2">
                  <ChartPanel
                    title="Recorded collection trend"
                    subtitle="PaymentReport cash by datePaid; credit and prepaid rows excluded"
                    tooltip="Money actually received, grouped by payment date. Compare with the receivables trend: one follows cash, the other follows invoices."
                  >
                    <CollectionsTrendChart data={data.collections} />
                  </ChartPanel>
                  <ChartPanel
                    title="Receivables trend"
                    subtitle="Invoice values grouped by due date; gold line = collection rate"
                    tooltip="Bars are billed and outstanding per period; the line shows how much of each period's billing was eventually allocated."
                  >
                    <ReceivablesTrendChart data={data.receivablesTrend} />
                  </ChartPanel>
                  <ChartPanel
                    title="Paid, partial and unpaid invoices"
                    subtitle="Invoice counts; cancelled invoices excluded"
                    tooltip="A growing partial/overdue share means tenants are paying late or incompletely — check the aging report next."
                  >
                    <StatusDistributionChart data={data.status} />
                  </ChartPanel>
                  <ChartPanel
                    title="Allocated collections by property"
                    subtitle="Top properties: billed vs allocated collections"
                    tooltip="Billed bars include uncollected amounts; the gap between the two bars is that property's uncollected receivables."
                  >
                    <RevenueByPropertyChart data={data.revenue || []} />
                  </ChartPanel>
                </div>
              )}

              {mode !== 'occupancy' && data.revenue && (
                <section className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5 shadow-xl">
                  <div className="mb-4 flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-sky-400" />
                    <div>
                      <h2 className="flex items-center text-lg font-semibold">Revenue by property <DefinitionTip definitions={definitions} metricKey="paid" /></h2>
                      <p className="text-sm text-slate-400">Backend-calculated invoice metrics for the active scope.</p>
                    </div>
                  </div>
                  <RevenueTable data={data.revenue} />
                </section>
              )}

              {mode !== 'occupancy' &&
                !hasFinancialRecords &&
                !data.collections?.length &&
                !data.revenue?.length && (
                  <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-slate-300">
                    No supported financial records matched this range. Values above are supported
                    empty-dataset results, not placeholders.
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