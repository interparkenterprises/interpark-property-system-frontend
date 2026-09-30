import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, Info } from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { AnalyticsEmpty } from './AnalyticsStates';
import type {
  ChurnedTenant, CollectionTrendPoint, CohortVsCash, DomainDistributionItem,
  MetricDefinition, PropertyRevenue, ReceivablesStatusDistribution, ReceivablesTrendPoint,
} from '@/types/analytics';
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat';

const money = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('en-KE');

export const formatMoney = (value: number | null | undefined) => value == null ? 'Not available' : money.format(value);
export const formatCompactMoney = (value: number | null | undefined) => value == null ? 'Not available' : formatCompactKes(value);
export const formatPercent = (value: number | null | undefined) => value == null ? 'Not available' : `${value.toFixed(2)}%`;
export const formatNumber = (value: number | null | undefined) => value == null ? 'Not available' : number.format(value);

// ========== USER EDUCATION PRIMITIVES ==========

/** Small hover tooltip used to explain metrics inline. */
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <Info aria-label="More info" className="h-3.5 w-3.5 cursor-help text-slate-400 transition-colors group-hover:text-sky-300" />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-lg border border-slate-600 bg-slate-900 p-3 text-xs font-normal leading-relaxed normal-case tracking-normal text-slate-200 opacity-0 shadow-2xl transition-opacity duration-150 group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

/** Renders a tooltip fed by meta.definitions so explanations are never hardcoded. */
export function DefinitionTip({ definitions, metricKey }: { definitions?: Record<string, MetricDefinition>; metricKey: string }) {
  const def = definitions?.[metricKey];
  if (!def) return null;
  return <InfoTip text={`${def.description} (basis: ${def.basis}, axis: ${def.axis})`} />;
}

/** Short explainer card shown above chart groups to help users read the analytics. */
export function Explain({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-900/40 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-sky-300">
        <Info className="h-4 w-4 shrink-0" />{title}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{children}</p>
    </div>
  );
}

// ========== KPI CARDS ==========

const toneStyles = {
  sky: 'from-sky-500/20 to-sky-900/10 border-sky-500/30',
  emerald: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/30',
  amber: 'from-amber-500/20 to-amber-900/10 border-amber-500/30',
  rose: 'from-rose-500/20 to-rose-900/10 border-rose-500/30',
} as const;

export type KpiTone = keyof typeof toneStyles;

export function KpiCard({ label, value, detail, href, fullValueTitle, tooltip, tone = 'sky' }: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
  fullValueTitle?: string;
  tooltip?: string;
  tone?: KpiTone;
}) {
  const content = (
    <div className={`h-full rounded-2xl border bg-linear-to-br p-5 shadow-lg transition-transform duration-150 ${href ? 'hover:-translate-y-0.5' : ''} ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-300">{label}{tooltip && <InfoTip text={tooltip} />}</p>
        {href && <ArrowUpRight className="h-4 w-4 text-slate-400" />}
      </div>
      <p className="kpi-value mt-3 font-bold tracking-tight text-white" title={fullValueTitle}>{value}</p>
      {detail && <p className="mt-2 text-xs text-slate-400">{detail}</p>}
    </div>
  );
  return href
    ? <Link href={href} className="block h-full rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400">{content}</Link>
    : content;
}

export const exactMoneyTitle = (value: number | null | undefined) => value == null ? undefined : formatExactKes(value);

export function ChartPanel({ title, subtitle, children, tooltip }: {
  title: string; subtitle?: string; children: React.ReactNode; tooltip?: string;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-700 bg-slate-800/70 p-5 shadow-xl">
      <h2 className="flex items-center text-lg font-semibold text-white">{title}{tooltip && <InfoTip text={tooltip} />}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      <div className="relative mt-5 h-75 min-h-75 w-full">{children}</div>
    </section>
  );
}

// ========== CHART SHARED BITS ==========

const tooltipStyle = { background: '#0f172a', border: '1px solid #475569', borderRadius: 10, color: '#fff', fontSize: 12 };
const axisStroke = '#94a3b8';
const gridStroke = '#334155';
const currencyTick = (value: number) =>
  value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}m` : value >= 1_000 ? `${Math.round(value / 1_000)}k` : String(value);
const moneyFormatter = (value: unknown) => formatMoney(Number(value));
const countFormatter = (value: unknown) => number.format(Number(value));

/** Donut with a total in the center — reads better than a plain pie. */
function Donut({ data, centerLabel }: { data: { name: string; value: number; color: string }[]; centerLabel?: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3} stroke="#0f172a">
            {data.map(item => <Cell key={item.name} fill={item.color} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={countFormatter} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{number.format(total)}</span>
        {centerLabel && <span className="text-xs text-slate-400">{centerLabel}</span>}
      </div>
    </div>
  );
}

// ========== CORE ANALYTICS CHARTS ==========

export function CollectionsTrendChart({ data }: { data: CollectionTrendPoint[] }) {
  if (!data.length) return <AnalyticsEmpty title="No recorded collections" detail="No payment records with a datePaid inside this range." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="collectionsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="period" stroke={axisStroke} tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis stroke={axisStroke} tickFormatter={currencyTick} tick={{ fontSize: 12 }} tickLine={false} width={58} />
        <Tooltip contentStyle={tooltipStyle} formatter={moneyFormatter} />
        <Area type="monotone" dataKey="collected" name="Recorded collections" stroke="#38bdf8" strokeWidth={2.5} fill="url(#collectionsGradient)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ReceivablesTrendChart({ data }: { data: ReceivablesTrendPoint[] }) {
  if (!data.length) return <AnalyticsEmpty title="No receivables in this period" detail="No invoices were due inside this range." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="period" stroke={axisStroke} tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis yAxisId="money" stroke={axisStroke} tickFormatter={currencyTick} tick={{ fontSize: 12 }} tickLine={false} width={58} />
        <YAxis yAxisId="rate" orientation="right" stroke="#fbbf24" tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} tickLine={false} width={44} unit="%" />
        <Tooltip contentStyle={tooltipStyle} formatter={moneyFormatter} />
        <Legend />
        <Bar yAxisId="money" dataKey="billed" name="Billed" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar yAxisId="money" dataKey="outstanding" name="Outstanding" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Line yAxisId="rate" type="monotone" dataKey="collectionRate" name="Collection rate %" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function StatusDistributionChart({ data }: { data: ReceivablesStatusDistribution }) {
  const values = [
    { name: 'Paid', value: data.paid.count, color: '#34d399' },
    { name: 'Partial', value: data.partial.count, color: '#fbbf24' },
    { name: 'Unpaid', value: data.unpaid.count, color: '#fb7185' },
    { name: 'Overdue', value: data.overdue?.count || 0, color: '#ef4444' },
  ].filter(v => v.value > 0);
  if (!values.length) return <AnalyticsEmpty title="No invoice statuses" detail="Cancelled invoices are excluded from this breakdown." />;
  return <Donut data={values} centerLabel="invoices" />;
}

export function RevenueByPropertyChart({ data }: { data: PropertyRevenue[] }) {
  if (!data.length) return <AnalyticsEmpty title="No property revenue" detail="No invoice activity matched the selected filters." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ left: 16, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
        <XAxis type="number" stroke={axisStroke} tickFormatter={currencyTick} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="propertyName" width={105} stroke={axisStroke} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={moneyFormatter} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
        <Legend />
        <Bar dataKey="billed" name="Billed" fill="#38bdf8" radius={[0, 5, 5, 0]} maxBarSize={16} />
        <Bar dataKey="paid" name="Allocated collections" fill="#34d399" radius={[0, 5, 5, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueTable({ data }: { data: PropertyRevenue[] }) {
  if (!data.length) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700">
      <table className="min-w-full divide-y divide-slate-700 text-sm">
        <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">Property</th><th className="px-4 py-3 text-right">Billed</th>
            <th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3 text-right">Outstanding</th>
            <th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Invoices</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700 bg-slate-800/50 text-slate-200">
          {data.map(row => (
            <tr key={row.propertyId} className="hover:bg-slate-700/40">
              <td className="px-4 py-3 font-medium">{row.propertyName}</td>
              <td className="px-4 py-3 text-right">{formatMoney(row.billed)}</td>
              <td className="px-4 py-3 text-right">{formatMoney(row.paid)}</td>
              <td className="px-4 py-3 text-right">{formatMoney(row.outstanding)}</td>
              <td className="px-4 py-3 text-right">{formatPercent(row.collectionRate)}</td>
              <td className="px-4 py-3 text-right">{number.format(row.invoiceCount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ========== COHORT VS CASH ==========

/**
 * Explains the classic reconciliation question: "why doesn't the paid total
 * match my PaymentReport sum?" — cohort metrics are invoice-based, cash
 * metrics are payment-date based, and the two legitimately differ.
 */
export function CohortVsCashPanel({ data }: { data: CohortVsCash }) {
  const rows = [
    { label: 'Billed (invoices due in range)', value: data.cohort.billed, tone: 'text-sky-300' },
    { label: 'Allocated to those invoices', value: data.cohort.allocated, tone: 'text-emerald-300' },
    { label: 'Cash collected (by date paid)', value: data.cash.collected, tone: 'text-emerald-300' },
    { label: 'Excluded credit / prepaid', value: data.cash.excludedCredit + data.cash.excludedPrepaid, tone: 'text-amber-300' },
    { label: 'Outstanding snapshot (as of)', value: data.snapshot.outstanding, tone: 'text-rose-300' },
  ];
  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5 shadow-xl">
      <h2 className="flex items-center text-lg font-semibold text-white">
        Cohort vs cash
        <InfoTip text="Cohort metrics follow invoices (what was due and what was allocated to them). Cash metrics follow payment dates (money actually received). They answer different questions, so totals will not match — that is expected." />
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Invoice-cohort receivables vs payment-date collections, reconciled in one call as of {data.snapshot.asOf}.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ul className="space-y-2">
          {rows.map(row => (
            <li key={row.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/70 bg-slate-900/40 px-4 py-2.5 text-sm">
              <span className="text-slate-300">{row.label}</span>
              <span className={`font-semibold ${row.tone}`}>{formatMoney(row.value)}</span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="Cohort collection rate" value={formatPercent(data.cohort.collectionRate)} detail={`${number.format(data.cohort.invoiceCount)} invoice(s)`} />
          <MiniStat label="Cash transactions" value={number.format(data.cash.transactionCount)} detail="Credit & prepaid excluded" />
          <MiniStat label="Open invoices (snapshot)" value={number.format(data.snapshot.openInvoiceCount)} detail={`Arrears ${formatCompactMoney(data.snapshot.arrears)}`} />
          <MiniStat label="Invoices vs cash gap" value={formatMoney(data.cash.collected - data.cohort.allocated)} detail="Collections on invoices due outside the range" />
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

// ========== DATA QUALITY / FRESHNESS ==========

export function DataQualityNotices({ values }: { values: Record<string, boolean | number | string | null>[] }) {
  const merged = Object.assign({}, ...values);
  const notices: string[] = [];
  if (merged.excludedCancelledInvoices) notices.push('Cancelled invoices are excluded from all financial metrics.');
  if (Number(merged.excludedCreditCount) > 0 || Number(merged.excludedPrepaidCount) > 0) notices.push(`${Number(merged.excludedCreditCount) || 0} credit and ${Number(merged.excludedPrepaidCount) || 0} prepaid payment records were excluded from cash trends.`);
  if (Number(merged.occupiedWithoutTenant) > 0) notices.push(`${merged.occupiedWithoutTenant} occupied unit(s) have no linked ACTIVE tenant record.`);
  if (Number(merged.vacantWithTenant) > 0) notices.push(`${merged.vacantWithTenant} vacant unit(s) still have an ACTIVE tenant linked.`);
  if (Number(merged.formerTenantsOnOccupiedUnits) > 0) notices.push(`${merged.formerTenantsOnOccupiedUnits} former tenant(s) are still tied to occupied units (informational).`);
  if (Number(merged.leftTenantsMissingLeftAt) > 0) notices.push(`${merged.leftTenantsMissingLeftAt} LEFT tenant(s) are missing a leftAt timestamp — backfill recommended.`);
  if (merged.contractedChargesOnly) notices.push('Service-provider values are configured contracted charges, not invoices, payments, or actual expenses.');
  if (merged.amountsAreDocumentSnapshots) notices.push('Demand-letter amounts are document snapshots. Current arrears continue to come from rent invoices.');
  if (merged.billOverdueIsNotRentArrears) notices.push('Overdue Bill Invoice balances are utility-bill receivables, not rent arrears. Current rent arrears use Invoice.');
  if (merged.propertyAttributionUnavailable) notices.push('This source has no reliable property relationship, so results are restricted to organization or manager scope.');
  if (merged.paidAmountIsDocumentStatusValue) notices.push('Paid Other Income is the value of documents marked PAID; partial cash collection is unavailable.');
  if (merged.configuredSalaryNotNormalized) notices.push('Configured salaries are not normalized across daily, weekly, bi-weekly, and monthly frequencies.');
  if (Number(merged.excludedNonKesRecords) > 0) notices.push(`${merged.excludedNonKesRecords} non-KES record(s) were excluded to prevent mixed-currency totals.`);
  if (!notices.length) return null;
  return (
    <aside className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-100">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        <div>
          <p className="font-semibold">Data-quality notes</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">{notices.map(notice => <li key={notice}>{notice}</li>)}</ul>
        </div>
      </div>
    </aside>
  );
}

export function Freshness({ generatedAt, definition }: { generatedAt: string; definition: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-slate-400">
      <Info className="h-3.5 w-3.5" />
      Live data generated {new Date(generatedAt).toLocaleString('en-KE')} · Metric definitions v{definition}
    </p>
  );
}

// ========== TENANT LIFECYCLE WIDGETS ==========

export function ChurnTrendChart({ data }: { data: { period: string; count: number }[] }) {
  if (!data.length) return <AnalyticsEmpty title="No churn recorded in this period" />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: 4, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="period" stroke={axisStroke} tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis stroke={axisStroke} tick={{ fontSize: 12 }} allowDecimals={false} tickLine={false} width={40} />
        <Tooltip contentStyle={tooltipStyle} formatter={countFormatter} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
        <Bar dataKey="count" name="Departed tenants" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LeftReasonChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data || {}).filter(([, v]) => Number(v) > 0);
  if (!entries.length) return <AnalyticsEmpty title="No left reasons recorded" detail="Departed tenants in this range have no leftReason set." />;
  const colors = ['#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#22d3ee', '#f97316', '#ef4444'];
  const chartData = entries.map(([label, value], i) => ({ name: label.replace(/_/g, ' '), value: Number(value), color: colors[i % colors.length] }));
  return <Donut data={chartData} centerLabel="departures" />;
}

export function DomainDonut({ data, centerLabel }: { data: DomainDistributionItem[]; centerLabel?: string }) {
  const filtered = data.filter(item => Number(item.count) > 0);
  if (!filtered.length) return <AnalyticsEmpty title="Nothing to chart" />;
  const colors = ['#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#22d3ee', '#f97316'];
  return <Donut data={filtered.map((item, i) => ({ name: item.label, value: item.count, color: colors[i % colors.length] }))} centerLabel={centerLabel} />;
}

export function ChurnedTenantsTable({ data }: { data: ChurnedTenant[] }) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-8 text-center">
        <p className="font-medium text-slate-200">No departed tenants</p>
        <p className="mt-1 text-sm text-slate-400">No tenants have left in the selected period.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700">
      <table className="min-w-full divide-y divide-slate-700 text-sm">
        <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">Tenant</th><th className="px-4 py-3">Property / Unit</th>
            <th className="px-4 py-3 text-right">Rent</th><th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3">Left</th><th className="px-4 py-3 text-right">Tenure</th>
            <th className="px-4 py-3">Reason</th><th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700 bg-slate-800/50 text-slate-200">
          {data.map(row => (
            <tr key={row.id} className="hover:bg-slate-700/40">
              <td className="px-4 py-3 font-medium">{row.name}</td>
              <td className="px-4 py-3 text-slate-300">{row.property || '—'}{row.unitNo ? ` · ${row.unitNo}` : ''}</td>
              <td className="px-4 py-3 text-right">{formatMoney(row.rent)}</td>
              <td className="px-4 py-3 text-slate-400">{row.joinedAt ? new Date(row.joinedAt).toLocaleDateString('en-KE') : '—'}</td>
              <td className="px-4 py-3 text-slate-400">{new Date(row.effectiveLeftAt).toLocaleDateString('en-KE')}</td>
              <td className="px-4 py-3 text-right">{row.tenureDays != null ? `${row.tenureDays} d` : '—'}</td>
              <td className="px-4 py-3"><LeftReasonBadge reason={row.leftReason} /></td>
              <td className="px-4 py-3 text-right"><Link className="text-sky-300 hover:underline" href={`/tenants/${row.id}`}>Open</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeftReasonBadge({ reason }: { reason: string | null }) {
  if (!reason) return <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">Unspecified</span>;
  const label = reason.replace(/_/g, ' ');
  const tone: Record<string, string> = {
    LEASE_EXPIRED: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
    VOLUNTARY: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
    EVICTED: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
    NON_PAYMENT: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
    TRANSFERRED: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
    DECEASED: 'bg-slate-500/20 text-slate-200 border-slate-500/40',
    OTHER: 'bg-violet-500/20 text-violet-200 border-violet-500/40',
  };
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${tone[reason] || 'bg-slate-700 text-slate-200 border-slate-600'}`}>{label}</span>;
}

export function LifecycleStatusBadge({ status }: { status: 'ACTIVE' | 'LEFT' | string }) {
  if (status === 'ACTIVE') {
    return <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200">Active</span>;
  }
  return <span className="rounded-full border border-rose-500/40 bg-rose-500/20 px-2 py-0.5 text-xs text-rose-200">Left</span>;
}