// Define all analytics routes with their permission requirements
export interface AnalyticsRoute {
  href: string;
  label: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
}

export const analyticsRoutes: AnalyticsRoute[] = [
  { 
    href: '/analytics', 
    label: 'Overview',
    requiredPermissions: ['VIEW_PAYMENT_REPORTS', 'VIEW_ARREARS', 'VIEW_UNITS', 'VIEW_TENANTS']
  },
  { 
    href: '/analytics/rent', 
    label: 'Rent',
    requiredPermissions: ['VIEW_PAYMENT_REPORTS', 'VIEW_ARREARS']
  },
  { 
    href: '/analytics/occupancy', 
    label: 'Occupancy',
    requiredPermissions: ['VIEW_UNITS', 'VIEW_TENANTS']
  },
  { 
    href: '/analytics/invoices', 
    label: 'Invoices',
    requiredPermissions: ['VIEW_PAYMENT_REPORTS', 'VIEW_BILL_INVOICES']
  },
  { 
    href: '/analytics/workforce', 
    label: 'Workforce',
    requiredRoles: ['ADMIN', 'MANAGER']
  },
  { 
    href: '/analytics/bill-invoices', 
    label: 'Bill invoices',
    requiredPermissions: ['VIEW_BILL_INVOICES']
  },
  { 
    href: '/analytics/service-providers', 
    label: 'Providers',
    requiredPermissions: ['VIEW_SERVICE_PROVIDERS']
  },
  { 
    href: '/analytics/commissions', 
    label: 'Commissions',
    requiredPermissions: ['VIEW_COMMISSIONS']
  },
  { 
    href: '/analytics/demand-letters', 
    label: 'Demand letters',
    requiredPermissions: ['VIEW_DEMAND_LETTERS']
  },
  { 
    href: '/analytics/tenants', 
    label: 'Tenants',
    requiredPermissions: ['VIEW_TENANTS']
  },
  { 
    href: '/analytics/other-income', 
    label: 'Other income',
    requiredRoles: ['ADMIN', 'MANAGER']
  },
];

// Helper to check if user has access to a specific route
export const hasAccessToRoute = (
  route: AnalyticsRoute,
  userPermissions: string[],
  userRole?: string
): boolean => {
  // Check role requirements
  if (route.requiredRoles && route.requiredRoles.length > 0) {
    if (!userRole) return false;
    const hasRole = route.requiredRoles.some(role => role === userRole);
    if (!hasRole) return false;
  }

  // Check permission requirements
  if (route.requiredPermissions && route.requiredPermissions.length > 0) {
    // If user has wildcard permission (admin), they have access
    if (userPermissions.includes('*')) return true;
    
    // Check if user has all required permissions
    const hasAllPermissions = route.requiredPermissions.every(perm => 
      userPermissions.includes(perm)
    );
    if (!hasAllPermissions) return false;
  }

  return true;
};

// Get the first accessible analytics route
export const getFirstAccessibleAnalyticsRoute = (
  userPermissions: string[],
  userRole?: string
): string => {
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
    if (route && hasAccessToRoute(route, userPermissions, userRole)) {
      return href;
    }
  }

  // If no route is accessible, return the analytics overview as fallback
  return '/analytics';
};