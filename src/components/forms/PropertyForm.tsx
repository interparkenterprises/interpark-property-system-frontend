'use client';

import { useState, useEffect, forwardRef } from 'react';
import { Property, Landlord, PropertyForm as PropertyFormType, UsageType } from '@/types';
import { propertiesAPI, landlordsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface PropertyFormProps {
  property?: Property;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PropertyForm = forwardRef<HTMLFormElement, PropertyFormProps>(
  ({ property, onSuccess, onCancel }, ref) => {
    const [formData, setFormData] = useState({
      name: '',
      address: '',
      lrNumber: '',
      form: 'APARTMENT' as PropertyFormType,
      usage: 'RESIDENTIAL' as UsageType,
      landlordId: '',
      landlordName: '',
      landlordEmail: '',
      landlordPhone: '',
      landlordAddress: '',
      landlordIdNumber: '',
      commissionFee: 0,
      image: '',
      // Bank details
      accountNo: '',
      accountName: '',
      bank: '',
      branch: '',
      branchCode: '',
    });
    const [landlords, setLandlords] = useState<Landlord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [landlordMode, setLandlordMode] = useState<'existing' | 'new'>('existing');

    useEffect(() => {
      fetchLandlords();
      if (property) {
        setLandlordMode(property.landlordId ? 'existing' : 'new');
        setFormData({
          name: property.name || '',
          address: property.address || '',
          lrNumber: property.lrNumber || '',
          form: property.form || 'APARTMENT',
          usage: property.usage || 'RESIDENTIAL',
          landlordId: property.landlordId || '',
          landlordName: property.landlord?.name || '',
          landlordEmail: property.landlord?.email || '',
          landlordPhone: property.landlord?.phone || '',
          landlordAddress: property.landlord?.address || '',
          landlordIdNumber: property.landlord?.idNumber || '',
          commissionFee: property.commissionFee || 0,
          image: property.image || '',
          // Bank details
          accountNo: property.accountNo || '',
          accountName: property.accountName || '',
          bank: property.bank || '',
          branch: property.branch || '',
          branchCode: property.branchCode || '',
        });
      }
    }, [property]);

    const fetchLandlords = async () => {
      try {
        const data = await landlordsAPI.getAll();
        setLandlords(data);
      } catch (error) {
        console.error('Error fetching landlords:', error);
        setError('Failed to load landlords. Please try again.');
      }
    };

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
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

      if (!formData.name.trim() || !formData.address.trim()) {
        setError('Property name and address are required.');
        setLoading(false);
        return;
      }

      if (landlordMode === 'existing' && !formData.landlordId) {
        setError('Please select a landlord.');
        setLoading(false);
        return;
      }

      if (landlordMode === 'new' && !formData.landlordName.trim()) {
        setError('Landlord name is required.');
        setLoading(false);
        return;
      }

      try {
        const payload: any = {
          name: formData.name,
          address: formData.address,
          lrNumber: formData.lrNumber || null,
          form: formData.form,
          usage: formData.usage,
          commissionFee: formData.commissionFee || null,
          image: formData.image || null,
          // Bank details
          accountNo: formData.accountNo || null,
          accountName: formData.accountName || null,
          bank: formData.bank || null,
          branch: formData.branch || null,
          branchCode: formData.branchCode || null,
        };

        if (landlordMode === 'existing') {
          payload.landlordId = formData.landlordId;
        } else {
          payload.landlord = {
            name: formData.landlordName.trim(),
            email: formData.landlordEmail.trim() || null,
            phone: formData.landlordPhone.trim() || null,
            address: formData.landlordAddress.trim() || null,
            idNumber: formData.landlordIdNumber.trim() || null,
          };
        }

        if (property) {
          await propertiesAPI.update(property.id, payload);
        } else {
          await propertiesAPI.create(payload);
        }

        onSuccess?.();
      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          err.message ||
          'Failed to save property. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className="space-y-5"
        noValidate
      >
        {/* Error Banner */}
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {/* Property Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g. InterPark Heights"
            disabled={loading}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            placeholder="Street, City, County"
            disabled={loading}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
          />
        </div>

        {/* LR Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            LR Number (Optional)
          </label>
          <input
            type="text"
            name="lrNumber"
            value={formData.lrNumber}
            onChange={handleChange}
            placeholder="e.g. LR/12345/2020"
            disabled={loading}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
          />
        </div>

        {/* Property Form (Building Type) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Form (Building Type) *
          </label>
          <select
            name="form"
            value={formData.form}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-black"
          >
            <option value="APARTMENT" className="text-black">Apartment</option>
            <option value="BUNGALOW" className="text-black">Bungalow</option>
            <option value="VILLA" className="text-black">Villa</option>
            <option value="DUPLEX" className="text-black">Duplex</option>
            <option value="TOWNHOUSE" className="text-black">Townhouse</option>
            <option value="MAISONETTE" className="text-black">Maisonette</option>
            <option value="OFFICE" className="text-black">Office</option>
            <option value="SHOP" className="text-black">Shop</option>
            <option value="WAREHOUSE" className="text-black">Warehouse</option>
            <option value="INDUSTRIAL_BUILDING" className="text-black">Industrial Building</option>
            <option value="RETAIL_CENTER" className="text-black">Retail Center</option>
          </select>
        </div>

        {/* Usage Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usage Type *
          </label>
          <select
            name="usage"
            value={formData.usage}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-black"
          >
            <option value="RESIDENTIAL" className="text-black">Residential</option>
            <option value="COMMERCIAL" className="text-black">Commercial</option>
            <option value="INDUSTRIAL" className="text-black">Industrial</option>
            <option value="INSTITUTIONAL" className="text-black">Institutional</option>
            <option value="MIXED_USE" className="text-black">Mixed Use</option>
          </select>
        </div>

        {/* Commission Fee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commission Fee (%) (Optional)
          </label>
          <input
            type="number"
            name="commissionFee"
            value={formData.commissionFee}
            onChange={handleChange}
            min="0"
            max="100"
            step="0.1"
            placeholder="e.g., 5.0"
            disabled={loading}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
          />
          <p className="mt-1 text-xs text-gray-500">
            Manager's commission percentage for this property (0-100%)
          </p>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL (Optional)
          </label>
          <input
            type="url"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/property-image.jpg"
            disabled={loading}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
          />
          <p className="mt-1 text-xs text-gray-500">
            URL or path to property image
          </p>
        </div>

        {/* BANK DETAILS SECTION */}
        <div className="border-t pt-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Details (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                name="accountNo"
                value={formData.accountNo}
                onChange={handleChange}
                placeholder="e.g. 1234567890"
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
              />
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name
              </label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
              />
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                name="bank"
                value={formData.bank}
                onChange={handleChange}
                placeholder="e.g. Equity Bank"
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch
              </label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                placeholder="e.g. Westlands Branch"
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
              />
            </div>

            {/* Branch Code */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch Code
              </label>
              <input
                type="text"
                name="branchCode"
                value={formData.branchCode}
                onChange={handleChange}
                placeholder="e.g. 068"
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Bank details for rent payments and financial transactions
          </p>
        </div>

        {/* LANDLORD SELECTION MODE TOGGLE */}
        <div className="border-t pt-5">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Landlord Assignment
          </label>
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              type="button"
              onClick={() => setLandlordMode('existing')}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                landlordMode === 'existing'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              ✅ Select Existing Landlord
            </button>
            <button
              type="button"
              onClick={() => setLandlordMode('new')}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                landlordMode === 'new'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              ➕ Add New Landlord
            </button>
          </div>

          {/* Existing Landlord */}
          {landlordMode === 'existing' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Landlord *
              </label>
              <select
                name="landlordId"
                value={formData.landlordId}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-black"
              >
                <option value="" className="text-black">— Choose a landlord —</option>
                {landlords.map((landlord) => (
                  <option key={landlord.id} value={landlord.id} className="text-black">
                    {landlord.name} {landlord.phone ? `• ${landlord.phone}` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                You can manage landlords in the <strong>Landlords</strong> section.
              </p>
            </div>
          )}

          {/* New Landlord */}
          {landlordMode === 'new' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">New Landlord Details</h4>
              
              {/* Landlord Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Landlord Name *
                </label>
                <input
                  type="text"
                  name="landlordName"
                  value={formData.landlordName}
                  onChange={handleChange}
                  placeholder="Full name"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
                />
              </div>

              {/* Landlord ID Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number (Optional)
                </label>
                <input
                  type="text"
                  name="landlordIdNumber"
                  value={formData.landlordIdNumber}
                  onChange={handleChange}
                  placeholder="National ID number"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
                />
              </div>

              {/* Landlord Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="landlordEmail"
                  value={formData.landlordEmail}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
                />
              </div>

              {/* Landlord Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  name="landlordPhone"
                  value={formData.landlordPhone}
                  onChange={handleChange}
                  placeholder="+254 7XX XXX XXX"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
                />
              </div>

              {/* Landlord Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  name="landlordAddress"
                  value={formData.landlordAddress}
                  onChange={handleChange}
                  placeholder="Street, City"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-black placeholder:opacity-70 text-black"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2.5"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow transition-shadow"
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : property ? (
              'Update Property'
            ) : (
              '✅ Create Property'
            )}
          </Button>
        </div>
      </form>
    );
  }
);

PropertyForm.displayName = 'PropertyForm';

export default PropertyForm;