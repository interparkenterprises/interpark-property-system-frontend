'use client';

import { Loader2, AlertTriangle, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

/** Full-area loading state. */
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-[#005478]" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Meaningful empty state with an icon and message. */
export function EmptyState({
  icon,
  title,
  message,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 px-4 text-center">
      <span className="text-slate-400">{icon ?? <Inbox className="h-8 w-8" />}</span>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {message && <p className="max-w-sm text-xs text-slate-500">{message}</p>}
    </div>
  );
}

/** Graceful API error banner. */
export function ErrorState({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
      <p>{message}</p>
    </div>
  );
}

/** Reusable white card. */
export function Card({
  title,
  action,
  children,
  className = '',
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && (
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
