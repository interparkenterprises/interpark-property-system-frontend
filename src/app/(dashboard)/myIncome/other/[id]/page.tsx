'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { otherIncomeAPI } from '@/lib/api';
import {
  InvoiceStatus,
  OtherIncome,
  OtherIncomeAttachment,
  OtherIncomeStatsResponse,
} from '@/types';
import IncomeFormModal from '@/components/forms/IncomeFormModal';

type ChartPoint = {
  label: string;
  value: number;
  color?: string;
};

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl animate-pulse px-4 sm:px-6 lg:px-8">
        <div className="mb-6 h-8 w-48 rounded bg-gray-200" />
        <div className="mb-6 h-28 rounded-xl bg-white shadow" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-72 rounded-xl bg-white shadow lg:col-span-2" />
          <div className="h-72 rounded-xl bg-white shadow" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
    </div>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const config: Record<InvoiceStatus, string> = {
    UNPAID: 'bg-yellow-100 text-yellow-800',
    PARTIAL: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config[status]}`}
    >
      {status}
    </span>
  );
}

function BarChart({
  title,
  data,
  emptyMessage = 'No data available',
}: {
  title: string;
  data: ChartPoint[];
  emptyMessage?: string;
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>

      {data.length === 0 ? (
        <div className="mt-6 rounded-lg bg-gray-50 p-6 text-sm text-gray-500">{emptyMessage}</div>
      ) : (
        <div className="mt-6">
          <div className="flex h-64 items-end gap-3 overflow-x-auto">
            {data.map((item) => {
              const height = maxValue > 0 ? Math.max((item.value / maxValue) * 100, 8) : 8;

              return (
                <div key={item.label} className="flex min-w-18 flex-1 flex-col items-center">
                  <span className="mb-2 text-xs font-medium text-gray-600">
                    {item.value.toLocaleString()}
                  </span>
                  <div className="flex h-48 w-full items-end rounded-t-lg bg-gray-100">
                    <div
                      className="w-full rounded-t-lg transition-all duration-300"
                      style={{
                        height: `${height}%`,
                        background: item.color || '#2563eb',
                      }}
                    />
                  </div>
                  <span className="mt-3 text-center text-xs text-gray-500">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PieChart({
  title,
  data,
  emptyMessage = 'No data available',
}: {
  title: string;
  data: ChartPoint[];
  emptyMessage?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const gradient = useMemo(() => {
    if (total === 0 || data.length === 0) return '#e5e7eb';

    let current = 0;
    const segments = data.map((item) => {
      const start = current;
      const percentage = (item.value / total) * 100;
      current += percentage;
      return `${item.color} ${start}% ${current}%`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }, [data, total]);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>

      {data.length === 0 || total === 0 ? (
        <div className="mt-6 rounded-lg bg-gray-50 p-6 text-sm text-gray-500">{emptyMessage}</div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <div className="relative mx-auto h-52 w-52">
            <div className="h-52 w-52 rounded-full" style={{ background: gradient }} />
            <div className="absolute inset-0 m-auto flex h-24 w-24 items-center justify-center rounded-full bg-white text-center shadow-inner">
              <div>
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-lg font-bold text-gray-900">{total}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {data.map((item) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';

              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{item.value}</div>
                    <div className="text-xs text-gray-500">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-3 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <div className="text-sm text-gray-900 sm:max-w-[60%] sm:text-right">{value || '—'}</div>
    </div>
  );
}

export default function OtherIncomeDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();

  const id = params?.id as string;

  const [income, setIncome] = useState<OtherIncome | null>(null);
  const [stats, setStats] = useState<OtherIncomeStatsResponse['data'] | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [deletingIncome, setDeletingIncome] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentDescription, setAttachmentDescription] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [selectingFile, setSelectingFile] = useState(false);

  const [previewingAttachmentId, setPreviewingAttachmentId] = useState<string | null>(null);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchData = async (showFullLoading = true) => {
    if (!id || !user?.id) return;

    try {
      if (showFullLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const [incomeResponse, statsResponse] = await Promise.all([
        otherIncomeAPI.getById(id),
        otherIncomeAPI.getStats(user.id, {
          year: String(new Date().getFullYear()),
        }),
      ]);

      setIncome(incomeResponse);
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Failed to fetch income details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch income details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id && user?.id) {
      fetchData(true);
    }
  }, [id, user?.id]);

  useEffect(() => {
    const handleWindowFocus = () => {
      if (selectingFile) {
        setTimeout(() => setSelectingFile(false), 300);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [selectingFile]);

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

  const formatDateTime = (date?: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const daysToDue = useMemo(() => {
    if (!income?.dueDate) return null;
    const today = new Date();
    const due = new Date(income.dueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [income?.dueDate]);

  const incomeShareOfTotal = useMemo(() => {
    if (!income || !stats?.totalIncome) return '0.0%';
    return `${((Number(income.totalAmount || 0) / Number(stats.totalIncome || 0)) * 100).toFixed(
      1
    )}%`;
  }, [income, stats]);

  const statusCount = useMemo(() => {
    if (!income || !stats?.statusData) return 0;
    return Number(stats.statusData[income.status] || 0);
  }, [income, stats]);

  const monthlyChartData = useMemo<ChartPoint[]>(() => {
    if (!stats?.monthlyData) return [];
    return Object.entries(stats.monthlyData)
      .map(([label, value]) => ({
        label,
        value: Number(value),
        color: '#2563eb',
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-6);
  }, [stats]);

  const categoryChartData = useMemo<ChartPoint[]>(() => {
    if (!stats?.categoryData) return [];

    const colors = [
      '#2563eb',
      '#10b981',
      '#f59e0b',
      '#8b5cf6',
      '#ef4444',
      '#06b6d4',
      '#84cc16',
      '#f97316',
      '#6366f1',
    ];

    return Object.entries(stats.categoryData)
      .map(([label, value], index) => ({
        label: otherIncomeAPI.getCategoryLabel(label as any),
        value: Number(value),
        color: colors[index % colors.length],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const statusChartData = useMemo<ChartPoint[]>(() => {
    if (!stats?.statusData) return [];

    const colorMap: Record<string, string> = {
      PAID: '#10b981',
      PARTIAL: '#3b82f6',
      UNPAID: '#f59e0b',
      OVERDUE: '#ef4444',
      CANCELLED: '#6b7280',
    };

    return Object.entries(stats.statusData)
      .map(([label, value]) => ({
        label,
        value: Number(value),
        color: colorMap[label] || '#94a3b8',
      }))
      .filter((item) => item.value > 0);
  }, [stats]);

  const handleDownloadInvoice = async () => {
    if (!income) return;

    try {
      setDownloadingInvoice(true);
      const blob = await otherIncomeAPI.downloadInvoice(income.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${income.invoiceNumber || `other-income-${income.id}`}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download invoice:', err);
      alert(err instanceof Error ? err.message : 'Failed to download invoice');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!income) return;

    try {
      setMarkingPaid(true);
      await otherIncomeAPI.markAsPaid(income.id);
      await fetchData(false);
      alert('Income marked as paid successfully.');
    } catch (err) {
      console.error('Failed to mark as paid:', err);
      alert(err instanceof Error ? err.message : 'Failed to mark income as paid');
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleDeleteIncome = async () => {
    if (!income) return;
    if (!confirm('Are you sure you want to delete this income invoice?')) return;

    try {
      setDeletingIncome(true);
      await otherIncomeAPI.delete(income.id);
      alert('Income deleted successfully.');
      router.push('/myIncome/other');
    } catch (err) {
      console.error('Failed to delete income:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete income');
    } finally {
      setDeletingIncome(false);
    }
  };

  const handleChooseFile = () => {
    setSelectingFile(true);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
    setSelectingFile(false);
  };

  const handleUploadAttachment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!income || !selectedFile) {
      alert('Please choose a file first.');
      return;
    }

    try {
      setUploadingAttachment(true);
      await otherIncomeAPI.uploadAttachment(
        income.id,
        selectedFile,
        attachmentDescription || undefined
      );
      setSelectedFile(null);
      setAttachmentDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchData(false);
      alert('Attachment uploaded successfully.');
    } catch (err) {
      console.error('Failed to upload attachment:', err);
      alert(err instanceof Error ? err.message : 'Failed to upload attachment');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachment: OtherIncomeAttachment) => {
    if (!confirm(`Delete attachment "${attachment.fileName}"?`)) return;

    try {
      setDeletingAttachmentId(attachment.id);
      await otherIncomeAPI.deleteAttachment(attachment.id);
      await fetchData(false);
      alert('Attachment deleted successfully.');
    } catch (err) {
      console.error('Failed to delete attachment:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete attachment');
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const handlePreview = async (attachmentId: string) => {
    try {
      setPreviewingAttachmentId(attachmentId);

      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to preview files');
        setPreviewingAttachmentId(null);
        return;
      }

      const previewUrl = `/api/other-income/attachments/${attachmentId}/preview?token=${encodeURIComponent(
        token
      )}`;
      window.open(previewUrl, '_blank');

      setTimeout(() => {
        setPreviewingAttachmentId(null);
      }, 700);
    } catch (err) {
      console.error('Failed to preview attachment:', err);
      alert(err instanceof Error ? err.message : 'Failed to preview attachment');
      setPreviewingAttachmentId(null);
    }
  };

  const handleDownloadAttachment = async (attachment: OtherIncomeAttachment) => {
    try {
      setDownloadingAttachmentId(attachment.id);
      await otherIncomeAPI.triggerAttachmentDownload(attachment.id, attachment.fileName);
    } catch (err) {
      console.error('Failed to download attachment:', err);
      alert(err instanceof Error ? err.message : 'Failed to download attachment');
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (error || !income) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">Unable to load income details</p>
            <p className="mt-2 text-sm">{error || 'Income not found.'}</p>
            <div className="mt-4">
              <Link
                href="/myIncome/other"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                ← Back to Other Income
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const attachments = income.attachments || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/myIncome/other"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              ← Back to Other Income
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              {income.invoiceNumber || 'Income Details'}
            </h1>
            <p className="mt-1 text-gray-600">
              {income.title} • {income.clientName}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowEditForm(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Edit
            </button>

            {(income.status === 'UNPAID' || income.status === 'PARTIAL') && (
              <button
                onClick={handleMarkAsPaid}
                disabled={markingPaid}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {markingPaid ? 'Updating...' : 'Mark Paid'}
              </button>
            )}

            <button
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {downloadingInvoice ? 'Downloading...' : 'Download PDF'}
            </button>

            <button
              onClick={handleDeleteIncome}
              disabled={deletingIncome}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deletingIncome ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {refreshing && (
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
            Refreshing data...
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Invoice Total"
            value={`KSH ${formatCurrency(Number(income.totalAmount || 0))}`}
          />
          <StatCard
            title="VAT Amount"
            value={`KSH ${formatCurrency(Number(income.vatAmount || 0))}`}
            subtitle={
              income.vatType === 'NOT_APPLICABLE'
                ? 'VAT not applicable'
                : `${income.vatType} • ${income.vatRate || 0}%`
            }
          />
          <StatCard
            title="Income Share"
            value={incomeShareOfTotal}
            subtitle="Share of current year's total other income"
          />
          <StatCard
            title="Attachments"
            value={attachments.length.toString()}
            subtitle="Files linked to this invoice"
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Invoice Overview</h2>
                <StatusBadge status={income.status} />
              </div>

              <div className="grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2">
                <InfoRow label="Invoice Number" value={income.invoiceNumber || '—'} />
                <InfoRow label="Category" value={otherIncomeAPI.getCategoryLabel(income.category)} />
                <InfoRow label="Title" value={income.title} />
                <InfoRow label="Sub Category" value={income.subCategory || '—'} />
                <InfoRow label="Issue Date" value={formatDate(income.issueDate)} />
                <InfoRow
                  label="Due Date"
                  value={
                    income.dueDate ? (
                      <div>
                        <div>{formatDate(income.dueDate)}</div>
                        {daysToDue !== null && (
                          <div className="text-xs text-gray-500">
                            {daysToDue >= 0
                              ? `${daysToDue} day(s) remaining`
                              : `${Math.abs(daysToDue)} day(s) overdue`}
                          </div>
                        )}
                      </div>
                    ) : (
                      '—'
                    )
                  }
                />
                <InfoRow label="Paid Date" value={formatDate(income.paidDate)} />
                <InfoRow label="Currency" value={income.currency} />
                <InfoRow label="Created At" value={formatDateTime(income.createdAt)} />
                <InfoRow label="Updated At" value={formatDateTime(income.updatedAt)} />
                <InfoRow label="Payment Method" value={income.paymentMethod || '—'} />
                <InfoRow label="Transaction Ref" value={income.transactionRef || '—'} />
              </div>

              {income.description && (
                <div className="mt-6 rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Description</h3>
                  <p className="text-sm leading-6 text-gray-700">{income.description}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Client & Bank Details</h2>

              <div className="space-y-1">
                <InfoRow label="Client Name" value={income.clientName} />
                <InfoRow label="Client Company" value={income.clientCompany || '—'} />
                <InfoRow label="Client Email" value={income.clientEmail || '—'} />
                <InfoRow label="Client Phone" value={income.clientPhone || '—'} />
                <InfoRow label="Client Address" value={income.clientAddress || '—'} />
                <InfoRow label="Bank Name" value={income.bankName || '—'} />
                <InfoRow label="Account Name" value={income.accountName || '—'} />
                <InfoRow label="Account Number" value={income.accountNumber || '—'} />
                <InfoRow label="Branch" value={income.branch || '—'} />
                <InfoRow label="Bank Code" value={income.bankCode || '—'} />
                <InfoRow label="SWIFT Code" value={income.swiftCode || '—'} />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BarChart title="Monthly Other Income Trend" data={monthlyChartData} />
          </div>
          <div className="lg:col-span-1">
            <PieChart title="Invoice Status Distribution" data={statusChartData} />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BarChart title="Category Performance" data={categoryChartData.slice(0, 6)} />
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Context Analytics</h3>

              <div className="mt-5 space-y-4">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="text-sm font-medium text-blue-700">Total Other Income</div>
                  <div className="mt-1 text-xl font-bold text-blue-900">
                    KSH {formatCurrency(Number(stats?.totalIncome || 0))}
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 p-4">
                  <div className="text-sm font-medium text-amber-700">Invoices With Same Status</div>
                  <div className="mt-1 text-xl font-bold text-amber-900">{statusCount}</div>
                  <div className="mt-1 text-xs text-amber-700">{income.status}</div>
                </div>

                <div className="rounded-lg bg-purple-50 p-4">
                  <div className="text-sm font-medium text-purple-700">Current Year Invoice Count</div>
                  <div className="mt-1 text-xl font-bold text-purple-900">{stats?.count || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
              <p className="text-sm text-gray-500">
                Upload supporting files for this income invoice.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleUploadAttachment}
            className="mb-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Attachment File
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleChooseFile}
                    disabled={uploadingAttachment || selectingFile}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {selectingFile ? 'Opening file picker...' : 'Choose File'}
                  </button>

                  <span className="text-xs text-gray-500">
                    {selectedFile ? selectedFile.name : 'No file selected'}
                  </span>
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={attachmentDescription}
                  onChange={(e) => setAttachmentDescription(e.target.value)}
                  placeholder="Optional attachment description"
                  disabled={uploadingAttachment}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={uploadingAttachment || !selectedFile}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingAttachment ? 'Uploading...' : 'Upload Attachment'}
                </button>
              </div>
            </div>
          </form>

          {attachments.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
              No attachments uploaded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {otherIncomeAPI.getFileIcon(attachment.fileType)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {otherIncomeAPI.formatFileSize(attachment.fileSize)} • Uploaded{' '}
                          {formatDateTime(attachment.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    {attachment.description && (
                      <p className="mt-2 text-sm text-gray-600">{attachment.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {otherIncomeAPI.isPreviewable(attachment.fileType) && (
                      <button
                        type="button"
                        onClick={() => handlePreview(attachment.id)}
                        disabled={previewingAttachmentId === attachment.id}
                        className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {previewingAttachmentId === attachment.id ? 'Opening preview...' : 'Preview'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownloadAttachment(attachment)}
                      disabled={downloadingAttachmentId === attachment.id}
                      className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {downloadingAttachmentId === attachment.id ? 'Downloading...' : 'Download'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(attachment)}
                      disabled={deletingAttachmentId === attachment.id}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingAttachmentId === attachment.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <IncomeFormModal
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSuccess={() => fetchData(false)}
        editingIncome={income}
        managerId={income.managerId || user?.id || ''}
      />
    </div>
  );
}