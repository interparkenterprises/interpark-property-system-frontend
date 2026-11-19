'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Eye,
  Download,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { providerPortalAPI } from '@/lib/api';
import ProviderPortalLayout from '@/components/ProviderPortalLayout';
import { PageLoading, PageError, EmptyState } from '@/components/PageStates';
import type { ServiceProviderPortalAttachment } from '@/types';

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${Math.max(m, 1)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProviderDocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attachments, setAttachments] = useState<ServiceProviderPortalAttachment[]>([]);

  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  // Upload form state (all optional except the file itself)
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadVersion, setUploadVersion] = useState('');
  const [uploadExpiry, setUploadExpiry] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await providerPortalAPI.getAttachments();
      if (res?.data) {
        setAttachments(res.data);
      } else {
        setLoadError('Failed to load your documents.');
      }
    } catch (err) {
      setLoadError((err as Error)?.message || 'Failed to load your documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshAttachments = async () => {
    const res = await providerPortalAPI.getAttachments();
    if (res?.data) setAttachments(res.data);
  };

  const openBlob = async (attachmentId: string, mode: 'preview' | 'download') => {
    clearMessages();
    setBusy(true);
    try {
      const blob =
        mode === 'preview'
          ? await providerPortalAPI.previewAttachment(attachmentId)
          : await providerPortalAPI.downloadAttachment(attachmentId);
      const url = URL.createObjectURL(blob);
      if (mode === 'preview') {
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setActionError((err as Error)?.message || 'Could not open the document.');
    } finally {
      setBusy(false);
    }
  };

  const clearMessages = () => {
    setActionError('');
    setActionMessage('');
  };

  const submitUpload = async () => {
    if (!pendingFile) return;
    clearMessages();
    setBusy(true);
    try {
      const res = await providerPortalAPI.uploadAttachment({
        file: pendingFile,
        description: uploadDescription || undefined,
        category: uploadCategory || undefined,
        version: uploadVersion || undefined,
        expiryDate: uploadExpiry || undefined,
      });
      if (res?.data) {
        setActionMessage(`Uploaded "${res.data.fileName}".`);
        setShowUploadForm(false);
        resetUploadForm();
        await refreshAttachments();
      } else {
        setActionError('Upload failed.');
      }
    } catch (err) {
      setActionError((err as Error)?.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const resetUploadForm = () => {
    setPendingFile(null);
    setUploadDescription('');
    setUploadCategory('');
    setUploadVersion('');
    setUploadExpiry('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = async (a: ServiceProviderPortalAttachment) => {
    const description = window.prompt(
      'New description for this document',
      a.description ?? ''
    );
    if (description === null) return;
    clearMessages();
    setBusy(true);
    try {
      const res = await providerPortalAPI.updateAttachment(a.id, { description });
      if (res?.data) {
        setActionMessage('Document updated.');
        await refreshAttachments();
      } else {
        setActionError('Update failed.');
      }
    } catch (err) {
      setActionError((err as Error)?.message || 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (a: ServiceProviderPortalAttachment) => {
    if (!window.confirm(`Delete "${a.description || a.fileName}"? This cannot be undone.`))
      return;
    clearMessages();
    setBusy(true);
    try {
      const res = await providerPortalAPI.deleteAttachment(a.id);
      if (res?.success) {
        setActionMessage('Document deleted.');
        await refreshAttachments();
      } else {
        setActionError('Delete failed.');
      }
    } catch (err) {
      setActionError((err as Error)?.message || 'Delete failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProviderPortalLayout
      title={
        <>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
            Documents & Files
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 truncate">
            Upload and manage your contracts and certificates
          </p>
        </>
      }
    >
      {loadError && <PageError message={loadError} onRetry={load} />}

      <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">
            Your documents {attachments.length > 0 && `(${attachments.length})`}
          </h2>
          <button
            onClick={() => setShowUploadForm((v) => !v)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-[#005478] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004460] transition disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {showUploadForm ? 'Cancel upload' : 'Upload Document'}
          </button>
        </div>

        {actionMessage && (
          <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
            {actionMessage}
          </p>
        )}
        {actionError && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">
            {actionError}
          </p>
        )}

        {showUploadForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitUpload();
            }}
            className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 grid gap-3 sm:grid-cols-2"
          >
            <label className="text-sm font-medium text-slate-900 sm:col-span-2">
              Document file *
              <input
                ref={fileInputRef}
                type="file"
                required
                onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-[#005478] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              />
            </label>
            <label className="text-sm font-medium text-slate-900">
              Description
              <input
                type="text"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="e.g. Service contract 2025"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-900">
              Category
              <input
                type="text"
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                placeholder="e.g. Contract, Certificate"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-900">
              Version
              <input
                type="text"
                value={uploadVersion}
                onChange={(e) => setUploadVersion(e.target.value)}
                placeholder="e.g. v1"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-900">
              Expiry date
              <input
                type="date"
                value={uploadExpiry}
                onChange={(e) => setUploadExpiry(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetUploadForm}
                disabled={busy}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition disabled:opacity-60"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={busy || !pendingFile}
                className="inline-flex items-center gap-2 rounded-lg bg-[#005478] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004460] transition disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Upload
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <PageLoading label="Loading documents…" />
        ) : attachments.length === 0 ? (
          !loadError && (
            <EmptyState
              icon={<FileText />}
              title="No documents uploaded yet"
              description="Use “Upload Document” to add your contracts and certificates."
            />
          )
        ) : (
          <ul className="divide-y divide-slate-200">
            {attachments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="rounded-lg bg-blue-50 p-2 text-blue-700 shrink-0">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 basis-full sm:basis-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {a.description || a.fileName}
                  </p>
                  <p className="text-xs text-slate-700 truncate">
                    {a.fileName} · {a.fileType}
                    {a.category ? ` · ${a.category}` : ''} · {formatSize(a.fileSize)} ·
                    uploaded {timeAgo(a.uploadedAt)}
                    {a.version ? ` · v${a.version}` : ''}
                  </p>
                </div>
                {a.expiryDate && (
                  <span className="text-xs font-medium text-slate-900">
                    Expires {formatDate(a.expiryDate)}
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openBlob(a.id, 'preview')}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition disabled:opacity-60"
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </button>
                  <button
                    onClick={() => openBlob(a.id, 'download')}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#005478] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#004460] transition disabled:opacity-60"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <button
                    onClick={() => handleEdit(a)}
                    disabled={busy}
                    aria-label="Edit description"
                    className="rounded-lg border border-slate-300 p-1.5 text-slate-900 hover:bg-slate-50 transition disabled:opacity-60"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    disabled={busy}
                    aria-label="Delete document"
                    className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-800 hover:bg-red-100 transition disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ProviderPortalLayout>
  );
}
