'use client';

import { useState, useEffect } from 'react';
import { Lead, Property } from '@/types';
import { leadsAPI, propertiesAPI } from '@/lib/api';
//import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LeadFormProps {
  lead?: Lead;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Draft storage key generator
const getDraftKey = (leadId?: string) => 
  leadId ? `lead_form_draft_${leadId}` : 'lead_form_draft_new';

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
  const [hasDraft, setHasDraft] = useState(false);

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const draftKey = getDraftKey(lead?.id);
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
      const draftKey = getDraftKey(lead?.id);
      localStorage.setItem(draftKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    try {
      const draftKey = getDraftKey(lead?.id);
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  useEffect(() => {
    fetchProperties();
    
    if (lead) {
      // Editing existing lead - check for draft first
      const draftLoaded = loadDraft();
      
      if (!draftLoaded) {
        // No draft found, use lead data
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
    } else {
      // Creating new lead - try to load draft
      loadDraft();
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
    const newFormData = {
      ...formData,
      [e.target.name]: e.target.value
    };
    
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
      
      // Clear draft after successful submission
      clearDraft();
      
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  const handleClearDraft = () => {
    if (confirm('Are you sure you want to clear the saved draft? This action cannot be undone.')) {
      // Reset to original data
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
      } else {
        // Clear form for new lead
        setFormData({
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
      }
      clearDraft();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name *
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Full name"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone *
          </label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="+254 7XX XXX XXX"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ID Number
          </label>
          <input
            name="idNumber"
            value={formData.idNumber}
            onChange={handleChange}
            placeholder="National ID number"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Company Name
        </label>
        <input
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          placeholder="Company name (if applicable)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Address
        </label>
        <input
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Street, City, County"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nature of Lead
        </label>
        <input
          name="natureOfLead"
          value={formData.natureOfLead}
          onChange={handleChange}
          placeholder="e.g., Rental inquiry, Property viewing, Commercial lease, etc."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Property
        </label>
        <select
          name="propertyId"
          value={formData.propertyId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="" className="text-gray-500 dark:text-gray-400">
            Select Property (Optional)
          </option>
          {properties.map(property => (
            <option key={property.id} value={property.id} className="text-gray-900 dark:text-gray-100">
              {property.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          placeholder="Additional notes about the lead..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
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