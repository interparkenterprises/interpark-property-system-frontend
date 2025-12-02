'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Landlord } from '@/types';
import { landlordsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import LandlordForm from '@/components/forms/LandlordForm';

export default function LandlordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [landlord, setLandlord] = useState<Landlord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const landlordId = params.id as string;

  useEffect(() => {
    fetchLandlord();
  }, [landlordId]);

  const fetchLandlord = async () => {
    try {
      const data = await landlordsAPI.getById(landlordId);
      setLandlord(data);
    } catch (error) {
      console.error('Error fetching landlord:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this landlord?')) {
      try {
        await landlordsAPI.delete(landlordId);
        router.push('/dashboard/landlords');
      } catch (error) {
        console.error('Error deleting landlord:', error);
      }
    }
  };

  const handleUpdateSuccess = () => {
    setEditing(false);
    fetchLandlord();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!landlord) {
    return <div>Landlord not found</div>;
  }

  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Edit Landlord</h1>
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <LandlordForm 
            landlord={landlord} 
            onSuccess={handleUpdateSuccess}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">{landlord.name}</h1>
        <div className="space-x-2">
          <Button onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Landlord Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900">{landlord.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900">{landlord.email || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="text-sm text-gray-900">{landlord.phone || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="text-sm text-gray-900">{landlord.address || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Properties</dt>
              <dd className="text-sm text-gray-900">{landlord.properties.length}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Properties</h2>
          {landlord.properties.length === 0 ? (
            <p className="text-gray-500">No properties assigned</p>
          ) : (
            <div className="space-y-3">
              {landlord.properties.map(property => (
                <div key={property.id} className="border-b pb-2 last:border-b-0">
                  <h3 className="font-medium">{property.name}</h3>
                  <p className="text-sm text-gray-600">{property.address}</p>
                  <p className="text-xs text-gray-500 capitalize">{property.form.toLowerCase()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}