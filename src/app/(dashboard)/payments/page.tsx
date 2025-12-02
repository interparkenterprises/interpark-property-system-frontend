'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { PaymentReport } from '@/types';
import { paymentsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ Now returns PaymentReport[] directly (API layer handles .data extraction)
      const data = await paymentsAPI.getPaymentReports();
      setPayments(data);
    } catch (err) {
      console.error('Error fetching payments:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to load payment reports.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Safe & performant total calculation
  const totalAmount = useMemo(() => {
    return payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  }, [payments]);

  // ✅ Loading & error UI
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-lg text-gray-600">Loading payment reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg">
        <p>⚠️ {error}</p>
        <Button onClick={fetchPayments} className="mt-3">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Payment Reports</h1>
        <div className="space-x-2">
          <Link href="/payments/income">
            <Button variant="secondary">View Income</Button>
          </Link>
          <Button>Record Payment</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Payments</h3>
              <p className="text-2xl font-semibold text-gray-900">{payments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded">
              <span className="text-2xl">💵</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
              <p className="text-2xl font-semibold text-gray-900">
                Ksh {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Average Payment</h3>
              <p className="text-2xl font-semibold text-gray-900">
                Ksh{' '}
                {payments.length > 0
                  ? (totalAmount / payments.length).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })
                  : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Paid
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length > 0 ? (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.tenant?.fullName ?? '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.tenant?.unit?.property?.name ?? '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    Ksh {payment.amountPaid.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.datePaid
                      ? new Date(payment.datePaid).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {payment.notes || '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No payment records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}