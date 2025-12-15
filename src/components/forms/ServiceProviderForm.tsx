'use client';

import { useState, useEffect } from 'react';
import { ServiceProvider, Property, ChargeFrequency } from '@/types';
import { serviceProvidersAPI, propertiesAPI } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ServiceProviderFormProps {
  serviceProvider?: ServiceProvider;
  onSuccess?: () => void;
  onCancel?: () => void;
  propertyId?: string;
}

// Draft storage key generator
const getDraftKey = (serviceProviderId?: string, propertyId?: string) => {
  if (serviceProviderId) {
    return `service_provider_form_draft_${serviceProviderId}`;
  }
  if (propertyId) {
    return `service_provider_form_draft_new_${propertyId}`;
  }
  return 'service_provider_form_draft_new';
};

export default function ServiceProviderForm({ 
  serviceProvider, 
  onSuccess, 
  onCancel,
  propertyId
}: ServiceProviderFormProps) {
  const [formData, setFormData] = useState({
    propertyId: '',
    name: '',
    contact: '',
    contractPeriod: '',
    serviceContract: '',
    chargeAmount: 0,
    chargeFrequency: 'MONTHLY' as ChargeFrequency,
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [hasDraft, setHasDraft] = useState(false);

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const draftKey = getDraftKey(serviceProvider?.id, propertyId);
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft);
        setHasDraft(true);
        return true;
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    return false;
  };

  // Save draft to localStorage
  const saveDraft = (data: typeof formData) => {
    try {
      const draftKey = getDraftKey(serviceProvider?.id, propertyId);
      localStorage.setItem(draftKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    try {
      const draftKey = getDraftKey(serviceProvider?.id, propertyId);
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  useEffect(() => {
    fetchProperties();
    
    // Try to load draft first
    const draftLoaded = loadDraft();
    
    if (!draftLoaded) {
      // If propertyId is passed as prop (from property detail page), set it in formData
      if (propertyId) {
        setFormData(prev => ({
          ...prev,
          propertyId: propertyId
        }));
        
        // Fetch property name to display
        fetchPropertyName(propertyId);
      }
      
      // If editing an existing service provider
      if (serviceProvider) {
        setFormData({
          propertyId: serviceProvider.propertyId,
          name: serviceProvider.name,
          contact: serviceProvider.contact || '',
          contractPeriod: serviceProvider.contractPeriod || '',
          serviceContract: serviceProvider.serviceContract || '',
          chargeAmount: serviceProvider.chargeAmount || 0,
          chargeFrequency: serviceProvider.chargeFrequency || 'MONTHLY',
        });
        
        // Fetch property name for editing
        fetchPropertyName(serviceProvider.propertyId);
      }
    } else {
      // Draft was loaded, fetch property name if propertyId exists
      if (formData.propertyId) {
        fetchPropertyName(formData.propertyId);
      }
    }
  }, [serviceProvider, propertyId]);

  const fetchProperties = async () => {
    try {
      const data = await propertiesAPI.getAll();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchPropertyName = async (id: string) => {
    try {
      // First check if property is in cached properties
      const cachedProperty = properties.find(p => p.id === id);
      if (cachedProperty) {
        setPropertyName(cachedProperty.name);
        return;
      }
      
      // If not found in cache, fetch it individually
      const property = await propertiesAPI.getById(id);
      setPropertyName(property.name);
    } catch (error) {
      console.error('Error fetching property name:', error);
      setPropertyName('Unknown Property');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let newFormData = { ...formData };
    
    // If property is being changed (only possible when not pre-populated)
    if (name === 'propertyId' && !propertyId) {
      const selectedProperty = properties.find(p => p.id === value);
      setPropertyName(selectedProperty ? selectedProperty.name : '');
    }
    
    if (type === 'number') {
      newFormData = {
        ...newFormData,
        [name]: value === '' ? 0 : parseFloat(value)
      };
    } else {
      newFormData = {
        ...newFormData,
        [name]: value
      };
    }
    
    setFormData(newFormData);
    
    // Auto-save draft on every change
    saveDraft(newFormData);
    
    // Mark as having draft data
    if (!hasDraft) {
      setHasDraft(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (serviceProvider) {
        await serviceProvidersAPI.update(serviceProvider.id, formData);
      } else {
        await serviceProvidersAPI.create(formData);
      }
      
      // Clear draft after successful submission
      clearDraft();
      
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save service provider');
    } finally {
      setLoading(false);
    }
  };

  const handleClearDraft = () => {
    if (confirm('Are you sure you want to clear the saved draft? This action cannot be undone.')) {
      // Reset to original data
      if (serviceProvider) {
        setFormData({
          propertyId: serviceProvider.propertyId,
          name: serviceProvider.name,
          contact: serviceProvider.contact || '',
          contractPeriod: serviceProvider.contractPeriod || '',
          serviceContract: serviceProvider.serviceContract || '',
          chargeAmount: serviceProvider.chargeAmount || 0,
          chargeFrequency: serviceProvider.chargeFrequency || 'MONTHLY',
        });
        fetchPropertyName(serviceProvider.propertyId);
      } else {
        // Clear form for new service provider
        setFormData({
          propertyId: propertyId || '',
          name: '',
          contact: '',
          contractPeriod: '',
          serviceContract: '',
          chargeAmount: 0,
          chargeFrequency: 'MONTHLY',
        });
        if (propertyId) {
          fetchPropertyName(propertyId);
        } else {
          setPropertyName('');
        }
      }
      clearDraft();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {hasDraft && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded flex justify-between items-center">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Draft saved - Your changes are being automatically saved</span>
          </span>
          <button
            type="button"
            onClick={handleClearDraft}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear Draft
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Property Field - Auto-populated when opened from property page */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property <span className="text-red-500">*</span>
        </label>
        
        {/* Show selected property name with styling */}
        {(propertyId || formData.propertyId) && propertyName && (
          <div className="mb-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm font-medium text-primary">
              <span className="font-semibold">Selected Property:</span> {propertyName}
            </p>
            <input
              type="hidden"
              name="propertyId"
              value={formData.propertyId}
            />
          </div>
        )}
        
        {/* Only show dropdown if property is not pre-populated */}
        {!propertyId && (
          <>
            <select
              name="propertyId"
              value={formData.propertyId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black bg-white"
            >
              <option value="" className="text-gray-500">Select a property</option>
              {properties.map(property => (
                <option key={property.id} value={property.id} className="text-black">
                  {property.name} - {property.address}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-gray-500">
              Select the property this service provider will be associated with
            </p>
          </>
        )}
        
        {/* Helper text for pre-populated property */}
        {propertyId && (
          <p className="mt-1.5 text-xs text-gray-500">
            Service provider will be automatically associated with this property
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Service Provider Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g., ABC Cleaning Services"
          className="text-black placeholder:text-gray-500"
        />

        <Input
          label="Contact Information"
          name="contact"
          value={formData.contact}
          onChange={handleChange}
          placeholder="Phone number, email, or other contact details"
          className="text-black placeholder:text-gray-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Contract Period"
          name="contractPeriod"
          value={formData.contractPeriod}
          onChange={handleChange}
          placeholder="e.g., 1 year, 6 months, etc."
          className="text-black placeholder:text-gray-500"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Charge Frequency <span className="text-red-500">*</span>
          </label>
          <select
            name="chargeFrequency"
            value={formData.chargeFrequency}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black bg-white"
          >
            <option value="DAILY" className="text-black">Daily</option>
            <option value="WEEKLY" className="text-black">Weekly</option>
            <option value="MONTHLY" className="text-black">Monthly</option>
            <option value="QUARTERLY" className="text-black">Quarterly</option>
            <option value="ANNUAL" className="text-black">Annual</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Charge Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              Ksh
            </span>
            <input
              type="number"
              name="chargeAmount"
              value={formData.chargeAmount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black placeholder:text-gray-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            &nbsp;
          </label>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              {formData.chargeAmount > 0 ? (
                <>
                  <span className="font-semibold">Ksh {formData.chargeAmount.toLocaleString()}</span>
                  <span className="text-gray-500"> per {formData.chargeFrequency.toLowerCase()}</span>
                </>
              ) : (
                <span className="text-gray-500">Enter charge amount to see preview</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Contract Details
        </label>
        <textarea
          name="serviceContract"
          value={formData.serviceContract}
          onChange={handleChange}
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black placeholder:text-gray-500"
          placeholder="Describe the services provided, terms, conditions, and any specific agreements..."
        />
        <p className="mt-1.5 text-xs text-gray-500">
          Include details about scope of work, service hours, response times, etc.
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="px-6 py-2.5"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : serviceProvider ? (
            'Update Service Provider'
          ) : (
            'Create Service Provider'
          )}
        </Button>
      </div>
    </form>
  );
}