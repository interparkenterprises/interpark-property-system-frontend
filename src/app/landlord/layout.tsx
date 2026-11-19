'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, ChevronDown, Loader2 } from 'lucide-react';
import DashboardShell from '@/components/DashboardShell';
import { LANDLORD_NAV, sectionMeta } from '@/components/landlord/nav';
import { useAuth } from '@/context/AuthContext';
import { resolveLandingRoute } from '@/types';

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, accountStatus, isLandlord, isLoading, logout } = useAuth();

  // One auth guard for the whole /landlord/* subtree.
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isLandlord) router.replace(resolveLandingRoute(user));
  }, [isLoading, user, isLandlord, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#005478]" />
      </div>
    );
  }
  if (!user || !isLandlord) return null;

  const meta = sectionMeta(pathname);

  const title = (
    <>
      <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{meta.title}</h1>
      <p className="text-xs sm:text-sm text-slate-600 truncate">{meta.subtitle}</p>
    </>
  );

  const headerRight = (
    <>
      <div className="hidden sm:block text-right">
        <p className="text-sm font-semibold text-slate-900 truncate max-w-48">
          {user.name || 'Landlord'}
        </p>
        <p className="text-xs text-slate-600">Landlord</p>
      </div>
      <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#005478] text-white font-semibold shrink-0">
        {(user.name || 'L').charAt(0).toUpperCase()}
      </div>
      <ChevronDown className="h-4 w-4 text-slate-500 hidden sm:block" />
    </>
  );

  return (
    <DashboardShell
      theme="dark"
      brandIcon={<Building2 className="h-6 w-6 text-white" />}
      navItems={LANDLORD_NAV}
      onLogout={logout}
      title={title}
      headerRight={headerRight}
    >
      {accountStatus && accountStatus !== 'ACTIVE' && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <span className="mt-0.5 text-amber-700">!</span>
          <div className="text-sm">
            <p className="font-medium text-amber-900">
              Account status: {accountStatus.replace('_', ' ')}
            </p>
            <p className="text-amber-800 mt-0.5">
              Some features may be limited until your account is fully activated.
            </p>
          </div>
        </div>
      )}
      {children}
    </DashboardShell>
  );
}
