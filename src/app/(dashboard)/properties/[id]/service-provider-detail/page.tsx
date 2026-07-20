'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ServiceProvider, ServiceProviderAttachmentWithUrls } from '@/types';
import { serviceProvidersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatFileSize, getFileIcon, isPreviewable, isExpired, getExpiryStatus, getDaysUntilExpiry } from '@/utils/attachmentHelpers';
import { Eye, Download, Trash2, Loader2, FileIcon, Upload, X, ChevronDown, ChevronUp, Edit, Save, AlertCircle, Building2, Phone, FileText, Calendar, MapPin, User, Briefcase } from 'lucide-react';
import ServiceProviderForm from '@/components/forms/ServiceProviderForm';

export default function ServiceProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [attachments, setAttachments] = useState<ServiceProviderAttachmentWithUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAllAttachments, setShowAllAttachments] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [uploadMetadata, setUploadMetadata] = useState({
    description: '',
    category: '',
    expiryDate: '',
    version: ''
  });
  const [showUploadForm, setShowUploadForm] = useState(false);

  const providerId = params.id as string;

  useEffect(() => {
    fetchProvider();
    fetchAttachments();
  }, [providerId]);

  const fetchProvider = async () => {
    try {
      const data = await serviceProvidersAPI.getById(providerId);
      setProvider(data);
    } catch (error) {
      console.error('Error fetching service provider:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async () => {
    try {
      setAttachmentsLoading(true);
      const data = await serviceProvidersAPI.getAttachments(providerId);
      setAttachments(data);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      await serviceProvidersAPI.uploadAttachment(providerId, selectedFile, uploadMetadata);
      setSelectedFile(null);
      setUploadMetadata({
        description: '',
        category: '',
        expiryDate: '',
        version: ''
      });
      setShowUploadForm(false);
      await fetchAttachments();
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload attachment. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    
    try {
      setDeletingId(attachmentId);
      await serviceProvidersAPI.deleteAttachment(attachmentId);
      await fetchAttachments();
      toast.success('Attachment deleted successfully!');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete attachment. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreview = (attachmentId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to preview files');
      return;
    }

    const previewUrl = `/api/service-providers/attachments/${attachmentId}/preview?token=${encodeURIComponent(token)}`;
    window.open(previewUrl, '_blank');
  };

  const handleDownload = async (attachmentId: string, fileName: string) => {
    try {
      setDownloadingId(attachmentId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to download files');
        return;
      }

      const downloadUrl = `/api/service-providers/attachments/${attachmentId}/download?token=${encodeURIComponent(token)}`;
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
          return;
        }
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download attachment. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    fetchProvider();
    toast.success('Service provider updated successfully!');
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
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

  const getExpiryStatusBadge = (attachment: ServiceProviderAttachmentWithUrls) => {
    const status = getExpiryStatus(attachment);
    const days = getDaysUntilExpiry(attachment);
    
    switch (status) {
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
            Expired
          </span>
        );
      case 'EXPIRING_SOON':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span>
            Expires in {days} days
          </span>
        );
      case 'VALID':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
            Valid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            No expiry
          </span>
        );
    }
  };

  // Toast helper
  const toast = {
    success: (msg: string) => console.log('✅', msg),
    error: (msg: string) => console.error('❌', msg),
    info: (msg: string) => console.info('ℹ️', msg),
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
          <p className="text-lg font-medium text-gray-800">Loading service provider details...</p>
        </motion.div>
      </div>
    );
  }

  if (!provider) {
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Provider Not Found</h2>
        <p className="text-gray-700 mb-6">The service provider you're looking for doesn't exist.</p>
        <Button onClick={() => router.back()}>
          Go Back
        </Button>
      </motion.div>
    );
  }

  // Get attachments to display (all or just first 4)
  const displayedAttachments = showAllAttachments ? attachments : attachments.slice(0, 4);
  const hasMoreAttachments = attachments.length > 4;

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
          className="group px-6 py-3 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-all duration-300 shadow-sm hover:shadow-md rounded-lg"
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
        className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b-2 border-gray-200"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-16 h-16 bg-linear-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/20"
          >
            <Building2 className="w-8 h-8 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{provider.name}</h1>
            <p className="text-gray-600 flex items-center gap-2 mt-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              ID: {provider.id}
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          {!showEditForm && (
            <Button
              onClick={() => setShowEditForm(true)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Edit className="w-4 h-4" />
              Edit Provider
            </Button>
          )}
          <Button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            {showUploadForm ? (
              <>
                <X className="w-4 h-4" />
                Cancel Upload
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Edit Form - Inline */}
      {showEditForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-blue-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit Service Provider
            </h2>
            <Button
              variant="secondary"
              onClick={handleEditCancel}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
          <ServiceProviderForm
            serviceProvider={provider}
            onSuccess={handleEditSuccess}
            onCancel={handleEditCancel}
          />
        </motion.div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 text-gray-900"
              />
            </div>
            {selectedFile && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900">Selected: {selectedFile.name}</p>
                <p className="text-xs text-gray-600">{formatFileSize(selectedFile.size)}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  placeholder="Document description"
                  value={uploadMetadata.description}
                  onChange={(e) => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={uploadMetadata.category}
                  onChange={(e) => setUploadMetadata(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white"
                >
                  <option value="" className="text-gray-400">Select category</option>
                  <option value="CONTRACT" className="text-gray-900">Contract</option>
                  <option value="CERTIFICATE" className="text-gray-900">Certificate</option>
                  <option value="INVOICE" className="text-gray-900">Invoice</option>
                  <option value="LICENSE" className="text-gray-900">License</option>
                  <option value="INSURANCE" className="text-gray-900">Insurance</option>
                  <option value="OTHER" className="text-gray-900">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                <input
                  type="date"
                  value={uploadMetadata.expiryDate}
                  onChange={(e) => setUploadMetadata(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
                <input
                  type="text"
                  placeholder="e.g., v1, v2"
                  value={uploadMetadata.version}
                  onChange={(e) => setUploadMetadata(prev => ({ ...prev, version: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowUploadForm(false)}
                className="px-6 py-2.5 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Show provider details only when not editing */}
      {!showEditForm && (
        <>
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Information */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -2 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Provider Details</h2>
              </div>
              <dl className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <dt className="text-sm font-semibold text-gray-600 mb-1">Provider Name</dt>
                    <dd className="text-sm text-gray-900 font-medium">{provider.name}</dd>
                  </div>
                </div>
                {provider.contact && (
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <dt className="text-sm font-semibold text-gray-600 mb-1">Contact</dt>
                      <dd className="text-sm text-gray-900 font-medium">{provider.contact}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </motion.div>

            {/* Contract Information */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -2 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Contract Information</h2>
              </div>
              <dl className="space-y-4">
                {provider.contractPeriod && (
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <dt className="text-sm font-semibold text-gray-600 mb-1">Contract Period</dt>
                      <dd className="text-sm text-gray-900 font-medium">{provider.contractPeriod}</dd>
                    </div>
                  </div>
                )}
                {provider.serviceContract && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Service Contract Details</p>
                    <p className="text-sm text-gray-900 leading-relaxed">{provider.serviceContract}</p>
                  </div>
                )}
              </dl>
            </motion.div>

            {/* Property Information */}
            {provider.property && (
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow lg:col-span-2"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-700" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Property Information</h2>
                </div>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <Building2 className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <dt className="text-sm font-semibold text-gray-600 mb-1">Property Name</dt>
                      <dd className="text-sm text-gray-900 font-medium">{provider.property.name}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <dt className="text-sm font-semibold text-gray-600 mb-1">Address</dt>
                      <dd className="text-sm text-gray-900">{provider.property.address}</dd>
                    </div>
                  </div>
                </dl>
              </motion.div>
            )}
          </div>

          {/* Attachments Section - Scrollable */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FileIcon className="w-5 h-5 text-emerald-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Attachments</h2>
                <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
                  {attachments.length}
                </span>
              </div>
              <div className="flex gap-2">
                {hasMoreAttachments && (
                  <Button
                    onClick={() => setShowAllAttachments(!showAllAttachments)}
                    variant="secondary"
                    className="px-4 py-2 text-sm flex items-center gap-1 text-gray-700 hover:text-gray-900"
                  >
                    {showAllAttachments ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show All ({attachments.length})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {attachmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : attachments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                  <FileIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-700">No attachments found</p>
                <p className="text-sm text-gray-500 mt-1">Upload documents to get started</p>
              </div>
            ) : (
              <div className={`max-h-100 overflow-y-auto pr-2 ${hasMoreAttachments && !showAllAttachments ? 'scrollbar-thin' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{getFileIcon(attachment.fileType)}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate" title={attachment.fileName}>
                            {attachment.fileName}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-600">
                              {formatFileSize(attachment.fileSize)}
                            </span>
                            {attachment.category && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                {attachment.category}
                              </span>
                            )}
                            {getExpiryStatusBadge(attachment)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isPreviewable(attachment.fileType) && (
                          <button
                            onClick={() => handlePreview(attachment.id)}
                            disabled={previewingId === attachment.id}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Preview"
                          >
                            {previewingId === attachment.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(attachment.id, attachment.fileName)}
                          disabled={downloadingId === attachment.id}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Download"
                        >
                          {downloadingId === attachment.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Download className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          disabled={deletingId === attachment.id}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === attachment.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {hasMoreAttachments && !showAllAttachments && attachments.length > 4 && (
                  <div className="mt-4 text-center">
                    <Button
                      onClick={() => setShowAllAttachments(true)}
                      variant="secondary"
                      className="px-6 py-2 text-sm text-gray-700 hover:text-gray-900"
                    >
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show {attachments.length - 4} More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Additional Information Section - Service Agreement */}
          {provider.serviceContract && (
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -2 }}
              className="bg-linear-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-lg border border-blue-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Service Agreement</h2>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-100 shadow-inner">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {provider.serviceContract}
                </p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}