'use client';

import { useState, useEffect } from 'react';
import { Unit, Property, UnitType, UnitStatus, RentType } from '@/types';
import { unitsAPI, propertiesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface UnitFormProps {
  unit?: Unit;
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultPropertyId?: string;
}

export default function UnitForm({ unit, onSuccess, onCancel, defaultPropertyId }: UnitFormProps) {
  const [formData, setFormData] = useState({
    propertyId: defaultPropertyId || '',
    unitNo: '',
    floor: '',
    unitType: 'RESIDENTIAL' as UnitType,
    usage: '',
    bedrooms: 0,
    bathrooms: 0,
    sizeSqFt: 0,
    type: '',
    status: 'VACANT' as UnitStatus,
    rentType: 'FIXED' as RentType,
    rentAmount: 0,
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!defaultPropertyId) {
      fetchProperties();
    }
    if (unit) {
      setFormData({
        propertyId: unit.propertyId,
        unitNo: unit.unitNo || '',
        floor: unit.floor || '',
        unitType: unit.unitType,
        usage: unit.usage || '',
        bedrooms: unit.bedrooms || 0,
        bathrooms: unit.bathrooms || 0,
        sizeSqFt: unit.sizeSqFt,
        type: unit.type || '',
        status: unit.status,
        rentType: unit.rentType,
        rentAmount: unit.rentAmount,
      });
    }
  }, [unit, defaultPropertyId]);

  const fetchProperties = async () => {
    try {
      const data = await propertiesAPI.getAll();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    // Validate required fields
    if (!formData.propertyId || !formData.sizeSqFt || !formData.rentAmount) {
      setError('Property, size, and rent amount are required.');
      setLoading(false);
      return;
    }

    // Validate size and rent amount
    if (formData.sizeSqFt <= 0) {
      setError('Size must be greater than 0.');
      setLoading(false);
      return;
    }

    if (formData.rentAmount <= 0) {
      setError('Rent amount must be greater than 0.');
      setLoading(false);
      return;
    }

    // For residential units, validate bedrooms and bathrooms
    if (formData.unitType === 'RESIDENTIAL') {
      if (formData.bedrooms < 0 || formData.bathrooms < 0) {
        setError('Bedrooms and bathrooms must be 0 or greater.');
        setLoading(false);
        return;
      }
    }

    try {
      // Prepare payload with correct data types
      const payload: any = {
        propertyId: formData.propertyId,
        sizeSqFt: Number(formData.sizeSqFt),
        rentType: formData.rentType,
        rentAmount: Number(formData.rentAmount),
        unitType: formData.unitType,
        status: formData.status,
      };

      // Add optional fields only if they have values
      if (formData.unitNo) payload.unitNo = formData.unitNo;
      if (formData.floor) payload.floor = formData.floor;
      if (formData.type) payload.type = formData.type;

      // Handle unit type specific fields
      if (formData.unitType === 'RESIDENTIAL') {
        payload.bedrooms = Number(formData.bedrooms);
        payload.bathrooms = Number(formData.bathrooms);
        // For residential units, usage should not be sent
      } else if (formData.unitType === 'COMMERCIAL') {
        if (formData.usage) payload.usage = formData.usage;
        // For commercial units, bedrooms and bathrooms should not be sent
        payload.bedrooms = undefined;
        payload.bathrooms = undefined;
      }

      console.log('Submitting payload:', payload); // Debug log

      if (unit) {
        await unitsAPI.update(unit.id, payload);
      } else {
        await unitsAPI.create(payload);
      }
      onSuccess?.();
    } catch (err: any) {
      console.error('Error saving unit:', err);
      setError(err.message || 'Failed to save unit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {!defaultPropertyId && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Property <span className="text-red-500">*</span>
          </label>
          <select
            name="propertyId"
            value={formData.propertyId}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900"
          >
            <option value="">Select Property</option>
            {properties.map(property => (
              <option key={property.id} value={property.id} className="text-gray-900">
                {property.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Unit Number
          </label>
          <input
            type="text"
            name="unitNo"
            value={formData.unitNo}
            onChange={handleChange}
            placeholder="e.g., 7, A-12, Ground Floor"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Floor
          </label>
          <input
            type="text"
            name="floor"
            value={formData.floor}
            onChange={handleChange}
            placeholder="e.g., 3rd Floor, Ground Floor, Basement"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Unit Type <span className="text-red-500">*</span>
          </label>
          <select
            name="unitType"
            value={formData.unitType}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900"
          >
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900"
          >
            <option value="VACANT">Vacant</option>
          </select>
        </div>
      </div>

      {formData.unitType === 'COMMERCIAL' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Business Usage Type
          </label>
          <input
            type="text"
            name="usage"
            value={formData.usage}
            onChange={handleChange}
            placeholder="e.g., Boutique, Cosmetic shop, Bank, Restaurant"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Type of business for commercial units
          </p>
        </div>
      )}

      {formData.unitType === 'RESIDENTIAL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bedrooms
            </label>
            <input
              type="number"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleChange}
              min="0"
              placeholder="1"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bathrooms
            </label>
            <input
              type="number"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleChange}
              min="0"
              step="0.5"
              placeholder="1"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Size (Sq Ft) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="sizeSqFt"
            value={formData.sizeSqFt}
            onChange={handleChange}
            required
            min="0"
            placeholder="500"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Unit Type Description
          </label>
          <input
            type="text"
            name="type"
            value={formData.type}
            onChange={handleChange}
            placeholder="e.g., Studio, 1BR, Office, Retail Space"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rent Type <span className="text-red-500">*</span>
          </label>
          <select
            name="rentType"
            value={formData.rentType}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900"
          >
            <option value="FIXED">Fixed (Total Amount)</option>
            <option value="PER_SQFT">Per Sq Ft</option>
            <option value="MONTHLY">Monthly</option>
            <option value="ANNUAL">Annual</option>
            <option value="PER_ROOM">Per Room</option>
            <option value="PER_OCCUPANT">Per Occupant</option>
            <option value="PERCENT_OF_REVENUE">Percentage of Revenue</option>
            <option value="GRADUATED">Graduated</option>
            <option value="INDEXED">Indexed</option>
            <option value="TIERED">Tiered</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="NEGOTIATED">Negotiated</option>
            <option value="PARTIAL_SUBSIDY">Partial Subsidy</option>
            <option value="VARIABLE">Variable</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rent Amount (Ksh) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="rentAmount"
            step="0.01"
            value={formData.rentAmount}
            onChange={handleChange}
            required
            min="0"
            placeholder="15000"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-100">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="px-6 py-3"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-primary text-white hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {unit ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {unit ? 'Update Unit' : 'Create Unit'}
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}