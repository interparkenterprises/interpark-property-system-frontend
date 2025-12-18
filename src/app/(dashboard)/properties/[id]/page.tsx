'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Property, Unit, ServiceProvider, Tenant, DailyReport, ActivationRequest  } from '@/types';
import { propertiesAPI, unitsAPI, serviceProvidersAPI, tenantsAPI, dailyReportsAPI, activationsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import PropertyForm from '@/components/forms/PropertyForm';
import UnitForm from '@/components/forms/UnitForm';
import ServiceProviderForm from '@/components/forms/ServiceProviderForm';
import TenantForm from '@/components/forms/TenantForm';
import DailyReportForm from '@/components/forms/DailyReportForm';
import ActivationForm from '@/components/forms/ActivationForm';
import Image from 'next/image';

type TabType = 'overview' | 'units' | 'tenants' | 'providers' | 'reports' | 'activations';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [deletingProviderId, setDeletingProviderId] = useState<string | null>(null);
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenantId, setDeletingTenantId] = useState<string | null>(null);
  const [propertyTenants, setPropertyTenants] = useState<Tenant[]>([]);
  const [propertyImageUrl, setPropertyImageUrl] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Daily Reports state
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  // Activation Forms state
  const [showActivationForm, setShowActivationForm] = useState(false);
  const [editingActivation, setEditingActivation] = useState<ActivationRequest | null>(null);
  const [activationRequests, setActivationRequests] = useState<ActivationRequest[]>([]);
  const [activationsLoading, setActivationsLoading] = useState(false);
  const [deletingActivationId, setDeletingActivationId] = useState<string | null>(null);

  const propertyId = params.id as string;

  useEffect(() => {
    fetchProperty();
    fetchPropertyTenants();
    fetchPropertyImage();
    fetchDailyReports();
    fetchActivations(); 
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const data = await propertiesAPI.getById(propertyId);
      setProperty(data);
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyImage = async () => {
    try {
      setImageLoading(true);
      const imageBlob = await propertiesAPI.getPropertyImage(propertyId);
      const imageUrl = URL.createObjectURL(imageBlob);
      setPropertyImageUrl(imageUrl);
    } catch (error) {
      console.error('Error fetching property image:', error);
      setPropertyImageUrl(null);
    } finally {
      setImageLoading(false);
    }
  };

  const fetchPropertyTenants = async () => {
    try {
      const allTenants = await tenantsAPI.getAll();
      const filteredTenants = allTenants.filter(
        tenant => tenant.unit && tenant.unit.propertyId === propertyId
      );
      setPropertyTenants(filteredTenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchDailyReports = async () => {
    try {
      setReportsLoading(true);
      const response = await dailyReportsAPI.getByProperty(propertyId, {
        page: 1,
        limit: 50
      });
      setDailyReports(response.data);
    } catch (error) {
      console.error('Error fetching daily reports:', error);
    } finally {
      setReportsLoading(false);
    }
  };
  const fetchActivations = async () => {
    try {
      setActivationsLoading(true);
      // Use getAll with propertyId filter instead of getByProperty
      const response = await activationsAPI.getAll({
        propertyId: propertyId,
        page: 1,
        limit: 50
      });
      setActivationRequests(response.data);
    } catch (error) {
      console.error('Error fetching activation requests:', error);
    } finally {
      setActivationsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this property?')) {
      try {
        await propertiesAPI.delete(propertyId);
        router.push('/properties');
      } catch (error) {
        console.error('Error deleting property:', error);
      }
    }
  };

  const handleUpdateSuccess = () => {
    setEditing(false);
    fetchProperty();
    fetchPropertyImage();
  };

  const handleUnitSuccess = () => {
    setShowUnitForm(false);
    setEditingUnit(null);
    fetchProperty();
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setShowUnitForm(true);
    setActiveTab('units');
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (confirm('Are you sure you want to delete this unit?')) {
      setDeletingId(unitId);
      try {
        await unitsAPI.delete(unitId);
        await fetchProperty();
      } catch (error) {
        console.error('Error deleting unit:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleCancelUnitForm = () => {
    setShowUnitForm(false);
    setEditingUnit(null);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Service Provider handlers
  const handleProviderSuccess = () => {
    setShowProviderForm(false);
    setEditingProvider(null);
    fetchProperty();
  };

  const handleEditProvider = (provider: ServiceProvider) => {
    setEditingProvider(provider);
    setShowProviderForm(true);
    setActiveTab('providers');
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (confirm('Are you sure you want to delete this service provider?')) {
      setDeletingProviderId(providerId);
      try {
        await serviceProvidersAPI.delete(providerId);
        await fetchProperty();
      } catch (error) {
        console.error('Error deleting service provider:', error);
      } finally {
        setDeletingProviderId(null);
      }
    }
  };

  const handleCancelProviderForm = () => {
    setShowProviderForm(false);
    setEditingProvider(null);
  };

  // Tenant handlers
  const handleTenantSuccess = () => {
    setShowTenantForm(false);
    setEditingTenant(null);
    fetchPropertyTenants();
    fetchProperty();
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setShowTenantForm(true);
    setActiveTab('tenants');
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (confirm('Are you sure you want to delete this tenant?')) {
      setDeletingTenantId(tenantId);
      try {
        await tenantsAPI.delete(tenantId);
        await fetchPropertyTenants();
        await fetchProperty();
      } catch (error) {
        console.error('Error deleting tenant:', error);
      } finally {
        setDeletingTenantId(null);
      }
    }
  };

  const handleCancelTenantForm = () => {
    setShowTenantForm(false);
    setEditingTenant(null);
  };

  // Daily Report handlers
  const handleReportSuccess = () => {
    setShowReportForm(false);
    setEditingReport(null);
    fetchDailyReports();
  };

  const handleEditReport = (report: DailyReport) => {
    setEditingReport(report);
    setShowReportForm(true);
    setActiveTab('reports');
  };

  const handleViewReport = async (reportId: string) => {
    try {
      const report = await dailyReportsAPI.getById(reportId, true);
      if (report.pdfUrl) {
        window.open(report.pdfUrl, '_blank');
      }
    } catch (error) {
      console.error('Error viewing report:', error);
    }
  };

  const handleDownloadReport = async (reportId: string, reportDate: string) => {
    try {
      const pdfBlob = await dailyReportsAPI.downloadPDF(reportId);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily-report-${reportDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (confirm('Are you sure you want to delete this daily report?')) {
      setDeletingReportId(reportId);
      try {
        await dailyReportsAPI.delete(reportId);
        await fetchDailyReports();
      } catch (error) {
        console.error('Error deleting report:', error);
      } finally {
        setDeletingReportId(null);
      }
    }
  };

  const handleCancelReportForm = () => {
    setShowReportForm(false);
    setEditingReport(null);
  };
  // Activation handlers
  const handleActivationSuccess = () => {
    setShowActivationForm(false);
    setEditingActivation(null);
    fetchActivations();
  };

  const handleEditActivation = (activation: ActivationRequest) => {
    setEditingActivation(activation);
    setShowActivationForm(true);
    setActiveTab('activations');
  };

  const handleViewActivation = async (activationId: string) => {
    try {
      const activation = await activationsAPI.getById(activationId);
      if (activation.documentUrl) {
        window.open(activation.documentUrl, '_blank');
      }
    } catch (error) {
      console.error('Error viewing activation:', error);
    }
  };

  const handleDownloadActivation = async (activationId: string, requestNumber: string) => {
    try {
      const pdfBlob = await activationsAPI.downloadPDF(activationId);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activation-request-${requestNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading activation:', error);
      alert('Failed to download activation request');
    }
  };

  const handleDeleteActivation = async (activationId: string) => {
    if (confirm('Are you sure you want to delete this activation request?')) {
      setDeletingActivationId(activationId);
      try {
        await activationsAPI.delete(activationId);
        await fetchActivations();
      } catch (error) {
        console.error('Error deleting activation:', error);
      } finally {
        setDeletingActivationId(null);
      }
    }
  };

  const handleCancelActivationForm = () => {
    setShowActivationForm(false);
    setEditingActivation(null);
  };

  const handleBackToProperties = () => {
    router.push('/properties');
  };

  const handleViewMoreDetails = () => {
    router.push(`/properties/${propertyId}/details`);
  };

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (propertyImageUrl) {
        URL.revokeObjectURL(propertyImageUrl);
      }
    };
  }, [propertyImageUrl]);

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const tabVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring" as const,
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

  const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2,
      },
    },
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
          <p className="text-lg font-medium text-gray-600">Loading property...</p>
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
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-heading-color mb-2">Property Not Found</h2>
        <p className="text-gray-600 mb-6">The property you're looking for doesn't exist.</p>
        <Button onClick={() => router.push('/properties')}>Back to Properties</Button>
      </motion.div>
    );
  }

  if (editing) {
    return (
      <motion.div
        key="editing"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6 p-6 md:p-8"
      >
        <div className="flex items-center justify-between pb-6 border-b-2 border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-heading-color mb-2">Edit Property</h1>
            <p className="text-sm text-gray-500">Update property information</p>
          </div>
          <Button variant="secondary" onClick={handleCancelEdit} className="px-6 py-2.5">
            Cancel
          </Button>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <PropertyForm property={property} onSuccess={handleUpdateSuccess} onCancel={handleCancelEdit} />
        </div>
      </motion.div>
    );
  }

  const units = property.units || [];
  const serviceProviders = property.serviceProviders || [];
  const leads = property.leads || [];
  const vacantUnits = units.filter(unit => unit.status === 'VACANT').length;
  const occupiedUnits = units.filter(unit => unit.status === 'OCCUPIED').length;
  const occupancyRate = units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0;

  return (
    <motion.div
      key="main-view"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 p-6 md:p-8"
    >
      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && propertyImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative max-w-6xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="relative w-full h-full bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  <img
                    src={propertyImageUrl}
                    alt={property.name}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  />
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-6">
                  <h3 className="text-white text-2xl font-bold mb-1">{property.name}</h3>
                  <p className="text-gray-200 text-sm">{property.address}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button and Action Buttons Row */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <Button
          onClick={handleBackToProperties}
          className="group px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300 shadow-sm hover:shadow-md rounded-lg"
        >
          <motion.span className="flex items-center gap-2" whileHover={{ x: -2 }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Properties
          </motion.span>
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setEditing(true)}
            className="group px-6 py-3 bg-primary text-white hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg"
          >
            <motion.span className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Property
            </motion.span>
          </Button>
          <Button
            onClick={handleDelete}
            className="px-6 py-3 bg-red-500 text-white hover:bg-red-600 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg"
          >
            <motion.span className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </motion.span>
          </Button>
        </div>
      </motion.div>

      {/* Header Section with Property Image */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b-2 border-gray-100"
      >
        <div className="flex-1 flex items-start gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative shrink-0 cursor-pointer group"
            onClick={() => propertyImageUrl && setShowImageModal(true)}
          >
            {imageLoading ? (
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-200 rounded-2xl flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            ) : propertyImageUrl ? (
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-lg border-4 border-white ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                <img
                  src={propertyImageUrl}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </div>
                <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                  Click to view
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 bg-linear-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white ring-2 ring-primary/20">
                <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            )}
          </motion.div>

          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-heading-color">{property.name}</h1>
                <p className="text-gray-500 flex items-center gap-2 mt-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {property.address}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-linear-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Total Units</p>
          <p className="text-3xl font-bold text-heading-color">{units.length}</p>
        </motion.div>
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Occupied</p>
          <p className="text-3xl font-bold text-heading-color">{occupiedUnits}</p>
        </motion.div>
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Vacant</p>
          <p className="text-3xl font-bold text-heading-color">{vacantUnits}</p>
        </motion.div>
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-linear-to-br from-teal-50 to-teal-100 rounded-xl p-6 border border-teal-200 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-teal-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Occupancy Rate</p>
          <p className="text-3xl font-bold text-heading-color">{occupancyRate}%</p>
        </motion.div>
      </motion.div>

      {/* Tabs Navigation - UPDATED WITH REPORTS TAB */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'units', label: 'Units', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { id: 'tenants', label: 'Tenants', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            {
              id: 'providers',
              label: 'Service Providers',
              icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            },
            {
              id: 'reports',
              label: "Manager's D.O.R",
              icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            },
            {
              id: 'activations',
              label: 'Activation Forms',
              icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setShowUnitForm(false);
                setEditingUnit(null);
                setShowProviderForm(false);
                setEditingProvider(null);
                setShowTenantForm(false);
                setEditingTenant(null);
                setShowReportForm(false);
                setEditingReport(null);
                setShowActivationForm(false);  // ADD THIS LINE
                setEditingActivation(null); // ADD THIS LINE AS WELL
              }}
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
      <AnimatePresence mode="wait">
        {/* DAILY REPORTS TAB - NEW SECTION */}
        {activeTab === 'reports' && (
          <motion.div
            key="reports"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            {showReportForm ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-heading-color">
                    {editingReport ? 'Edit Daily Report' : 'Create Daily Report'}
                  </h2>
                  <Button
                    onClick={handleCancelReportForm}
                    variant="secondary"
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                </div>
                <DailyReportForm
                  propertyId={propertyId}
                  report={editingReport}
                  onSuccess={handleReportSuccess}
                  onCancel={handleCancelReportForm}
                />
              </motion.div>
            ) : (
              <>
                {/* Header with Add Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-heading-color">Daily Operations Reports</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Track and manage daily property operations
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowReportForm(true)}
                    className="group px-6 py-3 bg-primary text-white hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg"
                  >
                    <motion.span className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Report
                    </motion.span>
                  </Button>
                </div>

                {/* Reports List */}
                {reportsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
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
                      <p className="text-gray-600">Loading reports...</p>
                    </div>
                  </div>
                ) : dailyReports.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200 text-center"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Daily Reports Yet</h3>
                    <p className="text-gray-500 mb-6">Start tracking daily operations by creating your first report.</p>
                    <Button
                      onClick={() => setShowReportForm(true)}
                      className="px-6 py-3 bg-primary text-white hover:bg-primary/90"
                    >
                      Create First Report
                    </Button>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dailyReports.map((report, index) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -4 }}
                        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                      >
                        {/* Report Date */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Report Date</p>
                              <p className="text-sm font-bold text-heading-color">
                                {new Date(report.reportDate).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              report.status === 'DRAFT'
                                ? 'bg-gray-100 text-gray-700'
                                : report.status === 'SUBMITTED'
                                ? 'bg-blue-100 text-blue-700'
                                : report.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {report.status}
                          </span>
                        </div>

                        {/* Report Summary */}
                        <div className="space-y-3 mb-4">
                          {report.overview?.summary && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-1">Summary</p>
                              <p className="text-sm text-gray-700 line-clamp-2">{report.overview.summary}</p>
                            </div>
                          )}
                          
                          {report.occupancy && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                              </svg>
                              <span className="text-sm text-gray-600">
                                Occupancy: <strong>{report.occupancy.occupancyRate}%</strong>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Prepared By */}
                        <div className="mb-4 pb-4 border-b border-gray-100">
                          <p className="text-xs text-gray-500">Prepared by</p>
                          <p className="text-sm font-medium text-gray-700">{report.preparedBy}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {report.status === 'DRAFT' && (
                            <Button
                              onClick={() => handleEditReport(report)}
                              variant="outline"
                              className="flex-1 text-sm py-2"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDownloadReport(report.id, report.reportDate)}
                            variant="outline"
                            className="flex-1 text-sm py-2"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Download
                          </Button>
                          {report.status === 'DRAFT' && (
                            <Button
                              onClick={() => handleDeleteReport(report.id)}
                              disabled={deletingReportId === report.id}
                              variant="outline"
                              className="text-red-600 hover:bg-red-50 hover:border-red-300 px-3 py-2"
                            >
                              {deletingReportId === report.id ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              )}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>


      {/* Tab Content - Keep the rest of your existing tab content here */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Property Information */}
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-heading-color">Property Information</h2>
              </div>
              <dl className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1">
                    <dt className="text-sm font-semibold text-gray-500 mb-1">Address</dt>
                    <dd className="text-sm text-gray-900">{property.address}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <div className="flex-1">
                    <dt className="text-sm font-semibold text-gray-500 mb-1">LR Number</dt>
                    <dd className="text-sm text-gray-900">{property.lrNumber || <span className="text-black">N/A</span>}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <div className="flex-1">
                    <dt className="text-sm font-semibold text-gray-500 mb-1">Property Form</dt>
                    <dd>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          property.form === 'APARTMENT'
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {property.form?.replace('_', ' ') || <span className="text-black">N/A</span>}
                      </span>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <div className="flex-1">
                    <dt className="text-sm font-semibold text-gray-500 mb-1">Usage Type</dt>
                    <dd>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          property.usage === 'RESIDENTIAL'
                            ? 'bg-green-100 text-green-700'
                            : property.usage === 'COMMERCIAL'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {property.usage?.replace('_', ' ') || <span className="text-black">N/A</span>}
                      </span>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="flex-1">
                    <dt className="text-sm font-semibold text-gray-500 mb-1">Landlord</dt>
                    <dd className="text-sm text-gray-900 font-medium">{property.landlord?.name || <span className="text-black">N/A</span>}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="flex-1">
                    <dt className="text-sm font-semibold text-gray-500 mb-1">Manager</dt>
                    <dd className="text-sm text-gray-900 font-medium">{property.manager?.name || <span className="text-black">N/A</span>}</dd>
                  </div>
                </div>
              </dl>
              {/* View More Button */}
              <div className="mt-6 pt-6 border-t-2 border-gray-100">
                <Button
                  onClick={handleViewMoreDetails}
                  className="w-full group px-6 py-3 bg-linear-to-r from-primary to-primary/80 text-white hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg"
                >
                  <motion.span className="flex items-center justify-center gap-2" whileHover={{ x: 5 }}>
                    View Financial Details
                    <svg
                      className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </motion.span>
                </Button>
              </div>
            </motion.div>
            {/* Quick Stats */}
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-heading-color">Quick Stats</h2>
              </div>
              <div className="space-y-6">
                <div className="p-4 bg-linear-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Active Tenants</span>
                    <span className="text-2xl font-bold text-purple-700">{propertyTenants.length}</span>
                  </div>
                </div>
                <div className="p-4 bg-linear-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Service Providers</span>
                    <span className="text-2xl font-bold text-primary">{serviceProviders.length}</span>
                  </div>
                </div>
                <div className="p-4 bg-linear-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Active Leads</span>
                    <span className="text-2xl font-bold text-blue-700">{leads.length}</span>
                  </div>
                </div>
                {/* Occupancy Progress Bar */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Occupancy Progress</span>
                    <span className="text-lg font-bold text-heading-color">{occupancyRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${occupancyRate}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      className={`h-full rounded-full ${
                        occupancyRate >= 80 ? 'bg-green-500' : occupancyRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'units' && (
          <motion.div
            key="units"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {showUnitForm ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-gray-100">
                  <div>
                    <h2 className="text-2xl font-bold text-heading-color mb-1">
                      {editingUnit ? 'Edit Unit' : 'Add New Unit'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {editingUnit ? 'Update unit information' : 'Create a new unit for this property'}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={handleCancelUnitForm} className="px-6 py-2.5">
                    Cancel
                  </Button>
                </div>
                <UnitForm
                  unit={editingUnit || undefined}
                  onSuccess={handleUnitSuccess}
                  onCancel={handleCancelUnitForm}
                  defaultPropertyId={propertyId}
                />
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Add Unit Button */}
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-heading-color">Property Units</h2>
                  <Button
                    onClick={() => setShowUnitForm(true)}
                    className="group px-6 py-3 bg-primary text-white hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg"
                  >
                    <motion.span className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Unit
                    </motion.span>
                  </Button>
                </div>
                {/* Units List */}
                {units.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-16 text-center border-2 border-dashed border-gray-300"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-black mb-2">No units yet</h3>
                    <p className="text-black mb-6">Start by adding units to this property</p>
                    <Button onClick={() => setShowUnitForm(true)} className="px-8 py-3 bg-primary text-white hover:bg-primary/90">
                      Add Your First Unit
                    </Button>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {units.map((unit, index) => (
                      <motion.div
                        key={unit.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4 }}
                        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-heading-color">{unit.type || 'Unit'}</h3>
                              <p className="text-sm text-gray-500">ID: {unit.id.slice(0, 8)}</p>
                            </div>
                          </div>
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                              unit.status === 'VACANT'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {unit.status}
                          </motion.span>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                            {unit.bedrooms} bed • {unit.bathrooms} bath
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                              />
                            </svg>
                            {unit.sizeSqFt} sq ft
                          </div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Ksh {unit.rentAmount.toLocaleString()} / {unit.rentType.toLowerCase()}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-100">
                          <Button
                            onClick={() => handleEditUnit(unit)}
                            className="flex-1 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 rounded-lg font-semibold"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit
                            </span>
                          </Button>
                          <Button
                            onClick={() => router.push(`/properties/${unit.id}/unit-details`)}
                            className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200 rounded-lg font-semibold"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              View Details
                            </span>
                          </Button>
                          <Button
                            onClick={() => handleDeleteUnit(unit.id)}
                            disabled={deletingId === unit.id}
                            className="flex-1 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 rounded-lg font-semibold disabled:opacity-50"
                          >
                            {deletingId === unit.id ? (
                              <span className="flex items-center justify-center gap-2">
                                <motion.svg
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                  className="w-4 h-4"
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
                                Deleting...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
                              </span>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'tenants' && (
          <motion.div
            key="tenants"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {showTenantForm ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-gray-100">
                  <div>
                    <h2 className="text-2xl font-bold text-heading-color mb-1">
                      {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {editingTenant ? 'Update tenant information' : 'Create a new tenant for this property'}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={handleCancelTenantForm} className="px-6 py-2.5">
                    Cancel
                  </Button>
                </div>
                <TenantForm
                  tenant={editingTenant || undefined}
                  onSuccess={handleTenantSuccess}
                  onCancel={handleCancelTenantForm}
                  propertyId={propertyId}  // Pass the propertyId to associate tenant with this property
                />
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Add Tenant Button */}
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-heading-color">Property Tenants</h2>
                  <Button
                    onClick={() => setShowTenantForm(true)}
                    className="group px-6 py-3 bg-primary text-white hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg"
                  >
                    <motion.span className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
                      <svg
                        className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Tenant
                    </motion.span>
                  </Button>
                </div>
                {/* Tenants List */}
                {propertyTenants.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-16 text-center border-2 border-dashed border-gray-300"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-black mb-2">No tenants yet</h3>
                    <p className="text-black mb-6">Start by adding tenants to this property</p>
                    <Button
                      onClick={() => setShowTenantForm(true)}
                      className="px-8 py-3 bg-primary text-white hover:bg-primary/90"
                    >
                      Add Your First Tenant
                    </Button>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {propertyTenants.map((tenant, index) => (
                      <motion.div
                        key={tenant.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4 }}
                        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-heading-color mb-2">{tenant.fullName}</h3>
                            <div className="space-y-2">
                              {tenant.contact && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                  </svg>
                                  {tenant.contact}
                                </div>
                              )}
                              {tenant.unit && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                    />
                                  </svg>
                                  {tenant.unit.type || 'Unit'} ({tenant.unit.bedrooms} bed / {tenant.unit.bathrooms} bath)
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Ksh {tenant.rent.toLocaleString()} / month
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Lease: {tenant.leaseTerm}
                              </div>
                              {tenant.termStart && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600">
                                    Started: {new Date(tenant.termStart).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-100">
                          <Button
                            onClick={() => handleEditTenant(tenant)}
                            className="flex-1 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 rounded-lg font-semibold"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit
                            </span>
                          </Button>
                          <Button
                            onClick={() => router.push(`/properties/${tenant.id}/tenant-details`)}
                            className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200 rounded-lg font-semibold"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              View Details
                            </span>
                          </Button>
                          <Button
                            onClick={() => handleDeleteTenant(tenant.id)}
                            disabled={deletingTenantId === tenant.id}
                            className="flex-1 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 rounded-lg font-semibold disabled:opacity-50"
                          >
                            {deletingTenantId === tenant.id ? (
                              <span className="flex items-center justify-center gap-2">
                                <motion.svg
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                  className="w-4 h-4"
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
                                Deleting...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
                              </span>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'providers' && (
          <motion.div
            key="providers"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {showProviderForm ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-gray-100">
                  <div>
                    <h2 className="text-2xl font-bold text-heading-color mb-1">
                      {editingProvider ? 'Edit Service Provider' : 'Add New Service Provider'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {editingProvider ? 'Update service provider information' : 'Create a new service provider for this property'}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={handleCancelProviderForm} className="px-6 py-2.5">
                    Cancel
                  </Button>
                </div>
                <ServiceProviderForm
                  serviceProvider={editingProvider || undefined}
                  onSuccess={handleProviderSuccess}
                  onCancel={handleCancelProviderForm}
                  propertyId={propertyId} 
                />
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Add Service Provider Button */}
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-heading-color">Service Providers</h2>
                  <Button
                    onClick={() => setShowProviderForm(true)}
                    className="group px-6 py-3 bg-primary text-white hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg"
                  >
                    <motion.span className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
                      <svg
                        className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Provider
                    </motion.span>
                  </Button>
                </div>
                {/* Service Providers List */}
                {serviceProviders.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-16 text-center border-2 border-dashed border-gray-300"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-black mb-2">No service providers yet</h3>
                    <p className="text-black mb-6">Start by adding service providers to this property</p>
                    <Button
                      onClick={() => setShowProviderForm(true)}
                      className="px-8 py-3 bg-primary text-white hover:bg-primary/90"
                    >
                      Add Your First Provider
                    </Button>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {serviceProviders.map((provider, index) => (
                      <motion.div
                        key={provider.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4 }}
                        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-heading-color mb-2">{provider.name}</h3>
                            <div className="space-y-2">
                              {provider.contact && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                  </svg>
                                  {provider.contact}
                                </div>
                              )}
                              {provider.contractPeriod && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {provider.contractPeriod}
                                </div>
                              )}
                              {provider.serviceContract && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600 line-clamp-2">{provider.serviceContract}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-100">
                          <Button
                            onClick={() => handleEditProvider(provider)}
                            className="flex-1 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 rounded-lg font-semibold"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit
                            </span>
                          </Button>
                          <Button
                            onClick={() => router.push(`/properties/${provider.id}/service-provider-detail`)}
                            className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200 rounded-lg font-semibold"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              View Details
                            </span>
                          </Button>
                          <Button
                            onClick={() => handleDeleteProvider(provider.id)}
                            disabled={deletingProviderId === provider.id}
                            className="flex-1 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 rounded-lg font-semibold disabled:opacity-50"
                          >
                            {deletingProviderId === provider.id ? (
                              <span className="flex items-center justify-center gap-2">
                                <motion.svg
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                  className="w-4 h-4"
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
                                Deleting...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
                              </span>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
        {/* ACTIVATION FORMS TAB */}
        {activeTab === 'activations' && (
          <motion.div
            key="activations"
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            {showActivationForm ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-heading-color">
                    {editingActivation ? 'Edit Activation Request' : 'Create Activation Request'}
                  </h2>
                  <Button
                    onClick={handleCancelActivationForm}
                    variant="secondary"
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                </div>
                <ActivationForm
                  propertyId={propertyId}
                  activation={editingActivation}
                  onSuccess={handleActivationSuccess}
                  onCancel={handleCancelActivationForm}
                />
              </motion.div>
            ) : (
              <>
                {/* Header with Add Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-heading-color">Activation Requests</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage space activation and temporary lease requests
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowActivationForm(true)}
                    className="group px-6 py-3 bg-primary text-white hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg"
                  >
                    <motion.span className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Request
                    </motion.span>
                  </Button>
                </div>

                {/* Activation Requests List */}
                {activationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
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
                      <p className="text-gray-600">Loading activation requests...</p>
                    </div>
                  </div>
                ) : activationRequests.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200 text-center"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Activation Requests Yet</h3>
                    <p className="text-gray-500 mb-6">Create your first activation request for this property.</p>
                    <Button
                      onClick={() => setShowActivationForm(true)}
                      className="px-6 py-3 bg-primary text-white hover:bg-primary/90"
                    >
                      Create First Request
                    </Button>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activationRequests.map((activation, index) => (
                      <motion.div
                        key={activation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -4 }}
                        className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                      >
                        {/* Request Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-500">Request No.</p>
                            <p className="text-sm font-bold text-heading-color">{activation.requestNumber}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              activation.status === 'DRAFT'
                                ? 'bg-gray-100 text-gray-700'
                                : activation.status === 'SUBMITTED'
                                ? 'bg-blue-100 text-blue-700'
                                : activation.status === 'UNDER_REVIEW'
                                ? 'bg-yellow-100 text-yellow-700'
                                : activation.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700'
                                : activation.status === 'REJECTED'
                                ? 'bg-red-100 text-red-700'
                                : activation.status === 'COMPLETED'
                                ? 'bg-teal-100 text-teal-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {activation.status}
                          </span>
                        </div>

                        {/* Company Info */}
                        <div className="space-y-3 mb-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Company</p>
                            <p className="text-sm font-bold text-gray-800">{activation.companyName}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Contact Person</p>
                            <p className="text-sm text-gray-700">{activation.contactPerson}</p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Type</p>
                            <p className="text-sm text-gray-700">{activation.activationType.replace(/_/g, ' ')}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-1">Space (sq ft)</p>
                              <p className="text-sm font-bold text-gray-800">{activation.spaceRequired.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-1">Duration</p>
                              <p className="text-sm font-bold text-gray-800">{activation.durationDays} days</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Period</p>
                            <p className="text-xs text-gray-600">
                              {new Date(activation.startDate).toLocaleDateString('en-GB')} - {new Date(activation.endDate).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditActivation(activation)}
                            className="flex-1 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
                          >
                            Edit
                          </motion.button>
                          
                          {activation.documentUrl && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewActivation(activation.id)}
                              className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                            >
                              View
                            </motion.button>
                          )}
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDownloadActivation(activation.id, activation.requestNumber)}
                            className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                          >
                            Download
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteActivation(activation.id)}
                            disabled={deletingActivationId === activation.id}
                            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            {deletingActivationId === activation.id ? 'Deleting...' : 'Delete'}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
