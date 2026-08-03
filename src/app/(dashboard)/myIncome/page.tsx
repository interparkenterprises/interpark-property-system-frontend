'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { commissionsAPI } from '@/lib/api';
import { ManagerCommission, CommissionStats, GenerateCommissionInvoiceRequest } from '@/types';

// =============================================
// SKELETON LOADING COMPONENT
// =============================================
const TableSkeleton = () => (
  <div className="overflow-x-auto animate-pulse">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {[1,2,3,4,5,6,7,8].map(i => (
            <th key={i} className="px-6 py-3">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {[1,2,3,4,5].map(i => (
          <tr key={i}>
            {[1,2,3,4,5,6,7,8].map(j => (
              <td key={j} className="px-6 py-4">
                <div className="h-4 bg-gray-100 rounded w-24"></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// =============================================
// MAIN PAGE COMPONENT
// =============================================
export default function MyIncomePage() {
  const { user } = useAuth();
  const [incomeData, setIncomeData] = useState<{
    commissions: ManagerCommission[];
    stats: CommissionStats | null;
    loading: boolean;
    error: string | null;
  }>({
    commissions: [],
    stats: null,
    loading: true,
    error: null,
  });
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'pending' | 'paid' | 'processing'>('all');
  const [updatingCommission, setUpdatingCommission] = useState<string | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedCommissionForInvoice, setSelectedCommissionForInvoice] = useState<string | null>(null);
  const [invoiceFormData, setInvoiceFormData] = useState<InvoiceFormData>({
    description: '',
    vatRate: 16,
    bankName: '',
    accountName: '',
    accountNumber: '',
    branch: '',
    bankCode: '',
    swiftCode: '',
    currency: 'KES',
  });

  interface InvoiceFormData {
    description: string;
    vatRate: number;
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
    bankCode: string;
    swiftCode: string;
    currency: string;
  }

  const INVOICE_FORM_STORAGE_KEY = 'invoiceFormData';

  // Load saved form data from localStorage
  useEffect(() => {
    const savedFormData = localStorage.getItem(INVOICE_FORM_STORAGE_KEY);
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setInvoiceFormData(prev => ({
          ...prev,
          ...parsedData,
          description: '',
        }));
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, []);

  // Save form data to localStorage
  useEffect(() => {
    if (showInvoiceModal) {
      localStorage.setItem(INVOICE_FORM_STORAGE_KEY, JSON.stringify(invoiceFormData));
    }
  }, [invoiceFormData, showInvoiceModal]);

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchIncomeData(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch data when period changes
  useEffect(() => {
    if (user?.id && !incomeData.loading) {
      fetchIncomeData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const fetchIncomeData = async (showFullLoading: boolean = true) => {
    try {
      if (showFullLoading) {
        setIncomeData(prev => ({ ...prev, loading: true, error: null }));
      } else {
        setTableLoading(true);
      }
      
      console.log('Fetching income data for manager:', user!.id);
      
      const [commissionsResponse, statsResponse] = await Promise.all([
        commissionsAPI.getManagerCommissions(user!.id),
        commissionsAPI.getCommissionStats(user!.id)
      ]);

      console.log('Commissions response:', commissionsResponse);
      console.log('Stats response:', statsResponse);

      const commissionsArray = commissionsResponse?.data || [];
      
      // Filter commissions based on selected period
      let filteredCommissions = commissionsArray;
      if (selectedPeriod === 'pending') {
        filteredCommissions = commissionsArray.filter(commission => 
          commission.status === 'PENDING'
        );
      } else if (selectedPeriod === 'processing') {
        filteredCommissions = commissionsArray.filter(commission => 
          commission.status === 'PROCESSING'
        );
      } else if (selectedPeriod === 'paid') {
        filteredCommissions = commissionsArray.filter(commission => 
          commission.status === 'PAID'
        );
      }

      setIncomeData({
        commissions: filteredCommissions,
        stats: statsResponse,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching income data:', error);
      setIncomeData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch income data'
      }));
    } finally {
      setTableLoading(false);
    }
  };

  // Handlers (unchanged)
  const handleMarkAsProcessing = async (commissionId: string) => {
    try {
      setUpdatingCommission(commissionId);
      await commissionsAPI.markAsProcessing(commissionId);
      await fetchIncomeData(false);
    } catch (error) {
      console.error('Error marking commission as processing:', error);
      alert(error instanceof Error ? error.message : 'Failed to update commission status');
    } finally {
      setUpdatingCommission(null);
    }
  };

  const handleMarkAsPaid = async (commissionId: string) => {
    try {
      setUpdatingCommission(commissionId);
      await commissionsAPI.markAsPaid(commissionId);
      await fetchIncomeData(false);
    } catch (error) {
      console.error('Error marking commission as paid:', error);
      alert(error instanceof Error ? error.message : 'Failed to update commission status');
    } finally {
      setUpdatingCommission(null);
    }
  };

  const openInvoiceModal = (commissionId: string, commission: ManagerCommission) => {
    setSelectedCommissionForInvoice(commissionId);
    
    const savedFormData = localStorage.getItem(INVOICE_FORM_STORAGE_KEY);
    let baseData = invoiceFormData;
    
    if (savedFormData) {
      try {
        baseData = JSON.parse(savedFormData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
    
    setInvoiceFormData({
      ...baseData,
      description: `Management commission for ${commission.property?.name || 'property'} (${formatDate(commission.periodStart)} - ${formatDate(commission.periodEnd)})`,
      accountName: baseData.accountName || user?.name || '',
    });
    
    setShowInvoiceModal(true);
  };

  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setTimeout(() => {
      setSelectedCommissionForInvoice(null);
    }, 300);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedCommissionForInvoice) return;

    try {
      setGeneratingInvoice(selectedCommissionForInvoice);
      
      const requestData: GenerateCommissionInvoiceRequest = {
        description: invoiceFormData.description,
        vatRate: invoiceFormData.vatRate,
        bankName: invoiceFormData.bankName,
        accountName: invoiceFormData.accountName,
        accountNumber: invoiceFormData.accountNumber,
        branch: invoiceFormData.branch || undefined,
        bankCode: invoiceFormData.bankCode || undefined,
        swiftCode: invoiceFormData.swiftCode || undefined,
        currency: invoiceFormData.currency,
      };

      await commissionsAPI.generateCommissionInvoice(
        selectedCommissionForInvoice,
        requestData
      );

      alert('Invoice generated successfully!');
      closeInvoiceModal();
      await fetchIncomeData(false);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate invoice');
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const handleDownloadInvoice = async (commissionId: string) => {
    try {
      setDownloadingInvoice(commissionId);
      
      const blob = await commissionsAPI.downloadCommissionInvoice(commissionId);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `commission-invoice-${commissionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert(error instanceof Error ? error.message : 'Failed to download invoice');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      PAID: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      PROCESSING: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', label: status };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Loading and error states
  if (incomeData.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (incomeData.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">Error loading income data</div>
          <div className="text-gray-600 mb-4">{incomeData.error}</div>
          <button
            onClick={() => fetchIncomeData(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const commissionsToRender = Array.isArray(incomeData.commissions) ? incomeData.commissions : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Tabs */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Income</h1>
          <p className="text-gray-600 mt-2">
            Track your commission earnings and other income
          </p>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mt-6">
            <nav className="-mb-px flex space-x-8">
              
              <Link
                href="/myIncome"
                className="py-4 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600"
              >
                Commission History
              </Link>
              <Link
                href="/myIncome/other"
                className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Other Income
              </Link>
            </nav>
          </div>
        </div>

        {/* Stats Overview */}
        {incomeData.stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Earned</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(incomeData.stats.totalEarned)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(incomeData.stats.totalPending)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Processing</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(incomeData.stats.totalProcessing || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(incomeData.stats.totalPaid)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Commission List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">Commission History</h2>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedPeriod('all')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedPeriod === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedPeriod('pending')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedPeriod === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setSelectedPeriod('processing')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedPeriod === 'processing'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Processing
                </button>
                <button
                  onClick={() => setSelectedPeriod('paid')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedPeriod === 'paid'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Paid
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden">
            {tableLoading ? (
              <TableSkeleton />
            ) : commissionsToRender.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No commissions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedPeriod === 'all' 
                    ? "You don't have any commissions yet."
                    : `No ${selectedPeriod} commissions found.`
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Income Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission Rate
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissionsToRender.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {commission.property?.name || 'Unknown Property'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {commission.property?.address}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(commission.periodStart)} - {formatDate(commission.periodEnd)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(commission.incomeAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {commission.commissionFee}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            {formatCurrency(commission.commissionAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(commission.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {commission.paidDate ? formatDate(commission.paidDate) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-2">
                            {commission.status === 'PENDING' && (
                              <button
                                onClick={() => openInvoiceModal(commission.id, commission)}
                                disabled={generatingInvoice === commission.id}
                                className="inline-flex items-center px-2 py-1 border border-blue-600 text-xs font-medium rounded text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {generatingInvoice === commission.id ? 'Generating...' : 'Generate Invoice'}
                              </button>
                            )}
                            
                            {commission.status === 'PROCESSING' && (
                              <>
                                <button
                                  onClick={() => handleMarkAsPaid(commission.id)}
                                  disabled={updatingCommission === commission.id}
                                  className="inline-flex items-center px-2 py-1 border border-green-600 text-xs font-medium rounded text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {updatingCommission === commission.id ? 'Processing...' : 'Mark as Paid'}
                                </button>
                                <button
                                  onClick={() => handleDownloadInvoice(commission.id)}
                                  disabled={downloadingInvoice === commission.id}
                                  className="inline-flex items-center px-2 py-1 border border-green-600 text-xs font-medium rounded text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  {downloadingInvoice === commission.id ? 'Downloading...' : 'Download'}
                                </button>
                              </>
                            )}
                            
                            {commission.status === 'PAID' && (
                              <span className="text-gray-500 text-xs">Completed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Property Breakdown */}
        {incomeData.stats && incomeData.stats.commissionsByProperty && incomeData.stats.commissionsByProperty.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Commission by Property</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {incomeData.stats.commissionsByProperty.map((property) => (
                  <div key={property.propertyId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {property.propertyName}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(property.totalCommission)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Generation Modal (unchanged) */}
      {showInvoiceModal && (
        // ... (keep your existing modal code exactly as it is)
        <div>Modal content here (unchanged)</div>
      )}
    </div>
  );
}