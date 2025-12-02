'use client';

import { useState, useEffect } from 'react';
import { Tenant, Unit, ServiceCharge, VATType } from '@/types';
import { tenantsAPI, unitsAPI } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TenantFormProps {
  tenant?: Tenant;
  onSuccess?: () => void;
  onCancel?: () => void;
  propertyId?: string;
}

interface ServiceChargeFormData {
  type: 'FIXED' | 'PERCENTAGE' | 'PER_SQ_FT';
  fixedAmount?: number;
  percentage?: number;
  perSqFtRate?: number;
}

interface TenantFormData {
  fullName: string;
  contact: string;
  KRAPin: string;
  POBox: string;
  unitId: string;
  leaseTerm: string;
  rent: number;
  escalationRate: number;
  escalationFrequency?: 'ANNUALLY' | 'BI_ANNUALLY';
  termStart: string;
  rentStart: string;
  deposit: number;
  vatRate: number;
  vatType: VATType;
  paymentPolicy: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  serviceCharge?: ServiceChargeFormData;
}

export default function TenantForm({ tenant, onSuccess, onCancel, propertyId }: TenantFormProps) {
  const [formData, setFormData] = useState<TenantFormData>({
    fullName: '',
    contact: '',
    KRAPin: '',
    POBox: '',
    unitId: '',
    leaseTerm: '',
    rent: 0,
    escalationRate: 0,
    escalationFrequency: undefined,
    termStart: '',
    rentStart: '',
    deposit: 0,
    vatRate: 0,
    vatType: 'NOT_APPLICABLE',
    paymentPolicy: 'MONTHLY',
    serviceCharge: undefined
  });
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  useEffect(() => {
    fetchUnits();
    if (tenant) {
      setFormData({
        fullName: tenant.fullName,
        contact: tenant.contact,
        KRAPin: tenant.KRAPin,
        POBox: tenant.POBox || '',
        unitId: tenant.unitId,
        leaseTerm: tenant.leaseTerm,
        rent: tenant.rent,
        escalationRate: tenant.escalationRate || 0,
        escalationFrequency: tenant.escalationFrequency || undefined,
        termStart: tenant.termStart.split('T')[0],
        rentStart: tenant.rentStart.split('T')[0],
        deposit: tenant.deposit,
        vatRate: tenant.vatRate || 0,
        vatType: tenant.vatType,
        paymentPolicy: tenant.paymentPolicy,
        serviceCharge: tenant.serviceCharge ? {
          type: tenant.serviceCharge.type,
          fixedAmount: tenant.serviceCharge.fixedAmount || 0,
          percentage: tenant.serviceCharge.percentage || 0,
          perSqFtRate: tenant.serviceCharge.perSqFtRate || 0
        } : undefined
      });
      // Set selected unit when editing tenant
      if (tenant.unit) {
        setSelectedUnit(tenant.unit);
      }
    }
  }, [tenant]);

  const fetchUnits = async () => {
    try {
      const data = await unitsAPI.getAll();
      
      // Filter units by property first if propertyId is provided
      let filteredUnits = propertyId 
        ? data.filter(unit => unit.propertyId === propertyId)
        : data;
      
      // Then filter by availability when creating a new tenant
      if (!tenant) {
        filteredUnits = filteredUnits.filter(unit => unit.status === 'VACANT');
      }
      
      setUnits(filteredUnits);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const handleUnitChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unitId = e.target.value;
    
    // Update the unitId in form data
    setFormData(prev => ({
      ...prev,
      unitId
    }));

    // If no unit selected, clear the selected unit and rent
    if (!unitId) {
      setSelectedUnit(null);
      setFormData(prev => ({
        ...prev,
        rent: 0
      }));
      return;
    }

    // Find the selected unit from the units list
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      setSelectedUnit(unit);
      
      // Auto-populate the rent field with the unit's rentAmount
      setFormData(prev => ({
        ...prev,
        rent: unit.rentAmount
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleServiceChargeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      serviceCharge: {
        ...prev.serviceCharge!,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const handleServiceChargeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    const serviceChargeType = value as 'FIXED' | 'PERCENTAGE' | 'PER_SQ_FT';
    
    // Initialize service charge if it doesn't exist
    if (!formData.serviceCharge) {
      setFormData(prev => ({
        ...prev,
        serviceCharge: {
          type: serviceChargeType,
          fixedAmount: 0,
          percentage: 0,
          perSqFtRate: 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        serviceCharge: {
          ...prev.serviceCharge!,
          type: serviceChargeType,
          // Reset other fields when type changes
          fixedAmount: serviceChargeType === 'FIXED' ? prev.serviceCharge!.fixedAmount : 0,
          percentage: serviceChargeType === 'PERCENTAGE' ? prev.serviceCharge!.percentage : 0,
          perSqFtRate: serviceChargeType === 'PER_SQ_FT' ? prev.serviceCharge!.perSqFtRate : 0
        }
      }));
    }
  };

  const handleRemoveServiceCharge = () => {
    setFormData(prev => ({
      ...prev,
      serviceCharge: undefined
    }));
  };

  const hasServiceChargeValue = (): boolean => {
    if (!formData.serviceCharge) return false;
    
    const { type, fixedAmount, percentage, perSqFtRate } = formData.serviceCharge;
    
    switch (type) {
      case 'FIXED':
        return (fixedAmount || 0) > 0;
      case 'PERCENTAGE':
        return (percentage || 0) > 0;
      case 'PER_SQ_FT':
        return (perSqFtRate || 0) > 0;
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare data for API call
      const submitData: Partial<Tenant> = {
        fullName: formData.fullName,
        contact: formData.contact,
        KRAPin: formData.KRAPin,
        POBox: formData.POBox || undefined,
        unitId: formData.unitId,
        leaseTerm: formData.leaseTerm,
        rent: formData.rent,
        escalationRate: formData.escalationRate > 0 ? formData.escalationRate : undefined,
        escalationFrequency: formData.escalationRate > 0 ? formData.escalationFrequency : undefined,
        termStart: formData.termStart,
        rentStart: formData.rentStart,
        deposit: formData.deposit,
        vatRate: formData.vatRate > 0 ? formData.vatRate : undefined,
        vatType: formData.vatType,
        paymentPolicy: formData.paymentPolicy,
      };

      if (tenant) {
        // For updates, first update the tenant basic info
        await tenantsAPI.update(tenant.id, submitData);
        
        // Then handle service charge separately if it exists
        if (formData.serviceCharge && hasServiceChargeValue()) {
          await tenantsAPI.updateServiceCharge(tenant.id, formData.serviceCharge);
        } else if (tenant.serviceCharge && !formData.serviceCharge) {
          // Remove service charge if it was removed
          await tenantsAPI.removeServiceCharge(tenant.id);
        }
      } else {
        // For creation, create tenant first
        const newTenant = await tenantsAPI.create(submitData);
        
        // Then add service charge if it exists
        if (formData.serviceCharge && hasServiceChargeValue()) {
          await tenantsAPI.updateServiceCharge(newTenant.id, formData.serviceCharge);
        }
      }
      
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save tenant');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get unit display name
  const getUnitDisplayName = (unit: Unit): string => {
    const propertyName = unit.property?.name || 'Unknown Property';
    const unitType = unit.type || 'Unit';
    const bedrooms = unit.bedrooms;
    const bathrooms = unit.bathrooms;
    const occupancyStatus = unit.status === 'OCCUPIED' ? ' - Currently Occupied' : '';
    
    // Only show property name if propertyId is not provided
    if (propertyId) {
      return `${unitType} (${bedrooms} bed / ${bathrooms} bath)${occupancyStatus}`;
    } else {
      return `${propertyName} - ${unitType} (${bedrooms} bed / ${bathrooms} bath)${occupancyStatus}`;
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Input
        label="Full Name"
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
        required
        placeholder="John Doe"
        className="text-gray-900 placeholder:text-gray-500"
      />

      <Input
        label="Contact Information"
        name="contact"
        value={formData.contact}
        onChange={handleChange}
        required
        placeholder="0712 345 678 or john@example.com"
        className="text-gray-900 placeholder:text-gray-500"
      />

      <Input
        label="KRA PIN"
        name="KRAPin"
        value={formData.KRAPin}
        onChange={handleChange}
        required
        placeholder="P051234567X"
        className="text-gray-900 placeholder:text-gray-500"
      />

      <Input
        label="P.O. Box (Optional)"
        name="POBox"
        value={formData.POBox}
        onChange={handleChange}
        placeholder="P.O. Box 12345-00100"
        className="text-gray-900 placeholder:text-gray-500"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Unit <span className="text-red-500">*</span>
        </label>
        <select
          name="unitId"
          value={formData.unitId}
          onChange={handleUnitChange} // Updated to use handleUnitChange
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
        >
          <option value="" className="text-gray-500">Select Unit</option>
          {units.length === 0 ? (
            <option value="" disabled className="text-gray-500">
              {propertyId ? 'No available units in this property' : 'No available units'}
            </option>
          ) : (
            units.map(unit => (
              <option key={unit.id} value={unit.id} className="text-gray-900">
                {getUnitDisplayName(unit)}
              </option>
            ))
          )}
        </select>
        {propertyId && units.length === 0 && (
          <p className="mt-1 text-sm text-gray-500">
            No vacant units available in this property. Please add units or select a different property.
          </p>
        )}
        
        {/* Display unit rent information when a unit is selected */}
        {selectedUnit && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Unit Rent:</strong> {formatCurrency(selectedUnit.rentAmount)}
              {selectedUnit.rentType && (
                <span className="ml-2 text-blue-600">
                  ({selectedUnit.rentType.replace(/_/g, ' ').toLowerCase()})
                </span>
              )}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              This rent amount has been auto-populated. You can adjust it based on the negotiated rate with the tenant.
            </p>
          </div>
        )}
      </div>

      <Input
        label="Lease Term"
        name="leaseTerm"
        value={formData.leaseTerm}
        onChange={handleChange}
        required
        placeholder="e.g., 12 months"
        className="text-gray-900 placeholder:text-gray-500"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Rent (Ksh)" // Changed from "Monthly Rent (Ksh)" to "Rent (Ksh)"
            name="rent"
            type="number"
            step="0.01"
            value={formData.rent}
            onChange={handleChange}
            required
            min="0"
            placeholder="15000"
            className="text-gray-900 placeholder:text-gray-500"
          />
          {selectedUnit && formData.rent !== selectedUnit.rentAmount && (
            <p className="mt-1 text-xs text-amber-600">
              Note: This differs from the unit's listed rent ({formatCurrency(selectedUnit.rentAmount)})
            </p>
          )}
        </div>

        <Input
          label="Rent Escalation Rate (%)"
          name="escalationRate"
          type="number"
          step="0.1"
          value={formData.escalationRate}
          onChange={handleChange}
          min="0"
          placeholder="3.0"
          className="text-gray-900 placeholder:text-gray-500"
        />
      </div>

      {formData.escalationRate > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Escalation Frequency <span className="text-red-500">*</span>
          </label>
          <select
            name="escalationFrequency"
            value={formData.escalationFrequency}
            onChange={handleChange}
            required={formData.escalationRate > 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
          >
            <option value="" className="text-gray-500">Select Frequency</option>
            <option value="ANNUALLY" className="text-gray-900">Annually</option>
            <option value="BI_ANNUALLY" className="text-gray-900">Bi-Annually</option>
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Lease Start Date"
          name="termStart"
          type="date"
          value={formData.termStart}
          onChange={handleChange}
          required
          className="text-gray-900"
        />

        <Input
          label="Rent Start Date"
          name="rentStart"
          type="date"
          value={formData.rentStart}
          onChange={handleChange}
          required
          className="text-gray-900"
        />
      </div>

      <Input
        label="Security Deposit (Ksh)"
        name="deposit"
        type="number"
        step="0.01"
        value={formData.deposit}
        onChange={handleChange}
        required
        min="0"
        placeholder="20000"
        className="text-gray-900 placeholder:text-gray-500"
      />

      {/* VAT Configuration Section */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">VAT Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              VAT Type <span className="text-red-500">*</span>
            </label>
            <select
              name="vatType"
              value={formData.vatType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
            >
              <option value="NOT_APPLICABLE">Not Applicable</option>
              <option value="INCLUSIVE">VAT Inclusive</option>
              <option value="EXCLUSIVE">VAT Exclusive</option>
            </select>
          </div>

          {(formData.vatType === 'INCLUSIVE' || formData.vatType === 'EXCLUSIVE') && (
            <Input
              label="VAT Rate (%)"
              name="vatRate"
              type="number"
              step="0.1"
              value={formData.vatRate}
              onChange={handleChange}
              required={formData.vatType === 'INCLUSIVE' || formData.vatType === 'EXCLUSIVE'}
              min="0"
              max="100"
              placeholder="16.0"
              className="text-gray-900 placeholder:text-gray-500"
            />
          )}
        </div>

        {formData.vatType !== 'NOT_APPLICABLE' && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              {formData.vatType === 'INCLUSIVE' 
                ? `VAT of ${formData.vatRate}% is included in the rent amount.`
                : `VAT of ${formData.vatRate}% will be added on top of the rent amount.`
              }
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Policy <span className="text-red-500">*</span>
        </label>
        <select
          name="paymentPolicy"
          value={formData.paymentPolicy}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
        >
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="ANNUAL">Annual</option>
        </select>
      </div>

      {/* Service Charge Section */}
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Service Charge</h3>
          {formData.serviceCharge && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRemoveServiceCharge}
            >
              Remove Service Charge
            </Button>
          )}
        </div>
        
        {!formData.serviceCharge ? (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-3">No service charge configured</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleServiceChargeTypeChange({ target: { value: 'FIXED' } } as any)}
            >
              Add Service Charge
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Charge Type
              </label>
              <select
                name="serviceChargeType"
                value={formData.serviceCharge.type}
                onChange={handleServiceChargeTypeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              >
                <option value="FIXED">Fixed Amount</option>
                <option value="PERCENTAGE">Percentage of Rent</option>
                <option value="PER_SQ_FT">Per Square Foot</option>
              </select>
            </div>

            {formData.serviceCharge.type === 'FIXED' && (
              <Input
                label="Fixed Amount (Ksh)"
                name="fixedAmount"
                type="number"
                step="0.01"
                value={formData.serviceCharge.fixedAmount || 0}
                onChange={handleServiceChargeChange}
                min="0"
                placeholder="1000"
                className="text-gray-900 placeholder:text-gray-500"
              />
            )}

            {formData.serviceCharge.type === 'PERCENTAGE' && (
              <Input
                label="Percentage (%)"
                name="percentage"
                type="number"
                step="0.1"
                value={formData.serviceCharge.percentage || 0}
                onChange={handleServiceChargeChange}
                min="0"
                max="100"
                placeholder="5.0"
                className="text-gray-900 placeholder:text-gray-500"
              />
            )}

            {formData.serviceCharge.type === 'PER_SQ_FT' && (
              <Input
                label="Rate Per Square Foot (Ksh)"
                name="perSqFtRate"
                type="number"
                step="0.01"
                value={formData.serviceCharge.perSqFtRate || 0}
                onChange={handleServiceChargeChange}
                min="0"
                placeholder="2.5"
                className="text-gray-900 placeholder:text-gray-500"
              />
            )}
          </div>
        )}
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
          className="px-6 py-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {tenant ? 'Updating...' : 'Creating...'}
            </span>
          ) : tenant ? 'Update Tenant' : 'Create Tenant'}
        </Button>
      </div>
    </form>
  );
}