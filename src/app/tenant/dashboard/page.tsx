'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  Wallet,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Wrench,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { tenantPortalAPI } from '@/lib/api';
import { Card, LoadingState, ErrorState } from '@/components/tenant/states';
import StatusBadge from '@/components/tenant/StatusBadge';
import { ksh, formatDate } from '@/components/tenant/format';
import type {
  TenantPortalProfileResponse,
  TenantPortalStatementResponse,
  TenantPortalPayment,
  TenantPortalBill,
} from '@/types';

type TenantProfile = TenantPortalProfileResponse['data'];
type TenantStatement = TenantPortalStatementResponse['data'];

export default function TenantDashboardPage() {
  const { user, accountStatus } = useAuth();

  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [statement, setStatement] = useState<TenantStatement | null>(null);
  const [payments, setPayments] = useState<TenantPortalPayment[]>([]);
  const [bills, setBills] = useState<TenantPortalBill[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const run = async () => {
      setDataLoading(true);
      setLoadError('');
      try {
        const [profileRes, statementRes, paymentsRes, billsRes] = await Promise.allSettled([
          tenantPortalAPI.getProfile(),
          tenantPortalAPI.getStatement(),
          tenantPortalAPI.getPayments(),
          tenantPortalAPI.getBills(),
        ]);
        if (cancelled) return;

        if (profileRes.status === 'rejected') {
          throw new Error(
            (profileRes.reason as any)?.message || 'Failed to load your tenancy profile.'
          );
        }
        if (!profileRes.value?.data) {
          throw new Error(
            (profileRes.value as any)?.message || 'Failed to load your tenancy profile.'
          );
        }

        setProfile(profileRes.value.data);
        if (statementRes.status === 'fulfilled' && statementRes.value?.data) {
          setStatement(statementRes.value.data);
        }
        if (paymentsRes.status === 'fulfilled' && paymentsRes.value?.data) {
          setPayments(paymentsRes.value.data.slice(0, 4));
        }
        if (billsRes.status === 'fulfilled' && billsRes.value?.bills?.data) {
          setBills(billsRes.value.bills.data.slice(0, 3));
        }
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
  }, [user]);

  const lifecycle = profile?.lifecycle;
  const isActive = lifecycle?.isActive ?? false;
  const nextPayment = statement?.paymentSummary?.nextPayment;
  const outstanding = nextPayment?.amount ?? 0;
  const isOverdue = nextPayment?.isOverdue ?? false;
  const rentInfo = statement?.rentInfo;

  return (
    <>
      {accountStatus && accountStatus !== 'ACTIVE' && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="text-sm">
            <p className="font-medium text-amber-900">
              Account status: {accountStatus.replace('_', ' ')}
            </p>
            <p className="mt-0.5 text-amber-800">
              Some features may be limited until your account is fully activated.
            </p>
          </div>
        </div>
      )}

      <ErrorState message={loadError} />

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <div className="min-w-0 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-emerald-800">
            <Home className="h-5 w-5" />
            <span className="text-sm font-medium">My Unit</span>
          </div>
          <p className="mt-2 truncate font-semibold text-slate-900">
            {dataLoading ? '…' : profile?.property?.name ?? '—'}
          </p>
          <p className="truncate text-sm text-emerald-800">
            {dataLoading ? '' : profile?.unit?.unitNo ? `Unit ${profile.unit.unitNo}` : ''}
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-purple-200 bg-purple-50 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-purple-800">
            <CalendarClock className="h-5 w-5" />
            <span className="text-sm font-medium">Next Rent Due</span>
          </div>
          <p className="mt-2 truncate font-semibold text-slate-900">
            {dataLoading ? '…' : nextPayment?.dueDateFormatted || formatDate(nextPayment?.dueDate)}
          </p>
          <p className="truncate text-sm text-purple-800">
            {dataLoading ? '' : nextPayment ? ksh(nextPayment.amount) : ''}
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-blue-800">
            <Wallet className="h-5 w-5" />
            <span className="text-sm font-medium">Last Payment</span>
          </div>
          <p className="mt-2 truncate font-semibold text-slate-900">
            {dataLoading ? '…' : payments[0] ? ksh(payments[0].amountPaid) : '—'}
          </p>
          <p className="truncate text-sm text-blue-800">
            {dataLoading ? '' : payments[0] ? formatDate(payments[0].datePaid) : 'No payments yet'}
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Tenancy Status</span>
          </div>
          <p className="mt-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                dataLoading
                  ? 'bg-slate-200 text-slate-700'
                  : isActive
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 text-white'
              }`}
            >
              {dataLoading ? '…' : isActive ? 'Active' : (lifecycle?.status ?? 'Inactive')}
            </span>
          </p>
          <p className="truncate text-sm text-emerald-800">
            {lifecycle?.isFrozen ? 'Tenancy currently frozen' : 'All good'}
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card
          title="Rent Account Overview"
          className="min-w-0 lg:col-span-2"
        >
          {dataLoading ? (
            <LoadingState label="Loading your rent account…" />
          ) : (
            <>
              {statement?.freezeWarning && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                  <p className="font-medium text-amber-900">{statement.freezeWarning}</p>
                </div>
              )}

              <div
                className={`flex items-start gap-3 rounded-xl border p-4 sm:gap-4 sm:p-5 ${
                  isOverdue ? 'border-red-300 bg-red-50' : 'border-emerald-300 bg-emerald-50'
                }`}
              >
                {isOverdue ? (
                  <AlertTriangle className="h-8 w-8 shrink-0 text-red-700 sm:h-10 sm:w-10" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-700 sm:h-10 sm:w-10" />
                )}
                <div className="min-w-0">
                  <p className={`font-semibold ${isOverdue ? 'text-red-900' : 'text-black'}`}>
                    {isOverdue
                      ? 'Payment overdue'
                      : outstanding > 0
                        ? 'Next payment coming up'
                        : 'Account in Good Standing'}
                  </p>
                  <p className={`mt-1 text-sm ${isOverdue ? 'text-red-900' : 'text-slate-800'}`}>
                    {isOverdue
                      ? `Your rent of ${ksh(outstanding)} is past its due date. Please settle it as soon as possible.`
                      : outstanding > 0
                        ? `Your next payment of ${ksh(outstanding)} is due ${nextPayment?.dueDateFormatted || formatDate(nextPayment?.dueDate)}.`
                        : 'Thank you for keeping up with your rent!'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-black">Outstanding Balance</p>
                  <p
                    className={`mt-1 truncate text-xl font-bold sm:text-2xl ${
                      isOverdue ? 'text-red-700' : outstanding > 0 ? 'text-black' : 'text-emerald-700'
                    }`}
                  >
                    {ksh(outstanding)}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-black">Monthly Rent</p>
                  <p className="mt-1 truncate text-xl font-bold text-black sm:text-2xl">
                    {ksh(rentInfo?.monthlyRent ?? profile?.tenant?.rent)}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-black">Service Charge (monthly)</p>
                  <p className="mt-1 truncate text-xl font-bold text-black sm:text-2xl">
                    {ksh(rentInfo?.serviceCharge?.monthly)}
                  </p>
                </div>
              </div>
            </>
          )}
        </Card>

        <Card title="Quick Actions" className="min-w-0">
          <div className="space-y-2">
            <QuickButton href="/tenant/payments" icon={<Wallet className="h-4 w-4" />} label="Make Payment" primary />
            <QuickButton href="/tenant/maintenance" icon={<Wrench className="h-4 w-4" />} label="Request Maintenance" />
            <QuickButton href="/tenant/lease" icon={<Home className="h-4 w-4" />} label="View My Lease" />
            <QuickButton href="/tenant/profile" icon={<User className="h-4 w-4" />} label="Update Profile" />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card
          title="Rent Payment History"
          className="min-w-0 lg:col-span-2"
          action={
            <Link href="/tenant/payments" className="shrink-0 text-xs font-medium text-[#005478] hover:underline visited:text-[#005478] sm:text-sm">
              View All →
            </Link>
          }
        >
          {dataLoading ? (
            <LoadingState label="Loading payments…" />
          ) : payments.length === 0 ? (
            <EmptyPayments />
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-130 text-sm">
                <thead>
                  <tr className="border-b border-slate-300 text-left">
                    <th className="pb-2 font-semibold text-black">Date Paid</th>
                    <th className="pb-2 font-semibold text-black">Period</th>
                    <th className="pb-2 font-semibold text-black">Amount</th>
                    <th className="pb-2 font-semibold text-black">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-200 last:border-0">
                      <td className="whitespace-nowrap py-3 font-medium text-black">{formatDate(p.datePaid)}</td>
                      <td className="whitespace-nowrap py-3 font-medium text-black">{p.paymentPeriod}</td>
                      <td className="whitespace-nowrap py-3 font-semibold text-black">{ksh(p.amountPaid)}</td>
                      <td className="py-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card
          title="Utility Bills"
          className="min-w-0"
          action={
            <Link href="/tenant/payments" className="shrink-0 text-xs font-medium text-[#005478] hover:underline visited:text-[#005478] sm:text-sm">
              View All →
            </Link>
          }
        >
          {dataLoading ? (
            <LoadingState label="Loading bills…" />
          ) : bills.length === 0 ? (
            <EmptyBills />
          ) : (
            <ul className="space-y-3">
              {bills.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-black">
                      {b.type === 'WATER' ? 'Water Bill' : 'Electricity Bill'}
                    </p>
                    <p className="truncate text-xs font-medium text-slate-700">
                      {ksh(b.grandTotal)}
                      {b.dueDate ? ` · Due ${formatDate(b.dueDate)}` : ''}
                    </p>
                  </div>
                  <span className="ml-2 shrink-0">
                    <StatusBadge status={b.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function EmptyPayments() {
  return (
    <div className="py-10 text-center">
      <Wallet className="mx-auto h-8 w-8 text-slate-400" />
      <p className="mt-2 text-sm text-slate-500">No payments recorded yet.</p>
    </div>
  );
}

function EmptyBills() {
  return (
    <div className="py-10 text-center">
      <Wrench className="mx-auto h-8 w-8 text-slate-400" />
      <p className="mt-2 text-sm text-slate-500">No bills issued yet.</p>
    </div>
  );
}

function QuickButton({ href, icon, label, primary }: {
  href: string; icon: React.ReactNode; label: string; primary?: boolean;
}) {
  const primaryCls =
    'bg-[#005478] text-white hover:bg-[#004460] active:bg-[#00364d]';
  const secondaryCls =
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100';

  const textCls = primary ? 'text-white' : 'text-slate-800';
  const iconCls = primary ? 'text-white' : 'text-slate-600';

  return (
    <Link
      href={href}
      className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition sm:justify-start ${
        primary ? primaryCls : secondaryCls
      }`}
    >
      <span className={`shrink-0 ${iconCls}`}>{icon}</span>
      <span className={textCls}>{label}</span>
    </Link>
  );
}