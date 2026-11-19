'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { landlordPortalAPI } from '@/lib/api';
import { dateLabel, Pill, ErrorNote, EmptyState, Panel } from '@/components/landlord/shared';
import type {
  LandlordPortalPropertySummary,
  LandlordPortalTenant,
  LandlordPortalTenantsStatusFilter,
} from '@/types';

type Row = LandlordPortalTenant & { propertyName: string };

export default function LandlordTenantsPage() {
  const [properties, setProperties] = useState<LandlordPortalPropertySummary[]>([]);
  const [propertyId, setPropertyId] = useState<string>('ALL');
  const [status, setStatus] = useState<LandlordPortalTenantsStatusFilter>('ACTIVE');
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState({ active: 0, left: 0, frozen: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await landlordPortalAPI.getProperties();
        if (cancelled) return;
        setProperties(res?.data ?? []);
      } catch {
        /* property list failure surfaces via the tenants request */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (properties.length === 0) {
        setRows([]);
        setMeta({ active: 0, left: 0, frozen: 0 });
        return;
      }

      if (propertyId === 'ALL') {
        const results = await Promise.allSettled(
          properties.map((p) => landlordPortalAPI.getPropertyTenants(p.id, status))
        );
        const collected: Row[] = [];
        let active = 0, left = 0, frozen = 0;
        results.forEach((r, i) => {
          if (r.status !== 'fulfilled') return;
          const p = properties[i];
          (r.value?.data ?? []).forEach((t) => collected.push({ ...t, propertyName: p.name }));
          active += r.value?.metadata?.activeTenantsCount ?? 0;
          left += r.value?.metadata?.leftTenantsCount ?? 0;
          frozen += r.value?.metadata?.frozenTenantsCount ?? 0;
        });
        setRows(collected);
        setMeta({ active, left, frozen });
      } else {
        const res = await landlordPortalAPI.getPropertyTenants(propertyId, status);
        if (!res?.data) throw new Error((res as any)?.message || 'Failed to load tenants.');
        const p = properties.find((x) => x.id === propertyId);
        setRows(res.data.map((t) => ({ ...t, propertyName: p?.name ?? 'Property' })));
        setMeta({
          active: res.metadata?.activeTenantsCount ?? 0,
          left: res.metadata?.leftTenantsCount ?? 0,
          frozen: res.metadata?.frozenTenantsCount ?? 0,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load tenants.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [properties, propertyId, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <Panel
        title="Tenants"
        description="Landlord view is redacted: no email, contact, KRA PIN, rent or deposit"
        action={
          <div className="flex flex-wrap gap-2">
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800"
            >
              <option value="ALL">All properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LandlordPortalTenantsStatusFilter)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800"
            >
              <option value="ACTIVE">Active</option>
              <option value="LEFT">Left</option>
              <option value="ALL">All</option>
            </select>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">{meta.active} active</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{meta.left} left</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-800">{meta.frozen} frozen</span>
        </div>

        {error && <div className="mb-4"><ErrorNote message={error} onRetry={load} /></div>}

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-600">Loading tenants…</div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No tenants for this selection"
            hint="Try another property, or switch the filter to All."
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-sm min-w-175">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-700">
                  <th className="pb-2 font-medium">Tenant</th>
                  <th className="pb-2 font-medium">Property</th>
                  <th className="pb-2 font-medium">Unit</th>
                  <th className="pb-2 font-medium">Lease term</th>
                  <th className="pb-2 font-medium">Term start</th>
                  <th className="pb-2 font-medium">Rent start</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Left</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={`${t.propertyName}-${t.id}`} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 font-medium text-slate-900">
                      <span className="inline-flex items-center gap-2">
                        {t.fullName}
                        {t.isFrozen && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">FROZEN</span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 text-slate-700 max-w-40 truncate">{t.propertyName}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">
                      {t.unit?.unitNo || '—'}{t.unit?.floor ? ` · ${t.unit.floor}` : ''}
                    </td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{t.leaseTerm}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{dateLabel(t.termStart)}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{dateLabel(t.rentStart)}</td>
                    <td className="py-3"><Pill value={t.status} /></td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">
                      {t.leftAt ? dateLabel(t.leftAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="text-xs text-slate-500">
        Open a <Link href="/landlord/properties" className="text-[#005478] font-medium hover:underline">property</Link> to see its units and demand letters.
      </p>
    </>
  );
}
