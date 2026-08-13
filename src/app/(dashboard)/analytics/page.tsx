'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getFirstAccessibleRoute } from '@/components/analytics/AnalyticsNavigation';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function AnalyticsPage() {
  const router = useRouter();
  const auth = useAuth();
  const { isLoading } = auth;

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Get user permissions and role
    const userPermissions = auth?.permissions || [];
    const userRole = auth?.user?.role;

    // ADMIN and MANAGER have access to overview
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      return; // Stay on overview
    }

    // Get the first accessible route for regular users
    const firstAccessibleRoute = getFirstAccessibleRoute(userPermissions, userRole);

    // If the first accessible route is not the overview, redirect
    if (firstAccessibleRoute !== '/analytics') {
      router.replace(firstAccessibleRoute);
    }
  }, [auth, isLoading, router]);

  // If loading, show a loading state
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

  // If the user is on the overview page (they have access), render the dashboard
  return <AnalyticsDashboard mode="overview" />;
}