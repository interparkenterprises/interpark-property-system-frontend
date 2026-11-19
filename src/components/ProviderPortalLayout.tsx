'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Wrench } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { resolveLandingRoute } from '@/types';
import DashboardShell from '@/components/DashboardShell';
import { PROVIDER_NAV_ITEMS } from '@/components/providerNav';

interface ProviderPortalLayoutProps {
  /** Header title block (left side) — one `title`/`subtitle` pair per page. */
  title: ReactNode;
  /** Optional override for the header right side (defaults to name + avatar). */
  headerRight?: ReactNode;
  children: ReactNode;
}

/**
 * Shared frame for EVERY Service Provider Portal page.
 *
 * Responsibilities (so individual pages never repeat them):
 * 1. Auth guard — redirects unauthenticated users to /login and
 *    non-provider users to their own landing route.
 * 2. Renders the fixed DashboardShell with the single shared nav config,
 *    so the sidebar survives client-side navigation between pages.
 */
export default function ProviderPortalLayout({
  title,
  headerRight,
  children,
}: ProviderPortalLayoutProps) {
  const router = useRouter();
  const { user, isServiceProvider, isLoading, logout } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isServiceProvider) {
      router.replace(resolveLandingRoute(user));
    }
  }, [isLoading, user, isServiceProvider, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#005478]" />
      </div>
    );
  }

  if (!user || !isServiceProvider) return null;

  const initials = (user.name || 'S').charAt(0).toUpperCase();

  const defaultHeaderRight = (
    <>
      <div className="hidden sm:block text-right">
        <p className="text-sm font-semibold text-slate-900 truncate max-w-48">{user.name}</p>
        <p className="text-xs text-slate-700">Service Provider</p>
      </div>
      <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-semibold shrink-0">
        {initials}
      </div>
    </>
  );

  return (
    <DashboardShell
      theme="dark"
      brandIcon={<Wrench className="h-6 w-6 text-white" />}
      navItems={PROVIDER_NAV_ITEMS}
      onLogout={logout}
      title={title}
      headerRight={headerRight ?? defaultHeaderRight}
    >
      {children}
    </DashboardShell>
  );
}
