'use client';

import { useEffect, useState } from 'react';
import { Bell, FileText, Receipt, AlertTriangle } from 'lucide-react';
import { tenantPortalAPI } from '@/lib/api';
import { LoadingState, ErrorState } from '@/components/tenant/states';
import StatusBadge from '@/components/tenant/StatusBadge';
import { ksh, formatDate } from '@/components/tenant/format';
import type {
  TenantPortalDemandLetter,
  TenantPortalBill,
  TenantPortalInvoice,
} from '@/types';

/**
 * NOTIFICATIONS — derived from real backend data only.
 * There is no dedicated tenant-notifications endpoint, so the feed is built
 * from: demand letters, utility bills and invoices. Nothing is simulated.
 */
interface FeedItem {
  id: string;
  kind: 'DEMAND_LETTER' | 'BILL' | 'INVOICE';
  title: string;
  description: string;
  date: string;
  amount: number | null;
  status: string;
}

const kindMeta = {
  DEMAND_LETTER: { icon: <AlertTriangle className="h-5 w-5 text-red-700" />, label: 'Demand Letter' },
  BILL: { icon: <Receipt className="h-5 w-5 text-amber-700" />, label: 'Utility Bill' },
  INVOICE: { icon: <FileText className="h-5 w-5 text-blue-700" />, label: 'Invoice' },
} as const;

export default function TenantNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const [lettersRes, billsRes, invoicesRes] = await Promise.allSettled([
          tenantPortalAPI.getDemandLetters(),
          tenantPortalAPI.getBills(),
          tenantPortalAPI.getInvoices(),
        ]);
        if (cancelled) return;

        const feed: FeedItem[] = [];

        if (lettersRes.status === 'fulfilled' && lettersRes.value?.data) {
          for (const l of lettersRes.value.data as TenantPortalDemandLetter[]) {
            feed.push({
              id: `letter-${l.id}`,
              kind: 'DEMAND_LETTER',
              title: `Demand letter ${l.letterNumber}`,
              description: `Outstanding rent of ${ksh(l.outstandingAmount)} for ${l.rentalPeriod}. Due ${formatDate(l.dueDate)}.`,
              date: l.issueDate,
              amount: l.outstandingAmount,
              status: l.status,
            });
          }
        }
        if (billsRes.status === 'fulfilled' && billsRes.value?.bills?.data) {
          for (const b of billsRes.value.bills.data as TenantPortalBill[]) {
            feed.push({
              id: `bill-${b.id}`,
              kind: 'BILL',
              title: `${b.type === 'WATER' ? 'Water' : 'Electricity'} bill issued`,
              description: `Grand total ${ksh(b.grandTotal)}${b.dueDate ? `, due ${formatDate(b.dueDate)}` : ''}.`,
              date: b.issuedAt,
              amount: b.grandTotal,
              status: b.status,
            });
          }
        }
        if (invoicesRes.status === 'fulfilled' && invoicesRes.value?.data) {
          for (const inv of invoicesRes.value.data as TenantPortalInvoice[]) {
            feed.push({
              id: `inv-${inv.id}`,
              kind: 'INVOICE',
              title: `Invoice ${inv.invoiceNumber}`,
              description: `${inv.paymentPeriod} — total due ${ksh(inv.totalDue)}, balance ${ksh(inv.balance)}. Due ${formatDate(inv.dueDate)}.`,
              date: inv.issueDate,
              amount: inv.totalDue,
              status: inv.status,
            });
          }
        }

        feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setItems(feed);

        if (
          lettersRes.status === 'rejected' &&
          billsRes.status === 'rejected' &&
          invoicesRes.status === 'rejected'
        ) {
          throw new Error(
            (lettersRes.reason as any)?.message || 'Failed to load notifications.'
          );
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load notifications.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingState label="Loading notifications…" />;

  return (
    <>
      <div>
        <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Notifications</h1>
        <p className="text-xs text-slate-500 sm:text-sm">
          Payment reminders, utility bills, invoices and demand letters.
        </p>
      </div>

      <ErrorState message={error} />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 px-4 text-center">
          <Bell className="h-8 w-8 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">No notifications</p>
          <p className="max-w-sm text-xs text-slate-500">
            You will see updates about bills, invoices and demand letters here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const meta = kindMeta[item.kind];
            return (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:items-center sm:gap-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-slate-900">{item.title}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{item.description}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(item.date)}</p>
                </div>
                <span className="shrink-0">
                  <StatusBadge status={item.status} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
