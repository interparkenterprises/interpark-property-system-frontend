'use client';

import { Loader2, LayoutDashboard, FileText, Wallet, Wrench, Bell, User, Home } from 'lucide-react';
import DashboardShell, { type NavItem } from '@/components/DashboardShell';
import { useTenantGuard } from '@/components/tenant/useTenantGuard';
import { useAuth } from '@/context/AuthContext';

const tenantNavItems: NavItem[] = [
  { href: '/tenant/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/tenant/lease', label: 'My Lease', icon: <FileText className="h-5 w-5" /> },
  { href: '/tenant/payments', label: 'Payments', icon: <Wallet className="h-5 w-5" /> },
  { href: '/tenant/maintenance', label: 'Maintenance', icon: <Wrench className="h-5 w-5" /> },
  { href: '/tenant/notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" />, badge: 1 },
  { href: '/tenant/profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
];

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready } = useTenantGuard();
  const { user, logout } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#005478]" />
      </div>
    );
  }

  return (
    <DashboardShell
      theme="light"
      brandIcon={<Home className="h-5 w-5 text-white" />}
      navItems={tenantNavItems}
      onLogout={logout}
      title={
        <div>
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Tenant Dashboard</h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Welcome back, {user?.name?.split(' ')[0] || 'Tenant'}
          </p>
        </div>
      }
      headerRight={
        <>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800">
            {(user?.name || 'T').charAt(0).toUpperCase()}
          </div>
          <div className="hidden text-right sm:block">
            <p className="max-w-48 truncate text-sm font-semibold text-slate-900">
              {user?.name || 'Tenant'}
            </p>
            <p className="text-xs text-slate-500">Tenant</p>
          </div>
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}