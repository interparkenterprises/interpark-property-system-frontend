'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lead } from '@/types';
import { leadsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function LeadsPage() {
  const { user, userId } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingLead, setDeletingLead] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      let data = await leadsAPI.getAll();
      
      // If user is MANAGER, filter by createdById
      if (user?.role === 'MANAGER' && userId) {
        data = data.filter(lead => lead.createdById === userId);
      }
      
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Only ADMIN can delete (optional - remove if managers can delete their own leads)
    if (user?.role !== 'ADMIN') {
      alert('Only administrators can delete leads.');
      return;
    }

    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        setDeletingLead(id);
        await leadsAPI.delete(id);
        fetchLeads();
      } catch (error) {
        console.error('Error deleting lead:', error);
      } finally {
        setDeletingLead(null);
      }
    }
  };

  // Show loading while auth is being checked
  if (!user && loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
      </div>
    );
  }

  // Check if user has permission to view leads
  if (user && !['ADMIN', 'MANAGER'].includes(user.role)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Access Denied</h1>
          <p className="text-red-600 dark:text-red-300">
            You don't have permission to view leads. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-400 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900"></div>
          </div>
        </div>
        <p className="mt-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Loading all leads Information</p>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Fetching details from the server...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with user role info */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {user?.role === 'ADMIN' 
              ? 'Manage all leads' 
              : 'Manage your leads'}
          </p>
          {user?.role === 'MANAGER' && (
            <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full inline-block">
              Viewing only your leads
            </div>
          )}
        </div>
        <Link href="/leads/create">
          <Button className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium shadow-sm">
            + Add Lead
          </Button>
        </Link>
      </div>

      {/* Stats Cards - Only show for ADMIN */}
      {user?.role === 'ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Leads</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{leads.length}</p>
          </div>
        </div>
      )}

      {/* Leads Table */}
      {leads.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No leads found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {user?.role === 'ADMIN' 
              ? 'No leads match your search criteria.'
              : "You haven't created any leads yet."}
          </p>
          <Link href="/leads/create">
            <button className="mt-6 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
              Add Lead
            </button>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nature of Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  {user?.role === 'ADMIN' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created By
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{lead.natureOfLead || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{lead.property?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    {user?.role === 'ADMIN' && lead.createdById && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {lead.createdById || 'Unknown'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          View
                        </Link>
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(lead.id)}
                            disabled={deletingLead === lead.id}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:text-red-300 dark:disabled:text-red-700 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {deletingLead === lead.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 dark:border-red-400"></div>
                                Deleting...
                              </>
                            ) : (
                              'Delete'
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}