'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import OfferLetterForm from '@/components/forms/OfferLetterForm';
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider';
import { Button } from '@/components/ui/button';

export default function CreateOfferPage() {
  const router = useRouter();
  const { canCreateOffer } = useGlobalPermissions();

  if (!canCreateOffer) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Access Denied</h1>
          <p className="text-red-600 dark:text-red-300">
            You don't have permission to create offer letters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="secondary"
          size="md"
          onClick={() => router.back()}
          className="text-black hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <OfferLetterForm
        onSuccess={() => {
          router.push('/offers');
          router.refresh();
        }}
        onCancel={() => router.push('/offers')}
      />
    </div>
  );
}