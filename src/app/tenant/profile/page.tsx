'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Phone, FileText, MapPin, Info } from 'lucide-react';
import { tenantPortalAPI } from '@/lib/api';
import { LoadingState, ErrorState } from '@/components/tenant/states';
import StatusBadge from '@/components/tenant/StatusBadge';
import { ksh, formatDate, orDash } from '@/components/tenant/format';
import type { TenantPortalProfileResponse } from '@/types';

type TenantProfile = TenantPortalProfileResponse['data'];

/**
 * PROFILE — read-only.
 * The tenantPortalAPI exposes no update-profile endpoint, so profile editing
 * is NOT simulated. Backend work needed: PATCH /api/portal/tenant/profile.
 */
export default function TenantProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<TenantProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await tenantPortalAPI.getProfile();
        if (cancelled) return;
        if (!res?.data) {
          throw new Error((res as any)?.message || 'Failed to load your profile.');
        }
        setProfile(res.data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load your profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingState label="Loading your profile…" />;
  if (error) return <ErrorState message={error} />;
  if (!profile) return null;

  const { tenant, unit, property, lifecycle } = profile;
  const initials = (tenant.fullName || 'T')
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <div>
        <h1 className="text-lg font-bold text-black sm:text-xl">Profile</h1>
        <p className="text-xs text-slate-700 sm:text-sm">
          Your personal and tenancy information.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
        <p className="font-medium">
          Profile details are managed by your landlord or property manager. If
          something looks wrong, contact them to have it corrected.
        </p>
      </div>

      {/* Identity header */}
      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#005478] text-xl font-bold text-white">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-black">{orDash(tenant.fullName)}</p>
          <p className="text-sm font-medium text-slate-700">Tenant</p>
        </div>
        <StatusBadge status={tenant.status} />
      </section>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Personal info */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-black sm:text-lg">
            <User className="h-5 w-5 text-[#005478]" />
            Personal Information
          </h2>
          <dl className="space-y-4">
            <Row icon={<User className="h-4 w-4" />} label="Full Name" value={orDash(tenant.fullName)} />
            <Row icon={<Mail className="h-4 w-4" />} label="Email" value={orDash(tenant.email)} />
            <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={orDash(tenant.contact)} />
            <Row
              icon={<FileText className="h-4 w-4" />}
              label="KRA PIN"
              value={orDash(tenant.KRAPin)}
            />
            <Row
              icon={<MapPin className="h-4 w-4" />}
              label="PO Box"
              value={orDash(tenant.POBox)}
            />
          </dl>
        </section>

        {/* Tenancy info */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-black sm:text-lg">
            <FileText className="h-5 w-5 text-[#005478]" />
            Tenancy Information
          </h2>
          <dl className="space-y-4">
            <Row icon={<FileText className="h-4 w-4" />} label="Lease Term" value={orDash(tenant.leaseTerm)} />
            <Row icon={<FileText className="h-4 w-4" />} label="Monthly Rent" value={ksh(tenant.rent)} />
            <Row icon={<FileText className="h-4 w-4" />} label="Deposit" value={ksh(tenant.deposit)} />
            <Row icon={<FileText className="h-4 w-4" />} label="Lease Start" value={formatDate(tenant.termStart)} />
            <Row
              icon={<MapPin className="h-4 w-4" />}
              label="Property"
              value={property ? `${property.name} — ${property.address}` : '—'}
            />
            <Row
              icon={<MapPin className="h-4 w-4" />}
              label="Unit"
              value={unit?.unitNo ? `Unit ${unit.unitNo}` : '—'}
            />
            <Row
              icon={<FileText className="h-4 w-4" />}
              label="Tenure"
              value={lifecycle?.tenureDays != null ? `${lifecycle.tenureDays} days` : '—'}
            />
          </dl>
        </section>
      </div>
    </>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-600">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          {label}
        </dt>
        <dd className="truncate text-sm font-semibold text-black">{value}</dd>
      </div>
    </div>
  );
}