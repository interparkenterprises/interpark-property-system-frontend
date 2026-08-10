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

type Domain = 'bill-invoices' | 'service-providers' | 'commissions' | 'demand-letters' | 'tenants' | 'other-income' | 'employees';
const config: Record<Domain, { title: string; endpoint: string; property: boolean; permission?: string; roles?: boolean; drill: string; labels: Record<string, string> }> = {
  'bill-invoices': { title: 'Bill invoice analytics', endpoint: 'bill-invoices/summary', property: true, permission: 'VIEW_BILL_INVOICES', drill: '/properties', labels: { invoiceCount: 'Bill invoices', billed: 'Total billed', paid: 'Amount paid', outstanding: 'Outstanding', overdueBillBalance: 'Overdue bill balance', collectionRate: 'Collection rate' } },
  'service-providers': { title: 'Service provider analytics', endpoint: 'service-providers/summary', property: true, permission: 'VIEW_SERVICE_PROVIDERS', drill: '/properties', labels: { providerCount: 'Providers', contractedCharges: 'Contracted charges', averageContractedCharge: 'Average contracted charge' } },
  commissions: { title: 'Commission analytics', endpoint: 'commissions/summary', property: true, permission: 'VIEW_COMMISSIONS', drill: '/myIncome', labels: { commissionCount: 'Commissions', totalCommission: 'Total commission', paidCommission: 'Paid commission', pendingCommission: 'Pending / processing' } },
  'demand-letters': { title: 'Demand letter analytics', endpoint: 'demand-letters/summary', property: true, permission: 'VIEW_DEMAND_LETTERS', drill: '/payments', labels: { letterCount: 'Demand letters', documentSnapshotAmount: 'Document snapshot amount', partialPaymentRecorded: 'Partial payment recorded', settledCount: 'Settled', escalatedCount: 'Escalated' } },
  tenants: { title: 'Tenant analytics', endpoint: 'tenants/insights', property: true, permission: 'VIEW_TENANTS', drill: '/properties', labels: { currentTenants: 'Current tenants', currentRentRoll: 'Current rent roll', averageRent: 'Average rent', depositsHeld: 'Deposits held' } },
  'other-income': { title: 'Other income analytics', endpoint: 'other-income/summary', property: false, roles: true, drill: '/myIncome/other', labels: { invoiceCount: 'Income documents', invoicedAmount: 'Invoiced amount', paidDocumentAmount: 'Paid document value', vatAmount: 'VAT amount' } },
  employees: { title: 'Employee and salary analytics', endpoint: 'employees/summary', property: false, roles: true, drill: '/employees', labels: { employeeCount: 'Employees', activeEmployees: 'Active employees', configuredSalaryTotal: 'Configured salaries', averageConfiguredSalary: 'Average configured salary', salaryPaidInRange: 'Salary paid in range' } },
};
const moneyKeys = /amount|paid|billed|outstanding|arrears|rent|deposit|salary|commission|charge/i;
const dateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const initial = (): Filters => { const now = new Date(); return { dateFrom: dateString(new Date(now.getFullYear(), now.getMonth() - 5, 1)), dateTo: dateString(now), asOf: dateString(now), grain: 'month' }; };
const colors = ['#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#22d3ee', '#f97316'];
const tooltipStyle = { background: '#0f172a', border: '1px solid #475569', borderRadius: 10, color: '#fff' };

export default function DomainAnalyticsDashboard({ domain }: { domain: Domain }) {
  const definition = config[domain]; const auth = useAuth();
  const authorized = definition.roles ? auth.isAdmin || auth.isManager : auth.isAdmin || auth.isManager || auth.hasPermission(definition.permission || '');
  const [draft, setDraft] = useState<Filters>(initial); const [filters, setFilters] = useState<Filters>(initial);
  const [properties, setProperties] = useState<Property[]>([]); const [response, setResponse] = useState<{ data: DomainAnalytics; meta: any } | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<AnalyticsApiFailure | null>(null);
  useEffect(() => { if (authorized && definition.property) propertiesAPI.getAll().then(value => setProperties(Array.isArray(value) ? value : [])).catch(() => setProperties([])); }, [authorized, definition.property]);
  const load = useCallback(async () => { if (!authorized) { setLoading(false); return; } setLoading(true); setError(null); try { setResponse(await analyticsAPI.getDomain(definition.endpoint, definition.property ? filters : { ...filters, propertyId: undefined, landlordId: undefined })); } catch (e) { setResponse(null); setError(toAnalyticsApiFailure(e)); } finally { setLoading(false); } }, [authorized, definition.endpoint, definition.property, filters]);
  useEffect(() => { load(); }, [load]);
  const ranking = useMemo(() => response?.data.byProperty || [], [response]);
  return <div className="space-y-6 text-white">
    <AnalyticsPageHeader title={definition.title} description={`Live database metrics${definition.property ? ' restricted to accessible properties.' : ` at ${response?.data.scope?.toLowerCase() || 'authorized'} scope; no property attribution is inferred.`}`} />
    {!authorized ? <AnalyticsUnauthorized detail={`You do not have permission to view ${definition.title.toLowerCase()}.`} /> : <>
    <AnalyticsFilters value={draft} properties={definition.property ? properties : []} showProperty={definition.property} disabled={loading} onChange={setDraft} onApply={() => setFilters({ ...draft, asOf: draft.dateTo, propertyId: definition.property ? draft.propertyId : undefined })} />
    {loading ? <AnalyticsLoading /> : error ? <AnalyticsError message={error.message} backendUnavailable={error.backendUnavailable} retry={load} /> : response ? <>
      <DataQualityNotices values={[response.meta.dataQuality]} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(response.data.summary).map(([key, value]) => { const monetary = moneyKeys.test(key); return <KpiCard key={key} label={definition.labels[key] || key} value={monetary ? formatCompactMoney(value) : value == null ? 'Not available' : Number(value).toLocaleString('en-KE')} fullValueTitle={monetary ? exactMoneyTitle(value) : undefined} href={definition.drill} />; })}</div>
      <div className="grid gap-6 xl:grid-cols-2"><ChartPanel title="Trend" subtitle="Values grouped by the selected date grain">{response.data.trend.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={response.data.trend}><CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="period" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/><Tooltip contentStyle={tooltipStyle} formatter={v => formatMoney(Number(v))}/><Line dataKey="amount" stroke="#38bdf8" strokeWidth={3}/></LineChart></ResponsiveContainer> : <AnalyticsEmpty title="No data for selected period" detail="No records matched the selected date and property filters."/>}</ChartPanel>
      <ChartPanel title="Status distribution">{response.data.statusDistribution.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={response.data.statusDistribution} dataKey="count" nameKey="label" innerRadius={55} outerRadius={90}>{response.data.statusDistribution.map((x, i) => <Cell key={x.label} fill={colors[i % colors.length]}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/><Legend/></PieChart></ResponsiveContainer> : <AnalyticsEmpty title="No status data available" detail="This domain has no status dimension, or no status records matched the selected filters."/>}</ChartPanel></div>
      <div className="grid gap-6 xl:grid-cols-2"><ChartPanel title="Category distribution">{response.data.categoryDistribution.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={response.data.categoryDistribution}><CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="label" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/><Tooltip contentStyle={tooltipStyle} formatter={v => formatMoney(Number(v))}/><Bar dataKey="amount" fill="#34d399"/></BarChart></ResponsiveContainer> : <AnalyticsEmpty title="No category data available" detail="This domain has no category dimension, or no category records matched the selected filters."/>}</ChartPanel>
      {definition.property && <ChartPanel title="Top properties" subtitle="Highest to lowest value in the selected range">{ranking.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={ranking.slice(0, 10)} layout="vertical"><XAxis type="number" stroke="#94a3b8"/><YAxis type="category" dataKey="propertyName" width={110} stroke="#94a3b8"/><Tooltip contentStyle={tooltipStyle} formatter={v => formatMoney(Number(v))}/><Bar dataKey="amount" fill="#a78bfa"/></BarChart></ResponsiveContainer> : <AnalyticsEmpty title="No property records matched" detail="Try another date range or choose all accessible properties."/>}</ChartPanel>}</div>
      {definition.property && ranking.length > 0 && <section className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5"><h2 className="text-lg font-semibold">Property comparison and drill-down</h2><div className="mt-4 overflow-x-auto"><table className="min-w-full text-sm"><thead className="text-left text-slate-400"><tr><th className="p-3">Property</th><th className="p-3 text-right">Records</th><th className="p-3 text-right">Value</th><th className="p-3"></th></tr></thead><tbody>{ranking.map(row => <tr key={row.propertyId} className="border-t border-slate-700"><td className="p-3">{row.propertyName}</td><td className="p-3 text-right">{row.count}</td><td className="p-3 text-right">{formatMoney(row.amount)}</td><td className="p-3 text-right"><Link className="text-sky-300" href={`/properties/${row.propertyId}`}>Open property</Link></td></tr>)}</tbody></table></div><p className="mt-3 text-xs text-slate-400">Top: {ranking[0].propertyName} · Bottom: {ranking[ranking.length - 1].propertyName}</p></section>}
      <Freshness generatedAt={response.meta.generatedAt} definition={response.meta.definitionsVersion}/>
    </> : null}</>}
  </div>;
}
