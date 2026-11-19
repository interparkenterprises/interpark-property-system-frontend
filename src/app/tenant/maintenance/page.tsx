'use client';

import { Wrench, AlertTriangle, Info } from 'lucide-react';

/**
 * MAINTENANCE — REQUIRES BACKEND SUPPORT
 *
 * There is currently NO maintenance endpoint under /api/portal/tenant/* in
 * lib/api.ts (the tenantPortalAPI exposes only profile, statement, payments,
 * invoices, bills, demand-letters and attachments). Per the project rules we
 * do NOT invent an endpoint or simulate a successful submission.
 *
 * Backend work needed before this page can go live:
 *   1. GET  /api/portal/tenant/maintenance-requests  — list the tenant's own requests
 *   2. POST /api/portal/tenant/maintenance-requests  — submit a new request
 *      (fields: title, category, priority, description, optional photos)
 *   3. Optional: GET /api/portal/tenant/maintenance-requests/:id — status timeline
 * Once those exist, implement the real UI here using tenantPortalAPI.
 */
export default function TenantMaintenancePage() {
  return (
    <>
      <div>
        <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Maintenance</h1>
        <p className="text-xs text-slate-500 sm:text-sm">
          Report issues and track repair requests for your unit.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
        <p>
          In the meantime, please report urgent issues directly to your landlord or
          property manager. This page will become available once maintenance
          requests are enabled for tenant accounts.
        </p>
      </div>

      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
            <Wrench className="h-7 w-7 text-amber-700" />
          </span>
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Online maintenance requests coming soon
          </h2>
          <p className="max-w-md text-sm text-slate-600">
            We are working on letting you submit and track maintenance requests
            right here. This section requires backend support that is not yet
            available.
          </p>
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-300 bg-white px-4 py-3 text-left text-xs text-slate-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Missing backend endpoint:{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800">
                /api/portal/tenant/maintenance-requests
              </code>
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
