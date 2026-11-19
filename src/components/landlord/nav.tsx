'use client';

import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  FileText,
  Settings,
} from 'lucide-react';
import type { NavItem } from '@/components/DashboardShell';

/**
 * The only place the landlord sidebar is defined.
 * Each href maps to a real landlordPortalAPI endpoint group:
 *   /properties -> getProperties, getProperty, getPropertyUnits
 *   /tenants    -> getPropertyTenants (per property)
 *   /payments   -> getCommissions
 *   /statements -> getPropertyDailyReports + getPropertyDemandLetters
 *   /settings   -> getProfile
 */
export const LANDLORD_NAV: NavItem[] = [
  { href: '/landlord/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/landlord/properties', label: 'My Properties', icon: <Building2 className="h-5 w-5" /> },
  { href: '/landlord/tenants', label: 'Tenants', icon: <Users className="h-5 w-5" /> },
  { href: '/landlord/payments', label: 'Payments', icon: <Wallet className="h-5 w-5" /> },
  { href: '/landlord/statements', label: 'Reports', icon: <FileText className="h-5 w-5" /> },
  { href: '/landlord/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
];

export interface LandlordSectionMeta {
  title: string;
  subtitle: string;
}

export function sectionMeta(pathname: string): LandlordSectionMeta {
  if (pathname.startsWith('/landlord/properties'))
    return { title: 'My Properties', subtitle: 'Units, tenants and records per property' };
  if (pathname.startsWith('/landlord/tenants'))
    return { title: 'Tenants', subtitle: 'Everyone leasing your units' };
  if (pathname.startsWith('/landlord/payments'))
    return { title: 'Payments', subtitle: 'Commission statements and payouts' };
  if (pathname.startsWith('/landlord/statements'))
    return { title: 'Reports', subtitle: 'Daily operations reports and demand letters' };
  if (pathname.startsWith('/landlord/settings'))
    return { title: 'Settings', subtitle: 'Your landlord account details' };
  return { title: 'Landlord Dashboard', subtitle: 'Overview of your properties' };
}
