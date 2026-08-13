'use client';

import { useCallback, useEffect, useState } from 'react';
import { employeesAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { StatisticsResponse } from '@/types';
import { AnalyticsError, AnalyticsLoading, AnalyticsUnauthorized } from './AnalyticsStates';
import { formatMoney, KpiCard } from './AnalyticsWidgets';

export default function WorkforceAnalytics() {
  const auth = useAuth();
  const authorized = auth.isAdmin || auth.isManager;
  const [data, setData] = useState<StatisticsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!authorized) { setLoading(false); return; }
    setLoading(true); setError(null);
    try { const response = await employeesAPI.getStatistics(); setData(response.data); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Employee statistics could not be loaded.'); }
    finally { setLoading(false); }
  }, [authorized]);
  useEffect(() => { load(); }, [load]);
  if (!authorized) return <AnalyticsUnauthorized detail="Workforce salary statistics are restricted to administrators and managers by the existing employee API." />;
  if (loading) return <AnalyticsLoading />;
  if (error) return <AnalyticsError message={error} retry={load} />;
  return <div className="space-y-6 text-white"><header><p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">Interpark intelligence</p><h1 className="mt-2 text-3xl font-bold">Workforce statistics</h1><p className="mt-2 text-slate-400">Current persisted employee and salary-payment facts from the existing employee statistics endpoint.</p></header>
    {data && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Total employees" value={data.totalEmployees.toLocaleString()} /><KpiCard label="Active employees" value={data.activeEmployees.toLocaleString()} tone="emerald" /><KpiCard label="Pending payments" value={data.pendingPayments.toLocaleString()} tone="amber" /><KpiCard label="Total paid this month" value={formatMoney(data.totalPaidThisMonth)} detail={`Payment period ${data.currentPeriod}`} tone="sky" /></div><div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 text-sm text-sky-100">Release A does not expose a dedicated workforce analytics endpoint. This view intentionally shows only the safe existing employee statistics and does not infer payroll liability, deductions, productivity, or normalized annual payroll.</div></>}
  </div>;
}