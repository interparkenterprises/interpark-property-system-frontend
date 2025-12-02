'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { Unit } from '@/types';
import { unitsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';

// Correctly typed framer-motion variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 12
    }
  }
};

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  const unitId = params.id as string;

  useEffect(() => {
    fetchUnit();
  }, [unitId]);

  const fetchUnit = async () => {
    try {
      const data = await unitsAPI.getById(unitId);
      setUnit(data);
    } catch (error) {
      console.error('Error fetching unit:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to get rent type display text
  const getRentTypeDisplay = (rentType: string): string => {
    const rentTypeMap: { [key: string]: string } = {
      'FIXED': 'Fixed Amount',
      'PER_SQFT': 'Per Square Foot',
      'MONTHLY': 'Monthly',
      'ANNUAL': 'Annual',
      'PER_ROOM': 'Per Room',
      'PER_OCCUPANT': 'Per Occupant',
      'PERCENT_OF_REVENUE': 'Percentage of Revenue',
      'GRADUATED': 'Graduated',
      'INDEXED': 'Indexed',
      'TIERED': 'Tiered',
      'DAILY': 'Daily',
      'WEEKLY': 'Weekly',
      'NEGOTIATED': 'Negotiated',
      'PARTIAL_SUBSIDY': 'Partial Subsidy',
      'VARIABLE': 'Variable'
    };
    return rentTypeMap[rentType] || rentType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="relative w-16 h-16 mx-auto mb-4">
            <motion.div
              className="absolute inset-0 border-4 border-primary/20 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <p className="text-lg font-medium text-gray-600">Loading unit details...</p>
        </motion.div>
      </div>
    );
  }

  if (!unit) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-heading-color mb-2">Unit Not Found</h2>
        <p className="text-gray-600 mb-6">The unit you're looking for doesn't exist.</p>
        <Button onClick={() => router.back()}>
          Go Back
        </Button>
      </motion.div>
    );
  }

  const isCommercial = unit.unitType === 'COMMERCIAL';
  const isPerSqFt = unit.rentType === 'PER_SQFT';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 p-6 md:p-8"
    >
      {/* Back Button */}
      <motion.div variants={itemVariants}>
        <Button
          onClick={() => router.back()}
          className="group px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300 shadow-sm hover:shadow-md rounded-lg"
        >
          <motion.span
            className="flex items-center gap-2"
            whileHover={{ x: -2 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </motion.span>
        </Button>
      </motion.div>

      {/* Header Section */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b-2 border-gray-100"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-16 h-16 bg-linear-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center shrink-0"
          >
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </motion.div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-heading-color">{unit.type || 'Unit'}</h1>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              ID: {unit.id}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.span
            whileHover={{ scale: 1.05 }}
            className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold ${
              unit.status === 'VACANT'
                ? 'bg-green-100 text-green-700 border-2 border-green-200'
                : 'bg-blue-100 text-blue-700 border-2 border-blue-200'
            }`}
          >
            {unit.status}
          </motion.span>
          <motion.span
            whileHover={{ scale: 1.05 }}
            className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold ${
              isCommercial
                ? 'bg-purple-100 text-purple-700 border-2 border-purple-200'
                : 'bg-orange-100 text-orange-700 border-2 border-orange-200'
            }`}
          >
            {unit.unitType}
          </motion.span>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unit Information */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-heading-color">Unit Details</h2>
          </div>
          <dl className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <div className="flex-1">
                <dt className="text-sm font-semibold text-gray-500 mb-1">Unit Type</dt>
                <dd className="text-sm text-gray-900 font-medium">{unit.type || 'N/A'}</dd>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <div className="flex-1">
                <dt className="text-sm font-semibold text-gray-500 mb-1">Size</dt>
                <dd className="text-sm text-gray-900 font-medium">{unit.sizeSqFt.toLocaleString()} sq ft</dd>
              </div>
            </div>

            {/* Only show bedrooms and bathrooms for residential units */}
            {!isCommercial && (
              <>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <div className="flex-1">
                    <dt className="text-sm font-semibold text-gray-500 mb-1">Bedrooms</dt>
                    <dd className="text-sm text-gray-900 font-medium">{unit.bedrooms || 0}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className="flex-1">
                    <dt className="text-sm font-semibold text-gray-500 mb-1">Bathrooms</dt>
                    <dd className="text-sm text-gray-900 font-medium">{unit.bathrooms || 0}</dd>
                  </div>
                </div>
              </>
            )}

            {/* Show usage for commercial units */}
            {isCommercial && unit.usage && (
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-500 mb-1">Business Usage</dt>
                  <dd className="text-sm text-gray-900 font-medium">{unit.usage}</dd>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1">
                <dt className="text-sm font-semibold text-gray-500 mb-1">Status</dt>
                <dd>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    unit.status === 'VACANT'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {unit.status}
                  </span>
                </dd>
              </div>
            </div>
          </dl>
        </motion.div>

        {/* Rent Information */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-heading-color">Rent Information</h2>
          </div>
          <div className="space-y-6">
            <div className="p-6 bg-linear-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
              <p className="text-sm font-semibold text-gray-600 mb-2">Rent Amount</p>
              <p className="text-4xl font-bold text-primary">{formatCurrency(unit.rentAmount)}</p>
              <p className="text-sm text-gray-600 mt-2">Per {getRentTypeDisplay(unit.rentType).toLowerCase()}</p>
              
              {/* Show calculation breakdown for PER_SQFT type */}
              {isPerSqFt && unit.calculationInfo && (
                <div className="mt-4 p-4 bg-white/50 rounded-lg border border-primary/10">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Calculation Breakdown:</p>
                  <div className="text-sm text-gray-800 space-y-1">
                    <div className="flex justify-between">
                      <span>Rate per sq ft:</span>
                      <span className="font-semibold">{formatCurrency(unit.calculationInfo.ratePerSqFt || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unit size:</span>
                      <span className="font-semibold">{unit.sizeSqFt.toLocaleString()} sq ft</span>
                    </div>
                    <div className="border-t border-gray-200 pt-1 mt-1">
                      <div className="flex justify-between text-primary font-bold">
                        <span>Total rent:</span>
                        <span>{formatCurrency(unit.rentAmount)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-800 mt-2 italic">
                    {unit.calculationInfo.formula}
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Rent Type</span>
                <span className="text-lg font-bold text-heading-color">{getRentTypeDisplay(unit.rentType)}</span>
              </div>
            </div>

            {/* Additional info for PER_SQFT type */}
            {isPerSqFt && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-700">Per Square Foot Pricing</span>
                </div>
                <p className="text-xs text-blue-800">
                  Rent is calculated based on the unit size. The rate per square foot is multiplied by the total area to determine the monthly rent.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Property Information */}
        {unit.property && (
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 lg:col-span-2"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-heading-color">Property Information</h2>
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-500 mb-1">Property Name</dt>
                  <dd className="text-sm text-gray-900 font-medium">{unit.property.name}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-500 mb-1">Address</dt>
                  <dd className="text-sm text-gray-900">{unit.property.address}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-500 mb-1">Property Type</dt>
                  <dd className="text-sm text-gray-900 font-medium">{unit.property.form}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-500 mb-1">Usage Type</dt>
                  <dd className="text-sm text-gray-900 font-medium">{unit.property.usage}</dd>
                </div>
              </div>
            </dl>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}