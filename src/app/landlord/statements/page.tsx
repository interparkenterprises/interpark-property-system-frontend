'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, Receipt } from 'lucide-react';
import { landlordPortalAPI } from '@/lib/api';
import {
  ksh, dateLabel, Pill, ErrorNote, EmptyState, Panel, Field,
} from '@/components/landlord/shared';
import type {
  LandlordPortalPropertySummary,
  LandlordPortalDemandLetter,
  LandlordPortalDailyReport,
} from '@/types';

type Tab = 'daily' | 'demand';

export default function LandlordStatementsPage() {
  const [properties, setProperties] = useState<LandlordPortalPropertySummary[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [tab, setTab] = useState<Tab>('daily');
  const [reports, setReports] = useState<LandlordPortalDailyReport[]>([]);
  const [letters, setLetters] = useState<LandlordPortalDemandLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await landlordPortalAPI.getProperties();
        if (cancelled) return;
        const list = res?.data ?? [];
        setProperties(list);
        if (list.length > 0) setPropertyId((prev) => prev || list[0].id);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load properties.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    if (!propertyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [reportsRes, lettersRes] = await Promise.allSettled([
        landlordPortalAPI.getPropertyDailyReports(propertyId),
        landlordPortalAPI.getPropertyDemandLetters(propertyId),
      ]);
      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value?.data ?? []);
      else setReports([]);
      if (lettersRes.status === 'fulfilled') setLetters(lettersRes.value?.data ?? []);
      else setLetters([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  const propertyName = properties.find((p) => p.id === propertyId)?.name;

  return (
    <>
      <Panel
        title="Reports"
        description={propertyName ? `Showing records for ${propertyName}` : 'Pick a property to see its records'}
        action={
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800"
          >
            {properties.length === 0 && <option value="">No properties</option>}
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        }
      >
        <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setTab('daily')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === 'daily' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily reports ({reports.length})
          </button>
          <button
            onClick={() => setTab('demand')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === 'demand' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Demand letters ({letters.length})
          </button>
        </div>

        {error && <div className="mb-4"><ErrorNote message={error} onRetry={load} /></div>}

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-600">Loading records…</div>
        ) : tab === 'daily' ? (
          reports.length === 0 ? (
            <EmptyState icon={<FileText className="h-8 w-8" />} title="No daily reports for this property" />
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
                    <Field label="Security incidents" value={r.securityIncidents} />
                    <Field label="Cleaning contractor" value={r.cleaningContractor} />
                    <Field label="Cleanliness" value={r.cleanlinessStandard} />
                    <Field label="Occupancy level" value={r.occupancyLevel} />
                    <Field label="Water" value={r.waterStatus} />
                    <Field label="Electricity" value={r.electricityStatus} />
                    <Field label="Other services" value={r.otherServicesStatus} />
                    <Field label="Tenant complaints" value={r.tenantComplaints} />
                    <Field label="Landlord instructions" value={r.landlordInstructions} />
                    <Field label="Landlord status" value={r.landlordStatus} />
                    <Field label="Operational challenges" value={r.operationalChallenges} />
                    <Field label="Health & safety" value={r.healthSafetyIssues} />
                  </dl>
                </li>
              ))}
            </ul>
          )
        ) : letters.length === 0 ? (
          <EmptyState icon={<Receipt className="h-8 w-8" />} title="No demand letters for this property" />
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
                  <th className="pb-2 font-medium">Partial paid</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Doc</th>
                </tr>
              </thead>
              <tbody>
                {letters.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 font-medium text-slate-900 whitespace-nowrap">{d.letterNumber}</td>
                    <td className="py-3 text-slate-700">{d.tenant?.fullName ?? '—'}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{d.unit?.unitNo || '—'}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{d.rentalPeriod}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{dateLabel(d.issueDate)}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{dateLabel(d.dueDate)}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{ksh(d.outstandingAmount)}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{ksh(d.partialPayment)}</td>
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
    </>
  );
}
