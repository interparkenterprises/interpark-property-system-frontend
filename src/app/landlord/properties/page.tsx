'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, DoorOpen, Search } from 'lucide-react';
import { landlordPortalAPI } from '@/lib/api';
import { Loading, ErrorNote, EmptyState } from '@/components/landlord/shared';
import type { LandlordPortalPropertySummary } from '@/types';

export default function LandlordPropertiesPage() {
  const [properties, setProperties] = useState<LandlordPortalPropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await landlordPortalAPI.getProperties();
        if (cancelled) return;
        if (!res?.data) throw new Error((res as any)?.message || 'Failed to load properties.');
        setProperties(res.data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load properties.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((p) =>
      [p.name, p.address, p.lrNumber, p.manager?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [properties, query]);

  const totalUnits = properties.reduce((sum, p) => sum + (p._count?.units ?? 0), 0);

  if (loading) return <Loading label="Loading your properties…" />;

  return (
    <>
      {error && <ErrorNote message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

      <section className="grid gap-3 sm:gap-4 grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-600">Properties</p>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">{properties.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-600">Total units</p>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">{totalUnits}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 col-span-2 xl:col-span-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="property-search">Search</label>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-300 px-2.5 py-1.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              id="property-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, address, LR no., manager"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState
            icon={<Building2 className="h-8 w-8" />}
            title={properties.length === 0 ? 'No properties assigned yet' : 'No properties match your search'}
            hint={
              properties.length === 0
                ? 'Once a property is assigned to you it will appear here with its units, tenants and records.'
                : 'Try a different name, address or LR number.'
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/landlord/properties/${p.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 transition hover:border-[#005478] hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate group-hover:text-[#005478]">{p.name}</p>
                  <p className="text-xs text-slate-600 truncate">{p.address}</p>
                </div>
                <span className="rounded-lg bg-blue-50 p-2 text-blue-700 shrink-0">
                  <Building2 className="h-4 w-4" />
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-slate-500">LR number</dt>
                  <dd className="text-slate-800 truncate">{p.lrNumber || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Form</dt>
                  <dd className="text-slate-800 truncate">{p.form || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Usage</dt>
                  <dd className="text-slate-800 truncate">{p.usage || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Commission fee</dt>
                  <dd className="text-slate-800 truncate">
                    {p.commissionFee == null ? '—' : `${p.commissionFee}%`}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <DoorOpen className="h-3.5 w-3.5" />
                  {p._count?.units ?? 0} units
                </span>
                <span className="text-slate-600 truncate">
                  {p.manager ? p.manager.name : 'No manager'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
