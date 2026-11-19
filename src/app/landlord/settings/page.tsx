'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, DoorOpen, Mail, Phone, ShieldCheck } from 'lucide-react';
import { landlordPortalAPI } from '@/lib/api';
import { Loading, ErrorNote, Panel, Field, dateLabel } from '@/components/landlord/shared';
import type { LandlordPortalProfile, LandlordPortalProfileStats } from '@/types';

export default function LandlordSettingsPage() {
  const [landlord, setLandlord] = useState<LandlordPortalProfile | null>(null);
  const [stats, setStats] = useState<LandlordPortalProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await landlordPortalAPI.getProfile();
      if (!res?.data) throw new Error((res as any)?.message || 'Failed to load your profile.');
      setLandlord(res.data.landlord);
      setStats(res.data.stats);
    } catch (err: any) {
      setError(err?.message || 'Failed to load your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading label="Loading your profile…" />;
  if (error || !landlord) return <ErrorNote message={error || 'Profile unavailable.'} onRetry={load} />;

  return (
    <>
      <Panel title="Account details" description="Read-only — the landlord portal exposes no update endpoint">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#005478] text-xl font-bold text-white">
            {(landlord.name || 'L').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900 truncate">{landlord.name}</p>
            <p className="text-sm text-slate-600 truncate">Landlord account</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Email" value={landlord.email} />
          <Field label="Phone" value={landlord.phone} />
          <Field label="Address" value={landlord.address} />
          <Field label="ID number" value={landlord.idNumber} />
          <Field label="Account created" value={dateLabel(landlord.createdAt)} />
          <Field label="Last updated" value={dateLabel(landlord.updatedAt)} />
        </dl>

        <div className="mt-5 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs text-blue-900">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            To change any of these details, contact your property manager. Requests go through them,
            not this portal.
          </p>
        </div>
      </Panel>

      <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Building2 className="h-4 w-4 text-blue-700" /> Properties
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.propertyCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <DoorOpen className="h-4 w-4 text-purple-700" /> Units
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats?.unitCount ?? 0}</p>
        </div>
      </section>

      <Panel title="Contact support" description="How to reach the office managing your properties">
        <div className="flex flex-wrap gap-4 text-sm text-slate-800">
          <span className="inline-flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-500" /> via your assigned property manager
          </span>
          <span className="inline-flex items-center gap-2">
            <Phone className="h-4 w-4 text-slate-500" /> {landlord.phone || 'No phone on file'}
          </span>
        </div>
      </Panel>
    </>
  );
}
