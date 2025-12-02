'use client';

import { useEffect, useState } from 'react';
import { propertiesAPI, landlordsAPI, tenantsAPI, paymentsAPI } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    properties: 0,
    landlords: 0,
    tenants: 0,
    totalIncome: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [properties, landlords, tenants, payments] = await Promise.all([
          propertiesAPI.getAll(),
          landlordsAPI.getAll(),
          tenantsAPI.getAll(),
          paymentsAPI.getIncomeReports(),
        ]);

        const totalIncome = payments.reduce((sum, payment) => sum + payment.amount, 0);

        setStats({
          properties: properties.length,
          landlords: landlords.length,
          tenants: tenants.length,
          totalIncome,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
      <p className="text-gray-600">Welcome to your property management dashboard</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded">
              <span className="text-2xl">🏢</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Properties</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.properties}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded">
              <span className="text-2xl">👤</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Landlords</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.landlords}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Tenants</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.tenants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
              <p className="text-2xl font-semibold text-gray-900">${stats.totalIncome}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}