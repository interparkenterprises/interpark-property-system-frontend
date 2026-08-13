'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, Info } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { AnalyticsEmpty } from './AnalyticsStates';
import type {
  CollectionTrendPoint, PropertyRevenue, ReceivablesStatusDistribution,
  ReceivablesTrendPoint
} from '@/types/analytics';
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat';

const money = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('en-KE');

export const formatMoney = (value: number | null | undefined) => value == null ? 'Not available' : money.format(value);
export const formatCompactMoney = (value: number | null | undefined) => value == null ? 'Not available' : formatCompactKes(value);
export const formatPercent = (value: number | null | undefined) => value == null ? 'Not available' : `${value.toFixed(2)}%`;

export function KpiCard({ label, value, detail, href, fullValueTitle, tone = 'sky' }: {
  label: string; value: string; detail?: string; href?: string; fullValueTitle?: string; tone?: 'sky' | 'emerald' | 'amber' | 'rose';
}) {
  const tones = {
    sky: 'from-sky-500/20 to-sky-900/10 border-sky-500/30',
    emerald: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/30',
    amber: 'from-amber-500/20 to-amber-900/10 border-amber-500/30',
    rose: 'from-rose-500/20 to-rose-900/10 border-rose-500/30',
  };
  const content = <div className={`h-full rounded-2xl border bg-linear-to-br p-5 shadow-lg ${tones[tone]}`}>
    <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-slate-300">{label}</p>{href && <ArrowUpRight className="h-4 w-4 text-slate-400" />}</div>
    <p className="kpi-value mt-3 font-bold tracking-tight text-white" title={fullValueTitle}>{value}</p>
    {detail && <p className="mt-2 text-xs text-slate-400">{detail}</p>}
  </div>;
  return href ? <Link href={href} className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400">{content}</Link> : content;
}

export const exactMoneyTitle = (value: number | null | undefined) => value == null ? undefined : formatExactKes(value);

export function ChartPanel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-700 bg-slate-800/70 p-5 shadow-xl">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      <div className="mt-5 w-full h-75 min-h-75 relative">
        {children}
      </div>
    </section>
  );
}

const tooltipStyle = { background: '#0f172a', border: '1px solid #475569', borderRadius: 10, color: '#fff' };
const currencyTick = (value: number) => value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}m` : value >= 1_000 ? `${Math.round(value / 1_000)}k` : String(value);

export function CollectionsTrendChart({ data }: { data: CollectionTrendPoint[] }) {
  if (!data.length) return <AnalyticsEmpty title="No recorded collections" />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 4, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="period" stroke="#94a3b8" tick={{ fontSize: 12 }} />
        <YAxis stroke="#94a3b8" tickFormatter={currencyTick} tick={{ fontSize: 12 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatMoney(Number(value))} />
        <Line type="monotone" dataKey="collected" name="Recorded collections" stroke="#38bdf8" strokeWidth={3} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ReceivablesTrendChart({ data }: { data: ReceivablesTrendPoint[] }) {
  if (!data.length) return <AnalyticsEmpty title="No receivables in this period" />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: 4, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="period" stroke="#94a3b8" tick={{ fontSize: 12 }} />
        <YAxis stroke="#94a3b8" tickFormatter={currencyTick} tick={{ fontSize: 12 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatMoney(Number(value))} />
        <Legend />
        <Bar dataKey="billed" name="Billed" fill="#38bdf8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="paid" name="Paid" fill="#34d399" radius={[4, 4, 0, 0]} />
        <Bar dataKey="outstanding" name="Outstanding" fill="#fb7185" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusDistributionChart({ data }: { data: ReceivablesStatusDistribution }) {
  const values = [
    { name: 'Paid', value: data.paid.count, color: '#34d399' },
    { name: 'Partial', value: data.partial.count, color: '#fbbf24' },
    { name: 'Unpaid', value: data.unpaid.count, color: '#fb7185' },
    { name: 'Overdue', value: data.overdue?.count || 0, color: '#ef4444' }
  ];
  const filteredValues = values.filter(v => v.value > 0);
  if (filteredValues.length === 0) return <AnalyticsEmpty title="No invoice statuses" />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={filteredValues} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
          {filteredValues.map(item => <Cell key={item.name} fill={item.color} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => number.format(Number(value))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RevenueByPropertyChart({ data }: { data: PropertyRevenue[] }) {
  if (!data.length) return <AnalyticsEmpty title="No property revenue" />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ left: 16, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis type="number" stroke="#94a3b8" tickFormatter={currencyTick} />
        <YAxis type="category" dataKey="propertyName" width={105} stroke="#94a3b8" tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatMoney(Number(value))} />
        <Bar dataKey="paid" name="Allocated collections" fill="#38bdf8" radius={[0, 5, 5, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueTable({ data }: { data: PropertyRevenue[] }) {
  if (!data.length) return null;
  return <div className="overflow-x-auto rounded-xl border border-slate-700"><table className="min-w-full divide-y divide-slate-700 text-sm">
    <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-3">Property</th><th className="px-4 py-3 text-right">Billed</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3 text-right">Outstanding</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Invoices</th></tr></thead>
    <tbody className="divide-y divide-slate-700 bg-slate-800/50 text-slate-200">{data.map(row => <tr key={row.propertyId} className="hover:bg-slate-700/40"><td className="px-4 py-3 font-medium">{row.propertyName}</td><td className="px-4 py-3 text-right">{formatMoney(row.billed)}</td><td className="px-4 py-3 text-right">{formatMoney(row.paid)}</td><td className="px-4 py-3 text-right">{formatMoney(row.outstanding)}</td><td className="px-4 py-3 text-right">{formatPercent(row.collectionRate)}</td><td className="px-4 py-3 text-right">{number.format(row.invoiceCount)}</td></tr>)}</tbody>
  </table></div>;
}

export function DataQualityNotices({ values }: { values: Record<string, boolean | number | string | null>[] }) {
  const merged = Object.assign({}, ...values);
  const notices: string[] = [];
  if (merged.excludedCancelledInvoices) notices.push('Cancelled invoices are excluded from all financial metrics.');
  if (Number(merged.excludedCreditCount) > 0 || Number(merged.excludedPrepaidCount) > 0) notices.push(`${Number(merged.excludedCreditCount) || 0} credit and ${Number(merged.excludedPrepaidCount) || 0} prepaid payment records were excluded from cash trends.`);
  if (Number(merged.occupiedWithoutTenant) > 0) notices.push(`${merged.occupiedWithoutTenant} occupied unit(s) have no linked tenant record.`);
  if (merged.lifecycleStatusUnavailable) notices.push('Tenant count represents current tenant records; tenant lifecycle history is unavailable.');
  if (merged.contractedChargesOnly) notices.push('Service-provider values are configured contracted charges, not invoices, payments, or actual expenses.');
  if (merged.amountsAreDocumentSnapshots) notices.push('Demand-letter amounts are document snapshots. Current arrears continue to come from rent invoices.');
  if (merged.billOverdueIsNotRentArrears) notices.push('Overdue Bill Invoice balances are utility-bill receivables, not rent arrears. Current rent arrears use Invoice.');
  if (merged.propertyAttributionUnavailable) notices.push('This source has no reliable property relationship, so results are restricted to organization or manager scope.');
  if (merged.paidAmountIsDocumentStatusValue) notices.push('Paid Other Income is the value of documents marked PAID; partial cash collection is unavailable.');
  if (merged.configuredSalaryNotNormalized) notices.push('Configured salaries are not normalized across daily, weekly, bi-weekly, and monthly frequencies.');
  if (Number(merged.excludedNonKesRecords) > 0) notices.push(`${merged.excludedNonKesRecords} non-KES record(s) were excluded to prevent mixed-currency totals.`);
  if (!notices.length) return null;
  return <aside className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-100"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><div><p className="font-semibold">Data-quality notes</p><ul className="mt-2 list-disc space-y-1 pl-5">{notices.map(notice => <li key={notice}>{notice}</li>)}</ul></div></div></aside>;
}

export function Freshness({ generatedAt, definition }: { generatedAt: string; definition: string }) {
  return <p className="flex items-center gap-1.5 text-xs text-slate-400"><Info className="h-3.5 w-3.5" />Live data generated {new Date(generatedAt).toLocaleString('en-KE')} · Metric definitions v{definition}</p>;
}