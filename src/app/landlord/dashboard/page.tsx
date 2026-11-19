'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Wallet,
  DoorOpen,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { landlordPortalAPI } from '@/lib/api';
import { StatCard } from '@/components/DashboardShell';
import {
  ksh,
  monthLabel,
  periodLabel,
  Pill,
  dateLabel,
} from '@/components/landlord/shared';
import type {
  LandlordPortalPropertySummary,
  LandlordPortalCommission,
} from '@/types';

interface MonthIncome {
  label: string;
  income: number;
}

export default function LandlordDashboardPage() {
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [properties, setProperties] = useState<LandlordPortalPropertySummary[]>([]);
  const [stats, setStats] = useState({ properties: 0, units: 0, tenants: 0, occupied: 0 });
  const [income, setIncome] = useState<MonthIncome[]>([]);
  const [commissions, setCommissions] = useState<LandlordPortalCommission[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setDataLoading(true);
      setLoadError('');
      try {
        const [profileRes, propsRes] = await Promise.all([
          landlordPortalAPI.getProfile(),
          landlordPortalAPI.getProperties(),
        ]);
        if (cancelled) return;

        if (!profileRes?.data || !propsRes?.data) {
          throw new Error(
            (propsRes as any)?.message ||
              (profileRes as any)?.message ||
              'Failed to load your portal data.'
          );
        }

        const props: LandlordPortalPropertySummary[] = propsRes.data;
        const unitCount = profileRes.data.stats?.unitCount ?? 0;

        const [unitLists, tenantLists, commissionsRes] = await Promise.allSettled([
          Promise.all(props.map((p) => landlordPortalAPI.getPropertyUnits(p.id))),
          Promise.all(props.map((p) => landlordPortalAPI.getPropertyTenants(p.id, 'ACTIVE'))),
          landlordPortalAPI.getCommissions({ limit: 24 }),
        ]);
        if (cancelled) return;

        const allUnits =
          unitLists.status === 'fulfilled' ? unitLists.value.flatMap((r) => r?.data ?? []) : [];
        const occupied = allUnits.filter(
          (u) => (u?.status ?? '').toUpperCase() === 'OCCUPIED'
        ).length;

        const activeTenants =
          tenantLists.status === 'fulfilled'
            ? tenantLists.value.reduce(
                (sum, res) => sum + (res?.metadata?.activeTenantsCount ?? 0),
                0
              )
            : 0;

        const commissions: LandlordPortalCommission[] =
          commissionsRes.status === 'fulfilled' ? commissionsRes.value?.data ?? [] : [];

        const byMonth = new Map<string, number>();
        [...commissions]
          .sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime())
          .forEach((c) => {
            const key = monthLabel(c.periodStart);
            byMonth.set(key, (byMonth.get(key) ?? 0) + (c.incomeAmount ?? 0));
          });

        if (cancelled) return;
        setProperties(props);
        setStats({
          properties: profileRes.data.stats?.propertyCount ?? props.length,
          units: unitCount,
          tenants: activeTenants,
          occupied,
        });
        setIncome(
          Array.from(byMonth.entries())
            .slice(-6)
            .map(([label, val]) => ({ label, income: val }))
        );
        setCommissions([...commissions].reverse().slice(0, 5));
      } catch (err: any) {
        if (!cancelled) setLoadError(err?.message || 'Failed to load dashboard data.');
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const occupancy = stats.units > 0 ? Math.round((stats.occupied / stats.units) * 100) : 0;
  const vacant = Math.max(stats.units - stats.occupied, 0);
  const maxIncome = Math.max(...income.map((b) => b.income), 1);

  return (
    <>
      {loadError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-700" />
          <p>{loadError}</p>
        </div>
      )}

      <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Building2 className="h-5 w-5" />} iconBg="bg-blue-50 text-blue-700"
          label="Total Properties" value={dataLoading ? '…' : String(stats.properties)} hint="Managed for you" />
        <StatCard icon={<Users className="h-5 w-5" />} iconBg="bg-emerald-50 text-emerald-700"
          label="Active Tenants" value={dataLoading ? '…' : String(stats.tenants)} hint="Across all properties" />
        <StatCard icon={<DoorOpen className="h-5 w-5" />} iconBg="bg-purple-50 text-purple-700"
          label="Total Units" value={dataLoading ? '…' : String(stats.units)} hint="Occupied + vacant" />
        <StatCard icon={<Wallet className="h-5 w-5" />} iconBg="bg-amber-50 text-amber-700"
          label="Occupancy Rate" value={dataLoading ? '…' : `${occupancy}%`} hint="Calculated: occupied / units" />
      </section>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 min-w-0">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Rental Income Overview</h2>
            <span className="text-xs sm:text-sm text-[#005478] font-medium shrink-0">From commissions</span>
          </div>
          {dataLoading ? (
            <div className="h-56 sm:h-64 flex items-center justify-center text-sm text-slate-600">
              Loading income data…
            </div>
          ) : income.length === 0 ? (
            <div className="h-56 sm:h-64 flex flex-col items-center justify-center text-center">
              <Wallet className="h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm text-slate-600 px-4">
                No commission income recorded yet. Monthly income will appear here.
              </p>
            </div>
          ) : (
            <div className="h-56 sm:h-64 flex items-end justify-between gap-2 sm:gap-3 px-1 sm:px-2">
              {income.map((m) => (
                <div key={m.label} className="flex flex-col items-center gap-2 flex-1 h-full justify-end min-w-0">
                  <span className="text-[10px] sm:text-xs font-medium text-slate-700 truncate">
                    {m.income >= 1000 ? `${Math.round(m.income / 1000)}K` : m.income}
                  </span>
                  <div
                    className="w-full max-w-10 rounded-t-md bg-[#005478]"
                    style={{ height: `${Math.max((m.income / maxIncome) * 100, 4)}%` }}
                  />
                  <span className="text-[10px] sm:text-xs text-slate-600 truncate w-full text-center">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Property Status</h2>
          {dataLoading ? (
            <div className="h-40 flex items-center justify-center text-sm text-slate-600">Loading…</div>
          ) : (
            <>
              <div className="flex items-center justify-center">
                <div className="relative h-36 w-36 sm:h-40 sm:w-40">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="16" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="16"
                      strokeDasharray={`${(occupancy / 100) * 251} 251`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900">{occupancy}%</p>
                    <p className="text-xs text-slate-600">Occupied</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Occupied
                  </span>
                  <span className="font-medium text-slate-900">{stats.occupied} units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> Vacant
                  </span>
                  <span className="font-medium text-slate-900">{vacant} units</span>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 min-w-0">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Recent Commission Statements</h2>
            <Link href="/landlord/payments" className="text-xs sm:text-sm text-[#005478] font-medium hover:underline shrink-0">
              View All →
            </Link>
          </div>
          {dataLoading ? (
            <div className="py-10 text-center text-sm text-slate-600">Loading…</div>
          ) : commissions.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm text-slate-600">No commission records yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-sm min-w-150">
                <thead>
                  <tr className="text-left text-slate-700 border-b border-slate-200">
                    <th className="pb-2 font-medium">Property</th>
                    <th className="pb-2 font-medium">Period</th>
                    <th className="pb-2 font-medium">Income</th>
                    <th className="pb-2 font-medium">Commission</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-medium text-slate-900">{c.property?.name ?? '—'}</td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">{periodLabel(c.periodStart, c.periodEnd)}</td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">{ksh(c.incomeAmount)}</td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">{ksh(c.commissionAmount)}</td>
                      <td className="py-3"><Pill value={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 min-w-0">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Your Properties</h2>
            <Link href="/landlord/properties" className="text-xs sm:text-sm text-[#005478] font-medium hover:underline shrink-0">
              View All →
            </Link>
          </div>
          {dataLoading ? (
            <div className="py-10 text-center text-sm text-slate-600">Loading…</div>
          ) : properties.length === 0 ? (
            <div className="py-10 text-center">
              <Building2 className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm text-slate-600">No properties assigned yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {properties.slice(0, 4).map((p) => (
                <li key={p.id} className="rounded-xl border border-slate-200 p-4">
                  <Link href={`/landlord/properties/${p.id}`} className="font-medium text-slate-900 truncate hover:text-[#005478] hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-xs text-slate-600 truncate">{p.address}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {p.manager ? `Manager: ${p.manager.name}` : 'No manager assigned'} ·{' '}
                    {p._count?.units ?? 0} units
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
