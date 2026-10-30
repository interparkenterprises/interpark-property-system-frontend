'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  analyticsRoutes, 
  hasRequiredPermissions,
  getFirstAccessibleRoute 
} from '@/components/analytics/AnalyticsNavigation';
import { AnalyticsLoading } from '@/components/analytics/AnalyticsStates';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { isLoading } = auth;

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    const userPermissions = auth?.permissions || [];
    const userRole = auth?.user?.role;

    // ADMIN and MANAGER have access to all routes
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      return;
    }

    // Check if the current path is an analytics route
    const currentRoute = analyticsRoutes.find(route => pathname === route.href);
    
    if (currentRoute) {
      // Check if user has access to the current route
      const hasAccess = hasRequiredPermissions(
        userPermissions,
        currentRoute.requiredPermissions,
        currentRoute.requiredRoles,
        userRole
      );
      
      if (!hasAccess) {
        // Redirect to the first accessible route
        const firstAccessibleRoute = getFirstAccessibleRoute(userPermissions, userRole);
        const search = searchParams.toString();
        router.replace(search ? `${firstAccessibleRoute}?${search}` : firstAccessibleRoute);
      }
    } else if (pathname === '/analytics') {
      // If user is on the analytics root, redirect to the first accessible route if needed
      const firstAccessibleRoute = getFirstAccessibleRoute(userPermissions, userRole);
      if (firstAccessibleRoute !== '/analytics') {
        const search = searchParams.toString();
        router.replace(search ? `${firstAccessibleRoute}?${search}` : firstAccessibleRoute);
      }
    }
  }, [auth, isLoading, pathname, router, searchParams]);

  // If loading, show loading state
  if (isLoading) {
    return <AnalyticsLoading />;
  }

  return <>{children}</>;
}
