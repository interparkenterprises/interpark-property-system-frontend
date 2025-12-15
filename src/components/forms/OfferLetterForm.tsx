'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { offerLettersAPI } from '@/lib/api';
import { propertiesAPI } from '@/lib/api';
import { leadsAPI } from '@/lib/api';
import { unitsAPI } from '@/lib/api';
import type { Property, Lead, Unit, OfferStatus, LetterType, UsageType } from '@/types';

interface OfferLetterFormProps {
  offerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Draft storage key generator
const getDraftKey = (offerId?: string) => 
  offerId ? `offer_form_draft_${offerId}` : 'offer_form_draft_new';

export default function OfferLetterForm({ offerId, onSuccess, onCancel }: OfferLetterFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isMixedUse, setIsMixedUse] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const [formData, setFormData] = useState({
    leadId: '',
    propertyId: '',
    unitId: '',
    letterType: '' as LetterType | '',
    rentAmount: '',
    deposit: '',
    leaseTerm: '',
    serviceCharge: '',
    escalationRate: '',
    expiryDate: '',
    additionalTerms: '',
    notes: '',
    // Commercial fields
    rentPerSqFt: '',
    serviceChargePerSqFt: '',
    useOfPremises: '',
    fitOutPeriodMonths: '',
    depositMonths: '',
    advanceRentMonths: '',
    // Residential fields
    escalationFrequency: '' as 'ANNUALLY' | 'BI_ANNUALLY' | '',
  });

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const draftKey = getDraftKey(offerId);
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
      const draftKey = getDraftKey(offerId);
      localStorage.setItem(draftKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    try {
      const draftKey = getDraftKey(offerId);
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchLeads();
    
    // Try to load draft
    loadDraft();
  }, []);

  useEffect(() => {
    if (formData.propertyId) {
      fetchUnits(formData.propertyId);
      const property = properties.find(p => p.id === formData.propertyId);
      setSelectedProperty(property || null);
      setIsMixedUse(property?.usage === 'MIXED_USE');
      
      // Clear unit selection when property changes
      if (formData.unitId) {
        const newFormData = { ...formData, unitId: '' };
        setFormData(newFormData);
        setSelectedUnit(null);
        saveDraft(newFormData);
      }
    } else {
      setUnits([]);
      setSelectedProperty(null);
      setSelectedUnit(null);
      setIsMixedUse(false);
    }
  }, [formData.propertyId, properties]);

  useEffect(() => {
    // Auto-populate fields when a unit is selected
    if (selectedUnit) {
      const newFormData = {
        ...formData,
        rentAmount: selectedUnit.rentAmount.toString(),
        // Auto-populate additional fields based on unit data
        rentPerSqFt: selectedUnit.rentType === 'PER_SQFT' && selectedUnit.calculationInfo?.ratePerSqFt 
          ? selectedUnit.calculationInfo.ratePerSqFt.toString() 
          : formData.rentPerSqFt,
        // Set default deposit (typically 1-2 months rent)
        deposit: selectedUnit.rentAmount ? (selectedUnit.rentAmount * 2).toString() : formData.deposit,
        // Set unit type for commercial/residential determination
        ...(selectedUnit.unitType === 'COMMERCIAL' && {
          useOfPremises: selectedUnit.usage || 'Commercial Space'
        })
      };
      
      setFormData(newFormData);
      saveDraft(newFormData);
    }
  }, [selectedUnit]);

  const fetchProperties = async () => {
    try {
      const data = await propertiesAPI.getAll();
      setProperties(data);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      const data = await leadsAPI.getAll();
      setLeads(data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    }
  };

  const fetchUnits = async (propertyId: string) => {
    try {
      const data = await unitsAPI.getByProperty(propertyId);
      setUnits(data.filter(unit => unit.status === 'VACANT'));
    } catch (error) {
      console.error('Failed to fetch units:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let newFormData = { ...formData };
    
    if (name === 'propertyId') {
      // Clear unit-related data when property changes
      if (formData.propertyId !== value) {
        setSelectedUnit(null);
        newFormData = { 
          ...newFormData, 
          [name]: value,
          unitId: '',
          rentAmount: '',
          rentPerSqFt: '',
          deposit: ''
        };
      } else {
        newFormData = { ...newFormData, [name]: value };
      }
    } else if (name === 'unitId') {
      const unit = units.find(u => u.id === value);
      setSelectedUnit(unit || null);
      newFormData = { ...newFormData, [name]: value };
    } else {
      newFormData = { ...newFormData, [name]: value };
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

    try {
      // Prepare payload based on the selected unit and form data
      const payload: any = {
        leadId: formData.leadId,
        propertyId: formData.propertyId,
        unitId: formData.unitId || undefined,
        rentAmount: formData.rentAmount ? parseFloat(formData.rentAmount) : undefined,
        deposit: formData.deposit ? parseFloat(formData.deposit) : undefined,
        leaseTerm: formData.leaseTerm || undefined,
        serviceCharge: formData.serviceCharge ? parseFloat(formData.serviceCharge) : undefined,
        escalationRate: formData.escalationRate ? parseFloat(formData.escalationRate) : undefined,
        expiryDate: formData.expiryDate || undefined,
        additionalTerms: formData.additionalTerms || undefined,
        notes: formData.notes || undefined,
      };

      // Determine letter type if not explicitly set
      if (!formData.letterType && selectedUnit) {
        payload.letterType = selectedUnit.unitType === 'COMMERCIAL' ? 'COMMERCIAL' : 'RESIDENTIAL';
      } else if (formData.letterType) {
        payload.letterType = formData.letterType;
      }

      // Add commercial fields
      if (formData.rentPerSqFt) payload.rentPerSqFt = parseFloat(formData.rentPerSqFt);
      if (formData.serviceChargePerSqFt) payload.serviceChargePerSqFt = parseFloat(formData.serviceChargePerSqFt);
      if (formData.useOfPremises) payload.useOfPremises = formData.useOfPremises;
      if (formData.fitOutPeriodMonths) payload.fitOutPeriodMonths = parseInt(formData.fitOutPeriodMonths);
      if (formData.depositMonths) payload.depositMonths = parseInt(formData.depositMonths);
      if (formData.advanceRentMonths) payload.advanceRentMonths = parseInt(formData.advanceRentMonths);

      // Add residential fields
      if (formData.escalationFrequency) payload.escalationFrequency = formData.escalationFrequency;

      // Use appropriate endpoint
      if (isMixedUse && formData.letterType) {
        payload.letterType = formData.letterType;
        await offerLettersAPI.createMixedUse(payload);
      } else {
        await offerLettersAPI.create(payload);
      }

      // Clear draft after successful submission
      clearDraft();

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/offers');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to create offer letter:', error);
      alert('Failed to create offer letter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearDraft = () => {
    if (confirm('Are you sure you want to clear the saved draft? This action cannot be undone.')) {
      // Reset form to empty state
      setFormData({
        leadId: '',
        propertyId: '',
        unitId: '',
        letterType: '' as LetterType | '',
        rentAmount: '',
        deposit: '',
        leaseTerm: '',
        serviceCharge: '',
        escalationRate: '',
        expiryDate: '',
        additionalTerms: '',
        notes: '',
        rentPerSqFt: '',
        serviceChargePerSqFt: '',
        useOfPremises: '',
        fitOutPeriodMonths: '',
        depositMonths: '',
        advanceRentMonths: '',
        escalationFrequency: '' as 'ANNUALLY' | 'BI_ANNUALLY' | '',
      });
      setSelectedProperty(null);
      setSelectedUnit(null);
      setIsMixedUse(false);
      clearDraft();
    }
  };

  const getPropertyTypeLabel = () => {
    if (!selectedProperty) return '';
    if (selectedProperty.usage === 'MIXED_USE') return 'Mixed Use Property';
    if (selectedProperty.usage === 'COMMERCIAL') return 'Commercial Property';
    if (selectedProperty.usage === 'RESIDENTIAL') return 'Residential Property';
    return selectedProperty.usage;
  };

  const getUnitDetails = () => {
    if (!selectedUnit) return null;
    
    return (
      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-medium text-blue-800 dark:text-blue-300">Selected Unit Details</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Unit No:</span>
            <span className="ml-2 font-medium">{selectedUnit.unitNo || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Size:</span>
            <span className="ml-2 font-medium">{selectedUnit.sizeSqFt} sq ft</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Type:</span>
            <span className="ml-2 font-medium">{selectedUnit.unitType}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Rent Type:</span>
            <span className="ml-2 font-medium">{selectedUnit.rentType}</span>
          </div>
        </div>
        {selectedUnit.calculationInfo && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            {selectedUnit.calculationInfo.formula && (
              <p>Formula: {selectedUnit.calculationInfo.formula}</p>
            )}
            {selectedUnit.calculationInfo.ratePerSqFt && (
              <p>Rate: KES {selectedUnit.calculationInfo.ratePerSqFt}/sq ft</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      {/* Draft Banner */}
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

      <div className="border-b pb-4 border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Offer Letter</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Generate an offer letter for a prospective tenant
        </p>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lead <span className="text-red-500">*</span>
          </label>
          <select
            name="leadId"
            value={formData.leadId}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="" className="text-gray-500 dark:text-gray-400">Select a lead</option>
            {leads.map(lead => (
              <option key={lead.id} value={lead.id} className="text-gray-900 dark:text-gray-100">
                {lead.name} - {lead.phone}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Property <span className="text-red-500">*</span>
          </label>
          <select
            name="propertyId"
            value={formData.propertyId}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="" className="text-gray-500 dark:text-gray-400">Select a property</option>
            {properties.map(property => (
              <option key={property.id} value={property.id} className="text-gray-900 dark:text-gray-100">
                {property.name} - {property.address}
              </option>
            ))}
          </select>
          {selectedProperty && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getPropertyTypeLabel()}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Unit (Optional)
          </label>
          <select
            name="unitId"
            value={formData.unitId}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            disabled={!formData.propertyId || units.length === 0}
          >
            <option value="" className="text-gray-500 dark:text-gray-400">
              {!formData.propertyId ? 'Select a property first' : 
               units.length === 0 ? 'No vacant units available' : 
               'Select a unit'}
            </option>
            {units.map(unit => (
              <option key={unit.id} value={unit.id} className="text-gray-900 dark:text-gray-100">
                Unit {unit.unitNo} - {unit.sizeSqFt} sq ft - KES {unit.rentAmount.toLocaleString()}
              </option>
            ))}
          </select>
          {units.length > 0 && !formData.unitId && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {units.length} vacant unit(s) available
            </p>
          )}
          {selectedUnit && getUnitDetails()}
        </div>

        {isMixedUse && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Letter Type <span className="text-red-500">*</span>
            </label>
            <select
              name="letterType"
              value={formData.letterType}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="" className="text-gray-500 dark:text-gray-400">Select letter type</option>
              <option value="COMMERCIAL" className="text-gray-900 dark:text-gray-100">Commercial</option>
              <option value="RESIDENTIAL" className="text-gray-900 dark:text-gray-100">Residential</option>
            </select>
          </div>
        )}
      </div>

      {/* Financial Terms */}
      <div className="border-t pt-6 border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Financial Terms</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rent Amount (KES) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="rentAmount"
              value={formData.rentAmount}
              onChange={handleChange}
              required
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="50000.00"
            />
            {selectedUnit && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Based on unit: KES {selectedUnit.rentAmount.toLocaleString()}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deposit (KES) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="deposit"
              value={formData.deposit}
              onChange={handleChange}
              required
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="50000.00"
            />
            {selectedUnit && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Suggested: KES {(selectedUnit.rentAmount * 2).toLocaleString()} (2 months rent)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Service Charge (KES)
            </label>
            <input
              type="number"
              name="serviceCharge"
              value={formData.serviceCharge}
              onChange={handleChange}
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="5000.00"
            />
          </div>
        </div>
      </div>

      {/* Commercial-Specific Fields */}
      {(selectedProperty?.usage === 'COMMERCIAL' || 
        (isMixedUse && formData.letterType === 'COMMERCIAL') ||
        selectedUnit?.unitType === 'COMMERCIAL') && (
        <div className="border-t pt-6 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Commercial Terms</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rent per Sq Ft (KES)
              </label>
              <input
                type="number"
                name="rentPerSqFt"
                value={formData.rentPerSqFt}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="50.00"
              />
              {selectedUnit?.rentType === 'PER_SQFT' && selectedUnit.calculationInfo?.ratePerSqFt && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Unit rate: KES {selectedUnit.calculationInfo.ratePerSqFt}/sq ft
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Service Charge per Sq Ft (KES)
              </label>
              <input
                type="number"
                name="serviceChargePerSqFt"
                value={formData.serviceChargePerSqFt}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="5.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fit-Out Period (Months)
              </label>
              <input
                type="number"
                name="fitOutPeriodMonths"
                value={formData.fitOutPeriodMonths}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="3"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Use of Premises
              </label>
              <input
                type="text"
                name="useOfPremises"
                value={formData.useOfPremises}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Retail shop, Office space, etc."
              />
              {selectedUnit?.usage && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Unit usage: {selectedUnit.usage}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deposit (Months)
              </label>
              <input
                type="number"
                name="depositMonths"
                value={formData.depositMonths}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Advance Rent (Months)
              </label>
              <input
                type="number"
                name="advanceRentMonths"
                value={formData.advanceRentMonths}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Lease Terms */}
      <div className="border-t pt-6 border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Lease Terms</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lease Term <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="leaseTerm"
              value={formData.leaseTerm}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="12 months, 2 years, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Escalation Rate (%)
            </label>
            <input
              type="number"
              name="escalationRate"
              value={formData.escalationRate}
              onChange={handleChange}
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="5.00"
            />
          </div>

          {(selectedProperty?.usage === 'RESIDENTIAL' || 
            (isMixedUse && formData.letterType === 'RESIDENTIAL') ||
            selectedUnit?.unitType === 'RESIDENTIAL') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Escalation Frequency
              </label>
              <select
                name="escalationFrequency"
                value={formData.escalationFrequency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="" className="text-gray-500 dark:text-gray-400">Select frequency</option>
                <option value="ANNUALLY" className="text-gray-900 dark:text-gray-100">Annually</option>
                <option value="BI_ANNUALLY" className="text-gray-900 dark:text-gray-100">Bi-Annually</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Offer Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="border-t pt-6 border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Additional Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Terms
            </label>
            <textarea
              name="additionalTerms"
              value={formData.additionalTerms}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Any special terms or conditions..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Internal Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Internal notes (not visible to client)..."
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 border-t pt-6 border-gray-200 dark:border-gray-700">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Offer Letter'}
        </button>
      </div>
    </form>
  );
}