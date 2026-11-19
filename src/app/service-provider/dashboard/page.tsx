'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  FileText,
  DollarSign,
  CalendarClock,
  AlertTriangle,
  Upload,
  User,
  Eye,
  Download,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { providerPortalAPI } from '@/lib/api';
import ProviderPortalLayout from '@/components/ProviderPortalLayout';
import { StatCard } from '@/components/DashboardShell';
import { PageLoading, PageError, EmptyState } from '@/components/PageStates';
import type {
  ServiceProviderPortalProperty,
  ServiceProviderPortalAttachment,
} from '@/types';

const ksh = (n?: number | null) =>
  n == null ? '—' : `KSh ${Number(n).toLocaleString('en-US')}`;

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

export default function ServiceProviderDashboardPage() {
  const { accountStatus } = useAuth();

  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [providerName, setProviderName] = useState('');
  const [chargeAmount, setChargeAmount] = useState<number | null>(null);
  const [chargeFrequency, setChargeFrequency] = useState<string | null>(null);
  const [contractPeriod, setContractPeriod] = useState<string | null>(null);
  const [properties, setProperties] = useState<ServiceProviderPortalProperty[]>([]);
  const [attachments, setAttachments] = useState<ServiceProviderPortalAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setDataLoading(true);
      setLoadError('');
      try {
        const [profileRes, propsRes, attachRes] = await Promise.allSettled([
          providerPortalAPI.getProfile(),
          providerPortalAPI.getProperties(),
          providerPortalAPI.getAttachments(),
        ]);
        if (cancelled) return;

        if (profileRes.status === 'rejected') {
          throw new Error(
            (profileRes.reason as { message?: string })?.message ||
              'Failed to load your provider profile.'
          );
        }
        if (!profileRes.value?.data) {
          throw new Error('Failed to load your provider profile.');
        }

        const provider = profileRes.value.data.provider;
        setProviderName(provider?.name ?? 'Service Provider');
        setChargeAmount(provider?.chargeAmount ?? null);
        setChargeFrequency(provider?.chargeFrequency ?? null);
        setContractPeriod(provider?.contractPeriod ?? null);
        setProperties(propsRes.status === 'fulfilled' ? propsRes.value?.data ?? [] : []);
        setAttachments(attachRes.status === 'fulfilled' ? attachRes.value?.data ?? [] : []);
      } catch (err) {
        if (!cancelled)
          setLoadError((err as Error)?.message || 'Failed to load dashboard data.');
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshAttachments = async () => {
    const res = await providerPortalAPI.getAttachments();
    if (res?.data) setAttachments(res.data);
  };

  const openBlob = async (attachmentId: string, mode: 'preview' | 'download') => {
    setActionError('');
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

  const handleUpload = async (file: File) => {
    setActionError('');
    setBusy(true);
    try {
      const res = await providerPortalAPI.uploadAttachment({ file });
      if (res?.data) {
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

  const recentDocuments = attachments.slice(0, 5);

  return (
    <ProviderPortalLayout
      title={
        <>
          <h1 className="text-lg sm:text-xl font-bold text-black truncate">
            {providerName ? `${providerName} — Dashboard` : 'Service Provider Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-800 truncate">
            Manage your assigned properties and documents
          </p>
        </>
      }
    >
      {accountStatus && accountStatus !== 'ACTIVE' && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-700" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">
              Account status: {accountStatus.replace('_', ' ')}
            </p>
            <p className="text-amber-900 mt-0.5">
              Some features may be limited until your account is fully activated.
            </p>
          </div>
        </div>
      )}

      {loadError && <PageError message={loadError} />}

      <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          iconBg="bg-blue-50 text-blue-700"
          label="Assigned Properties"
          value={dataLoading ? '…' : String(properties.length)}
          hint="Properties you serve"
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          iconBg="bg-emerald-50 text-emerald-700"
          label="Documents on File"
          value={dataLoading ? '…' : String(attachments.length)}
          hint="Contracts & certificates"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          iconBg="bg-purple-50 text-purple-700"
          label="Charge Amount"
          value={dataLoading ? '…' : ksh(chargeAmount)}
          hint={chargeFrequency ?? 'Per contract'}
        />
        <StatCard
          icon={<CalendarClock className="h-5 w-5" />}
          iconBg="bg-amber-50 text-amber-700"
          label="Contract Period"
          value={dataLoading ? '…' : contractPeriod || '—'}
          hint="Service contract"
        />
      </section>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 min-w-0">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-black">
              Assigned Properties
            </h2>
            <Link
              href="/service-provider/properties"
              className="text-xs sm:text-sm font-semibold text-[#005478] hover:underline shrink-0"
            >
              View All →
            </Link>
          </div>
          {dataLoading ? (
            <PageLoading />
          ) : properties.length === 0 ? (
            <EmptyState
              icon={<Building2 />}
              title="No properties yet"
              description="Properties assigned to you will appear here."
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {properties.map((p) => (
                <li key={p.id} className="rounded-xl border border-slate-200 p-4 min-w-0">
                  <p className="font-semibold text-black truncate">{p.name}</p>
                  <p className="mt-0.5 text-sm text-slate-900 truncate">{p.address}</p>
                  <p className="mt-1 text-xs font-medium text-slate-800 truncate">
                    {p.usage || p.form || 'Service location'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-black mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="flex w-full items-center justify-center sm:justify-start gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition bg-[#005478] text-white hover:bg-[#004460] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              Upload Document
            </button>
            <QuickButton
              href="/service-provider/documents"
              icon={<FileText className="h-4 w-4" />}
              label="Manage Documents"
            />
            <QuickButton
              href="/service-provider/properties"
              icon={<Building2 className="h-4 w-4" />}
              label="View My Properties"
            />
            <QuickButton
              href="/service-provider/profile"
              icon={<User className="h-4 w-4" />}
              label="My Profile"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = '';
            }}
          />
          {actionError && <p className="mt-3 text-sm font-medium text-red-800">{actionError}</p>}
        </section>
      </div>

      <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-black">
            Recent Documents
          </h2>
          <Link
            href="/service-provider/documents"
            className="text-xs sm:text-sm font-semibold text-[#005478] hover:underline shrink-0"
          >
            Manage all documents →
          </Link>
        </div>
        {dataLoading ? (
          <PageLoading />
        ) : recentDocuments.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title="No documents yet"
            description="Use “Upload Document” to add your contracts and certificates."
          />
        ) : (
          <ul className="divide-y divide-slate-200">
            {recentDocuments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="rounded-lg bg-blue-50 p-2 text-blue-700 shrink-0">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 basis-full sm:basis-0">
                  <p className="text-sm font-semibold text-black truncate">
                    {a.description || a.fileName}
                  </p>
                  <p className="text-xs text-slate-800 truncate">
                    {a.category ? `${a.category} · ` : ''}
                    {formatSize(a.fileSize)} · uploaded {timeAgo(a.uploadedAt)}
                    {a.version ? ` · v${a.version}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openBlob(a.id, 'preview')}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-black hover:bg-slate-50 transition disabled:opacity-60"
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 min-w-0">
        <h2 className="text-base sm:text-lg font-semibold text-black mb-1">
          Service Assignments
        </h2>
        <p className="text-sm text-slate-900 mb-4">
          A dedicated Services view (work allocated to you) is not available in the portal
          yet. Your assigned properties are shown under My Properties.
        </p>
        <Link
          href="/service-provider/assignments"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-50 transition"
        >
          <ClipboardList className="h-4 w-4" />
          Preview the Services page
        </Link>
      </section>
    </ProviderPortalLayout>
  );
}

function QuickButton({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center sm:justify-start gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-slate-50 transition"
    >
      {icon}
      {label}
    </Link>
  );
}