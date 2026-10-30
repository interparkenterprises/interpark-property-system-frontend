'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { tenantsAPI } from '@/lib/api';
import type { Tenant } from '@/types';
import { TENANT_LEFT_REASON_LABELS } from '@/types';
import type {
  ChurnedTenant,
  DomainPropertyPoint,
  DomainTrendPoint,
  TenantChurnAnalytics,
} from '@/types/analytics';
import { AnalyticsFilters } from '@/components/analytics/AnalyticsFilters';
import { AnalyticsPageHeader } from '@/components/analytics/AnalyticsNavigation';
import {
  AnalyticsError,
  AnalyticsEmpty,
  AnalyticsLoading,
  AnalyticsUnauthorized,
} from '@/components/analytics/AnalyticsStates';
import {
  DataQualityNotices, exactMoneyTitle, formatCompactMoney, Freshness,
} from '@/components/analytics/AnalyticsCore';
import { ChartPanel } from '@/components/analytics/charts/ChartPanel';
import {
  ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart';
import { RankedComparison } from '@/components/ui/ranked-comparison';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDepartedTenantAnalytics } from '@/components/analytics/hooks/useDepartedTenantAnalytics';
import { CompositionBar, PrimaryMetric, SummaryCard } from '../SummaryPanelPrimitives';

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatMoney = (value: number | null | undefined): string => {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatTenure = (days: number | null | undefined): string => {
  if (days == null) return '—';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo ${days % 30}d`;
  return `${Math.floor(days / 365)}y ${Math.round((days % 365) / 30)}mo`;
};

function DepartedTenantSummary({ data }: { data: TenantChurnAnalytics }) {
  const { summary } = data;
  const sharesPopulation = summary.totalTenantsEver === summary.activeTenants + summary.churnedTenants;
  return (
    <section className="grid gap-6 xl:grid-cols-2" aria-label="Departed tenant summary">
      <SummaryCard title="Tenant departures" description="Departures in the selected period with the backend-provided churn context.">
        <div className="grid gap-3 sm:grid-cols-2">
          <PrimaryMetric label="Departed tenants" value={summary.churnedTenants} kind="count" />
          <PrimaryMetric label="Backend churn rate" value={summary.churnRate} kind="percent" />
        </div>
        {sharesPopulation && summary.totalTenantsEver > 0 && <div className="mt-5"><CompositionBar label="Active tenants now and departed tenant records" segments={[{ label: 'Active tenants now', value: summary.activeTenants, className: 'bg-primary' }, { label: 'Departed tenants', value: summary.churnedTenants, className: 'bg-[var(--chart-4)]' }]} /></div>}
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div><dt className="text-xs text-muted-foreground">Active tenants now</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{summary.activeTenants.toLocaleString()}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Total tenants ever</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{summary.totalTenantsEver.toLocaleString()}</dd></div>
        </dl>
      </SummaryCard>
      <SummaryCard title="Departure-related rental exposure" description="Recorded rent and tenure associated with tenants who departed in the selected period.">
        <PrimaryMetric label="Rent associated with departed tenants" value={summary.rentLostToChurn} />
        <div className="mt-4 rounded-lg border border-border/70 p-4">
          <p className="text-xs text-muted-foreground">Average tenure</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{summary.averageTenureDays == null ? 'Not available' : `${summary.averageTenureDays.toLocaleString()} days`}</p>
          {summary.averageTenureDays === 0 && <p className="mt-2 text-xs font-medium text-warning">Review data quality: the backend reported an average tenure of zero days.</p>}
        </div>
      </SummaryCard>
    </section>
  );
}

const trendLabel = (period: string): string => {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1).toLocaleDateString('en-KE', {
      month: 'short',
      year: '2-digit',
    });
  }
  if (period.includes('W')) return period.replace('W', ' · W');
  const d = new Date(period);
  return Number.isNaN(d.getTime())
    ? period
    : d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
};

/* ------------------------------------------------------------------ */
/*  Reason colors / badges                                             */
/* ------------------------------------------------------------------ */

const REASON_COLORS: Record<string, string> = {
  LEASE_EXPIRED: '#f59e0b',
  VOLUNTARY: '#38bdf8',
  EVICTED: '#f87171',
  NON_PAYMENT: '#fb923c',
  TRANSFERRED: '#a78bfa',
  DECEASED: '#94a3b8',
  OTHER: '#64748b',
  UNSPECIFIED: '#475569',
};

const REASON_BADGES: Record<string, string> = {
  LEASE_EXPIRED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  VOLUNTARY: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  EVICTED: 'bg-red-500/15 text-red-300 border-red-500/30',
  NON_PAYMENT: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  TRANSFERRED: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  DECEASED: 'bg-slate-500/15 text-muted-foreground border-slate-500/30',
  OTHER: 'bg-slate-500/15 text-muted-foreground border-slate-500/30',
  UNSPECIFIED: 'bg-slate-600/15 text-muted-foreground border-border/30',
};

const reasonLabel = (reason: string | null | undefined): string =>
  (reason && (TENANT_LEFT_REASON_LABELS as Record<string, string>)[reason]) || 'Unspecified';

const reasonColor = (reason: string | null | undefined): string =>
  (reason && REASON_COLORS[reason]) || REASON_COLORS.UNSPECIFIED;

const ReasonBadge = ({ reason }: { reason: string | null | undefined }) => {
  const cls = (reason && REASON_BADGES[reason]) || REASON_BADGES.UNSPECIFIED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: reasonColor(reason) }}
      />
      {reasonLabel(reason)}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Improved charts                                                    */
/* ------------------------------------------------------------------ */

function DepartureTrendChart({ data }: { data: DomainTrendPoint[] }) {
  if (!data.length) return <AnalyticsEmpty title="No departures in the selected period" />;
  const config = { count: { label: 'Departed tenants', color: 'var(--chart-4)' } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="h-full w-full aspect-auto">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="period" tickFormatter={trendLabel} tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ChartContainer>
  );
}

function LeftReasonDonut({ data }: { data: Record<string, number> }) {
  const entries = useMemo(
    () => Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]),
    [data],
  );
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (!total) return <AnalyticsEmpty title="No departure reasons recorded" detail="No reasons were recorded for this period." />;
  const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--primary)', 'var(--warning)'];
  const values = entries.map(([reason, value], index) => ({ key: reason, name: reasonLabel(reason), value, fill: palette[index % palette.length] }));
  const config = Object.fromEntries(values.map(item => [item.key, { label: item.name, color: item.fill }])) satisfies ChartConfig;

  return (
    <div className="relative h-full w-full">
      <ChartContainer config={config} className="h-full w-full aspect-auto">
        <PieChart accessibilityLayer>
          <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <ChartLegend content={<ChartLegendContent nameKey="key" />} />
          <Pie data={values} dataKey="value" nameKey="key" innerRadius={58} outerRadius={92} paddingAngle={3} strokeWidth={0}>
            {values.map(item => <Cell key={item.key} fill={item.fill} />)}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
        <span className="text-2xl font-semibold tabular-nums text-foreground">{total}</span>
        <span className="text-xs text-muted-foreground">departures</span>
      </div>
    </div>
  );
}

function PropertyChurnBars({ data }: { data: DomainPropertyPoint[] }) {
  const entries = useMemo(() => [...data].sort((a, b) => b.count - a.count), [data]);
  if (!entries.length) return <AnalyticsEmpty title="No property-level churn data" />;

  return (
    <RankedComparison
      items={entries.map(item => ({
        id: item.propertyId,
        label: item.propertyName,
        values: { count: { value: item.count, display: item.count.toLocaleString('en-KE') } },
      }))}
      columns={[{ key: 'count', label: 'Departures', emphasized: true }]}
      bars={[{ key: 'count', color: 'var(--chart-4)' }]}
      labelHeading="Property"
      emptyMessage="No property-level churn data is available."
    />
  );
}

/** Automatically derived highlights from the churn dataset. */
function ChurnInsights({ data }: { data: TenantChurnAnalytics }) {
  const topReason = Object.entries(data.byReason)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])[0];
  const topProperty = [...data.byProperty].sort((a, b) => b.count - a.count)[0];
  const peak = [...data.trend].sort((a, b) => b.count - a.count)[0];

  const items = [
    topReason && {
      color: reasonColor(topReason[0]),
      title: `Most common reason: ${reasonLabel(topReason[0])}`,
      detail: `${topReason[1]} departure${topReason[1] === 1 ? '' : 's'} (${(
        (topReason[1] / Math.max(1, data.summary.churnedTenants)) *
        100
      ).toFixed(1)}% of total)`,
    },
    topProperty && {
      color: '#38bdf8',
      title: `Highest churn property: ${topProperty.propertyName}`,
      detail: `${topProperty.count} tenant${topProperty.count === 1 ? '' : 's'} departed`,
    },
    peak && {
      color: '#fb923c',
      title: `Peak departure period: ${trendLabel(peak.period)}`,
      detail: `${peak.count} tenant${peak.count === 1 ? '' : 's'} left`,
    },
    data.summary.averageTenureDays != null && {
      color: '#34d399',
      title: 'Average tenure before leaving',
      detail: formatTenure(data.summary.averageTenureDays),
    },
  ].filter(Boolean) as Array<{ color: string; title: string; detail: string }>;

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.title} className="flex items-start gap-3">
          <span
            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Tenant detail modal                                                */
/* ------------------------------------------------------------------ */

interface DetailModalState {
  open: boolean;
  row: ChurnedTenant | null;
  tenant: Tenant | null;
  financials: TenantFinancials | null;
  loading: boolean;
  error: string | null;
}

interface TenantFinancials {
  rentOutstanding?: number;
  billOutstanding?: number;
  totalOutstanding?: number;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 26 } },
  exit: { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.15 } },
};

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    {children}
  </h4>
);

const InfoItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-xl border border-border bg-muted/40 p-3">
    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 truncate text-sm font-semibold text-foreground">{value ?? '—'}</p>
  </div>
);

const FinCard = ({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: 'rose' | 'emerald' | 'sky';
}) => {
  const tones = {
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    sky: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  };
  return (
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-lg font-bold">{formatMoney(amount)}</p>
    </div>
  );
};

const RecordChip = ({ label, count }: { label: string; count: number | null }) => (
  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-foreground">
      {count ?? '—'}
    </span>
  </div>
);

function TenantDetailModal({
  state,
  onClose,
  onRetry,
}: {
  state: DetailModalState;
  onClose: () => void;
  onRetry: () => void;
}) {
  const { row, tenant, financials, loading, error } = state;

  const fin: TenantFinancials = tenant?.financials ?? financials ?? {};
  const rentOutstanding: number = fin.rentOutstanding ?? 0;
  const billOutstanding: number = fin.billOutstanding ?? 0;
  const totalOutstanding: number =
    fin.totalOutstanding ?? rentOutstanding + billOutstanding;

  const records: Array<[string, number | null]> = tenant
    ? [
        ['Payment reports', tenant.paymentReports ? tenant.paymentReports.length : null],
        ['Invoices', tenant.invoices ? tenant.invoices.length : null],
        ['Bill invoices', tenant.billInvoices ? tenant.billInvoices.length : null],
        ['Bills', tenant.bills ? tenant.bills.length : null],
        ['Incomes', tenant.incomes ? tenant.incomes.length : null],
      ]
    : [];

  const displayName = tenant?.fullName ?? row?.name ?? 'Tenant';
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'T';
  const propertyName = row?.property ?? tenant?.unit?.property?.name ?? null;
  const unitNo = row?.unitNo ?? tenant?.unit?.unitNo ?? null;
  const joinedAt = tenant?.termStart ?? row?.joinedAt ?? null;
  const leftAt = tenant?.leftAt ?? row?.leftAt ?? null;
  const reason = tenant?.leftReason ?? row?.leftReason ?? null;
  const tenure = tenant?.lifecycle?.tenureDays ?? row?.tenureDays ?? null;
  const monthlyRent = tenant?.rent ?? row?.rent ?? null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="border-b border-border bg-muted/40 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-sm font-bold text-rose-300 ring-1 ring-rose-500/30">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">{displayName}</h3>
                <span className="rounded-full border border-rose-500/30 bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-300">
                  LEFT
                </span>
                <ReasonBadge reason={reason} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {[propertyName, unitNo && `Unit ${unitNo}`].filter(Boolean).join(' · ') ||
                  'No unit on record'}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
              <motion.svg
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-8 w-8 text-rose-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </motion.svg>
              Loading tenant details…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-14 text-center">
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={onRetry}
                className="rounded-lg border border-border px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Timeline */}
              <div>
                <SectionLabel>Timeline</SectionLabel>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                    <div>
                      <p className="text-xs text-muted-foreground">Joined</p>
                      <p className="text-sm font-semibold text-foreground">{formatDate(joinedAt)}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {formatTenure(tenure)}
                  </span>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <p className="text-xs text-muted-foreground">Left</p>
                      <span className="h-3 w-3 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{formatDate(leftAt)}</p>
                  </div>
                </div>
              </div>

              {/* Key information */}
              <div>
                <SectionLabel>Key information</SectionLabel>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem label="Contact" value={tenant?.contact} />
                  <InfoItem label="Email" value={tenant?.email} />
                  <InfoItem label="KRA PIN" value={tenant?.KRAPin} />
                  <InfoItem label="Monthly rent" value={formatMoney(monthlyRent)} />
                  <InfoItem label="Deposit held" value={formatMoney(tenant?.deposit)} />
                  <InfoItem label="Lease start" value={formatDate(tenant?.termStart)} />
                </div>
              </div>

              {/* Financial snapshot */}
              <div>
                <SectionLabel>Financial snapshot</SectionLabel>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <FinCard label="Rent outstanding" amount={rentOutstanding} tone="rose" />
                  <FinCard label="Bill outstanding" amount={billOutstanding} tone="sky" />
                  <FinCard label="Total outstanding" amount={totalOutstanding} tone="emerald" />
                </div>
              </div>

              {/* Preserved records */}
              <div>
                <SectionLabel>Preserved records</SectionLabel>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {records.map(([label, count]) => (
                    <RecordChip key={label} label={label} count={count} />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Historical record preserved.</strong>{' '}
                All payment history, invoices, bills, and documents for this tenant remain
                available in their full profile.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/40 px-6 py-4 text-right">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DepartedTenantsPage() {
  const analytics = useDepartedTenantAnalytics();
  const { data, meta } = analytics;
  const [modal, setModal] = useState<DetailModalState>({
    open: false,
    row: null,
    tenant: null,
    financials: null,
    loading: false,
    error: null,
  });

  /* ---------- tenant detail modal ---------- */

  const openTenantDetail = useCallback((rowItem: ChurnedTenant) => {
    setModal({
      open: true,
      row: rowItem,
      tenant: null,
      financials: null,
      loading: true,
      error: null,
    });
    void (async () => {
      try {
        const [tenant, financials] = await Promise.all([
          tenantsAPI.getById(rowItem.id),
          tenantsAPI.getFinancials(rowItem.id).catch(() => null),
        ]);
        setModal((m) =>
          m.row?.id === rowItem.id ? { ...m, tenant, financials, loading: false } : m,
        );
      } catch {
        setModal((m) =>
          m.row?.id === rowItem.id
            ? { ...m, loading: false, error: 'Failed to load tenant details. Please try again.' }
            : m,
        );
      }
    })();
  }, []);

  const closeTenantDetail = useCallback(
    () => setModal((m) => ({ ...m, open: false })),
    [],
  );

  const retryTenantDetail = useCallback(() => {
    if (modal.row) openTenantDetail(modal.row);
  }, [modal.row, openTenantDetail]);

  useEffect(() => {
    if (!modal.open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTenantDetail();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [modal.open, closeTenantDetail]);

  /* ---------- render ---------- */

  return (
    <div className="space-y-6 text-foreground">
      <AnalyticsPageHeader
        title="Departed tenants"
        description="Full record of tenants who have left, with reasons, tenure, and rent lost. Data comes directly from Tenant (leftAt) and Tenant (leftReason)."
        actions={analytics.canView ? (
          <AnalyticsFilters
            value={analytics.draftFilters}
            properties={analytics.properties}
            disabled={analytics.loading}
            onChange={analytics.setDraftFilters}
            onApply={analytics.applyFilters}
          />
        ) : undefined}
      />

      {!analytics.canView ? (
        <AnalyticsUnauthorized detail="This view requires the VIEW_TENANTS permission." />
      ) : (
        <>
          {analytics.loading ? (
            <AnalyticsLoading />
          ) : analytics.error ? (
            <AnalyticsError
              message={analytics.error.message}
              backendUnavailable={analytics.error.backendUnavailable}
              retry={analytics.load}
            />
          ) : data ? (
            <>
              {analytics.meta?.dataQuality && <DataQualityNotices values={[analytics.meta.dataQuality]} />}

              <DepartedTenantSummary data={data} />

              {/* Charts */}
              <div className="grid gap-6 xl:grid-cols-5">
                <div className="xl:col-span-3">
                  <ChartPanel
                    title="Departures over time"
                    subtitle="Grouped by Tenant.leftAt (falls back to updatedAt where missing)"
                  >
                    <DepartureTrendChart data={data.trend} />
                  </ChartPanel>
                </div>
                <div className="xl:col-span-2">
                  <ChartPanel title="Why tenants left" subtitle="Distribution by Tenant.leftReason">
                    <LeftReasonDonut data={data.byReason} />
                  </ChartPanel>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <ChartPanel title="Churn by property" subtitle="Departed tenants per property">
                  <PropertyChurnBars data={data.byProperty} />
                </ChartPanel>
                <ChartPanel title="Quick insights" subtitle="Automatically derived from the data above">
                  <ChurnInsights data={data} />
                </ChartPanel>
              </div>

              {/* Departed tenants table */}
              <Card>
                <CardHeader>
                  <CardTitle>Departed tenants</CardTitle>
                  <CardDescription>{data.churnedTenants.length} tenant(s) left in this period. Open a record to review its preserved history.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHead>
                      <TableHeader>Tenant</TableHeader><TableHeader>Rent / month</TableHeader><TableHeader>Reason</TableHeader><TableHeader>Joined</TableHeader><TableHeader>Left</TableHeader><TableHeader>Tenure</TableHeader><TableHeader className="text-right">Detail</TableHeader>
                    </TableHead>
                    <TableBody>
                      {data.churnedTenants.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No tenants departed in the selected period.</TableCell></TableRow>
                      ) : data.churnedTenants.map(tenant => (
                        <TableRow key={tenant.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                                {tenant.name.split(' ').filter(Boolean).map(word => word[0]).slice(0, 2).join('').toUpperCase()}
                              </span>
                              <div className="min-w-0"><p className="font-semibold">{tenant.name}</p><p className="truncate text-xs text-muted-foreground">{[tenant.property, tenant.unitNo && `Unit ${tenant.unitNo}`].filter(Boolean).join(' · ')}</p></div>
                            </div>
                          </TableCell>
                          <TableCell title={exactMoneyTitle(tenant.rent)} className="tabular-nums">{formatCompactMoney(tenant.rent)}</TableCell>
                          <TableCell><ReasonBadge reason={tenant.leftReason} /></TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(tenant.joinedAt)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(tenant.leftAt)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatTenure(tenant.tenureDays)}</TableCell>
                          <TableCell className="text-right"><Button type="button" size="sm" variant="outline" onClick={() => openTenantDetail(tenant)}>Open</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {meta && <Freshness generatedAt={meta.generatedAt} definition={meta.definitionsVersion} />}
            </>
          ) : null}
        </>
      )}

      <AnimatePresence>
        {modal.open && (
          <TenantDetailModal
            state={modal}
            onClose={closeTenantDetail}
            onRetry={retryTenantDetail}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
