'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Building2, MapPin, Hash } from 'lucide-react';
import { providerPortalAPI } from '@/lib/api';
import ProviderPortalLayout from '@/components/ProviderPortalLayout';
import { PageLoading, PageError, EmptyState } from '@/components/PageStates';
import type { ServiceProviderPortalProperty } from '@/types';

export default function ProviderPropertiesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState<ServiceProviderPortalProperty[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await providerPortalAPI.getProperties();
      if (res?.data) {
        setProperties(res.data);
      } else {
        setError('Failed to load your properties.');
      }
    } catch (err) {
      setError((err as Error)?.message || 'Failed to load your properties.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProviderPortalLayout
      title={
        <>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">My Properties</h1>
          <p className="text-xs sm:text-sm text-slate-700 truncate">
            Properties where you deliver services
          </p>
        </>
      }
    >
      {error && <PageError message={error} onRetry={load} />}

      {loading ? (
        <section className="rounded-2xl bg-white border border-slate-200 p-6">
          <PageLoading label="Loading your properties…" />
        </section>
      ) : properties.length === 0 ? (
        !error && (
          <section className="rounded-2xl bg-white border border-slate-200 p-6">
            <EmptyState
              icon={<Building2 />}
              title="No properties yet"
              description="Properties assigned to you by the property administrator will appear here."
            />
          </section>
        )
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl bg-white border border-slate-200 overflow-hidden min-w-0 flex flex-col"
            >
              <div className="relative h-36 w-full bg-slate-100">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-500">
                    <Building2 className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col gap-1.5 min-w-0">
                <h2 className="font-semibold text-slate-900 truncate">{p.name}</h2>
                <p className="flex items-start gap-1.5 text-xs text-slate-800">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-700" />
                  <span className="min-w-0">{p.address}</span>
                </p>
                {p.lrNumber && (
                  <p className="flex items-center gap-1.5 text-xs text-slate-700">
                    <Hash className="h-3.5 w-3.5 shrink-0 text-slate-700" />
                    <span className="truncate">L.R. {p.lrNumber}</span>
                  </p>
                )}
                {(p.usage || p.form) && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {p.usage && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-900">
                        {p.usage}
                      </span>
                    )}
                    {p.form && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-900">
                        {p.form}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </ProviderPortalLayout>
  );
}
