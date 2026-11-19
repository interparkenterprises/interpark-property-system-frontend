'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Loader2, AlertTriangle, Inbox, Construction, ArrowRight } from 'lucide-react';

/** Full-page centered spinner used while a page's data is loading. */
export function PageLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-700">
      <Loader2 className="h-8 w-8 animate-spin text-[#005478]" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

/** Inline error banner with optional retry. */
export function PageError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
      <AlertTriangle className="h-5 w-5 shrink-0 text-red-700" />
      <p className="flex-1 min-w-0 font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 transition"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** Card-content empty state. */
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="py-10 text-center">
      <div className="flex justify-center text-slate-500">{icon}</div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-700 px-4">{description}</p>
    </div>
  );
}

export interface PlaceholderLink {
  href: string;
  label: string;
}

/**
 * Honest "not available yet" page used for portal sections that have no
 * supporting backend endpoints. It never fakes data — it explains what is
 * coming and routes the user to the sections that DO work today.
 */
export function FeaturePlaceholder({
  icon,
  title,
  description,
  points,
  links,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  /** Short bullets describing what this section will show once enabled. */
  points?: string[];
  /** Links to sections that are available right now. */
  links?: PlaceholderLink[];
}) {
  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-10 min-w-0">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {icon}
        </div>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
          <Construction className="h-3.5 w-3.5" />
          Coming soon
        </span>
        <h2 className="mt-3 text-lg sm:text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-800">{description}</p>

        {points && points.length > 0 && (
          <ul className="mt-5 space-y-2 text-left">
            {points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#005478]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}

        {links && links.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#005478] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004460] transition"
              >
                {link.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Small helper for rows/cards that need an Inbox-style default icon. */
export function InboxIcon({ className = 'h-8 w-8' }: { className?: string }) {
  return <Inbox className={className} />;
}
