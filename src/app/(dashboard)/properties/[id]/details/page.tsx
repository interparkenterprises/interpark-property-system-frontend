'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Property, ArrearsResponse, ArrearsItem, Income } from '@/types';
import { propertiesAPI, paymentsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { exportArrearsToPDF } from '@/lib/arrearsPdfGenerator';
import { exportPropertyToExcel, ExportSection } from '@/lib/excelGenerator';

type TabType = 'income' | 'commissions' | 'payments' | 'arrears';

// Define proper types for Framer Motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

const tabVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 120,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
    },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
};

// Types for grouped data
type GroupedIncome = {
  tenantId: string;
  tenantName: string;
  tenantContact: string;
  unitName: string;
  totalAmount: number;
  incomes: Income[];
};

type GroupedArrears = {
  tenantId: string;
  tenantName: string;
  tenantContact: string;
  unitName: string;
  totalArrears: number;
  totalPaid: number;
  items: ArrearsItem[];
};

export default function PropertyDetailInfoPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [arrearsData, setArrearsData] = useState<ArrearsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [arrearsLoading, setArrearsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('income');
  const [exporting, setExporting] = useState(false);
  const [exportingArrearsPdf, setExportingArrearsPdf] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // State for expanded tenant tabs
  const [expandedIncomeTenant, setExpandedIncomeTenant] = useState<string | null>(null);
  const [expandedArrearsTenant, setExpandedArrearsTenant] = useState<string | null>(null);

  const [exportSections, setExportSections] = useState<ExportSection[]>([
    { id: 'propertyInfo', label: 'Property Information', selected: true },
    { id: 'financialSummary', label: 'Financial Summary', selected: true },
    { id: 'unitsAndTenants', label: 'Units & Tenants', selected: true },
    { id: 'incomeRecords', label: 'Income Records', selected: true },
    { id: 'commissionRecords', label: 'Commission Records', selected: true },
    { id: 'serviceProviders', label: 'Service Providers', selected: true },
  ]);

  const propertyId = params.id as string;

  useEffect(() => {
    fetchPropertyDetails();
  }, [propertyId]);

  useEffect(() => {
    if (activeTab === 'arrears' && !arrearsData) {
      fetchArrearsData();
    }
  }, [activeTab]);

  const fetchPropertyDetails = async () => {
    try {
      const data = await propertiesAPI.getById(propertyId);
      setProperty(data);
    } catch (error) {
      console.error('Error fetching property details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArrearsData = async () => {
    setArrearsLoading(true);
    try {
      const data = await paymentsAPI.getArrears(propertyId);
      setArrearsData(data);
    } catch (error) {
      console.error('Error fetching arrears data:', error);
    } finally {
      setArrearsLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/properties/${propertyId}`);
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!property)
      return { totalIncome: 0, totalCommissions: 0, pendingCommissions: 0, paidCommissions: 0 };

    const totalIncome = property.incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
    const totalCommissions =
      property.commissions?.reduce((sum, commission) => sum + commission.commissionAmount, 0) || 0;
    const pendingCommissions =
      property.commissions
        ?.filter((c) => c.status === 'PENDING')
        .reduce((sum, c) => sum + c.commissionAmount, 0) || 0;
    const paidCommissions =
      property.commissions
        ?.filter((c) => c.status === 'PAID')
        .reduce((sum, c) => sum + c.commissionAmount, 0) || 0;

    return { totalIncome, totalCommissions, pendingCommissions, paidCommissions };
  };

  const totals = calculateTotals();

  // Group income data by tenant
  const groupIncomeByTenant = (): GroupedIncome[] => {
    if (!property?.incomes) return [];

    const grouped = property.incomes.reduce((acc, income) => {
      if (!income.tenantId) return acc;
      
      const unit = property.units?.find((u) => u.tenant?.id === income.tenantId);
      const tenant = unit?.tenant;
      
      if (!tenant) return acc;

      const existing = acc.find((item) => item.tenantId === income.tenantId);
      
      if (existing) {
        existing.incomes.push(income);
        existing.totalAmount += income.amount;
      } else {
        acc.push({
          tenantId: income.tenantId,
          tenantName: tenant.fullName,
          tenantContact: tenant.contact || '',
          unitName: unit.type || 'Unit',
          totalAmount: income.amount,
          incomes: [income],
        });
      }
      
      return acc;
    }, [] as GroupedIncome[]);

    return grouped.sort((a, b) => b.totalAmount - a.totalAmount);
  };

  // Group arrears data by tenant
  const groupArrearsByTenant = (): GroupedArrears[] => {
    if (!arrearsData?.arrears) return [];

    const grouped = arrearsData.arrears.reduce((acc, item) => {
      const existing = acc.find((group) => group.tenantId === item.tenantId);
      
      if (existing) {
        existing.items.push(item);
        existing.totalArrears += item.balance;
        existing.totalPaid += item.paidAmount;
      } else {
        acc.push({
          tenantId: item.tenantId,
          tenantName: item.tenantName,
          tenantContact: item.tenantContact,
          unitName: `${item.unitType} ${item.unitNo}`,
          totalArrears: item.balance,
          totalPaid: item.paidAmount,
          items: [item],
        });
      }
      
      return acc;
    }, [] as GroupedArrears[]);

    return grouped.sort((a, b) => b.totalArrears - a.totalArrears);
  };

  // Toggle individual section
  const toggleSection = (sectionId: string) => {
    setExportSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, selected: !section.selected } : section
      )
    );
  };

  // Toggle all sections
  const toggleAllSections = () => {
    const allSelected = exportSections.every((s) => s.selected);
    setExportSections((prev) => prev.map((section) => ({ ...section, selected: !allSelected })));
  };

  // Check if all sections are selected
  const allSectionsSelected = exportSections.every((s) => s.selected);

  // Get selected sections
  const getSelectedSections = () => {
    return exportSections.filter((s) => s.selected).map((s) => s.id);
  };

  // Open export modal
  const handleOpenExportModal = () => {
    setShowExportModal(true);
  };

  // Close export modal
  const handleCloseExportModal = () => {
    setShowExportModal(false);
  };

  // Export Arrears to PDF
  const handleExportArrearsToPDF = async () => {
    if (!property || !arrearsData) return;

    setExportingArrearsPdf(true);

    try {
      await exportArrearsToPDF(property, arrearsData);
      alert('Arrears report exported successfully!');
    } catch (error) {
      console.error('Error exporting arrears to PDF:', error);
      alert('Failed to export arrears report. Please try again.');
    } finally {
      setExportingArrearsPdf(false);
    }
  };

  // Export to Excel using the separated utility
  const exportToExcel = async () => {
    if (!property) return;

    const selectedSections = getSelectedSections();

    if (selectedSections.length === 0) {
      alert('Please select at least one section to export.');
      return;
    }

    setExporting(true);
    setShowExportModal(false);

    try {
      const { buffer, filename } = await exportPropertyToExcel(property, selectedSections, totals);
      
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      alert('Payment report exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
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
          <p className="text-lg font-medium text-gray-600">Loading details...</p>
        </motion.div>
      </div>
    );
  }

  if (!property) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-heading-color mb-2">Property Not Found</h2>
        <p className="text-gray-600 mb-6">Unable to load property details.</p>
        <Button onClick={handleBack}>Back to Property</Button>
      </motion.div>
    );
  }

  const groupedIncome = groupIncomeByTenant();
  const groupedArrears = groupArrearsByTenant();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 p-6 md:p-8"
    >
      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={handleCloseExportModal}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-linear-to-r from-primary to-primary/80 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Export Payment Report</h2>
                    <p className="text-sm text-white/90">
                      Select sections to include in your export
                    </p>
                  </div>
                  <button
                    onClick={handleCloseExportModal}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-220px)]">
                {/* Select All Option */}
                <div className="mb-6 pb-4 border-b-2 border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={allSectionsSelected}
                        onChange={toggleAllSections}
                        className="w-6 h-6 rounded border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
                      />
                      {allSectionsSelected && (
                        <svg
                          className="absolute top-1 left-1 w-4 h-4 text-white pointer-events-none"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                      Select All Sections
                    </span>
                  </label>
                </div>

                {/* Individual Sections */}
                <div className="space-y-3">
                  {exportSections.map((section) => {
                    // Check if section has data
                    let hasData = true;
                    let itemCount = 0;

                    if (section.id === 'unitsAndTenants') {
                      hasData = (property.units?.length || 0) > 0;
                      itemCount = property.units?.length || 0;
                    } else if (section.id === 'incomeRecords') {
                      hasData = (property.incomes?.length || 0) > 0;
                      itemCount = property.incomes?.length || 0;
                    } else if (section.id === 'commissionRecords') {
                      hasData = (property.commissions?.length || 0) > 0;
                      itemCount = property.commissions?.length || 0;
                    } else if (section.id === 'serviceProviders') {
                      hasData = (property.serviceProviders?.length || 0) > 0;
                      itemCount = property.serviceProviders?.length || 0;
                    }

                    return (
                      <motion.label
                        key={section.id}
                        whileHover={{ x: 4 }}
                        className={`flex items-center justify-between gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          section.selected
                            ? 'bg-primary/5 border-primary shadow-sm'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        } ${!hasData ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={section.selected}
                              onChange={() => hasData && toggleSection(section.id)}
                              disabled={!hasData}
                              className="w-5 h-5 rounded border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer disabled:cursor-not-allowed"
                            />
                            {section.selected && (
                              <svg
                                className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <span
                              className={`font-semibold ${
                                section.selected ? 'text-primary' : 'text-gray-900'
                              }`}
                            >
                              {section.label}
                            </span>
                            {!hasData && (
                              <p className="text-xs text-gray-500 mt-0.5">No data available</p>
                            )}
                            {hasData && itemCount > 0 && (
                              <p className="text-xs text-gray-600 mt-0.5">
                                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                              </p>
                            )}
                          </div>
                        </div>
                        <svg
                          className={`w-5 h-5 transition-colors ${
                            section.selected ? 'text-primary' : 'text-gray-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </motion.label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {getSelectedSections().length}
                  </span>{' '}
                  of {exportSections.length} sections selected
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleCloseExportModal}
                    variant="secondary"
                    className="px-6 py-2.5"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    disabled={getSelectedSections().length === 0 || exporting}
                    className="px-6 py-2.5 bg-primary text-white hover:bg-primary/90 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-2">
                      {exporting ? (
                        <>
                          <motion.svg
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </motion.svg>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Export to Excel
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <Button
          onClick={handleBack}
          className="group px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300 shadow-sm hover:shadow-md rounded-lg"
        >
          <motion.span className="flex items-center gap-2" whileHover={{ x: -2 }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </motion.span>
        </Button>
      </motion.div>

      {/* Property Header */}
      <motion.div
        variants={itemVariants}
        className="bg-linear-to-r from-primary to-primary/80 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex items-center gap-4 mb-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </motion.div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{property.name}</h1>
            <p className="text-white/90 flex items-center gap-2 mt-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {property.address}
            </p>
          </div>
        </div>
        <div className="text-sm text-white/80">Financial Details & Reports</div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-linear-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-white/80 mb-1">Total Collection</p>
          <p className="text-3xl font-bold">Ksh {totals.totalIncome.toLocaleString()}</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-white/80 mb-1">Total Commissions</p>
          <p className="text-3xl font-bold">Ksh {totals.totalCommissions.toLocaleString()}</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-linear-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-white/80 mb-1">Pending Commissions</p>
          <p className="text-3xl font-bold">Ksh {totals.pendingCommissions.toLocaleString()}</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-white/80 mb-1">Paid Commissions</p>
          <p className="text-3xl font-bold">Ksh {totals.paidCommissions.toLocaleString()}</p>
        </motion.div>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-2"
      >
        <div className="flex gap-2 overflow-x-auto">
          {[
            {
              id: 'income',
              label: 'Income Details',
              icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            },
            {
              id: 'commissions',
              label: 'Commissions',
              icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
            },
            {
              id: 'arrears',
              label: 'Arrears',
              icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            },
            {
              id: 'payments',
              label: 'Payment Report',
              icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div key={activeTab} variants={tabVariants} initial="hidden" animate="visible" exit="exit">
        {/* INCOME TAB - Grouped by Tenant */}
        {activeTab === 'income' && (
          <div className="space-y-6">
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-heading-color">Income by Tenant</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {groupedIncome.length} tenant{groupedIncome.length !== 1 ? 's' : ''} with income records
                  </p>
                </div>
              </div>

              {groupedIncome.length > 0 ? (
                <div className="space-y-4">
                  {groupedIncome.map((group, index) => (
                    <motion.div
                      key={group.tenantId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
                    >
                      {/* Tenant Header - Clickable */}
                      <button
                        onClick={() => setExpandedIncomeTenant(
                          expandedIncomeTenant === group.tenantId ? null : group.tenantId
                        )}
                        className="w-full flex items-center justify-between p-5 bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-green-700">
                              {group.tenantName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{group.tenantName}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                {group.unitName}
                              </span>
                              <span>•</span>
                              <span>{group.incomes.length} payment{group.incomes.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Total Paid</p>
                            <p className="text-xl font-bold text-green-600">
                              Ksh {group.totalAmount.toLocaleString()}
                            </p>
                          </div>
                          <motion.div
                            animate={{ rotate: expandedIncomeTenant === group.tenantId ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </motion.div>
                        </div>
                      </button>

                      {/* Expandable Income Details */}
                      <AnimatePresence>
                        {expandedIncomeTenant === group.tenantId && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-5 bg-white border-t border-gray-200">
                              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                                Payment History
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Date</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Amount</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Frequency</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Invoice #</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.incomes.map((income, idx) => (
                                      <motion.tr
                                        key={income.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                                      >
                                        <td className="py-3 px-4 text-gray-900">
                                          {new Date(income.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                          })}
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className="font-semibold text-green-600">
                                            Ksh {income.amount.toLocaleString()}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                            {income.frequency}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            Recorded
                                          </span>
                                        </td>
                                      </motion.tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-green-50/50 font-semibold">
                                      <td className="py-3 px-4 text-gray-900">Total</td>
                                      <td className="py-3 px-4 text-green-700" colSpan={3}>
                                        Ksh {group.totalAmount.toLocaleString()}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium">No income records found</p>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {activeTab === 'commissions' && (
          <div className="space-y-6">
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-heading-color">Commission Records</h2>
              </div>

              {property.commissions && property.commissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">Period</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">Manager</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">Income</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">Rate</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">
                          Commission
                        </th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">Status</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-900">
                          Paid Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.commissions.map((commission, index) => (
                        <motion.tr
                          key={commission.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-4 text-gray-900">
                            <div className="text-sm">
                              {new Date(commission.periodStart).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                              {' - '}
                              {new Date(commission.periodEnd).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-900">
                              {property.manager?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-gray-900">
                              Ksh {commission.incomeAmount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-900">{commission.commissionFee}%</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-bold text-blue-600">
                              Ksh {commission.commissionAmount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                commission.status === 'PAID'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {commission.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-900">
                            {commission.paidDate
                              ? new Date(commission.paidDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '-'}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium">No commission records found</p>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* ARREARS TAB - Grouped by Tenant */}
        {activeTab === 'arrears' && (
          <div className="space-y-6">
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-heading-color">Arrears by Tenant</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {groupedArrears.length} tenant{groupedArrears.length !== 1 ? 's' : ''} with outstanding balances
                    </p>
                  </div>
                </div>
                {arrearsData && arrearsData.arrears.length > 0 && (
                  <Button
                    onClick={handleExportArrearsToPDF}
                    disabled={exportingArrearsPdf}
                    className="px-6 py-2.5 bg-red-600 text-white hover:bg-red-700 transition-all duration-300 shadow-md rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-2">
                      {exportingArrearsPdf ? (
                        <>
                          <motion.svg
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </motion.svg>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          Export PDF
                        </>
                      )}
                    </span>
                  </Button>
                )}
              </div>

              {arrearsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                    <div className="relative w-12 h-12 mx-auto mb-4">
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
                    <p className="text-gray-600 font-medium">Loading arrears data...</p>
                  </motion.div>
                </div>
              ) : arrearsData ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-linear-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                      <div className="text-sm font-medium text-red-700 mb-2">Total Arrears</div>
                      <div className="text-2xl font-bold text-red-900">
                        Ksh {arrearsData.summary.totalArrears.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="text-sm font-medium text-blue-700 mb-2">Total Expected</div>
                      <div className="text-2xl font-bold text-blue-900">
                        Ksh {arrearsData.summary.totalExpected.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <div className="text-sm font-medium text-green-700 mb-2">Total Paid</div>
                      <div className="text-2xl font-bold text-green-900">
                        Ksh {arrearsData.summary.totalPaid.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-2">Total Items</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {arrearsData.summary.itemCount}
                      </div>
                    </div>
                  </div>

                  {/* Grouped Arrears by Tenant */}
                  {groupedArrears.length > 0 ? (
                    <div className="space-y-4">
                      {groupedArrears.map((group, index) => (
                        <motion.div
                          key={group.tenantId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-red/30 transition-colors"
                        >
                          {/* Tenant Header - Clickable */}
                          <button
                            onClick={() => setExpandedArrearsTenant(
                              expandedArrearsTenant === group.tenantId ? null : group.tenantId
                            )}
                            className="w-full flex items-center justify-between p-5 bg-red-50/30 hover:bg-red-50/50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-lg font-bold text-red-700">
                                  {group.tenantName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{group.tenantName}</h3>
                                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    {group.unitName}
                                  </span>
                                  <span>•</span>
                                  <span>{group.items.length} outstanding {group.items.length !== 1 ? 'invoices' : 'invoice'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-xs text-gray-600 mb-1">Paid: 
                                  <span className="text-green-600 font-medium ml-1">
                                    Ksh {group.totalPaid.toLocaleString()}
                                  </span>
                                </p>
                                <p className="text-sm text-gray-600">Balance: 
                                  <span className="text-red-600 font-bold text-lg ml-1">
                                    Ksh {group.totalArrears.toLocaleString()}
                                  </span>
                                </p>
                              </div>
                              <motion.div
                                animate={{ rotate: expandedArrearsTenant === group.tenantId ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
                              >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </motion.div>
                            </div>
                          </button>

                          {/* Expandable Arrears Details */}
                          <AnimatePresence>
                            {expandedArrearsTenant === group.tenantId && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="p-5 bg-white border-t border-gray-200">
                                  <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                                    Outstanding Invoices
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="border-b border-gray-200">
                                          <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Invoice #</th>
                                          <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Type</th>
                                          <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Expected</th>
                                          <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Paid</th>
                                          <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Balance</th>
                                          <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {group.items.map((item, idx) => (
                                          <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                                          >
                                            <td className="py-3 px-4 font-mono text-sm text-gray-900">
                                              {item.invoiceNumber}
                                            </td>
                                            <td className="py-3 px-4">
                                              <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                  item.invoiceType === 'RENT'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                }`}
                                              >
                                                {item.invoiceType === 'RENT' ? 'Rent' : item.billType}
                                              </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-900">
                                              Ksh {item.expectedAmount?.toLocaleString() || '-'}
                                            </td>
                                            <td className="py-3 px-4">
                                              <span className="text-green-600 font-medium">
                                                Ksh {item.paidAmount.toLocaleString()}
                                              </span>
                                            </td>
                                            <td className="py-3 px-4">
                                              <span className="font-bold text-red-600">
                                                Ksh {item.balance.toLocaleString()}
                                              </span>
                                            </td>
                                            <td className="py-3 px-4">
                                              <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                  item.status === 'UNPAID'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}
                                              >
                                                {item.status === 'UNPAID' ? 'Unpaid' : 'Partial'}
                                              </span>
                                            </td>
                                          </motion.tr>
                                        ))}
                                      </tbody>
                                      <tfoot>
                                        <tr className="bg-red-50/50 font-semibold">
                                          <td className="py-3 px-4 text-gray-900" colSpan={2}>Total Balance</td>
                                          <td className="py-3 px-4 text-gray-700">
                                            Ksh {group.items.reduce((sum, item) => sum + (item.expectedAmount || 0), 0).toLocaleString()}
                                          </td>
                                          <td className="py-3 px-4 text-green-700">
                                            Ksh {group.totalPaid.toLocaleString()}
                                          </td>
                                          <td className="py-3 px-4 text-red-700" colSpan={2}>
                                            Ksh {group.totalArrears.toLocaleString()}
                                          </td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-900 font-medium text-lg">No Arrears Found</p>
                      <p className="text-gray-600 mt-2">
                        All tenants are up to date with their payments!
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium">Failed to load arrears data</p>
                  <Button onClick={fetchArrearsData} className="mt-4">
                    Retry
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-heading-color">Payment Report</h2>
                </div>
                <Button
                  onClick={handleOpenExportModal}
                  disabled={exporting}
                  className="px-6 py-2.5 bg-primary text-white hover:bg-primary/90 transition-all duration-300 shadow-md rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Export to Excel
                  </span>
                </Button>
              </div>

              {/* Report Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="text-sm font-medium text-green-700 mb-2">Total Income</div>
                  <div className="text-2xl font-bold text-green-900">
                    Ksh {totals.totalIncome.toLocaleString()}
                  </div>
                </div>
                <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="text-sm font-medium text-blue-700 mb-2">Total Commissions</div>
                  <div className="text-2xl font-bold text-blue-900">
                    Ksh {totals.totalCommissions.toLocaleString()}
                  </div>
                </div>
                <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="text-sm font-medium text-purple-700 mb-2">Net Income</div>
                  <div className="text-2xl font-bold text-purple-900">
                    Ksh {(totals.totalIncome - totals.totalCommissions).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-6">
                {/* Tenants & Units Overview */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Units & Tenants</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Unit</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            Tenant
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            Monthly Rent
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            Service Charge
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {property.units && property.units.length > 0 ? (
                          property.units.map((unit, index) => (
                            <motion.tr
                              key={unit.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-3 px-4">
                                <div className="font-medium text-gray-900">
                                  {unit.type || 'Unit'}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {[
                                    unit.bedrooms !== undefined && `${unit.bedrooms} bed`,
                                    unit.bathrooms !== undefined && `${unit.bathrooms} bath`,
                                  ]
                                    .filter(Boolean)
                                    .join(' • ') || 'N/A'}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {unit.tenant ? (
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {unit.tenant.fullName}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {unit.tenant.contact}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 font-medium">Vacant</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-gray-900">
                                  Ksh {unit.rentAmount.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {unit.tenant?.serviceCharge ? (
                                  <div className="text-sm text-gray-900">
                                    {unit.tenant.serviceCharge.type === 'PERCENTAGE' && (
                                      <span>{unit.tenant.serviceCharge.percentage}%</span>
                                    )}
                                    {unit.tenant.serviceCharge.type === 'FIXED' && (
                                      <span>
                                        Ksh{' '}
                                        {unit.tenant.serviceCharge.fixedAmount?.toLocaleString()}
                                      </span>
                                    )}
                                    {unit.tenant.serviceCharge.type === 'PER_SQ_FT' && (
                                      <span>
                                        Ksh {unit.tenant.serviceCharge.perSqFtRate}/sq ft
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                    unit.status === 'OCCUPIED'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {unit.status}
                                </span>
                              </td>
                            </motion.tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center">
                              <p className="text-gray-900 font-medium">No units found</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Service Providers */}
                {property.serviceProviders && property.serviceProviders.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Service Providers</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Provider
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Service
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Contact
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Charge
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                              Frequency
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {property.serviceProviders.map((provider, index) => (
                            <motion.tr
                              key={provider.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-3 px-4">
                                <div className="font-medium text-gray-900">{provider.name}</div>
                              </td>
                              <td className="py-3 px-4 text-gray-900">
                                {provider.serviceContract || '-'}
                              </td>
                              <td className="py-3 px-4 text-gray-900">
                                {provider.contact || '-'}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-red-600">
                                  Ksh {provider.chargeAmount.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                  {provider.chargeFrequency}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}