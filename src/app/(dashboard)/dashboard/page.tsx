'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider';
import { useAuth } from '@/context/AuthContext';
import { propertiesAPI, landlordsAPI, commissionsAPI } from '@/lib/api';
import { Property } from '@/types';
import AdminUserManagement from '@/components/admin/AdminUserManagement';

interface DashboardStats {
  properties: number;
  landlords: number;
  totalIncome: number;
}

const INITIAL_STATS: DashboardStats = {
  properties: 0,
  landlords: 0,
  totalIncome: 0,
};

const statsCache = new Map<string, { data: DashboardStats; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

export default function DashboardPage() {
  const {
    user,
    isAdmin,
    isManager,
    isManagedUser,
    roleName,
    canViewProperties,
    canCreateProperty,
    canCreateOffer,
    canViewIncome,
    getAccessiblePropertyIds,
    canViewProperty,
  } = useGlobalPermissions();

  const { refreshUserData } = useAuth();

  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [accessiblePropertyList, setAccessiblePropertyList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshingPermissions, setIsRefreshingPermissions] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const fetchedRef = useRef(false);

  const accessiblePropertyIds = useMemo(() => {
    return getAccessiblePropertyIds();
  }, [getAccessiblePropertyIds]);

  const accessiblePropertyIdsKey = accessiblePropertyIds.join(',');
  const canAccessProperties = canViewProperties || (isManagedUser && accessiblePropertyIds.length > 0);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const fetchStats = useCallback(async (skipCache = false) => {
    if (!user) return;
    if (fetchedRef.current && !skipCache) return;

    const cacheKey = `${user.id}-${isAdmin}-${isManager}-${accessiblePropertyIdsKey}-${(user as any)?.permissions?.join(',') || ''}`;
    const cached = statsCache.get(cacheKey);

    if (!skipCache && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setStats(cached.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newStats = { ...INITIAL_STATS };
      const promises: Promise<any>[] = [];

      if (canAccessProperties) {
        promises.push(
          propertiesAPI.getAll().then((allProperties) => {
            let filtered: Property[] = [];

            if (isAdmin) {
              filtered = allProperties;
            } else if (isManager) {
              filtered = allProperties.filter((p: Property) => p.managerId === user.id);
            } else if (isManagedUser) {
              filtered = allProperties.filter(
                (p: Property) =>
                  accessiblePropertyIds.includes(p.id) || canViewProperty(p.id)
              );
            }

            newStats.properties = filtered.length;
            setAccessiblePropertyList(filtered);
            return filtered;
          }).catch((err) => {
            console.error('Properties fetch error:', err);
            setAccessiblePropertyList([]);
            return [];
          })
        );
      } else {
        setAccessiblePropertyList([]);
      }

      if (isAdmin || isManager) {
        promises.push(
          landlordsAPI.getAll().then((landlords) => {
            newStats.landlords = Array.isArray(landlords) ? landlords.length : 0;
          }).catch((err) => {
            console.error('Landlords fetch error:', err);
            newStats.landlords = 0;
          })
        );
      }

      if (canViewIncome && (isAdmin || isManager) && user.id) {
        promises.push(
          commissionsAPI.getCommissionStats(user.id).then((commissionStats) => {
            newStats.totalIncome = commissionStats?.totalPaid || 0;
          }).catch((err) => {
            console.error('Commission stats failed:', err);
            newStats.totalIncome = 0;
          })
        );
      }

      await Promise.allSettled(promises);

      statsCache.set(cacheKey, { data: { ...newStats }, timestamp: Date.now() });
      setStats(newStats);
      fetchedRef.current = true;
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [
    user,
    isAdmin,
    isManager,
    isManagedUser,
    canAccessProperties,
    canViewIncome,
    canViewProperty,
    accessiblePropertyIds,
    accessiblePropertyIdsKey,
  ]);

  const handleRefreshPermissions = async () => {
    try {
      setIsRefreshingPermissions(true);
      setError(null);

      await refreshUserData();

      statsCache.clear();
      fetchedRef.current = false;
      setRefreshNonce((prev) => prev + 1);

      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 z-50 rounded-lg bg-green-500 px-4 py-2 text-white shadow-lg';
      successMsg.textContent = 'Permissions refreshed successfully!';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh permissions');
    } finally {
      setIsRefreshingPermissions(false);
    }
  };

  // Check for permission sync flag from role change
  useEffect(() => {
    const needsSync = localStorage.getItem('needsPermissionSync');
    if (needsSync === 'true' && isManagedUser) {
      localStorage.removeItem('needsPermissionSync');
      handleRefreshPermissions();
    }
  }, [isManagedUser]);

  // Auto-refresh when page becomes visible (user returns to tab)
  useEffect(() => {
    let isSubscribed = true;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isSubscribed && user) {
        try {
          const lastRefresh = sessionStorage.getItem('lastDashboardRefresh');
          const now = Date.now();

          if (!lastRefresh || now - parseInt(lastRefresh) > 120000) {
            await refreshUserData();
            statsCache.clear();
            fetchedRef.current = false;
            setRefreshNonce((prev) => prev + 1);
            sessionStorage.setItem('lastDashboardRefresh', now.toString());
          }
        } catch (err) {
          console.error('Auto-refresh failed:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isSubscribed = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshUserData]);

  useEffect(() => {
    if (user && (!fetchedRef.current || refreshNonce > 0)) {
      fetchStats(true);
    }
  }, [user, fetchStats, refreshNonce, accessiblePropertyIdsKey]);

  if (loading && !stats.properties && !stats.landlords && !stats.totalIncome) {
    return (
      <div className="min-h-screen bg-slate-950 py-6 sm:py-8">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-6">
            <div className="h-8 w-48 animate-pulse rounded bg-slate-700"></div>
            <div className="mt-3 h-5 w-64 animate-pulse rounded bg-slate-700"></div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-700"></div>
                  <div className="flex-1">
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-700"></div>
                    <div className="mt-2 h-8 w-32 animate-pulse rounded bg-slate-700"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 text-center shadow-lg shadow-black/20">
          <div className="mb-2 text-lg font-semibold text-red-400">Error loading dashboard</div>
          <div className="mb-4 text-sm text-slate-300">{error}</div>
          <button
            onClick={() => {
              fetchedRef.current = false;
              statsCache.clear();
              setRefreshNonce((prev) => prev + 1);
            }}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 px-6 py-6 shadow-lg shadow-black/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
                Dashboard
              </h1>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <p className="text-sm font-medium text-slate-300 sm:text-base">
                  Welcome back, <span className="font-semibold text-white">{user?.name}</span>
                </p>

                <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  isAdmin 
                    ? 'border border-purple-500/30 bg-purple-500/15 text-purple-300'
                    : 'border border-blue-500/30 bg-blue-500/15 text-blue-300'
                }`}>
                  {roleName || user?.role}
                  {isAdmin && ' (Administrator)'}
                </span>

                {isManagedUser && (
                  <span className="inline-flex w-fit items-center rounded-full border border-green-500/30 bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300">
                    {accessiblePropertyList.length} Properties Assigned
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {/* Admin Panel Toggle Button */}
              {isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    showAdminPanel
                      ? 'bg-purple-600 text-white hover:bg-purple-500'
                      : 'border border-purple-600 text-purple-400 hover:bg-purple-600/20'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  {showAdminPanel ? 'Hide Admin Panel' : 'Show Admin Panel'}
                </button>
              )}

              {(isManagedUser || isManager) && (
                <button
                  onClick={handleRefreshPermissions}
                  disabled={isRefreshingPermissions}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRefreshingPermissions ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Refresh Permissions
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Admin User Management Section */}
        {isAdmin && showAdminPanel && (
          <div className="mb-8">
            <AdminUserManagement />
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {canAccessProperties && (
            <Link href="/properties" className="group">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-950/20">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-blue-500/15 p-3 ring-1 ring-blue-400/20">
                    <svg className="h-6 w-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Properties
                    </h3>
                    <p className="mt-1 text-3xl font-bold text-slate-50">{stats.properties}</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {(isAdmin || isManager) && (
            <Link href="/landlords" className="group">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-green-400/50 hover:shadow-xl hover:shadow-green-950/20">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-green-500/15 p-3 ring-1 ring-green-400/20">
                    <svg className="h-6 w-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Landlords
                    </h3>
                    <p className="mt-1 text-3xl font-bold text-slate-50">{stats.landlords}</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {canViewIncome && (isAdmin || isManager) && (
            <Link href="/myIncome" className="group">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/50 hover:shadow-xl hover:shadow-amber-950/20">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-amber-500/15 p-3 ring-1 ring-amber-400/20">
                    <svg className="h-6 w-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Total Income
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-slate-50 sm:text-3xl">
                      {formatCurrency(stats.totalIncome)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-400">Paid Commissions</p>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>

        {isManagedUser && accessiblePropertyList.length > 0 && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-50">Your Assigned Properties</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Properties you currently have access to view.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {accessiblePropertyList.map((property) => (
                <Link key={property.id} href={`/properties/${property.id}`} className="group">
                  <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 transition-all duration-200 hover:border-blue-400/50 hover:bg-slate-800/90 hover:shadow-md hover:shadow-black/20">
                    <h3 className="text-base font-semibold text-slate-100">{property.name}</h3>
                    <p className="mt-1 truncate text-sm text-slate-300">
                      {property.address || 'No address provided'}
                    </p>
                    <div className="mt-3 flex gap-2">
                      {canViewProperty(property.id) && (
                        <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-300 ring-1 ring-blue-400/20">
                          View
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {isManagedUser && accessiblePropertyList.length === 0 && !loading && (
          <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-950/30 p-8 text-center shadow-lg shadow-black/20">
            <svg
              className="mx-auto h-12 w-12 text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-amber-300">No Properties Assigned</h3>
            <p className="mt-2 text-sm text-slate-300">
              You don't have access to any properties yet. Please contact your manager to grant you access.
            </p>
            <button
              onClick={handleRefreshPermissions}
              disabled={isRefreshingPermissions}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              {isRefreshingPermissions ? 'Refreshing...' : 'Refresh Permissions'}
            </button>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
            <h2 className="text-lg font-bold text-slate-50">Recent Activity</h2>
            <div className="py-10 text-center">
              <svg
                className="mx-auto h-12 w-12 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <p className="mt-3 text-sm font-medium text-slate-400">
                Recent activity will appear here
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
            <h2 className="text-lg font-bold text-slate-50">Quick Actions</h2>
            <div className="mt-4 space-y-3">
              {canCreateProperty && (
                <Link
                  href="/properties/create"
                  className="flex w-full items-center rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-200 transition-all duration-200 hover:border-blue-400/40 hover:bg-blue-500/15"
                >
                  <svg
                    className="mr-3 h-5 w-5 text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Add New Property
                </Link>
              )}

              {canViewIncome && (isAdmin || isManager) && (
                <Link
                  href="/myIncome"
                  className="flex w-full items-center rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200 transition-all duration-200 hover:border-amber-400/40 hover:bg-amber-500/15"
                >
                  <svg
                    className="mr-3 h-5 w-5 text-amber-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  View My Income
                </Link>
              )}

              {canCreateOffer && (
                <Link
                  href="/offers/create"
                  className="flex w-full items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 transition-all duration-200 hover:border-emerald-400/40 hover:bg-emerald-500/15"
                >
                  <svg
                    className="mr-3 h-5 w-5 text-emerald-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v10a2 2 0 01-2 2z"
                    />
                  </svg>
                  Create Offer Letter
                </Link>
              )}
            </div>
          </div>
        </div>

        {canViewIncome && (isAdmin || isManager) && user?.id && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
            <h2 className="text-lg font-bold text-slate-50">Commission Overview</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-green-500/25 bg-green-500/10 p-5 text-center">
                <div className="text-2xl font-bold text-green-300">
                  {formatCurrency(stats.totalIncome)}
                </div>
                <div className="mt-1 text-sm font-semibold text-green-200">Paid Commissions</div>
              </div>
              <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 p-5 text-center">
                <div className="text-2xl font-bold text-blue-300">View Details</div>
                <div className="mt-2 text-sm font-semibold text-blue-200">
                  <Link href="/myIncome" className="underline hover:text-blue-100">
                    Check All Commissions
                  </Link>
                </div>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 text-center">
                <div className="text-2xl font-bold text-slate-100">{user?.name}</div>
                <div className="mt-1 text-sm font-semibold text-slate-300">
                  {roleName || user?.role}
                </div>
              </div>
            </div>
          </div>
        )}

        {isManagedUser && (
          <div className="mt-8 rounded-2xl border border-blue-500/20 bg-linear-to-r from-blue-950/60 to-indigo-950/60 p-6 shadow-lg shadow-black/20">
            <h2 className="text-lg font-bold text-blue-100">Your Access Summary</h2>
            <p className="mt-2 text-sm leading-6 text-blue-200">
              You are logged in as a <span className="font-semibold text-white">{roleName}</span>.
              You have access to{' '}
              <span className="font-semibold text-white">{accessiblePropertyList.length}</span>{' '}
              properties. Contact your manager if you need additional access.
            </p>
            <button
              onClick={handleRefreshPermissions}
              disabled={isRefreshingPermissions}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600/50 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-600/70"
            >
              {isRefreshingPermissions ? 'Refreshing...' : 'Check for Updated Access'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}