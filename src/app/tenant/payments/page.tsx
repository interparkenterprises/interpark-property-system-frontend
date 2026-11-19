'use client';

import { useEffect, useState } from 'react';
import { Wallet, Receipt, FileText, CalendarClock } from 'lucide-react';
import { tenantPortalAPI } from '@/lib/api';
import { Card, LoadingState, ErrorState } from '@/components/tenant/states';
import StatusBadge from '@/components/tenant/StatusBadge';
import { ksh, formatDate } from '@/components/tenant/format';
import type {
  TenantPortalPayment,
  TenantPortalInvoice,
  TenantPortalBill,
} from '@/types';

export default function TenantPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [outstanding, setOutstanding] = useState<number | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);
  const [payments, setPayments] = useState<TenantPortalPayment[]>([]);
  const [invoices, setInvoices] = useState<TenantPortalInvoice[]>([]);
  const [bills, setBills] = useState<TenantPortalBill[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const [statementRes, paymentsRes, invoicesRes, billsRes] =
          await Promise.allSettled([
            tenantPortalAPI.getStatement(),
            tenantPortalAPI.getPayments(),
            tenantPortalAPI.getInvoices(),
            tenantPortalAPI.getBills(),
          ]);
        if (cancelled) return;

        // Statement drives the outstanding-balance summary; failure is non-fatal.
        if (
          statementRes.status === 'fulfilled' &&
          statementRes.value?.data?.paymentSummary
        ) {
          const summary = statementRes.value.data.paymentSummary;
          setOutstanding(summary.paymentHistory?.outstandingBalance ?? summary.nextPayment?.amount ?? 0);
          setIsOverdue(summary.nextPayment?.isOverdue ?? false);
        }

        if (paymentsRes.status === 'fulfilled' && paymentsRes.value?.data) {
          setPayments(paymentsRes.value.data);
        }
        if (invoicesRes.status === 'fulfilled' && invoicesRes.value?.data) {
          setInvoices(invoicesRes.value.data);
        }
        if (billsRes.status === 'fulfilled' && billsRes.value?.bills?.data) {
          setBills(billsRes.value.bills.data);
        }

        // Only fail the whole page if the primary data failed.
        if (
          paymentsRes.status === 'rejected' &&
          invoicesRes.status === 'rejected' &&
          billsRes.status === 'rejected'
        ) {
          throw new Error(
            (paymentsRes.reason as any)?.message || 'Failed to load payment data.'
          );
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load payment data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingState label="Loading your payments…" />;

  return (
    <>
      <div>
        <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Payments</h1>
        <p className="text-xs text-slate-500 sm:text-sm">
          Your payment history, invoices and utility bills.
        </p>
      </div>

      <ErrorState message={error} />

      {/* Summary */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <div
          className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${
            isOverdue ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-800' : 'text-emerald-800'}`}>
            <Wallet className="h-5 w-5" />
            <span className="text-sm font-medium">Outstanding Balance</span>
          </div>
          <p
            className={`mt-2 truncate text-xl font-bold sm:text-2xl ${
              isOverdue ? 'text-red-800' : 'text-slate-900'
            }`}
          >
            {ksh(outstanding)}
          </p>
          {isOverdue && (
            <p className="mt-1 text-xs font-medium text-red-800">
              Past due — please settle as soon as possible.
            </p>
          )}
        </div>

        <SummaryCard
          icon={<CalendarClock className="h-5 w-5" />}
          tint="text-blue-800"
          bg="border-blue-200 bg-blue-50"
          label="Payments Recorded"
          value={String(payments.length)}
        />
        <SummaryCard
          icon={<FileText className="h-5 w-5" />}
          tint="text-purple-800"
          bg="border-purple-200 bg-purple-50"
          label="Invoices"
          value={String(invoices.length)}
        />
        <SummaryCard
          icon={<Receipt className="h-5 w-5" />}
          tint="text-amber-800"
          bg="border-amber-200 bg-amber-50"
          label="Utility Bills"
          value={String(bills.length)}
        />
      </section>

      {/* Payment history */}
      <Card title="Payment History">
        {payments.length === 0 ? (
          <EmptyRows icon={<Wallet className="mx-auto h-8 w-8 text-slate-400" />} text="No payments recorded yet." />
        ) : (
          <Table
            headers={['Date Paid', 'Period', 'Amount', 'Paid', 'Arrears', 'Status']}
            rows={payments.map((p) => [
              formatDate(p.datePaid),
              p.paymentPeriod,
              ksh(p.amountPaid),
              ksh(p.totalDue),
              p.arrears > 0 ? ksh(p.arrears) : '—',
              <StatusBadge key="s" status={p.status} />,
            ])}
          />
        )}
      </Card>

      {/* Invoices */}
      <Card title="Invoices">
        {invoices.length === 0 ? (
          <EmptyRows icon={<FileText className="mx-auto h-8 w-8 text-slate-400" />} text="No invoices issued yet." />
        ) : (
          <Table
            headers={['Invoice #', 'Period', 'Issued', 'Due', 'Total Due', 'Paid', 'Balance', 'Status']}
            rows={invoices.map((inv) => [
              inv.invoiceNumber,
              inv.paymentPeriod,
              formatDate(inv.issueDate),
              formatDate(inv.dueDate),
              ksh(inv.totalDue),
              ksh(inv.amountPaid),
              inv.balance > 0 ? ksh(inv.balance) : '—',
              <StatusBadge key="s" status={inv.status} />,
            ])}
          />
        )}
      </Card>

      {/* Utility bills */}
      <Card title="Utility Bills">
        {bills.length === 0 ? (
          <EmptyRows icon={<Receipt className="mx-auto h-8 w-8 text-slate-400" />} text="No utility bills issued yet." />
        ) : (
          <Table
            headers={['Type', 'Issued', 'Due', 'Units', 'Grand Total', 'Paid', 'Status']}
            rows={bills.map((b) => [
              b.type === 'WATER' ? 'Water' : 'Electricity',
              formatDate(b.issuedAt),
              b.dueDate ? formatDate(b.dueDate) : '—',
              `${b.units} @ ${ksh(b.chargePerUnit)}`,
              ksh(b.grandTotal),
              ksh(b.amountPaid),
              <StatusBadge key="s" status={b.status} />,
            ])}
          />
        )}
      </Card>
    </>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tint,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: string;
  bg: string;
}) {
  return (
    <div className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${bg}`}>
      <div className={`flex items-center gap-2 ${tint}`}>
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-2 truncate text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-200 text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-700">
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap pb-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              {cells.map((cell, j) => (
                <td key={j} className="whitespace-nowrap py-3 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyRows({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="py-10 text-center">
      {icon}
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}
