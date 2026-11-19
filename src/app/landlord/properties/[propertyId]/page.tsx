'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2, DoorOpen, FileText, Receipt } from 'lucide-react';
import { landlordPortalAPI } from '@/lib/api';
import {
  ksh,
  dateLabel,
  periodLabel,
  Pill,
  Loading,
  ErrorNote,
  EmptyState,
  Panel,
  Field,
} from '@/components/landlord/shared';
import type {
  LandlordPortalPropertyDetail,
  LandlordPortalTenant,
  LandlordPortalTenantsStatusFilter,
  LandlordPortalDemandLetter,
  LandlordPortalDailyReport,
} from '@/types';

type Tab = 'units' | 'tenants' | 'demand' | 'reports';

const TABS: { id: Tab; label: string }[] = [
  { id: 'units', label: 'Units' },
  { id: 'tenants', label: 'Tenants' },
  { id: 'demand', label: 'Demand letters' },
  { id: 'reports', label: 'Daily reports' },
];

export default function LandlordPropertyDetailPage() {
  const params = useParams();
  const raw = params?.propertyId;
  const propertyId = Array.isArray(raw) ? raw[0] : raw ?? '';

  const [detail, setDetail] = useState<LandlordPortalPropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tab, setTab] = useState<Tab>('units');
  const [tenantFilter, setTenantFilter] = useState<LandlordPortalTenantsStatusFilter>('ACTIVE');
  const [tenants, setTenants] = useState<LandlordPortalTenant[]>([]);
  const [tenantMeta, setTenantMeta] = useState<{ active: number; left: number; frozen: number } | null>(null);
  const [demandLetters, setDemandLetters] = useState<LandlordPortalDemandLetter[]>([]);
  const [reports, setReports] = useState<LandlordPortalDailyReport[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState('');

  /* property + its units come from getProperty (detail already includes units) */
  const loadDetail = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    setError('');
    try {
      const res = await landlordPortalAPI.getProperty(propertyId);
      if (!res?.data) throw new Error((res as any)?.message || 'Failed to load this property.');
      setDetail(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load this property.');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  useEffect(() => {
    if (!propertyId || tab === 'units') return;
    let cancelled = false;

    const run = async () => {
      setTabLoading(true);
      setTabError('');
      try {
        if (tab === 'tenants') {
          const res = await landlordPortalAPI.getPropertyTenants(propertyId, tenantFilter);
          if (cancelled) return;
          setTenants(res?.data ?? []);
          setTenantMeta({
            active: res?.metadata?.activeTenantsCount ?? 0,
            left: res?.metadata?.leftTenantsCount ?? 0,
            frozen: res?.metadata?.frozenTenantsCount ?? 0,
          });
        } else if (tab === 'demand') {
          const res = await landlordPortalAPI.getPropertyDemandLetters(propertyId);
          if (cancelled) return;
          setDemandLetters(res?.data ?? []);
        } else {
          const res = await landlordPortalAPI.getPropertyDailyReports(propertyId);
          if (cancelled) return;
          setReports(res?.data ?? []);
        }
      } catch (err: any) {
        if (!cancelled) setTabError(err?.message || 'Failed to load records.');
      } finally {
        if (!cancelled) setTabLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [propertyId, tab, tenantFilter]);

  if (loading) return <Loading label="Loading property…" />;

  if (error || !detail) {
    return (
      <>
        <ErrorNote message={error || 'Property not found.'} onRetry={loadDetail} />
        <Link href="/landlord/properties" className="inline-flex items-center gap-2 text-sm font-medium text-[#005478] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to properties
        </Link>
      </>
    );
  }

  const occupied = detail.units.filter((u) => (u.status ?? '').toUpperCase() === 'OCCUPIED').length;
  const occupancy = detail.units.length > 0 ? Math.round((occupied / detail.units.length) * 100) : 0;

  return (
    <>
      <Link href="/landlord/properties" className="inline-flex items-center gap-2 text-sm font-medium text-[#005478] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to properties
      </Link>

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700 shrink-0">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{detail.name}</h2>
              <p className="text-sm text-slate-600">{detail.address}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
              {detail.units.length} units
            </span>
            <span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              {occupancy}% occupied
            </span>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="LR number" value={detail.lrNumber} />
          <Field label="Form" value={detail.form} />
          <Field label="Usage" value={detail.usage} />
          <Field label="Commission fee" value={detail.commissionFee == null ? null : `${detail.commissionFee}%`} />
          <Field label="Manager" value={detail.manager?.name} />
          <Field label="Manager email" value={detail.manager?.email} />
          <Field label="Added" value={dateLabel(detail.createdAt)} />
          <Field label="Last updated" value={dateLabel(detail.updatedAt)} />
        </dl>
      </Panel>

      {/* tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`flex-1 min-w-fit rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.id ? 'bg-[#005478] text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tabError && <ErrorNote message={tabError} />}

      {tab === 'units' && (
        <Panel title="Units" description="From getProperty() — SAFE_UNIT projection">
          {detail.units.length === 0 ? (
            <EmptyState icon={<DoorOpen className="h-8 w-8" />} title="No units on this property yet" />
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-sm min-w-150">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-700">
                    <th className="pb-2 font-medium">Unit</th>
                    <th className="pb-2 font-medium">Floor</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Beds / Baths</th>
                    <th className="pb-2 font-medium">Size</th>
                    <th className="pb-2 font-medium">Rent</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.units.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-medium text-slate-900 whitespace-nowrap">{u.unitNo || '—'}</td>
                      <td className="py-3 text-slate-700">{u.floor || '—'}</td>
                      <td className="py-3 text-slate-700">{u.unitType || u.type || '—'}</td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">
                        {u.bedrooms ?? '—'} / {u.bathrooms ?? '—'}
                      </td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">
                        {u.sizeSqFt == null ? '—' : `${u.sizeSqFt} sqft`}
                      </td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">
                        {u.rentAmount == null ? '—' : `${ksh(u.rentAmount)}${u.rentType ? ` / ${u.rentType.toLowerCase()}` : ''}`}
                      </td>
                      <td className="py-3">{u.status ? <Pill value={u.status} /> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab === 'tenants' && (
        <Panel
          title="Tenants"
          description="Redacted for landlords: no KRA PIN, email, contact, rent or deposit"
          action={
            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value as LandlordPortalTenantsStatusFilter)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800"
            >
              <option value="ACTIVE">Active</option>
              <option value="LEFT">Left</option>
              <option value="ALL">All</option>
            </select>
          }
        >
          {tenantMeta && (
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
                {tenantMeta.active} active
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                {tenantMeta.left} left
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-800">
                {tenantMeta.frozen} frozen
              </span>
            </div>
          )}

          {tabLoading ? (
            <div className="py-10 text-center text-sm text-slate-600">Loading tenants…</div>
          ) : tenants.length === 0 ? (
            <EmptyState title="No tenants for this filter" hint="Switch the filter to All to see previous tenants." />
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-sm min-w-150">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-700">
                    <th className="pb-2 font-medium">Tenant</th>
                    <th className="pb-2 font-medium">Unit</th>
                    <th className="pb-2 font-medium">Lease term</th>
                    <th className="pb-2 font-medium">Term start</th>
                    <th className="pb-2 font-medium">Rent start</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-medium text-slate-900">
                        <span className="inline-flex items-center gap-2">
                          {t.fullName}
                          {t.isFrozen && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              FROZEN
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">
                        {t.unit?.unitNo || '—'}
                        {t.unit?.floor ? ` · ${t.unit.floor}` : ''}
                      </td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">{t.leaseTerm}</td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">{dateLabel(t.termStart)}</td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">{dateLabel(t.rentStart)}</td>
                      <td className="py-3"><Pill value={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab === 'demand' && (
        <Panel title="Demand letters" description="Outstanding rent notices issued for this property">
          {tabLoading ? (
            <div className="py-10 text-center text-sm text-slate-600">Loading demand letters…</div>
          ) : demandLetters.length === 0 ? (
            <EmptyState icon={<Receipt className="h-8 w-8" />} title="No demand letters issued" />
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-sm min-w-200">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-700">
                    <th className="pb-2 font-medium">Letter</th>
                    <th className="pb-2 font-medium">Tenant</th>
                    <th className="pb-2 font-medium">Unit</th>
                    <th className="pb-2 font-medium">Rental period</th>
                    <th className="pb-2 font-medium">Issued</th>
                    <th className="pb-2 font-medium">Due</th>
                    <th className="pb-2 font-medium">Outstanding</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Doc</th>
                  </tr>
                </thead>
                <tbody>
                  {demandLetters.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-medium text-slate-900 whitespace-nowrap">{d.letterNumber}</td>
                      <td className="py-3 text-slate-700">{d.tenant?.fullName ?? '—'}</td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">{d.unit?.unitNo || '—'}</td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">{d.rentalPeriod}</td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">{dateLabel(d.issueDate)}</td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">{dateLabel(d.dueDate)}</td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">{ksh(d.outstandingAmount)}</td>
                      <td className="py-3"><Pill value={d.status} /></td>
                      <td className="py-3">
                        {d.documentUrl ? (
                          <a href={d.documentUrl} target="_blank" rel="noreferrer"
                             className="text-xs font-semibold text-[#005478] hover:underline">
                            Open
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab === 'reports' && (
        <Panel title="Daily reports" description="Operational reports filed by the property manager">
          {tabLoading ? (
            <div className="py-10 text-center text-sm text-slate-600">Loading reports…</div>
          ) : reports.length === 0 ? (
            <EmptyState icon={<FileText className="h-8 w-8" />} title="No daily reports yet" />
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => (
                <li key={r.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {dateLabel(r.reportDate)}
                        {r.day ? <span className="text-slate-500 font-normal"> · {r.day}</span> : null}
                      </p>
                      <p className="text-xs text-slate-600 truncate">
                        {r.preparedBy ? `Prepared by ${r.preparedBy}` : 'Prepared by —'}
                        {r.timeSubmitted ? ` · ${r.timeSubmitted}` : ''}
                      </p>
                    </div>
                    <Pill value={r.status} />
                  </div>

                  <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Security provider" value={r.securityProvider} />
                    <Field label="Cleaning contractor" value={r.cleaningContractor} />
                    <Field label="Cleanliness" value={r.cleanlinessStandard} />
                    <Field label="Occupancy level" value={r.occupancyLevel} />
                    <Field label="Water" value={r.waterStatus} />
                    <Field label="Electricity" value={r.electricityStatus} />
                    <Field label="Other services" value={r.otherServicesStatus} />
                    <Field label="Landlord status" value={r.landlordStatus} />
                    <Field label="Landlord instructions" value={r.landlordInstructions} />
                    <Field label="Security incidents" value={r.securityIncidents} />
                    <Field label="Tenant complaints" value={r.tenantComplaints} />
                    <Field label="Operational challenges" value={r.operationalChallenges} />
                    <Field label="Health & safety" value={r.healthSafetyIssues} />
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </>
  );
}
