'use client';

import { useCallback, useEffect, useState } from 'react';
import { employeesAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { StatisticsResponse } from '@/types';
import { AnalyticsError, AnalyticsLoading, AnalyticsUnauthorized } from './AnalyticsStates';
import { AnalyticsPageHeader } from './AnalyticsNavigation';
import { Explain, formatMoney, KpiCard } from './AnalyticsWidgets';

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

  return (
    <div className="space-y-6 text-white">
      <AnalyticsPageHeader
        title="Workforce statistics"
        description="Current persisted employee and salary-payment facts from the existing employee statistics endpoint."
      />
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Total employees" value={data.totalEmployees.toLocaleString()}
              tooltip="All employee records, including inactive ones." tone="sky" />
            <KpiCard label="Active employees" value={data.activeEmployees.toLocaleString()}
              tooltip="Employees currently marked active — the headcount your payroll scales with." tone="emerald" />
            <KpiCard label="Pending payments" value={data.pendingPayments.toLocaleString()}
              tooltip="Salary payments recorded but not yet completed. A rising count usually means a processing bottleneck." tone="amber" />
            <KpiCard label="Total paid this month" value={formatMoney(data.totalPaidThisMonth)}
              detail={`Payment period ${data.currentPeriod}`}
              tooltip="Cash actually paid out for the current salary period." tone="sky" />
          </div>
          <Explain title="What this view deliberately does not show">
            Release A does not expose a dedicated workforce analytics endpoint. This view intentionally shows only the
            safe existing employee statistics and does not infer payroll liability, deductions, productivity, or
            normalized annual payroll — configured salaries are not normalized across daily, weekly, bi-weekly, and
            monthly frequencies, so any derived total would mislead.
          </Explain>
        </>
      )}
    </div>
  );
}