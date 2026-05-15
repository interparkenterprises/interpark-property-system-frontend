'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Landlord } from '@/types';
import { landlordsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function LandlordsPage() {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLandlords();
  }, []);

  const fetchLandlords = async () => {
    try {
      const data = await landlordsAPI.getAll();
      setLandlords(data);
    } catch (error) {
      console.error('Error fetching landlords:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this landlord?')) {
      try {
        await landlordsAPI.delete(id);
        fetchLandlords();
      } catch (error) {
        console.error('Error deleting landlord:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Loading landlords...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Landlords Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all your property landlords</p>
        </div>
        <div className="flex gap-3">
          <Link href="/landlords/create">
            <Button className="bg-primary hover:bg-primary/90">
              Add Landlord
            </Button>
          </Link>
          <Link href="/landlords/create-with-property">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
              Create Landlord with Property
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Properties
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Offer Letters
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {landlords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-1">No landlords found</p>
                      <p className="text-gray-600 mb-4">Get started by creating your first landlord</p>
                      <Link href="/landlords/create">
                        <Button className="bg-primary hover:bg-primary/90">
                          Create Your First Landlord
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                landlords.map((landlord) => (
                  <tr key={landlord.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{landlord.name}</div>
                        {landlord.phone && (
                          <div className="text-sm text-gray-500">{landlord.phone}</div>
                        )}
                        {landlord.email && (
                          <div className="text-sm text-blue-600">{landlord.email}</div>
                        )}
                        {landlord.address && (
                          <div className="text-xs text-gray-400 mt-1">{landlord.address}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {landlord.idNumber || (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {landlord.properties && landlord.properties.length > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {landlord.properties.length} property{landlord.properties.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">No properties</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {landlord.offerLetters && landlord.offerLetters.length > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {landlord.offerLetters.length} offer{landlord.offerLetters.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">No offers</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(landlord.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/landlords/${landlord.id}`}
                          className="text-primary-600 hover:text-primary-900 text-sm font-medium transition-colors"
                        >
                          View
                        </Link>
                        <Link
                          href={`/landlords/${landlord.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium transition-colors"
                        >
                          Edit
                        </Link>
                        {landlord.properties && landlord.properties.length > 0 && (
                          <Link
                            href={`/properties?landlordId=${landlord.id}`}
                            className="text-purple-600 hover:text-purple-900 text-sm font-medium transition-colors"
                          >
                            Properties
                          </Link>
                        )}
                        {landlord.offerLetters && landlord.offerLetters.length > 0 && (
                          <Link
                            href={`/offer-letters?landlordId=${landlord.id}`}
                            className="text-green-600 hover:text-green-900 text-sm font-medium transition-colors"
                          >
                            Offers
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(landlord.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {landlords.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>Showing {landlords.length} landlord{landlords.length !== 1 ? 's' : ''}</div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
              <span>Has properties</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 rounded-full"></div>
              <span>Has offer letters</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}