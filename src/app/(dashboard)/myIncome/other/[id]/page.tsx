'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  IncomeContextPanel,
  IncomeRecordOverview,
} from '@/components/my-income/IncomeAnalyticalPanels';
import { useBreadcrumbAction, useBreadcrumbOverride } from '@/components/layout/BreadcrumbContext';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button, buttonStyles } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailItem, DetailList } from '@/components/ui/detail-list';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FileUpload } from '@/components/ui/file-upload';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge as SharedStatusBadge } from '@/components/ui/status-badge';

function PageSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading income details" aria-busy="true">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map(item => <Skeleton key={item} className="h-28" />)}</div>
      <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-72 lg:col-span-2" /><Skeleton className="h-72" /></div>
    </div>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const config: Record<InvoiceStatus, 'warning' | 'info' | 'success' | 'destructive' | 'neutral'> = {
    UNPAID: 'warning', PARTIAL: 'info', PAID: 'success', OVERDUE: 'destructive', CANCELLED: 'neutral',
  };
  return <SharedStatusBadge status={status} appearance={config[status]} />;
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return <DetailItem label={label}>{value || '—'}</DetailItem>;
}

export default function OtherIncomeDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();

  const id = params?.id as string;
  const userId = user?.id;

  const [income, setIncome] = useState<OtherIncome | null>(null);
  const [stats, setStats] = useState<OtherIncomeStatsResponse['data'] | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [deletingIncome, setDeletingIncome] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);
  useBreadcrumbOverride(`/myIncome/other/${id}`, loading ? 'Loading…' : income?.invoiceNumber || income?.title || 'Income details');
  useBreadcrumbAction(showEditForm ? 'Edit' : null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentDescription, setAttachmentDescription] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const [previewingAttachmentId, setPreviewingAttachmentId] = useState<string | null>(null);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [confirmDeleteIncome, setConfirmDeleteIncome] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<OtherIncomeAttachment | null>(null);

  const fetchData = useCallback(async (showFullLoading = true) => {
    if (!id || !userId) return;

    try {
      if (showFullLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const [incomeResponse, statsResponse] = await Promise.all([
        otherIncomeAPI.getById(id),
        otherIncomeAPI.getStats(userId, {
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
  }, [id, userId]);

  useEffect(() => {
    if (!id || !userId) return;
    const frame = requestAnimationFrame(() => void fetchData(true));
    return () => cancelAnimationFrame(frame);
  }, [fetchData, id, userId]);

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
      setConfirmDeleteIncome(false);
    }
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
      setAttachmentToDelete(null);
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
      <EmptyState title="Unable to load income details" description={error || 'Income not found.'} action={<Link href="/myIncome/other" className={buttonStyles({ variant: 'outline' })}>Back to other income</Link>} />
    );
  }

  const attachments = income.attachments || [];
  const categoryLabels = Object.fromEntries(
    otherIncomeAPI.getCategories().map((category) => [category.value, category.label])
  );

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader
        title={income.invoiceNumber || 'Income details'}
        description={`${income.title} · ${income.clientName}`}
        leading={<StatusBadge status={income.status} />}
        actions={
          <>
            <Link href="/myIncome/other" className={buttonStyles({ variant: 'outline', size: 'sm' })}>Back</Link>
            <Button size="sm" variant="outline" onClick={() => setShowEditForm(true)}>Edit</Button>
            {(income.status === 'UNPAID' || income.status === 'PARTIAL') && (
              <Button size="sm" onClick={handleMarkAsPaid} disabled={markingPaid} loading={markingPaid}>
                {markingPaid ? 'Updating...' : 'Mark Paid'}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleDownloadInvoice} disabled={downloadingInvoice} loading={downloadingInvoice}>
              {downloadingInvoice ? 'Downloading...' : 'Download PDF'}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setConfirmDeleteIncome(true)} disabled={deletingIncome}>
              Delete
            </Button>
          </>
        }
      />

      {refreshing && <Alert><AlertTitle>Refreshing data…</AlertTitle></Alert>}

      <IncomeRecordOverview
        amount={Number(income.amount || 0)}
        vatAmount={Number(income.vatAmount || 0)}
        totalAmount={Number(income.totalAmount || 0)}
        status={income.status}
        dueDate={formatDate(income.dueDate)}
        incomeShare={incomeShareOfTotal}
        attachmentCount={attachments.length}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Income information</CardTitle></CardHeader>
          <CardContent>
            <DetailList>
              <InfoRow label="Invoice Number" value={income.invoiceNumber || '—'} />
              <InfoRow label="Title" value={income.title} />
              <InfoRow label="Category" value={otherIncomeAPI.getCategoryLabel(income.category)} />
              <InfoRow label="Sub Category" value={income.subCategory || '—'} />
              <InfoRow label="Status" value={<StatusBadge status={income.status} />} />
              <InfoRow label="Issue Date" value={formatDate(income.issueDate)} />
              <InfoRow label="Created At" value={formatDateTime(income.createdAt)} />
              <InfoRow label="Updated At" value={formatDateTime(income.updatedAt)} />
            </DetailList>
            {income.description && (
              <div className="mt-5 rounded-lg bg-muted/40 p-4">
                <h3 className="text-sm font-semibold text-foreground">Description</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{income.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Client information</CardTitle></CardHeader>
          <CardContent>
            <DetailList>
              <InfoRow label="Client Name" value={income.clientName} />
              <InfoRow label="Client Company" value={income.clientCompany || '—'} />
              <InfoRow label="Client Email" value={income.clientEmail || '—'} />
              <InfoRow label="Client Phone" value={income.clientPhone || '—'} />
              <InfoRow label="Client Address" value={income.clientAddress || '—'} />
            </DetailList>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Financial &amp; payment information</CardTitle></CardHeader>
          <CardContent>
            <DetailList>
              <InfoRow label="Original Amount" value={`KSH ${formatCurrency(Number(income.amount || 0))}`} />
              <InfoRow label="VAT Treatment" value={income.vatType === 'NOT_APPLICABLE' ? 'Not applicable' : `${income.vatType} • ${income.vatRate || 0}%`} />
              <InfoRow label="VAT Amount" value={`KSH ${formatCurrency(Number(income.vatAmount || 0))}`} />
              <InfoRow label="Invoice Total" value={`KSH ${formatCurrency(Number(income.totalAmount || 0))}`} />
              <InfoRow label="Due Date" value={income.dueDate ? <span>{formatDate(income.dueDate)}{daysToDue !== null && <span className="block text-xs text-muted-foreground">{daysToDue >= 0 ? `${daysToDue} day(s) remaining` : `${Math.abs(daysToDue)} day(s) overdue`}</span>}</span> : '—'} />
              <InfoRow label="Paid Date" value={formatDate(income.paidDate)} />
              <InfoRow label="Currency" value={income.currency} />
              <InfoRow label="Payment Method" value={income.paymentMethod || '—'} />
              <InfoRow label="Transaction Ref" value={income.transactionRef || '—'} />
              <InfoRow label="Bank Name" value={income.bankName || '—'} />
              <InfoRow label="Account Name" value={income.accountName || '—'} />
              <InfoRow label="Account Number" value={income.accountNumber || '—'} />
              <InfoRow label="Branch" value={income.branch || '—'} />
              <InfoRow label="Bank Code" value={income.bankCode || '—'} />
              <InfoRow label="SWIFT Code" value={income.swiftCode || '—'} />
            </DetailList>
          </CardContent>
        </Card>
      </div>

      {stats && <IncomeContextPanel stats={stats} categoryLabels={categoryLabels} />}

      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
          <p className="text-sm text-muted-foreground">Upload supporting files for this income invoice.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleUploadAttachment} className="space-y-4">
            <FileUpload
              id="income-attachment"
              value={selectedFile}
              onValueChange={setSelectedFile}
              disabled={uploadingAttachment}
              title="Drop a supporting file here"
              description="Documents, spreadsheets, PDFs, and images are supported."
              buttonLabel="Select file"
            />
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <FormField label="Description" htmlFor="attachment-description" optional>
                <Input id="attachment-description" value={attachmentDescription} onChange={(event) => setAttachmentDescription(event.target.value)} placeholder="Optional attachment description" disabled={uploadingAttachment} />
              </FormField>
              <div>
                <Button type="submit" className="w-full md:w-auto" disabled={uploadingAttachment || !selectedFile} loading={uploadingAttachment}>
                  {uploadingAttachment ? 'Uploading...' : 'Upload attachment'}
                </Button>
              </div>
            </div>
          </form>

          {attachments.length === 0 ? (
            <EmptyState title="No attachments yet" description="Supporting files uploaded for this invoice will appear here." />
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex min-w-0 flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="text-2xl" aria-hidden="true">{otherIncomeAPI.getFileIcon(attachment.fileType)}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground" title={attachment.fileName}>{attachment.fileName}</p>
                      <p className="text-xs text-muted-foreground">{otherIncomeAPI.formatFileSize(attachment.fileSize)} • Uploaded {formatDateTime(attachment.uploadedAt)}</p>
                      {attachment.description && <p className="mt-1 text-sm text-muted-foreground">{attachment.description}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {otherIncomeAPI.isPreviewable(attachment.fileType) && (
                      <Button size="sm" variant="outline" onClick={() => handlePreview(attachment.id)} disabled={previewingAttachmentId === attachment.id} loading={previewingAttachmentId === attachment.id}>
                        {previewingAttachmentId === attachment.id ? 'Opening...' : 'Preview'}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleDownloadAttachment(attachment)} disabled={downloadingAttachmentId === attachment.id} loading={downloadingAttachmentId === attachment.id}>
                      {downloadingAttachmentId === attachment.id ? 'Downloading...' : 'Download'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setAttachmentToDelete(attachment)} disabled={deletingAttachmentId === attachment.id}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <IncomeFormModal isOpen={showEditForm} onClose={() => setShowEditForm(false)} onSuccess={() => fetchData(false)} editingIncome={income} managerId={income.managerId || user?.id || ''} />

      <Dialog open={confirmDeleteIncome} onOpenChange={(open) => !deletingIncome && setConfirmDeleteIncome(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete income invoice?</DialogTitle>
            <DialogDescription>This permanently deletes {income.invoiceNumber || income.title}. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteIncome(false)} disabled={deletingIncome}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteIncome} loading={deletingIncome} disabled={deletingIncome}>{deletingIncome ? 'Deleting...' : 'Delete invoice'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(attachmentToDelete)} onOpenChange={(open) => !open && !deletingAttachmentId && setAttachmentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete attachment?</DialogTitle>
            <DialogDescription>This permanently removes {attachmentToDelete?.fileName || 'this attachment'} from the income invoice.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachmentToDelete(null)} disabled={Boolean(deletingAttachmentId)}>Cancel</Button>
            <Button variant="destructive" onClick={() => attachmentToDelete && handleDeleteAttachment(attachmentToDelete)} loading={Boolean(deletingAttachmentId)} disabled={Boolean(deletingAttachmentId)}>
              {deletingAttachmentId ? 'Deleting...' : 'Delete attachment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
