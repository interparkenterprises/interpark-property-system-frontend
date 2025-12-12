'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Lead } from '@/types';
import { leadsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import LeadForm from '@/components/forms/LeadForm';
import Link from 'next/link';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const leadId = params.id as string;

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  const fetchLead = async () => {
    try {
      const data = await leadsAPI.getById(leadId);
      setLead(data);
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadsAPI.delete(leadId);
        router.push('/leads');
      } catch (error) {
        console.error('Error deleting lead:', error);
      }
    }
  };

  const handleUpdateSuccess = () => {
    setEditing(false);
    fetchLead();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-400 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900"></div>
          </div>
        </div>
        <p className="mt-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Loading Lead Information</p>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Fetching details from the server...</p>
      </div>
    );
  }

  if (!lead) {
    return <div>Lead not found</div>;
  }

  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/leads">
              <Button variant="secondary" size="sm">
                ← Back
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Edit Lead</h1>
          </div>
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <LeadForm 
            lead={lead} 
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
        <div className="flex items-center space-x-4">
          <Link href="/leads">
            <Button variant="secondary" size="sm">
              ← Back
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{lead.name}</h1>
        </div>
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Lead Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{lead.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{lead.phone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{lead.email || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{lead.address || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Number</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{lead.idNumber || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Company Name</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{lead.companyName || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nature of Lead</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{lead.natureOfLead || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Property</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">{lead.property?.name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {new Date(lead.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Notes</h2>
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {lead.notes || 'No notes available.'}
          </p>
        </div>
      </div>
    </div>
  );
}