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

// Draft storage key generator
const getDraftKey = (unitId?: string, defaultPropertyId?: string) => 
  unitId 
    ? `unit_form_draft_${unitId}` 
    : `unit_form_draft_new_${defaultPropertyId || 'default'}`;

export default function UnitForm({ 
  unit, 
  onSuccess, 
  onCancel, 
  defaultPropertyId 
}: UnitFormProps) {
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
  const [hasDraft, setHasDraft] = useState(false);

  // Load draft from localStorage
  const loadDraft = (): boolean => {
    try {
      const draftKey = getDraftKey(unit?.id, defaultPropertyId);
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
      const draftKey = getDraftKey(unit?.id, defaultPropertyId);
      localStorage.setItem(draftKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    try {
      const draftKey = getDraftKey(unit?.id, defaultPropertyId);
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  // Reset form to default values
  const resetForm = () => {
    setFormData({
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
    setError('');
  };

  // Handle clear draft confirmation
  const handleClearDraft = () => {
    if (confirm('Are you sure you want to clear the saved draft? This action cannot be undone.')) {
      if (unit) {
        // Reset to unit data
        setFormData({
          propertyId: unit.propertyId,
          unitNo: unit.unitNo || '',
          floor: unit.floor || '',
          unitType: unit.unitType,
          usage: unit.usage || '',
          bedrooms: unit.bedrooms || 0,
          bathrooms: unit.bathrooms || 0,
          sizeSqFt: unit.sizeSqFt || 0,
          type: unit.type || '',
          status: unit.status,
          rentType: unit.rentType,
          rentAmount: unit.rentAmount || 0,
        });
      } else {
        resetForm();
      }
      clearDraft();
    }
  };

  useEffect(() => {
    if (!defaultPropertyId) {
      fetchProperties();
    }
    
    if (unit) {
      // Editing existing unit - check for draft first
      const draftLoaded = loadDraft();
      if (!draftLoaded) {
        // No draft found, use unit data
        setFormData({
          propertyId: unit.propertyId,
          unitNo: unit.unitNo || '',
          floor: unit.floor || '',
          unitType: unit.unitType,
          usage: unit.usage || '',
          bedrooms: unit.bedrooms || 0,
          bathrooms: unit.bathrooms || 0,
          sizeSqFt: unit.sizeSqFt || 0,
          type: unit.type || '',
          status: unit.status,
          rentType: unit.rentType,
          rentAmount: unit.rentAmount || 0,
        });
      }
    } else {
      // Creating new unit - try to load draft
      loadDraft();
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
    const newFormData = type === 'number' 
      ? { ...formData, [name]: value ? parseFloat(value) : 0 }
      : { ...formData, [name]: value };
    
    setFormData(newFormData);
    
    // Auto-save draft on every change
    saveDraft(newFormData);
    
    // Mark as having draft data
    if (!hasDraft) {
      setHasDraft(true);
    }
    
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.propertyId) {
      setError('Property is required.');
      setLoading(false);
      return;
    }
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
      } else if (formData.unitType === 'COMMERCIAL') {
        if (formData.usage) payload.usage = formData.usage;
        payload.bedrooms = undefined;
        payload.bathrooms = undefined;
      }

      if (unit) {
        await unitsAPI.update(unit.id, payload);
      } else {
        await unitsAPI.create(payload);
      }
      
      // Clear draft after successful submission
      clearDraft();
      
      onSuccess?.();
    } catch (err: any) {
      console.error('Error saving unit:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save unit');
    } finally {
      setLoading(false);
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
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 fill-none stroke-current" viewBox="0 0 24 24">
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
            <option value="OCCUPIED">Occupied</option>
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
          <p className="mt-1 text-xs text-gray-500">Type of business for commercial units</p>
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
              min={0}
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
              min={0}
              step={0.5}
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
            min={0}
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
            <option value="FIXED">Fixed Total Amount</option>
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
            min={0}
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
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-primary text-white hover:bg-primary-90 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5 mr-2 fill-none stroke-current" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {unit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2 fill-none stroke-current" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {unit ? 'Update Unit' : 'Create Unit'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
