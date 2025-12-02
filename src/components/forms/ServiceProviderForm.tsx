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
}

export default function ServiceProviderForm({ serviceProvider, onSuccess, onCancel }: ServiceProviderFormProps) {
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

  useEffect(() => {
    fetchProperties();
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
    }
  }, [serviceProvider]);

  const fetchProperties = async () => {
    try {
      const data = await propertiesAPI.getAll();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save service provider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Property <span className="text-red-500">*</span>
        </label>
        <select
          name="propertyId"
          value={formData.propertyId}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-black"
        >
          <option value="" className="text-black">Select Property</option>
          {properties.map(property => (
            <option key={property.id} value={property.id} className="text-black">
              {property.name}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Service Provider Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        placeholder="Enter service provider name"
        className="text-black placeholder:text-black placeholder:opacity-70"
      />

      <Input
        label="Contact Information"
        name="contact"
        value={formData.contact}
        onChange={handleChange}
        placeholder="Phone number, email, or other contact details"
        className="text-black placeholder:text-black placeholder:opacity-70"
      />

      <Input
        label="Contract Period"
        name="contractPeriod"
        value={formData.contractPeriod}
        onChange={handleChange}
        placeholder="e.g., 1 year, 6 months, etc."
        className="text-black placeholder:text-black placeholder:opacity-70"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Charge Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="chargeAmount"
            value={formData.chargeAmount}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-black placeholder:text-black placeholder:opacity-70"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Charge Frequency <span className="text-red-500">*</span>
          </label>
          <select
            name="chargeFrequency"
            value={formData.chargeFrequency}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-black"
          >
            <option value="DAILY" className="text-black">Daily</option>
            <option value="WEEKLY" className="text-black">Weekly</option>
            <option value="MONTHLY" className="text-black">Monthly</option>
            <option value="QUARTERLY" className="text-black">Quarterly</option>
            <option value="ANNUAL" className="text-black">Annual</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Service Contract Details
        </label>
        <textarea
          name="serviceContract"
          value={formData.serviceContract}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-black placeholder:text-black placeholder:opacity-70"
          placeholder="Describe the services provided, terms, and conditions..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : serviceProvider ? 'Update' : 'Create'} Service Provider
        </Button>
      </div>
    </form>
  );
}