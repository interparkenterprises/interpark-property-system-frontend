'use client';

import { useEffect, useState } from 'react';
import { Home, Building2, MapPin, FileText } from 'lucide-react';
import { tenantPortalAPI } from '@/lib/api';
import { LoadingState, ErrorState } from '@/components/tenant/states';
import StatusBadge from '@/components/tenant/StatusBadge';
import AttachmentList from '@/components/tenant/AttachmentList';
import { ksh, formatDate, orDash } from '@/components/tenant/format';
import type {
  TenantPortalProfileResponse,
  TenantPortalAttachmentsResponse,
} from '@/types';

type TenantProfile = TenantPortalProfileResponse['data'];

export default function TenantLeasePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [attachments, setAttachments] = useState<
    TenantPortalAttachmentsResponse['data']
  >([]);
  const [attachmentsError, setAttachmentsError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const profileRes = await tenantPortalAPI.getProfile();
        if (cancelled) return;
        if (!profileRes?.data) {
          throw new Error(
            (profileRes as any)?.message || 'Failed to load your lease details.'
          );
        }
        setProfile(profileRes.data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load your lease details.');
      } finally {
        if (!cancelled) setLoading(false);
      }

      try {
        const attRes = await tenantPortalAPI.getAttachments();
        if (cancelled) return;
        if (attRes?.data) setAttachments(attRes.data);
      } catch (err: any) {
        // Non-fatal: lease info can still render if attachments fail.
        if (!cancelled)
          setAttachmentsError(err?.message || 'Failed to load lease documents.');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingState label="Loading your lease…" />;
  if (error) return <ErrorState message={error} />;
  if (!profile) return null;

  const { tenant, unit, property, lifecycle } = profile;

  return (
    <>
      <div>
        <h1 className="text-lg font-bold text-black sm:text-xl">My Lease</h1>
        <p className="text-xs text-slate-700 sm:text-sm">
          Your tenancy details, unit information and lease documents.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Tenancy details */}
        <Card title="Tenancy Details" className="min-w-0 lg:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Tenant Name" value={orDash(tenant.fullName)} />
            <Field label="Lease Term" value={orDash(tenant.leaseTerm)} />
            <Field
              label="Tenancy Status"
              value={<StatusBadge status={tenant.status} />}
            />
            <Field label="Monthly Rent" value={ksh(tenant.rent)} />
            <Field label="Deposit Held" value={ksh(tenant.deposit)} />
            <Field label="Payment Policy" value={orDash(tenant.paymentPolicy)} />
            <Field label="Lease Start" value={formatDate(tenant.termStart)} />
            <Field label="Rent Start" value={formatDate(tenant.rentStart)} />
            <Field
              label="Annual Escalation"
              value={
                tenant.escalationRate != null ? `${tenant.escalationRate}%` : '—'
              }
            />
            <Field
              label="VAT Treatment"
              value={
                tenant.vatType === 'NOT_APPLICABLE'
                  ? 'Not applicable'
                  : tenant.vatRate != null
                    ? `${tenant.vatType} (${tenant.vatRate}%)`
                    : orDash(tenant.vatType)
              }
            />
            <Field
              label="Tenure So Far"
              value={lifecycle?.tenureDays != null ? `${lifecycle.tenureDays} days` : '—'}
            />
            <Field
              label="Freeze Status"
              value={
                lifecycle?.isFrozen
                  ? `Frozen${lifecycle.freezeEndDate ? ` until ${formatDate(lifecycle.freezeEndDate)}` : ''}`
                  : 'Not frozen'
              }
            />
          </dl>
        </Card>

        {/* Property & unit */}
        <Card title="Property & Unit" className="min-w-0">
            <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl border border-slate-300 bg-slate-50 p-4">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[#005478]" />
                <div className="min-w-0">
                    <p className="truncate text-base font-bold text-black">
                    {orDash(property?.name)}
                    </p>
                    <p className="mt-1 flex items-start gap-1 text-sm font-medium text-black">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#005478]" />
                    {orDash(property?.address)}
                    </p>
                </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-300 bg-slate-50 p-4">
                <Home className="mt-0.5 h-5 w-5 shrink-0 text-[#005478]" />
                <div className="min-w-0 text-sm">
                    <p className="text-base font-bold text-black">
                    {unit?.unitNo ? `Unit ${unit.unitNo}` : 'Unit not assigned'}
                    </p>
                    <p className="mt-1 text-sm font-medium text-black">
                    {[
                        unit?.unitType || unit?.type,
                        unit?.bedrooms != null ? `${unit.bedrooms} bed` : null,
                        unit?.bathrooms != null ? `${unit.bathrooms} bath` : null,
                        unit?.floor ? `Floor ${unit.floor}` : null,
                        unit?.sizeSqFt != null ? `${unit.sizeSqFt} sq ft` : null,
                    ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                </div>
                </div>
            </div>
        </Card>
      </div>

      {/* Lease documents */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-black sm:text-lg">
          <FileText className="h-5 w-5 text-[#005478]" />
          Lease Documents
        </h2>
        {attachmentsError && <ErrorState message={attachmentsError} />}
        <AttachmentList attachments={attachments} />
      </section>
    </>
  );
}

function Card({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}
    >
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-black sm:text-lg">
        <FileText className="h-5 w-5 text-[#005478]" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-700">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-black">
        {value}
      </dd>
    </div>
  );
}