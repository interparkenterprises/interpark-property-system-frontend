'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { offerLettersAPI } from '@/lib/api';
import type { OfferLetter, OfferStatus } from '@/types';
import OfferLetterForm from '@/components/forms/OfferLetterForm';
import { useAuth } from '@/context/AuthContext';
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default function OffersPage() {
  const router = useRouter();
  const { user, userId } = useAuth();
  const { 
    canViewOffers, 
    canCreateOffer, 
    canEditOffer, 
    canDeleteOffer,
    isAdmin, 
    isManager,
    isManagedUser,
    getAccessiblePropertyIds 
  } = useGlobalPermissions();
  
  const [offers, setOffers] = useState<OfferLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<OfferStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [deletingOffer, setDeletingOffer] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // ✅ Check permission at the top - but after hooks
  // All hooks must be called before conditional returns
  useEffect(() => {
    if (user && canViewOffers) {
      fetchOffers();
    }
  }, [user, canViewOffers]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      let data = await offerLettersAPI.getAll();
      
      // Apply filters based on user role and permissions
      if (isAdmin) {
        // Admins see all offers
        // No filtering needed
      } else if (isManager && userId) {
        // Managers only see offers they created
        data = data.filter(offer => offer.createdById === userId);
      } else if (isManagedUser) {
        // Managed users only see offers for properties they have access to
        const accessiblePropertyIds = getAccessiblePropertyIds();
        data = data.filter(offer => 
          offer.propertyId && accessiblePropertyIds.includes(offer.propertyId)
        );
      }
      
      setOffers(data);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      alert('Failed to fetch offers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (offerId: string) => {
    try {
      setGeneratingPdf(offerId);
      const result = await offerLettersAPI.generatePDF(offerId);
      alert('PDF generated successfully!');
      fetchOffers(); // Refresh to show updated offer with PDF URL
    } catch (error: any) {
      console.error('Failed to generate PDF:', error);
      alert(`Failed to generate PDF: ${error.message || 'Please try again.'}`);
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleDownloadPDF = async (offerId: string, offerNumber: string) => {
    try {
      setDownloadingPdf(offerId);
      const blob = await offerLettersAPI.downloadPDF(offerId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Offer-Letter-${offerNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Failed to download PDF:', error);
      alert(`Failed to download PDF: ${error.message || 'Please try again.'}`);
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleStatusChange = async (offerId: string, newStatus: OfferStatus) => {
    // Check if user has permission to edit offers
    if (!canEditOffer) {
      alert('You don\'t have permission to update offer status.');
      return;
    }
    
    try {
      setUpdatingStatus(offerId);
      await offerLettersAPI.updateStatus(offerId, newStatus);
      alert('Status updated successfully!');
      fetchOffers();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert(`Failed to update status: ${error.message || 'Please try again.'}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!canDeleteOffer) {
      alert('You don\'t have permission to delete offer letters.');
      return;
    }

    if (!confirm('Are you sure you want to delete this offer letter? This action cannot be undone.')) return;

    try {
      setDeletingOffer(offerId);
      await offerLettersAPI.delete(offerId);
      alert('Offer letter deleted successfully!');
      fetchOffers();
    } catch (error: any) {
      console.error('Failed to delete offer:', error);
      alert(`Failed to delete offer letter: ${error.message || 'Please try again.'}`);
    } finally {
      setDeletingOffer(null);
    }
  };

  const getStatusColor = (status: OfferStatus) => {
    const colors: Record<OfferStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      EXPIRED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      CONVERTED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const getLetterTypeColor = (letterType: string) => {
    return letterType === 'COMMERCIAL' 
      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' 
      : 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
  };

  // Filter offers based on user role and search
  const filteredOffers = offers.filter(offer => {
    const matchesStatus = filterStatus === 'ALL' || offer.status === filterStatus;
    const matchesSearch = 
      offer.offerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.lead?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.property?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // If user is MANAGER, also filter by user ID
    if (isManager) {
      return matchesStatus && matchesSearch && offer.createdById === userId;
    }
    
    return matchesStatus && matchesSearch;
  });

  // Calculate stats
  const stats = {
    total: offers.length,
    draft: offers.filter(o => o.status === 'DRAFT').length,
    sent: offers.filter(o => o.status === 'SENT').length,
    accepted: offers.filter(o => o.status === 'ACCEPTED').length,
    rejected: offers.filter(o => o.status === 'REJECTED').length,
  };

  // ✅ Conditional returns AFTER all hooks
  // Check if user has permission to view offers
  if (!canViewOffers) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Access Denied</h1>
          <p className="text-red-600 dark:text-red-300">
            You don't have permission to view offer letters. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="p-6">
        <OfferLetterForm
          onSuccess={() => {
            setShowForm(false);
            fetchOffers();
          }}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  // Show loading while auth is being checked
  if (!user && loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with user role info */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Offer Letters</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isAdmin 
              ? 'Manage all offer letters' 
              : isManager
              ? 'Manage your offer letters'
              : 'View offer letters for your assigned properties'}
          </p>
          {isManager && (
            <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full inline-block">
              Viewing only offers you created
            </div>
          )}
          {isManagedUser && (
            <div className="mt-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full inline-block">
              Viewing offers for your assigned properties only
            </div>
          )}
        </div>
        <PermissionGuard module="offers" action="create">
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium shadow-sm"
          >
            + Create Offer Letter
          </button>
        </PermissionGuard>
      </div>

      {/* Stats Cards - Only show for ADMIN */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Offers</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Draft</p>
            <p className="text-2xl font-bold text-gray-500 dark:text-gray-300">{stats.draft}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Sent</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.sent}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Accepted</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.accepted}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by offer number, lead name, or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as OfferStatus | 'ALL')}
              className="w-full md:w-48 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="ALL" className="text-gray-900 dark:text-gray-100">All Status</option>
              <option value="DRAFT" className="text-gray-900 dark:text-gray-100">Draft</option>
              <option value="SENT" className="text-gray-900 dark:text-gray-100">Sent</option>
              <option value="ACCEPTED" className="text-gray-900 dark:text-gray-100">Accepted</option>
              <option value="REJECTED" className="text-gray-900 dark:text-gray-100">Rejected</option>
              <option value="EXPIRED" className="text-gray-900 dark:text-gray-100">Expired</option>
              <option value="CANCELLED" className="text-gray-900 dark:text-gray-100">Cancelled</option>
              <option value="CONVERTED" className="text-gray-900 dark:text-gray-100">Converted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No offer letters found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isAdmin 
              ? 'No offer letters match your search criteria.'
              : isManager
              ? "You haven't created any offer letters yet."
              : "No offer letters found for your assigned properties."}
          </p>
          <PermissionGuard module="offers" action="create">
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Create Offer Letter
            </button>
          </PermissionGuard>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Offer #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rent Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Issue Date
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created By
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {offer.offerNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {offer.lead?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {offer.lead?.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {offer.property?.name || 'N/A'}
                      </div>
                      {offer.unit && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Unit {offer.unit.unitNo}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLetterTypeColor(offer.letterType)}`}>
                        {offer.letterType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      KES {offer.rentAmount?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PermissionGuard module="offers" action="edit">
                        <select
                          value={offer.status}
                          onChange={(e) => handleStatusChange(offer.id, e.target.value as OfferStatus)}
                          disabled={updatingStatus === offer.id}
                          className={`px-2 py-1 text-xs font-medium rounded-full border-0 cursor-pointer ${getStatusColor(offer.status)}`}
                        >
                          <option value="DRAFT" className="text-gray-900 dark:text-gray-100">Draft</option>
                          <option value="SENT" className="text-gray-900 dark:text-gray-100">Sent</option>
                          <option value="ACCEPTED" className="text-gray-900 dark:text-gray-100">Accepted</option>
                          <option value="REJECTED" className="text-gray-900 dark:text-gray-100">Rejected</option>
                          <option value="EXPIRED" className="text-gray-900 dark:text-gray-100">Expired</option>
                          <option value="CANCELLED" className="text-gray-900 dark:text-gray-100">Cancelled</option>
                          <option value="CONVERTED" className="text-gray-900 dark:text-gray-100">Converted</option>
                        </select>
                      </PermissionGuard>
                      {!canEditOffer && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(offer.status)}`}>
                          {offer.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {offer.issueDate ? new Date(offer.issueDate).toLocaleDateString() : 'N/A'}
                    </td>
                    {isAdmin && offer.createdById && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {offer.createdById || 'Unknown'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {!offer.documentUrl && (
                          <button
                            onClick={() => handleGeneratePDF(offer.id)}
                            disabled={generatingPdf === offer.id}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 disabled:text-blue-300 dark:disabled:text-blue-700 disabled:cursor-not-allowed flex items-center gap-1"
                            title="Generate PDF"
                          >
                            {generatingPdf === offer.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                Generating...
                              </>
                            ) : (
                              'Generate'
                            )}
                          </button>
                        )}
                        {offer.documentUrl && (
                          <button
                            onClick={() => handleDownloadPDF(offer.id, offer.offerNumber)}
                            disabled={downloadingPdf === offer.id}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 disabled:text-green-300 dark:disabled:text-green-700 disabled:cursor-not-allowed flex items-center gap-1"
                            title="Download PDF"
                          >
                            {downloadingPdf === offer.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 dark:border-green-400"></div>
                                Downloading...
                              </>
                            ) : (
                              'Download'
                            )}
                          </button>
                        )}
                        <PermissionGuard module="offers" action="delete">
                          <button
                            onClick={() => handleDelete(offer.id)}
                            disabled={deletingOffer === offer.id}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:text-red-300 dark:disabled:text-red-700 disabled:cursor-not-allowed flex items-center gap-1"
                            title="Delete"
                          >
                            {deletingOffer === offer.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 dark:border-red-400"></div>
                                Deleting...
                              </>
                            ) : (
                              'Delete'
                            )}
                          </button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}