'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Define permission requirements for each analytics route
const analyticsRoutes = [
  { 
    href: '/analytics', 
    label: 'Overview',
    requiredPermissions: ['VIEW_PAYMENT_REPORTS', 'VIEW_ARREARS', 'VIEW_UNITS', 'VIEW_TENANTS'],
    requiredRoles: []
  },
  { 
    href: '/analytics/rent', 
    label: 'Rent',
    requiredPermissions: ['VIEW_PAYMENT_REPORTS', 'VIEW_ARREARS'],
    requiredRoles: []
  },
  { 
    href: '/analytics/occupancy', 
    label: 'Occupancy',
    requiredPermissions: ['VIEW_UNITS', 'VIEW_TENANTS'],
    requiredRoles: []
  },
  { 
    href: '/analytics/invoices', 
    label: 'Invoices',
    requiredPermissions: ['VIEW_PAYMENT_REPORTS', 'VIEW_BILL_INVOICES'],
    requiredRoles: []
  },
  { 
    href: '/analytics/workforce', 
    label: 'Workforce',
    requiredPermissions: [],
    requiredRoles: ['ADMIN', 'MANAGER']
  },
  { 
    href: '/analytics/bill-invoices', 
    label: 'Bill invoices',
    requiredPermissions: ['VIEW_BILL_INVOICES'],
    requiredRoles: []
  },
  { 
    href: '/analytics/service-providers', 
    label: 'Providers',
    requiredPermissions: ['VIEW_SERVICE_PROVIDERS'],
    requiredRoles: []
  },
  { 
    href: '/analytics/commissions', 
    label: 'Commissions',
    requiredPermissions: ['VIEW_COMMISSIONS'],
    requiredRoles: []
  },
  { 
    href: '/analytics/demand-letters', 
    label: 'Demand letters',
    requiredPermissions: ['VIEW_DEMAND_LETTERS'],
    requiredRoles: []
  },
  { 
    href: '/analytics/tenants', 
    label: 'Tenants',
    requiredPermissions: ['VIEW_TENANTS'],
    requiredRoles: []
  },
  { 
    href: '/analytics/other-income', 
    label: 'Other income',
    requiredPermissions: [],
    requiredRoles: ['ADMIN', 'MANAGER']
  },
];

// Helper to check if user has the required permissions
const hasRequiredPermissions = (
  userPermissions: string[], 
  requiredPermissions: string[] = [], 
  requiredRoles: string[] = [],
  userRole?: string
): boolean => {
  // ADMIN and MANAGER have access to everything
  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    return true;
  }
  
  // Check if route requires admin/manager role
  if (requiredRoles.length > 0) {
    if (!userRole) return false;
    const hasRole = requiredRoles.some(role => role === userRole);
    if (!hasRole) return false;
  }
  
  // Check if route requires specific permissions
  if (requiredPermissions.length > 0) {
    // If permissions include wildcard, user has all permissions
    if (userPermissions.includes('*')) return true;
    
    // Check if user has all required permissions
    return requiredPermissions.every(perm => userPermissions.includes(perm));
  }
  
  return true;
};

// Get the first accessible analytics route
const getFirstAccessibleRoute = (
  userPermissions: string[],
  userRole?: string
): string => {
  // ADMIN and MANAGER have access to all routes, return overview
  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    return '/analytics';
  }

  // Define the order of preference for analytics routes
  const routeOrder = [
    '/analytics',
    '/analytics/rent',
    '/analytics/occupancy',
    '/analytics/invoices',
    '/analytics/bill-invoices',
    '/analytics/tenants',
    '/analytics/service-providers',
    '/analytics/commissions',
    '/analytics/demand-letters',
    '/analytics/workforce',
    '/analytics/other-income'
  ];

  // First, try to find a route in the preferred order
  for (const href of routeOrder) {
    const route = analyticsRoutes.find(r => r.href === href);
    if (route && hasRequiredPermissions(
      userPermissions,
      route.requiredPermissions,
      route.requiredRoles,
      userRole
    )) {
      return href;
    }
  }

  // If no route is accessible, return the analytics overview as fallback
  return '/analytics';
};

export function AnalyticsNavigation() {
  const pathname = usePathname().replace(/\/$/, '') || '/';
  const router = useRouter();
  const auth = useAuth();
  
  // Get permissions and role from auth
  const userPermissions = auth?.permissions || [];
  const userRole = auth?.user?.role;

  // ADMIN and MANAGER have access to all routes
  const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';

  // Filter routes based on permissions
  const visibleRoutes = analyticsRoutes.filter(route => {
    // ADMIN and MANAGER can see all routes
    if (isAdminOrManager) {
      return true;
    }
    
    return hasRequiredPermissions(
      userPermissions,
      route.requiredPermissions,
      route.requiredRoles,
      userRole
    );
  });

  // If no routes are visible, return a message
  if (visibleRoutes.length === 0) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 text-center text-sm text-amber-100">
        <p>You don't have permission to view any analytics sections.</p>
        <p className="mt-1 text-xs text-amber-200/60">Please contact your administrator for access.</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto pb-1 scrollbar-thin">
      <nav className="flex w-max min-w-full gap-2 sm:w-auto sm:min-w-0 sm:flex-wrap" aria-label="Analytics sections">
        {visibleRoutes.map(tab => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                active 
                  ? 'bg-[#0078a3] text-white shadow-sm' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
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

// Export the helper functions for use in other components
export { getFirstAccessibleRoute, hasRequiredPermissions, analyticsRoutes };