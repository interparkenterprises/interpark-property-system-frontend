'use client';

import { useCallback, useEffect, useState } from 'react';
import { User, Contact, CalendarClock, DollarSign, FileSignature } from 'lucide-react';
import { providerPortalAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ProviderPortalLayout from '@/components/ProviderPortalLayout';
import { PageLoading, PageError, EmptyState } from '@/components/PageStates';
import type { ServiceProviderPortalProfile } from '@/types';

const ksh = (n?: number | null) =>
  n == null ? '—' : `KSh ${Number(n).toLocaleString('en-US')}`;

export default function ProviderProfilePage() {
  const { user, accountStatus } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<ServiceProviderPortalProfile | null>(null);
  const [stats, setStats] = useState<{ propertyCount: number; attachmentCount: number } | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await providerPortalAPI.getProfile();
      if (res?.data?.provider) {
        setProfile(res.data.provider);
        setStats(res.data.stats ?? null);
      } else {
        setError('Failed to load your profile.');
      }
    } catch (err) {
      setError((err as Error)?.message || 'Failed to load your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows: Array<{ icon: React.ReactNode; label: string; value: string }> = profile
    ? [
        { icon: <User className="h-4 w-4" />, label: 'Provider name', value: profile.name || '—' },
        { icon: <Contact className="h-4 w-4" />, label: 'Contact', value: profile.contact || '—' },
        {
          icon: <CalendarClock className="h-4 w-4" />,
          label: 'Contract period',
          value: profile.contractPeriod || '—',
        },
        {
          icon: <FileSignature className="h-4 w-4" />,
          label: 'Service contract',
          value: profile.serviceContract || '—',
        },
        {
          icon: <DollarSign className="h-4 w-4" />,
          label: 'Charge amount',
          value: `${ksh(profile.chargeAmount)}${profile.chargeFrequency ? ` · ${profile.chargeFrequency}` : ''}`,
        },
      ]
    : [];

  return (
    <ProviderPortalLayout
      title={
        <>
          <h1 className="text-lg sm:text-xl font-bold text-black truncate">My Profile</h1>
          <p className="text-xs sm:text-sm text-slate-800 truncate">
            Your service provider details on file
          </p>
        </>
      }
    >
      {error && <PageError message={error} onRetry={load} />}

      {loading ? (
        <section className="rounded-2xl bg-white border border-slate-200 p-6">
          <PageLoading label="Loading your profile…" />
        </section>
      ) : !profile ? (
        !error && (
          <section className="rounded-2xl bg-white border border-slate-200 p-6">
            <EmptyState
              icon={<User />}
              title="Profile unavailable"
              description="Your provider profile could not be loaded. Please try again later."
            />
          </section>
        )
      ) : (
        <>
          <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 min-w-0">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-900">
                {(profile.name || 'S').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-black truncate">
                  {profile.name || 'Service Provider'}
                </h2>
                <p className="text-sm text-slate-800 truncate">Service Provider</p>
              </div>
            </div>

            <dl className="mt-6 divide-y divide-slate-200">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center gap-3 py-3">
                  <span className="rounded-lg bg-slate-100 p-2 text-slate-800 shrink-0">
                    {row.icon}
                  </span>
                  <dt className="text-sm font-medium text-slate-800 w-40 sm:w-48 shrink-0">
                    {row.label}
                  </dt>
                  <dd className="text-sm font-semibold text-black min-w-0 truncate">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800">
              These details are maintained by the property administrator. Contact them if
              something needs to be corrected.
            </p>
          </section>

          {stats && (
            <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <SummaryTile label="Assigned properties" value={String(stats.propertyCount)} />
              <SummaryTile label="Documents on file" value={String(stats.attachmentCount)} />
              <SummaryTile
                label="Account status"
                value={accountStatus ? accountStatus.replace('_', ' ') : '—'}
              />
            </section>
          )}

          {user?.email && (
            <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 min-w-0">
              <h3 className="text-sm font-semibold text-black">Login account</h3>
              <p className="mt-1 text-sm font-medium text-black">{user.email}</p>
            </section>
          )}
        </>
      )}
    </ProviderPortalLayout>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5">
      <p className="text-xs sm:text-sm font-medium text-slate-800">{label}</p>
      <p className="mt-2 text-xl sm:text-2xl font-bold text-black">{value}</p>
    </div>
  );
}