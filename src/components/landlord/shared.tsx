'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2, RotateCw } from 'lucide-react';

/* ── formatting helpers ─────────────────────────────────────── */

export const ksh = (n?: number | null): string =>
  n == null ? '—' : `KSh ${Number(n).toLocaleString('en-US')}`;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function monthLabel(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function periodLabel(startIso?: string | null, endIso?: string | null): string {
  if (!startIso || !endIso) return '—';
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return '—';
  return `${MONTHS[s.getMonth()]} – ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

export function dateLabel(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/* ── status pills ───────────────────────────────────────────── */

const TONES = {
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  slate: 'bg-slate-100 text-slate-700',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800',
} as const;

export type Tone = keyof typeof TONES;

const STATUS_TONE: Record<string, Tone> = {
  PAID: 'green',
  ACTIVE: 'green',
  REVIEWED: 'green',
  SETTLED: 'green',
  OCCUPIED: 'green',
  PENDING: 'amber',
  SUBMITTED: 'amber',
  VACANT: 'amber',
  PROCESSING: 'blue',
  GENERATED: 'blue',
  ACKNOWLEDGED: 'blue',
  DRAFT: 'slate',
  LEFT: 'slate',
  SENT: 'purple',
  ESCALATED: 'red',
  CANCELLED: 'red',
};

export function statusTone(value?: string | null): Tone {
  if (!value) return 'slate';
  return STATUS_TONE[value.toUpperCase()] ?? 'slate';
}

export function Pill({ value, tone }: { value: string; tone?: Tone }) {
  const cls = TONES[tone ?? statusTone(value)];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${cls}`}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
}

/* ── layout atoms ───────────────────────────────────────────── */

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-16 text-sm text-slate-600">
      <Loader2 className="h-5 w-5 animate-spin text-[#005478]" />
      {label}
    </div>
  );
}

export function ErrorNote({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-700" />
      <p className="flex-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-200 hover:bg-red-100"
        >
          <RotateCw className="h-3.5 w-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 min-w-0 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-slate-600">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-slate-400">{icon ?? <Inbox className="h-8 w-8" />}</span>
      <p className="mt-2 text-sm font-medium text-slate-700">{title}</p>
      {hint && <p className="mt-1 max-w-md text-xs text-slate-600 px-4">{hint}</p>}
    </div>
  );
}

export function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-slate-900">{value || '—'}</dd>
    </div>
  );
}
