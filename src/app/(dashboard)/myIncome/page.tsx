'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { commissionsAPI } from '@/lib/api';
import { ManagerCommission, CommissionStats, GenerateCommissionInvoiceRequest } from '@/types';

interface IncomeData {
  commissions: ManagerCommission[];
  stats: CommissionStats | null;
  loading: boolean;
  error: string | null;
}

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

export default function MyIncomePage() {
  const { user } = useAuth();
  const [incomeData, setIncomeData] = useState<IncomeData>({
    commissions: [],
    stats: null,
    loading: true,
    error: null,
  });
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

  useEffect(() => {
    if (user?.id) {
      fetchIncomeData();
    }
  }, [user, selectedPeriod]);

  const fetchIncomeData = async () => {
    try {
      setIncomeData(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('Fetching income data for manager:', user!.id);
      
      const [commissionsResponse, statsResponse] = await Promise.all([
        commissionsAPI.getManagerCommissions(user!.id),
        commissionsAPI.getCommissionStats(user!.id)
      ]);

      console.log('Commissions response:', commissionsResponse);
      console.log('Stats response:', statsResponse);

      // Handle the data structure - extract commissions from the response
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
    }
  };

  const handleMarkAsProcessing = async (commissionId: string) => {
    try {
      setUpdatingCommission(commissionId);
      await commissionsAPI.markAsProcessing(commissionId);
      await fetchIncomeData(); // Refresh data
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
      await fetchIncomeData(); // Refresh data
    } catch (error) {
      console.error('Error marking commission as paid:', error);
      alert(error instanceof Error ? error.message : 'Failed to update commission status');
    } finally {
      setUpdatingCommission(null);
    }
  };

  const openInvoiceModal = (commissionId: string, commission: ManagerCommission) => {
    setSelectedCommissionForInvoice(commissionId);
    
    // Pre-fill form data with sensible defaults
    setInvoiceFormData({
      description: `Management commission for ${commission.property?.name || 'property'} (${formatDate(commission.periodStart)} - ${formatDate(commission.periodEnd)})`,
      vatRate: 16,
      bankName: '',
      accountName: user?.name || '',
      accountNumber: '',
      branch: '',
      bankCode: '',
      swiftCode: '',
      currency: 'KES',
    });
    
    setShowInvoiceModal(true);
  };

  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedCommissionForInvoice(null);
    setInvoiceFormData({
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

      const response = await commissionsAPI.generateCommissionInvoice(
        selectedCommissionForInvoice,
        requestData
      );

      alert('Invoice generated successfully!');
      closeInvoiceModal();
      await fetchIncomeData(); // Refresh data
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
      
      // Create a download link
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

  // Debug: Log the current state
  useEffect(() => {
    console.log('Current incomeData:', incomeData);
  }, [incomeData]);

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
            onClick={fetchIncomeData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Additional safety check before rendering
  const commissionsToRender = Array.isArray(incomeData.commissions) ? incomeData.commissions : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Income</h1>
          <p className="text-gray-600 mt-2">
            Track your commission earnings from managed properties
          </p>
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
            {commissionsToRender.length === 0 ? (
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
                            {/* Show different buttons based on status */}
                            {commission.status === 'PENDING' && (
                              <div className="flex space-x-2">
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
                              </div>
                            )}
                            
                            {commission.status === 'PROCESSING' && (
                              <div className="flex space-x-2">
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
                              </div>
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

      {/* Invoice Generation Modal */}
      {showInvoiceModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeInvoiceModal}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                      Generate Commission Invoice
                    </h3>
                    
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Description *
                        </label>
                        <textarea
                          id="description"
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={invoiceFormData.description}
                          onChange={(e) => setInvoiceFormData({ ...invoiceFormData, description: e.target.value })}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="vatRate" className="block text-sm font-medium text-gray-700">
                            VAT Rate (%)
                          </label>
                          <input
                            type="number"
                            id="vatRate"
                            step="0.01"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={invoiceFormData.vatRate}
                            onChange={(e) => setInvoiceFormData({ ...invoiceFormData, vatRate: parseFloat(e.target.value) })}
                          />
                        </div>

                        <div>
                          <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                            Currency
                          </label>
                          <input
                            type="text"
                            id="currency"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={invoiceFormData.currency}
                            onChange={(e) => setInvoiceFormData({ ...invoiceFormData, currency: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                          Bank Name *
                        </label>
                        <input
                          type="text"
                          id="bankName"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={invoiceFormData.bankName}
                          onChange={(e) => setInvoiceFormData({ ...invoiceFormData, bankName: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                          Account Name *
                        </label>
                        <input
                          type="text"
                          id="accountName"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={invoiceFormData.accountName}
                          onChange={(e) => setInvoiceFormData({ ...invoiceFormData, accountName: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                          Account Number *
                        </label>
                        <input
                          type="text"
                          id="accountNumber"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={invoiceFormData.accountNumber}
                          onChange={(e) => setInvoiceFormData({ ...invoiceFormData, accountNumber: e.target.value })}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                            Branch
                          </label>
                          <input
                            type="text"
                            id="branch"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={invoiceFormData.branch}
                            onChange={(e) => setInvoiceFormData({ ...invoiceFormData, branch: e.target.value })}
                          />
                        </div>

                        <div>
                          <label htmlFor="bankCode" className="block text-sm font-medium text-gray-700">
                            Bank Code
                          </label>
                          <input
                            type="text"
                            id="bankCode"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={invoiceFormData.bankCode}
                            onChange={(e) => setInvoiceFormData({ ...invoiceFormData, bankCode: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="swiftCode" className="block text-sm font-medium text-gray-700">
                          SWIFT Code
                        </label>
                        <input
                          type="text"
                          id="swiftCode"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={invoiceFormData.swiftCode}
                          onChange={(e) => setInvoiceFormData({ ...invoiceFormData, swiftCode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleGenerateInvoice}
                  disabled={!invoiceFormData.description || !invoiceFormData.bankName || !invoiceFormData.accountName || !invoiceFormData.accountNumber || generatingInvoice !== null}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
                </button>
                <button
                  type="button"
                  onClick={closeInvoiceModal}
                  disabled={generatingInvoice !== null}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}