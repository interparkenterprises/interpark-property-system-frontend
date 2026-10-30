'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const analyticsRoutes = [
  { href: '/analytics', label: 'Overview', requiredPermissions: ['VIEW_PAYMENT_REPORTS', 'VIEW_ARREARS', 'VIEW_UNITS', 'VIEW_TENANTS'], requiredRoles: [] },
  { href: '/analytics/rent', label: 'Rent', requiredPermissions: ['VIEW_PAYMENT_REPORTS', 'VIEW_ARREARS'], requiredRoles: [] },
  { href: '/analytics/occupancy', label: 'Occupancy', requiredPermissions: ['VIEW_UNITS', 'VIEW_TENANTS'], requiredRoles: [] },
  { href: '/analytics/invoices', label: 'Invoices', requiredPermissions: ['VIEW_PAYMENT_REPORTS', 'VIEW_BILL_INVOICES'], requiredRoles: [] },
  { href: '/analytics/workforce', label: 'Workforce', requiredPermissions: [], requiredRoles: ['ADMIN', 'MANAGER'] },
  { href: '/analytics/bill-invoices', label: 'Bill invoices', requiredPermissions: ['VIEW_BILL_INVOICES'], requiredRoles: [] },
  { href: '/analytics/service-providers', label: 'Providers', requiredPermissions: ['VIEW_SERVICE_PROVIDERS'], requiredRoles: [] },
  { href: '/analytics/commissions', label: 'Commissions', requiredPermissions: ['VIEW_COMMISSIONS'], requiredRoles: [] },
  { href: '/analytics/demand-letters', label: 'Demand letters', requiredPermissions: ['VIEW_DEMAND_LETTERS'], requiredRoles: [] },
  { href: '/analytics/tenants', label: 'Tenants', requiredPermissions: ['VIEW_TENANTS'], requiredRoles: [] },
  { href: '/analytics/tenants/left', label: 'Departed tenants', requiredPermissions: ['VIEW_TENANTS'], requiredRoles: [] },
  { href: '/analytics/other-income', label: 'Other income', requiredPermissions: [], requiredRoles: ['ADMIN', 'MANAGER'] },
];

const hasRequiredPermissions = (
  userPermissions: string[],
  requiredPermissions: string[] = [],
  requiredRoles: string[] = [],
  userRole?: string
): boolean => {
  if (userRole === 'ADMIN' || userRole === 'MANAGER') return true;
  if (requiredRoles.length > 0) {
    if (!userRole) return false;
    if (!requiredRoles.some(role => role === userRole)) return false;
  }
  if (requiredPermissions.length > 0) {
    if (userPermissions.includes('*')) return true;
    return requiredPermissions.every(perm => userPermissions.includes(perm));
  }
  return true;
};

const getFirstAccessibleRoute = (userPermissions: string[], userRole?: string): string => {
  if (userRole === 'ADMIN' || userRole === 'MANAGER') return '/analytics';

  const routeOrder = [
    '/analytics',
    '/analytics/rent',
    '/analytics/occupancy',
    '/analytics/invoices',
    '/analytics/bill-invoices',
    '/analytics/tenants',
    '/analytics/tenants/left',
    '/analytics/service-providers',
    '/analytics/commissions',
    '/analytics/demand-letters',
    '/analytics/workforce',
    '/analytics/other-income',
  ];

  for (const href of routeOrder) {
    const route = analyticsRoutes.find(r => r.href === href);
    if (route && hasRequiredPermissions(userPermissions, route.requiredPermissions, route.requiredRoles, userRole)) {
      return href;
    }
  }
  return '/analytics';
};

export function AnalyticsNavigation() {
  const pathname = usePathname().replace(/\/$/, '') || '/';
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();

  const userPermissions = auth?.permissions || [];
  const userRole = auth?.user?.role;
  const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';

  const visibleRoutes = analyticsRoutes.filter(route => {
    if (isAdminOrManager) return true;
    return hasRequiredPermissions(userPermissions, route.requiredPermissions, route.requiredRoles, userRole);
  });

  if (visibleRoutes.length === 0) {
    return (
      <Alert variant="warning" className="text-center"><AlertDescription>You do not have permission to view any analytics sections. Please contact your administrator for access.</AlertDescription></Alert>
    );
  }

  return (
    <nav aria-label="Analytics sections" className="min-w-0">
      <Tabs value={pathname} onValueChange={href => {
        const search = searchParams.toString();
        router.push(search ? `${href}?${search}` : href);
      }}>
        <TabsList className="max-w-full">
          {visibleRoutes.map(tab => <TabsTrigger key={tab.href} value={tab.href}>{tab.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>
    </nav>
  );
}

export function AnalyticsPageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return (
    <header className="space-y-5">
      <PageHeader title={title} description={description} actions={actions} />
      <AnalyticsNavigation />
    </header>
  );
}

export { getFirstAccessibleRoute, hasRequiredPermissions, analyticsRoutes };
