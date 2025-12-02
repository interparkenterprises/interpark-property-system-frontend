'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NewsForm from '@/components/forms/NewsForm';
import { Button } from '@/components/ui/button';

export default function CreateNewsPage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      router.push('/dashboard/news');
    }, 2000);
  };

  const handleCancel = () => {
    router.back();
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
        News created successfully! Redirecting...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Create News</h1>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <NewsForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
}