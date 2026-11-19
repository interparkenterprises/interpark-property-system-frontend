'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { resolveLandingRoute } from '@/types';

/**
 * Shared auth guard for all tenant routes.
 * - While auth is loading: isLoading = true (render a spinner).
 * - Not signed in: redirect to /login.
 * - Signed in but NOT a tenant: redirect to that user's own landing route.
 */
export function useTenantGuard() {
  const router = useRouter();
  const { user, isTenant, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isTenant) {
      router.replace(resolveLandingRoute(user));
    }
  }, [isLoading, user, isTenant, router]);

  return { ready: !isLoading && !!user && isTenant, user };
}
