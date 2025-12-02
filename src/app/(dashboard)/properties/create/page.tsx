'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PropertyForm from '@/components/forms/PropertyForm';
import { Button } from '@/components/ui/button';

export default function CreatePropertyPage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      router.push('/properties');
    }, 2000);
  };

  const handleCancel = () => {
    router.back();
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-heading-color">Property created!</h2>
        <p className="text-gray-600">Redirecting to properties list…</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-heading-color">Create New Property</h1>
        <Button
          variant="secondary"
          onClick={handleCancel}
          className="border-gray-300 text-gray-700 px-5 py-2 hover:bg-gray-50 transition-colors duration-200"
        >
          ← Cancel
        </Button>
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="bg-linear-to-r from-primary to-primary/80 px-6 py-4">
          <h2 className="text-lg font-semibold text-blue-600">Property Details</h2>
          <p className="text-primary-100 text-sm">Fill in the fields below to register a new property.</p>
        </div>
        <div className="p-6">
          <PropertyForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
      </motion.div>
    </motion.div>
  );
}