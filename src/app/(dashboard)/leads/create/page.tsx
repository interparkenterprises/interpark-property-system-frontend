'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LeadForm from '@/components/forms/LeadForm';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider';

export default function CreateLeadPage() {
  const router = useRouter();
  const { canCreateLead } = useGlobalPermissions();
  const [success, setSuccess] = useState(false);

  // Check permission
  if (!canCreateLead) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Access Denied</h1>
          <p className="text-red-600 dark:text-red-300">
            You don't have permission to create leads. Please contact an administrator.
          </p>
          <Button 
            onClick={() => router.back()}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      router.push('/leads');
    }, 2000);
  };

  const handleCancel = () => {
    router.back();
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
        Lead created successfully! Redirecting...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Create Lead</h1>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <LeadForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
}