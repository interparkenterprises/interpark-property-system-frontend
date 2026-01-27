'use client';

import { useEffect, useState } from 'react';
import { propertiesAPI, landlordsAPI, tenantsAPI, commissionsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    properties: 0,
    landlords: 0,
    tenants: 0,
    totalIncome: 0, // This will now show PAID commissions
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch basic stats
        const [propertiesResponse, landlordsResponse, tenantsResponse] = await Promise.all([
          propertiesAPI.getAll(),
          landlordsAPI.getAll(),
          tenantsAPI.getAll(),
        ]);

        // Fetch manager's commission stats to get total PAID commissions
        let totalPaidCommissions = 0;
        
        if (user?.id) {
          try {
            const commissionStats = await commissionsAPI.getCommissionStats(user.id);
            console.log('Commission stats:', commissionStats); // Debug log
            
            // Use totalPaid from commission stats
            totalPaidCommissions = commissionStats.totalPaid || 0;
          } catch (commissionError) {
            console.error('Error fetching commission stats:', commissionError);
            // If commission stats fail, try to get commissions and calculate manually
            try {
              const commissionsResponse = await commissionsAPI.getManagerCommissions(user.id);
              const commissions = commissionsResponse.data; // Access the data property
              const paidCommissions = commissions.filter(commission => commission.status === 'PAID');
              totalPaidCommissions = paidCommissions.reduce((sum, commission) => sum + commission.commissionAmount, 0);
            } catch (fallbackError) {
              console.error('Fallback commission fetch also failed:', fallbackError);
              // Continue with 0 if both methods fail
            }
          }
        }

        setStats({
          properties: Array.isArray(propertiesResponse) ? propertiesResponse.length : 0,
          landlords: Array.isArray(landlordsResponse) ? landlordsResponse.length : 0,
          tenants: Array.isArray(tenantsResponse) ? tenantsResponse.length : 0,
          totalIncome: totalPaidCommissions,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">Error loading dashboard</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to your property management dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Properties Card */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Properties</h3>
                <p className="text-2xl font-semibold text-gray-900">{stats.properties}</p>
              </div>
            </div>
          </div>

          {/* Landlords Card */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Landlords</h3>
                <p className="text-2xl font-semibold text-gray-900">{stats.landlords}</p>
              </div>
            </div>
          </div>

          {/* Tenants Card */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Tenants</h3>
                <p className="text-2xl font-semibold text-gray-900">{stats.tenants}</p>
              </div>
            </div>
          </div>

          {/* Total Income Card - Now shows PAID commissions */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalIncome)}</p>
                <p className="text-xs text-gray-500 mt-1">Paid Commissions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Dashboard Content */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Placeholder */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="text-center text-gray-500 py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p className="mt-2">Recent activity will appear here</p>
            </div>
          </div>

          {/* Quick Actions Placeholder */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/properties'}
                className="w-full text-left p-3 bg-blue-500/10 text-blue-800 rounded-lg hover:bg-blue-500/20 hover:text-blue-900 transition-all duration-200 border border-blue-100 hover:border-blue-200 font-medium flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Add New Property
              </button>
             
              <button 
                onClick={() => window.location.href = '/myIncome'}
                className="w-full text-left p-3 bg-yellow-500/10 text-yellow-800 rounded-lg hover:bg-yellow-500/20 hover:text-yellow-900 transition-all duration-200 border border-yellow-100 hover:border-yellow-200 font-medium flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View My Income
              </button>
            </div>
          </div>
        </div>

        {/* Commission Status Overview */}
        {user?.id && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</div>
                <div className="text-sm text-green-800">Paid Commissions</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">View Details</div>
                <div className="text-sm text-blue-800">
                  <button 
                    onClick={() => window.location.href = '/myIncome'}
                    className="underline hover:text-blue-900"
                  >
                    Check All Commissions
                  </button>
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">Manager</div>
                <div className="text-sm text-gray-800">{user?.name}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}