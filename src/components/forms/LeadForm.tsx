'use client';

import { useState, useEffect } from 'react';
import { Lead, Property } from '@/types';
import { leadsAPI, propertiesAPI } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LeadFormProps {
  lead?: Lead;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function LeadForm({ lead, onSuccess, onCancel }: LeadFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    idNumber: '',
    companyName: '',
    natureOfLead: '',
    notes: '',
    propertyId: '',
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProperties();
    if (lead) {
      setFormData({
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone,
        address: lead.address || '',
        idNumber: lead.idNumber || '',
        companyName: lead.companyName || '',
        natureOfLead: lead.natureOfLead || '',
        notes: lead.notes || '',
        propertyId: lead.propertyId || '',
      });
    }
  }, [lead]);

  const fetchProperties = async () => {
    try {
      const data = await propertiesAPI.getAll();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Name and phone are required fields.');
      setLoading(false);
      return;
    }

    try {
      // Prepare payload with proper undefined values for optional fields
      const payload: Partial<Lead> = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        idNumber: formData.idNumber.trim() || undefined,
        companyName: formData.companyName.trim() || undefined,
        natureOfLead: formData.natureOfLead.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        propertyId: formData.propertyId || undefined,
      };

      if (lead) {
        await leadsAPI.update(lead.id, payload);
      } else {
        await leadsAPI.create(payload);
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save lead');
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Name *"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Full name"
        />

        <Input
          label="Phone *"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          placeholder="+254 7XX XXX XXX"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="name@example.com"
        />

        <Input
          label="ID Number"
          name="idNumber"
          value={formData.idNumber}
          onChange={handleChange}
          placeholder="National ID number"
        />
      </div>

      <Input
        label="Company Name"
        name="companyName"
        value={formData.companyName}
        onChange={handleChange}
        placeholder="Company name (if applicable)"
      />

      <Input
        label="Address"
        name="address"
        value={formData.address}
        onChange={handleChange}
        placeholder="Street, City, County"
      />

      <Input
        label="Nature of Lead"
        name="natureOfLead"
        value={formData.natureOfLead}
        onChange={handleChange}
        placeholder="e.g., Rental inquiry, Property viewing, Commercial lease, etc."
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Property
        </label>
        <select
          name="propertyId"
          value={formData.propertyId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Select Property (Optional)</option>
          {properties.map(property => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          placeholder="Additional notes about the lead..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
          {loading ? 'Saving...' : lead ? 'Update' : 'Create'} Lead
        </Button>
      </div>
    </form>
  );
}