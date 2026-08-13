'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { otherIncomeAPI } from '@/lib/api';
import {
  OtherIncome,
  OtherIncomeCategory,
  InvoiceStatus,
  OtherIncomeListResponse,
} from '@/types';
import IncomeFormModal from '@/components/forms/IncomeFormModal';
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat';

// =============================================
// SKELETON LOADING
// =============================================
const TableSkeleton = () => (
  <div className="overflow-x-auto animate-pulse">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <th key={i} className="px-6 py-3">
              <div className="h-4 w-20 rounded bg-gray-200" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {[1, 2, 3, 4, 5].map((i) => (
          <tr key={i}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
              <td key={j} className="px-6 py-4">
                <div className="h-4 w-24 rounded bg-gray-100" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

function SummaryCard({
  title,
  value,
  fullValueTitle,
  tone = 'blue',
}: {
  title: string;
  value: string;
  fullValueTitle?: string;
  tone?: 'blue' | 'green' | 'amber' | 'purple';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };

  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="kpi-value mt-2 font-bold" title={fullValueTitle}>{value}</p>
    </div>
  );
}

// =============================================
// MAIN PAGE COMPONENT
// =============================================
export default function OtherIncomePage() {
  const { user } = useAuth();

  const [incomes, setIncomes] = useState<OtherIncome[]>([]);
  const [listStats, setListStats] = useState<OtherIncomeListResponse['stats'] | null>(null);

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<OtherIncome | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<OtherIncomeCategory | 'all'>('all');

  useEffect(() => {
    if (user?.id) {
      fetchIncomes(true);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && !loading) {
      fetchIncomes(false);
    }
  }, [statusFilter, categoryFilter]);

  const fetchIncomes = async (showFullLoading = true) => {
    try {
      if (showFullLoading) {
        setLoading(true);
      } else {
        setTableLoading(true);
      }

      setError(null);

      const params: {
        status?: InvoiceStatus;
        category?: OtherIncomeCategory;
      } = {};

      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const response = await otherIncomeAPI.getMyIncomes(user!.id, params);

      setIncomes(response.data || []);
      setListStats(response.stats || null);
    } catch (err) {
      console.error('Error fetching other incomes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch other incomes');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income?')) return;

    try {
      setDeletingId(id);
      await otherIncomeAPI.delete(id);
      await fetchIncomes(false);
      alert('Income deleted successfully!');
    } catch (err) {
      console.error('Error deleting income:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete income');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      setDownloading(id);
      const blob = await otherIncomeAPI.downloadInvoice(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `other-income-invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert(err instanceof Error ? err.message : 'Failed to download invoice');
    } finally {
      setDownloading(null);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      setMarkingPaidId(id);
      await otherIncomeAPI.markAsPaid(id);
      await fetchIncomes(false);
      alert('Income marked as paid!');
    } catch (err) {
      console.error('Error marking as paid:', err);
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setMarkingPaidId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    const numericAmount =
      typeof amount === 'number' ? amount : Number.parseFloat(String(amount)) || 0;

    const roundedAmount = Math.round(numericAmount * 1000) / 1000;
    const decimals = Number.isInteger(roundedAmount)
      ? 0
      : Math.min(String(roundedAmount).split('.')[1]?.length || 0, 3);

    return roundedAmount.toLocaleString('en-KE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatDate = (date?: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const config: Record<InvoiceStatus, string> = {
      UNPAID: 'bg-yellow-100 text-yellow-800',
      PARTIAL: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config[status]}`}
      >
        {status}
      </span>
    );
  };

  const getCategoryLabel = (category: OtherIncomeCategory) => {
    return otherIncomeAPI.getCategoryLabel(category);
  };

  const summary = useMemo(() => {
    return {
      totalCount: listStats?.totalCount ?? incomes.length,
      totalAmount:
        listStats?.totalAmount ??
        incomes.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
      totalVat:
        listStats?.totalVat ??
        incomes.reduce((sum, item) => sum + Number(item.vatAmount || 0), 0),
      unpaidCount: incomes.filter(
        (item) => item.status === 'UNPAID' || item.status === 'OVERDUE'
      ).length,
    };
  }, [incomes, listStats]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Income</h1>
          <p className="mt-2 text-gray-600">
            Track your commission earnings and other income
          </p>

          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <Link
                href="/myIncome"
                className="border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                Commission History
              </Link>
              <Link
                href="/myIncome/other"
                className="border-b-2 border-blue-500 px-1 py-4 text-sm font-medium text-blue-600"
              >
                Other Income
              </Link>
            </nav>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Other Income</h2>
            <p className="text-sm text-gray-500">
              Manage income from consultancy, sales, and other services
            </p>
          </div>

          <button
            onClick={() => {
              setEditingIncome(null);
              setShowForm(true);
            }}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Income
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Total Invoices" value={summary.totalCount.toString()} tone="blue" />
          <SummaryCard title="Total Value" value={formatCompactKes(summary.totalAmount)} fullValueTitle={formatExactKes(summary.totalAmount)} tone="green" />
          <SummaryCard title="Total VAT" value={formatCompactKes(summary.totalVat)} fullValueTitle={formatExactKes(summary.totalVat)} tone="purple" />
          <SummaryCard title="Open / Overdue" value={summary.unpaidCount.toString()} tone="amber" />
        </div>

        <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg bg-white p-4 shadow">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Status</label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
            >
              <option value="all">All Status</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Category</label>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as OtherIncomeCategory | 'all')}
            >
              <option value="all">All Categories</option>
              {otherIncomeAPI.getCategories().map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setStatusFilter('all');
              setCategoryFilter('all');
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear Filters
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg bg-white shadow">
          {tableLoading ? (
            <TableSkeleton />
          ) : incomes.length === 0 ? (
            <div className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No other income</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add income from consultancy, property sales, or other services.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Title / Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      VAT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {incomes.map((income) => {
                    const hasInvoice = Boolean(income.invoiceNumber);

                    return (
                      <tr key={income.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          {hasInvoice ? (
                            <Link
                              href={`/myIncome/other/${income.id}`}
                              className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {income.invoiceNumber}
                            </Link>
                          ) : (
                            <span className="text-gray-400">No invoice</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{income.title}</div>
                          <div className="text-sm text-gray-500">{income.clientName}</div>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {getCategoryLabel(income.category)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          KSH {formatCurrency(Number(income.amount || 0))}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {income.vatType !== 'NOT_APPLICABLE' && income.vatAmount ? (
                            `KSH ${formatCurrency(Number(income.vatAmount || 0))}`
                          ) : (
                            'N/A'
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-green-600">
                          KSH {formatCurrency(Number(income.totalAmount || 0))}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          {getStatusBadge(income.status)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDate(income.issueDate)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <div className="flex flex-col space-y-1">
                            {hasInvoice && (
                              <Link
                                href={`/myIncome/other/${income.id}`}
                                className="text-left text-xs text-sky-600 hover:text-sky-900"
                              >
                                View Details
                              </Link>
                            )}

                            {(income.status === 'UNPAID' || income.status === 'PARTIAL') && (
                              <button
                                onClick={() => handleMarkAsPaid(income.id)}
                                disabled={markingPaidId === income.id}
                                className="text-left text-xs text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                {markingPaidId === income.id ? 'Updating...' : 'Mark Paid'}
                              </button>
                            )}

                            <button
                              onClick={() => handleDownloadPDF(income.id)}
                              disabled={downloading === income.id}
                              className="text-left text-xs text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            >
                              {downloading === income.id ? 'Downloading...' : 'Download PDF'}
                            </button>

                            <button
                              onClick={() => {
                                setEditingIncome(income);
                                setShowForm(true);
                              }}
                              className="text-left text-xs text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDelete(income.id)}
                              disabled={deletingId === income.id}
                              className="text-left text-xs text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              {deletingId === income.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <IncomeFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingIncome(null);
        }}
        onSuccess={() => {
          fetchIncomes(false);
        }}
        editingIncome={editingIncome}
        managerId={user?.id || ''}
      />
    </div>
  );
}