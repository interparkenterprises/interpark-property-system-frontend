'use client';

import { useCallback, useEffect, useState } from 'react';
import { Wallet, Percent } from 'lucide-react';
import { landlordPortalAPI } from '@/lib/api';
import { ksh, dateLabel, periodLabel, Pill, ErrorNote, EmptyState, Panel } from '@/components/landlord/shared';
import type {
  LandlordPortalCommission,
  LandlordPortalPropertySummary,
  PortalPagination,
  CommissionStatus,
} from '@/types';

const PAGE_SIZE = 10;

export default function LandlordPaymentsPage() {
  const [commissions, setCommissions] = useState<LandlordPortalCommission[]>([]);
  const [pagination, setPagination] = useState<PortalPagination | null>(null);
  const [properties, setProperties] = useState<LandlordPortalPropertySummary[]>([]);
  const [status, setStatus] = useState<CommissionStatus | ''>('');
  const [propertyId, setPropertyId] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await landlordPortalAPI.getProperties();
        if (!cancelled) setProperties(res?.data ?? []);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await landlordPortalAPI.getCommissions({
        page,
        limit: PAGE_SIZE,
        ...(status ? { status: status as CommissionStatus } : {}),
        ...(propertyId ? { propertyId } : {}),
      });
      if (!res?.data) throw new Error((res as any)?.message || 'Failed to load commissions.');
      setCommissions(res.data);
      setPagination(res.pagination ?? null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load commissions.');
      setCommissions([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, status, propertyId]);

  useEffect(() => { load(); }, [load]);

  const paidTotal = commissions
    .filter((c) => c.status === 'PAID')
    .reduce((sum, c) => sum + (c.commissionAmount ?? 0), 0);
  const incomeTotal = commissions.reduce((sum, c) => sum + (c.incomeAmount ?? 0), 0);

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <>
      <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Wallet className="h-4 w-4 text-[#005478]" /> Income on this page
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900 truncate">{ksh(incomeTotal)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Percent className="h-4 w-4 text-emerald-700" /> Commission paid
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900 truncate">{ksh(paidTotal)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-600">Statements</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{pagination?.total ?? commissions.length}</p>
          {pagination && (
            <p className="mt-1 text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
          )}
        </div>
      </section>

      <Panel
        title="Commission statements"
        description="From getCommissions() — filter, then page through"
        action={
          <div className="flex flex-wrap gap-2">
            <select
              value={propertyId}
              onChange={(e) => { setPropertyId(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800"
            >
              <option value="">All properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as CommissionStatus | ''); setPage(1); }}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        }
      >
        {error && <div className="mb-4"><ErrorNote message={error} onRetry={load} /></div>}

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-600">Loading commissions…</div>
        ) : commissions.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-8 w-8" />}
            title="No commission statements"
            hint="Statements appear here once your manager records income for a period."
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-sm min-w-200">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-700">
                  <th className="pb-2 font-medium">Property</th>
                  <th className="pb-2 font-medium">Period</th>
                  <th className="pb-2 font-medium">Income</th>
                  <th className="pb-2 font-medium">Fee</th>
                  <th className="pb-2 font-medium">Commission</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Paid</th>
                  <th className="pb-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 font-medium text-slate-900 max-w-45 truncate">{c.property?.name ?? '—'}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{periodLabel(c.periodStart, c.periodEnd)}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{ksh(c.incomeAmount)}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">
                      {c.commissionFee == null ? '—' : `${c.commissionFee}%`}
                    </td>
                    <td className="py-3 font-medium text-slate-900 whitespace-nowrap">{ksh(c.commissionAmount)}</td>
                    <td className="py-3"><Pill value={c.status} /></td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{c.paidDate ? dateLabel(c.paidDate) : '—'}</td>
                    <td className="py-3 text-slate-600 max-w-50 truncate">{c.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-600">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </Panel>
    </>
  );
}
