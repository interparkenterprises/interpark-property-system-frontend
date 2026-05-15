'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Property } from '@/types';
import { propertiesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default function PropertiesPage() {
  const router = useRouter();

  const {
    user,
    isAdmin,
    isManager,
    isManagedUser,
    roleName,
    permissions,
    canViewProperties,
    canCreateProperty,
    canEditProperty,
    canDeleteProperty,
    canViewProperty,
    getAccessiblePropertyIds,
  } = useGlobalPermissions();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accessiblePropertyIds = useMemo(() => {
    return getAccessiblePropertyIds();
  }, [getAccessiblePropertyIds]);

  const canAccessPage = useMemo(() => {
    return isAdmin || isManager || isManagedUser || canViewProperties;
  }, [isAdmin, isManager, isManagedUser, canViewProperties]);

  const getRoleBadge = useMemo(() => {
    if (isAdmin) {
      return {
        text: 'Admin View',
        className: 'bg-purple-100 text-purple-800 border border-purple-200',
      };
    }

    if (isManager) {
      return {
        text: 'Manager View',
        className: 'bg-blue-100 text-blue-800 border border-blue-200',
      };
    }

    if (isManagedUser) {
      return {
        text: 'Limited Access',
        className: 'bg-amber-100 text-amber-800 border border-amber-200',
      };
    }

    return {
      text: roleName || user?.role || 'User',
      className: 'bg-gray-100 text-gray-700 border border-gray-200',
    };
  }, [isAdmin, isManager, isManagedUser, roleName, user?.role]);

  const canViewThisProperty = useCallback(
    (property: Property) => {
      if (isAdmin) return true;

      if (isManager) {
        return property.managerId === user?.id;
      }

      if (isManagedUser) {
        return accessiblePropertyIds.includes(property.id) || canViewProperty(property.id);
      }

      return canViewProperties;
    },
    [isAdmin, isManager, isManagedUser, user?.id, accessiblePropertyIds, canViewProperty, canViewProperties]
  );

  const canEditThisProperty = useCallback(
    (property: Property) => {
      if (isAdmin) return true;

      if (isManager) {
        return property.managerId === user?.id && permissions.properties.canEdit;
      }

      if (isManagedUser) {
        return canEditProperty(property.id);
      }

      return permissions.properties.canEdit;
    },
    [isAdmin, isManager, isManagedUser, user?.id, permissions.properties.canEdit, canEditProperty]
  );

  const canDeleteThisProperty = useCallback(
    (property: Property) => {
      if (isAdmin) return true;

      if (isManager) {
        return property.managerId === user?.id && permissions.properties.canDelete;
      }

      if (isManagedUser) {
        return canDeleteProperty(property.id);
      }

      return permissions.properties.canDelete;
    },
    [isAdmin, isManager, isManagedUser, user?.id, permissions.properties.canDelete, canDeleteProperty]
  );

  const fetchProperties = useCallback(async () => {
    if (!canAccessPage) {
      setLoading(false);
      setError("You don't have permission to view properties");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const allProperties = await propertiesAPI.getAll();
      const safeProperties = Array.isArray(allProperties) ? allProperties : [];

      const filteredProperties = safeProperties.filter((property: Property) =>
        canViewThisProperty(property)
      );

      setProperties(filteredProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to load properties. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [canAccessPage, canViewThisProperty]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleView = (propertyId: string) => {
    setViewingId(propertyId);

    setTimeout(() => {
      router.push(`/properties/${propertyId}`);
    }, 150);
  };

  const handleEdit = (property: Property) => {
    if (!canEditThisProperty(property)) {
      alert("You don't have permission to edit this property");
      return;
    }

    setEditingId(property.id);

    setTimeout(() => {
      router.push(`/properties/${property.id}?mode=edit`);
    }, 150);
  };

  const handleDelete = async (property: Property) => {
    if (!canDeleteThisProperty(property)) {
      alert("You don't have permission to delete this property");
      return;
    }

    if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      setDeletingId(property.id);

      try {
        await propertiesAPI.delete(property.id);
        setProperties((prev) => prev.filter((item) => item.id !== property.id));
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Failed to delete property. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (!canAccessPage && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to view properties. Please contact your administrator if you believe this is an error.
          </p>

          {(isManagedUser || isManager || isAdmin) && (
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <span className="text-sm text-gray-600">Your role:</span>
                <span className="text-sm font-semibold text-gray-900">{roleName || user?.role}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-[#005478] border-t-transparent rounded-full mx-auto"
          />
          <p className="text-lg text-gray-700 font-medium">Loading properties...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Error Loading Properties</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchProperties}
            className="px-6 py-2 bg-[#005478] text-white rounded-lg hover:bg-[#004267] transition-colors"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#005478] font-condensed tracking-tight">
              Properties
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadge.className}`}>
              {getRoleBadge.text}
            </span>
          </div>

          <p className="text-gray-900 max-w-2xl">
            {isAdmin
              ? 'Manage your entire property portfolio, view details, and track unit occupancy across all properties.'
              : isManager
              ? 'Manage your assigned properties, view details, and track unit occupancy.'
              : isManagedUser
              ? 'View and work with properties you have been granted access to.'
              : 'Manage your property portfolio, view details, and track unit occupancy.'}
          </p>

          {isManagedUser && (
            <p className="text-sm text-blue-600 mt-1">
              You currently have access to {properties.length} propert{properties.length === 1 ? 'y' : 'ies'}
            </p>
          )}
        </div>

        <PermissionGuard permission="CREATE_PROPERTY">
          <Link href="/properties/create">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="px-6 py-3 bg-[#005478] text-white hover:bg-[#004267] transition-all duration-200 shadow-lg hover:shadow-xl font-medium rounded-lg">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Property
                </span>
              </Button>
            </motion.div>
          </Link>
        </PermissionGuard>
      </motion.div>

      {properties.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#005478]/10 rounded-lg">
                <svg className="w-6 h-6 text-[#005478]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
                <p className="text-gray-600 text-sm">
                  {isAdmin ? 'Total Properties' : isManager ? 'Managed Properties' : 'Accessible Properties'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {properties.reduce((total, property) => total + (property.units?.length || 0), 0)}
                </p>
                <p className="text-gray-600 text-sm">Total Units</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(properties.map((p) => p.landlord?.id).filter(Boolean)).size}
                </p>
                <p className="text-gray-600 text-sm">Active Landlords</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {properties.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl p-16 text-center border border-gray-200 shadow-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 bg-[#005478]/10 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <svg className="w-10 h-10 text-[#005478]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </motion.div>

            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {isManagedUser ? 'No accessible properties yet' : 'No properties yet'}
            </h3>

            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {isAdmin || isManager
                ? 'Start building your property portfolio by adding your first property. Track units, manage landlords, and streamline your operations.'
                : 'You do not have any assigned properties yet. Contact your manager or administrator to request access.'}
            </p>

            {(isAdmin || isManager) && canCreateProperty && (
              <Link href="/properties/create">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="px-8 py-3 bg-[#005478] text-white hover:bg-[#004267] transition-all duration-200 shadow-lg font-medium rounded-lg">
                    Create Your First Property
                  </Button>
                </motion.div>
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="properties-table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-linear-to-r from-[#005478]/5 to-[#005478]/10">
                  <tr>
                    <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Property
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Address
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Landlord
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Units
                    </th>
                    <th scope="col" className="px-8 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  <AnimatePresence>
                    {properties.map((property, index) => {
                      const isViewing = viewingId === property.id;
                      const isEditing = editingId === property.id;
                      const isDeleting = deletingId === property.id;
                      const rowBusy = isViewing || isEditing || isDeleting;

                      const allowEdit = canEditThisProperty(property);
                      const allowDelete = canDeleteThisProperty(property);

                      return (
                        <motion.tr
                          key={property.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="group hover:bg-linear-to-r hover:from-[#005478]/5 hover:to-transparent transition-all duration-200"
                        >
                          <td className="px-8 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#005478]/10 rounded-lg">
                                <svg className="w-4 h-4 text-[#005478]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-base font-semibold text-gray-900 group-hover:text-[#005478] transition-colors">
                                  {property.name}
                                </div>
                                {property.lrNumber && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    LR: {property.lrNumber}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="text-sm text-gray-700 max-w-xs line-clamp-2 leading-relaxed">
                              {property.address}
                            </div>
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                                  property.usage === 'RESIDENTIAL'
                                    ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                    : property.usage === 'COMMERCIAL'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : 'bg-purple-50 text-purple-800 border border-purple-200'
                                }`}
                              >
                                {property.usage.toLowerCase()}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {property.form.toLowerCase().replace('_', ' ')}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {property.landlord?.name || (
                                <span className="text-gray-400 italic">—</span>
                              )}
                            </div>
                            {property.landlord?.phone && (
                              <div className="text-xs text-gray-600 mt-1">
                                {property.landlord.phone}
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-gray-900">
                                {property.units?.length || 0}
                              </span>
                              <span className="text-sm text-gray-600">units</span>
                            </div>
                          </td>

                          <td className="px-8 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3 flex-wrap">
                              <button
                                onClick={() => handleView(property.id)}
                                disabled={rowBusy}
                                className="inline-flex items-center gap-1.5 text-[#005478] hover:text-[#004267] font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/link"
                              >
                                {isViewing ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                      className="w-3 h-3 border border-[#005478] border-t-transparent rounded-full"
                                    />
                                    Opening...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View
                                  </>
                                )}
                              </button>

                              {allowEdit && (
                                <button
                                  onClick={() => handleEdit(property)}
                                  disabled={rowBusy}
                                  className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-800 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/edit"
                                >
                                  {isEditing ? (
                                    <>
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-3 h-3 border border-amber-600 border-t-transparent rounded-full"
                                      />
                                      Opening form...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4 transition-transform group-hover/edit:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                      Edit
                                    </>
                                  )}
                                </button>
                              )}

                              {allowDelete && (
                                <button
                                  onClick={() => handleDelete(property)}
                                  disabled={rowBusy}
                                  className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/delete"
                                >
                                  {isDeleting ? (
                                    <>
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-3 h-3 border border-red-600 border-t-transparent rounded-full"
                                      />
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4 transition-transform group-hover/delete:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
