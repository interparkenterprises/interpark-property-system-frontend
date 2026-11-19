'use client';

import { useState } from 'react';
import { Eye, Download, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { tenantPortalAPI } from '@/lib/api';
import type { TenantPortalAttachment } from '@/types';
import { formatFileSize, formatDate } from './format';

/**
 * Attachment list for the tenant portal.
 * - Preview: fetches an authenticated blob via `previewAttachment()` and opens
 *   it in a new tab via URL.createObjectURL (never a raw, unauthenticated URL).
 * - Download: fetches an authenticated blob via `downloadAttachment()` and
 *   triggers a named download. Each object URL is revoked after use.
 */
export default function AttachmentList({
  attachments,
}: {
  attachments: TenantPortalAttachment[];
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const run = async (
    attachment: TenantPortalAttachment,
    mode: 'preview' | 'download'
  ) => {
    setBusyId(attachment.id);
    setError('');
    let objectUrl: string | null = null;
    try {
      const blob =
        mode === 'preview'
          ? await tenantPortalAPI.previewAttachment(attachment.id)
          : await tenantPortalAPI.downloadAttachment(attachment.id);

      objectUrl = URL.createObjectURL(blob);

      if (mode === 'preview') {
        window.open(objectUrl, '_blank', 'noopener,noreferrer');
        // Give the new tab a moment to load the blob before revoking.
        setTimeout(() => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        }, 60_000);
      } else {
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = attachment.fileName || attachment.name || 'document';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    } catch (err: any) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setError(err?.message || `Failed to ${mode} this document.`);
    } finally {
      setBusyId(null);
    }
  };

  if (attachments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-8 text-center">
        <FileText className="h-7 w-7 text-slate-400" />
        <p className="text-sm font-medium text-slate-700">No documents available</p>
        <p className="text-xs text-slate-500">
          Lease documents uploaded by your landlord will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
          <p>{error}</p>
        </div>
      )}
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {attachments.map((att) => (
          <li
            key={att.id}
            className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <FileText className="h-5 w-5 text-slate-600" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {att.name || att.fileName}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {formatFileSize(att.size)} · Uploaded {formatDate(att.uploadedAt)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => run(att, 'preview')}
                disabled={busyId === att.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {busyId === att.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                Preview
              </button>
              <button
                type="button"
                onClick={() => run(att, 'download')}
                disabled={busyId === att.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#005478] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#004460] disabled:opacity-50"
              >
                {busyId === att.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Download
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
