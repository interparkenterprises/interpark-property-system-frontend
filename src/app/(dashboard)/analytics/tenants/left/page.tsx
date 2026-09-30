'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { propertiesAPI, tenantsAPI } from '@/lib/api';
import { analyticsAPI, toAnalyticsApiFailure } from '@/lib/analyticsApi';
import type { Property, Tenant } from '@/types';
import { TENANT_LEFT_REASON_LABELS } from '@/types';
import type {
  AnalyticsApiFailure,
  AnalyticsFilters as FilterValues,
  ChurnedTenant,
  DomainPropertyPoint,
  DomainTrendPoint,
  TenantChurnAnalytics,
} from '@/types/analytics';
import { AnalyticsFilters } from '@/components/analytics/AnalyticsFilters';
import { AnalyticsPageHeader } from '@/components/analytics/AnalyticsNavigation';
import {
  AnalyticsError,
  AnalyticsLoading,
  AnalyticsUnauthorized,
} from '@/components/analytics/AnalyticsStates';
import {
  ChartPanel,
  DataQualityNotices,
  exactMoneyTitle,
  formatCompactMoney,
  formatPercent,
  Freshness,
  KpiCard,
} from '@/components/analytics/AnalyticsWidgets';

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */

const dateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const initialFilters = (): FilterValues => {
  const now = new Date();
  return {
    // Default: last 12 months of churn history
    dateFrom: dateString(new Date(now.getFullYear() - 1, now.getMonth(), 1)),
    dateTo: dateString(now),
    asOf: dateString(now),
    grain: 'month',
  };
};

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
  DECEASED: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  OTHER: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  UNSPECIFIED: 'bg-slate-600/15 text-slate-400 border-slate-600/30',
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

const ChartEmpty = ({ message }: { message: string }) => (
  <div className="flex h-48 items-center justify-center text-sm text-slate-500">{message}</div>
);

/** Animated gradient bar chart of departures over time. */
function DepartureTrendChart({ data }: { data: DomainTrendPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  if (!data.length) return <ChartEmpty message="No departures in the selected period." />;

  return (
    <div className="select-none">
      <div className="flex h-56 items-end gap-2 sm:gap-3">
        {data.map((d, i) => {
          const heightPct = Math.max(3, (d.count / max) * 100);
          const active = hover === i;
          return (
            <div
              key={d.period}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {active && (
                <div className="pointer-events-none absolute -top-1 z-10 -translate-y-full rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-center shadow-lg">
                  <p className="text-[11px] text-slate-400">{trendLabel(d.period)}</p>
                  <p className="text-sm font-bold text-white">
                    {d.count} departed
                  </p>
                </div>
              )}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.5, delay: i * 0.03, ease: 'easeOut' }}
                className={`w-full max-w-10 rounded-t-lg bg-linear-to-t from-rose-600 via-rose-500 to-orange-400 transition-all duration-200 ${
                  active
                    ? 'brightness-125 shadow-[0_0_18px_rgba(244,63,94,0.45)]'
                    : hover !== null
                      ? 'opacity-60'
                      : ''
                }`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3">
        {data.map((d, i) => (
          <div
            key={d.period}
            className={`flex-1 truncate text-center text-[10px] sm:text-xs ${
              hover === i ? 'text-slate-200' : 'text-slate-500'
            }`}
          >
            {trendLabel(d.period)}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Donut chart of departure reasons with interactive legend. */
function LeftReasonDonut({ data }: { data: Record<string, number> }) {
  const [active, setActive] = useState<number | null>(null);
  const entries = useMemo(
    () => Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]),
    [data],
  );
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (!total) return <ChartEmpty message="No departure reasons recorded for this period." />;

  const size = 200;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = 3;
  let acc = 0;

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:gap-8">
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#1e293b"
            strokeWidth={stroke}
          />
          {entries.map(([key, value], i) => {
            const frac = value / total;
            const len = Math.max(0, frac * c - gap);
            const offset = -acc * c;
            acc += frac;
            return (
              <motion.circle
                key={key}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={reasonColor(key)}
                strokeWidth={active === i ? stroke + 6 : stroke}
                strokeDasharray={`${len} ${c - len}`}
                initial={{ strokeDashoffset: offset, opacity: 0 }}
                animate={{
                  strokeDashoffset: offset,
                  opacity: active === null || active === i ? 1 : 0.35,
                }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="cursor-pointer"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{total}</span>
          <span className="text-xs text-slate-400">departures</span>
        </div>
      </div>
      <ul className="w-full flex-1 space-y-2.5">
        {entries.map(([key, value], i) => {
          const pct = (value / total) * 100;
          const isActive = active === i;
          return (
            <li
              key={key}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className={`cursor-pointer rounded-lg px-2 py-1 transition ${
                isActive ? 'bg-slate-700/50' : ''
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-200">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: reasonColor(key) }}
                  />
                  {reasonLabel(key)}
                </span>
                <span className="font-semibold text-white">
                  {value}{' '}
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    {pct.toFixed(1)}%
                  </span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-700/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: reasonColor(key) }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Horizontal bars of departures per property. */
function PropertyChurnBars({ data }: { data: DomainPropertyPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const entries = useMemo(() => [...data].sort((a, b) => b.count - a.count), [data]);
  const max = Math.max(1, ...entries.map((d) => d.count));
  if (!entries.length) return <ChartEmpty message="No property-level churn data." />;
  const palette = [
    '#f87171',
    '#fb923c',
    '#f59e0b',
    '#38bdf8',
    '#a78bfa',
    '#34d399',
    '#f472b6',
    '#94a3b8',
  ];

  return (
    <ul className="space-y-3">
      {entries.map((d, i) => {
        const pct = (d.count / max) * 100;
        const isActive = active === i;
        return (
          <li
            key={d.propertyId}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className={`rounded-lg px-2 py-1 transition ${isActive ? 'bg-slate-700/40' : ''}`}
          >
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-slate-200">{d.propertyName}</span>
              <span className="shrink-0 font-semibold text-white">
                {d.count}{' '}
                <span className="text-xs font-normal text-slate-400">
                  tenant{d.count === 1 ? '' : 's'}
                </span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-700/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="h-full rounded-full"
                style={{ backgroundColor: palette[i % palette.length] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
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
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <p className="text-xs text-slate-400">{item.detail}</p>
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
  financials: Record<string, any> | null;
  loading: boolean;
  error: string | null;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 26 } },
  exit: { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.15 } },
};

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
    {children}
  </h4>
);

const InfoItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-xl border border-slate-700/70 bg-slate-800/60 p-3">
    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 truncate text-sm font-semibold text-white">{value ?? '—'}</p>
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
  <div className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-800/60 px-3 py-2">
    <span className="text-xs text-slate-400">{label}</span>
    <span className="rounded-full bg-slate-700/80 px-2 py-0.5 text-xs font-bold text-white">
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

  const fin: any = tenant?.financials ?? financials ?? {};
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
  const propertyName = row?.property ?? (tenant?.unit as any)?.property?.name ?? null;
  const unitNo = row?.unitNo ?? (tenant?.unit as any)?.unitNo ?? null;
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
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
      >
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-800/70 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-sm font-bold text-rose-300 ring-1 ring-rose-500/30">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-white">{displayName}</h3>
                <span className="rounded-full border border-rose-500/30 bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-300">
                  LEFT
                </span>
                <ReasonBadge reason={reason} />
              </div>
              <p className="mt-1 text-sm text-slate-400">
                {[propertyName, unitNo && `Unit ${unitNo}`].filter(Boolean).join(' · ') ||
                  'No unit on record'}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-white"
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
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-400">
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
                className="rounded-lg border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
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
                      <p className="text-xs text-slate-400">Joined</p>
                      <p className="text-sm font-semibold text-white">{formatDate(joinedAt)}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {formatTenure(tenure)}
                  </span>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <p className="text-xs text-slate-400">Left</p>
                      <span className="h-3 w-3 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
                    </div>
                    <p className="text-sm font-semibold text-white">{formatDate(leftAt)}</p>
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

              <div className="rounded-xl border border-slate-700/70 bg-slate-800/50 px-4 py-3 text-xs leading-relaxed text-slate-400">
                <strong className="text-slate-200">Historical record preserved.</strong>{' '}
                All payment history, invoices, bills, and documents for this tenant remain
                available in their full profile.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 bg-slate-800/70 px-6 py-4 text-right">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
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
  const auth = useAuth();
  const [draft, setDraft] = useState<FilterValues>(initialFilters);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [properties, setProperties] = useState<Property[]>([]);
  const [data, setData] = useState<TenantChurnAnalytics | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AnalyticsApiFailure | null>(null);
  const [modal, setModal] = useState<DetailModalState>({
    open: false,
    row: null,
    tenant: null,
    financials: null,
    loading: false,
    error: null,
  });

  const canView = auth.isAdmin || auth.isManager || auth.hasPermission('VIEW_TENANTS');

  useEffect(() => {
    if (!canView) return;
    propertiesAPI
      .getAll()
      .then((result) => setProperties(Array.isArray(result) ? result : []))
      .catch(() => setProperties([]));
  }, [canView]);

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsAPI.getTenantChurnAnalytics(filters);
      setData(result.data);
      setMeta(result.meta);
    } catch (e) {
      setData(null);
      setError(toAnalyticsApiFailure(e));
    } finally {
      setLoading(false);
    }
  }, [canView, filters]);

  useEffect(() => {
    load();
  }, [load]);

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
    <div className="space-y-6 text-white">
      <AnalyticsPageHeader
        title="Departed tenants"
        description="Full record of tenants who have left, with reasons, tenure, and rent lost. Data comes directly from Tenant (leftAt) and Tenant (leftReason)."
      />

      {!canView ? (
        <AnalyticsUnauthorized detail="This view requires the VIEW_TENANTS permission." />
      ) : (
        <>
          <AnalyticsFilters
            value={draft}
            properties={properties}
            disabled={loading}
            onChange={setDraft}
            onApply={() =>
              setFilters({ ...draft, asOf: draft.dateTo ?? dateString(new Date()) })
            }
          />

          {loading ? (
            <AnalyticsLoading />
          ) : error ? (
            <AnalyticsError
              message={error.message}
              backendUnavailable={error.backendUnavailable}
              retry={load}
            />
          ) : data ? (
            <>
              {meta?.dataQuality && <DataQualityNotices values={[meta.dataQuality]} />}

              {/* Summary KPIs */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <KpiCard
                  label="Departed tenants"
                  value={data.summary.churnedTenants.toLocaleString()}
                  detail="Left in selected period"
                  tone="rose"
                />
                <KpiCard
                  label="Churn rate"
                  value={formatPercent(data.summary.churnRate)}
                  detail="Departed ÷ total ever"
                  tone="amber"
                />
                <KpiCard
                  label="Average tenure"
                  value={
                    data.summary.averageTenureDays != null
                      ? `${data.summary.averageTenureDays} days`
                      : 'N/A'
                  }
                  detail="Mean tenure of departed tenants"
                  tone="sky"
                />
                <KpiCard
                  label="Rent lost to churn"
                  value={formatCompactMoney(data.summary.rentLostToChurn)}
                  fullValueTitle={exactMoneyTitle(data.summary.rentLostToChurn)}
                  detail="Sum of departed tenants' rent"
                  tone="rose"
                />
                <KpiCard
                  label="Active tenants now"
                  value={data.summary.activeTenants.toLocaleString()}
                  detail="Currently occupied"
                  tone="emerald"
                />
                <KpiCard
                  label="Total tenants ever"
                  value={data.summary.totalTenantsEver.toLocaleString()}
                  detail="Active + departed"
                  tone="sky"
                />
              </div>

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
              <section className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5 shadow-xl">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Departed tenants</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {data.churnedTenants.length} tenant(s) left in this period. Click “Open”
                    to review their preserved history.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-190 text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <th className="pb-3 pr-3">Tenant</th>
                        <th className="pb-3 pr-3">Rent / month</th>
                        <th className="pb-3 pr-3">Reason</th>
                        <th className="pb-3 pr-3">Joined</th>
                        <th className="pb-3 pr-3">Left</th>
                        <th className="pb-3 pr-3">Tenure</th>
                        <th className="pb-3 text-right">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.churnedTenants.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-500">
                            No tenants departed in the selected period.
                          </td>
                        </tr>
                      ) : (
                        data.churnedTenants.map((t) => (
                          <tr
                            key={t.id}
                            className="border-t border-slate-700/50 transition hover:bg-slate-700/30"
                          >
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700/70 text-xs font-bold text-slate-200">
                                  {t.name
                                    .split(' ')
                                    .filter(Boolean)
                                    .map((w) => w[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-semibold text-white">{t.name}</p>
                                  <p className="truncate text-xs text-slate-400">
                                    {[t.property, t.unitNo && `Unit ${t.unitNo}`]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-3 whitespace-nowrap" title={exactMoneyTitle(t.rent)}>
                              {formatCompactMoney(t.rent)}
                            </td>
                            <td className="py-3 pr-3">
                              <ReasonBadge reason={t.leftReason} />
                            </td>
                            <td className="py-3 pr-3 whitespace-nowrap text-slate-300">
                              {formatDate(t.joinedAt)}
                            </td>
                            <td className="py-3 pr-3 whitespace-nowrap text-slate-300">
                              {formatDate(t.leftAt)}
                            </td>
                            <td className="py-3 pr-3 whitespace-nowrap text-slate-300">
                              {formatTenure(t.tenureDays)}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => openTenantDetail(t)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-700/60 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-sky-500/50 hover:bg-sky-500/15 hover:text-sky-300"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                Open
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

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