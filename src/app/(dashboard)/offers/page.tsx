'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { offerLettersAPI } from '@/lib/api';
import type { OfferLetter, OfferStatus } from '@/types';
import OfferLetterForm from '@/components/forms/OfferLetterForm';

export default function OffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<OfferStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const data = await offerLettersAPI.getAll();
      setOffers(data);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async (offerId: string) => {
    try {
      const result = await offerLettersAPI.generatePDF(offerId);
      alert('PDF generated successfully!');
      fetchOffers(); // Refresh to show updated offer with PDF URL
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleDownloadPDF = async (offerId: string, offerNumber: string) => {
    try {
      const blob = await offerLettersAPI.downloadPDF(offerId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Offer-Letter-${offerNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleStatusChange = async (offerId: string, newStatus: OfferStatus) => {
    try {
      await offerLettersAPI.updateStatus(offerId, newStatus);
      alert('Status updated successfully!');
      fetchOffers();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer letter?')) return;

    try {
      await offerLettersAPI.delete(offerId);
      alert('Offer letter deleted successfully!');
      fetchOffers();
    } catch (error) {
      console.error('Failed to delete offer:', error);
      alert('Failed to delete offer letter. Please try again.');
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

  const filteredOffers = offers.filter(offer => {
    const matchesStatus = filterStatus === 'ALL' || offer.status === filterStatus;
    const matchesSearch = 
      offer.offerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.lead?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.property?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: offers.length,
    draft: offers.filter(o => o.status === 'DRAFT').length,
    sent: offers.filter(o => o.status === 'SENT').length,
    accepted: offers.filter(o => o.status === 'ACCEPTED').length,
    rejected: offers.filter(o => o.status === 'REJECTED').length,
  };

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Offer Letters</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage offer letters for prospective tenants
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium shadow-sm"
        >
          + Create Offer Letter
        </button>
      </div>

      {/* Stats Cards */}
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
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
        </div>
      ) : filteredOffers.length === 0 ? (
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
            Get started by creating a new offer letter.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-6 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Create Offer Letter
          </button>
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
                        {offer.lead?.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {offer.lead?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {offer.property?.name}
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
                      KES {offer.rentAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={offer.status}
                        onChange={(e) => handleStatusChange(offer.id, e.target.value as OfferStatus)}
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(offer.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {!offer.documentUrl && (
                          <button
                            onClick={() => handleGeneratePDF(offer.id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            title="Generate PDF"
                          >
                            Generate
                          </button>
                        )}
                        {offer.documentUrl && (
                          <button
                            onClick={() => handleDownloadPDF(offer.id, offer.offerNumber)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                            title="Download PDF"
                          >
                            Download
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(offer.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Delete"
                        >
                          Delete
                        </button>
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