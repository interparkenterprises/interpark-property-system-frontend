'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  analyticsRoutes, 
  hasRequiredPermissions,
  getFirstAccessibleRoute 
} from '@/components/analytics/AnalyticsNavigation';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
        router.replace(firstAccessibleRoute);
      }
    } else if (pathname === '/analytics') {
      // If user is on the analytics root, redirect to the first accessible route if needed
      const firstAccessibleRoute = getFirstAccessibleRoute(userPermissions, userRole);
      if (firstAccessibleRoute !== '/analytics') {
        router.replace(firstAccessibleRoute);
      }
    }
  }, [auth, isLoading, pathname, router]);

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-400 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}