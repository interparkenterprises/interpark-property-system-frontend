'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const analyticsRoutes = [
  { href: '/analytics', label: 'Overview' },
  { href: '/analytics/rent', label: 'Rent' },
  { href: '/analytics/occupancy', label: 'Occupancy' },
  { href: '/analytics/workforce', label: 'Workforce' },
  { href: '/analytics/bill-invoices', label: 'Bill invoices' },
  { href: '/analytics/service-providers', label: 'Providers' },
  { href: '/analytics/commissions', label: 'Commissions' },
  { href: '/analytics/demand-letters', label: 'Demand letters' },
  { href: '/analytics/tenants', label: 'Tenants' },
  { href: '/analytics/other-income', label: 'Other income' },
] as const;

export function AnalyticsNavigation() {
  const pathname = usePathname().replace(/\/$/, '') || '/';

  return (
    <div className="min-w-0 overflow-x-auto pb-1 [scrollbar-width:thin]">
      <nav className="flex w-max min-w-full gap-2 sm:w-auto sm:min-w-0 sm:flex-wrap" aria-label="Analytics sections">
        {analyticsRoutes.map(tab => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 ${active ? 'bg-[#0078a3] text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AnalyticsPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">Interpark intelligence</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{title}</h1>
        <p className="mt-2 max-w-3xl text-slate-400">{description}</p>
      </div>
      <AnalyticsNavigation />
    </header>
  );
}
