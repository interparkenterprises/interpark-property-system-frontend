'use client';

import { useState, useEffect, forwardRef, ChangeEvent } from 'react';
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
      imageFile: null as File | null, // Changed from image URL to File
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
    const [imagePreview, setImagePreview] = useState<string | null>(null);

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
          imageFile: null, // Keep as null since we can't get File from URL
          // Bank details
          accountNo: property.accountNo || '',
          accountName: property.accountName || '',
          bank: property.bank || '',
          branch: property.branch || '',
          branchCode: property.branchCode || '',
        });
        
        // If property has an image URL, set it as preview
        if (property.image) {
          setImagePreview(property.image);
        }
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

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, WebP, GIF).');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Image size should be less than 5MB.');
        return;
      }

      // Update form data
      setFormData(prev => ({
        ...prev,
        imageFile: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Clear any previous errors
      setError('');
    };

    const removeImage = () => {
      setFormData(prev => ({
        ...prev,
        imageFile: null
      }));
      setImagePreview(null);
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
        // Create FormData for file upload
        const formDataToSend = new FormData();
        
        // Add text fields
        formDataToSend.append('name', formData.name);
        formDataToSend.append('address', formData.address);
        if (formData.lrNumber) formDataToSend.append('lrNumber', formData.lrNumber);
        formDataToSend.append('form', formData.form);
        formDataToSend.append('usage', formData.usage);
        if (formData.commissionFee) formDataToSend.append('commissionFee', formData.commissionFee.toString());
        
        // Add bank details
        if (formData.accountNo) formDataToSend.append('accountNo', formData.accountNo);
        if (formData.accountName) formDataToSend.append('accountName', formData.accountName);
        if (formData.bank) formDataToSend.append('bank', formData.bank);
        if (formData.branch) formDataToSend.append('branch', formData.branch);
        if (formData.branchCode) formDataToSend.append('branchCode', formData.branchCode);

        // Add image file if selected
        if (formData.imageFile) {
          formDataToSend.append('image', formData.imageFile);
        }

        // Add landlord data
        if (landlordMode === 'existing') {
          formDataToSend.append('landlordId', formData.landlordId);
        } else {
          const landlordData = {
            name: formData.landlordName.trim(),
            email: formData.landlordEmail.trim() || null,
            phone: formData.landlordPhone.trim() || null,
            address: formData.landlordAddress.trim() || null,
            idNumber: formData.landlordIdNumber.trim() || null,
          };
          formDataToSend.append('landlord', JSON.stringify(landlordData));
        }

        if (property) {
          await propertiesAPI.update(property.id, formDataToSend);
        } else {
          await propertiesAPI.create(formDataToSend);
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
        encType="multipart/form-data"
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

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Image (Optional)
          </label>
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3">
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Property preview"
                  className="w-40 h-40 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* File Input */}
          <div className="relative">
            <input
              type="file"
              id="imageFile"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
            />
            <label
              htmlFor="imageFile"
              className="flex items-center justify-center w-full px-3.5 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <svg
                  className="mx-auto h-8 w-8 text-gray-400 mb-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {formData.imageFile 
                    ? `Selected: ${formData.imageFile.name}` 
                    : 'Click to upload image'}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Supports JPG, PNG, WebP, GIF • Max 5MB
                </p>
              </div>
            </label>
          </div>
          
          {/* If editing and there's an existing image URL but no new file */}
          {property?.image && !imagePreview && (
            <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs text-gray-600">
                <strong>Current image:</strong> Using previously uploaded image. 
                Upload a new image to replace it.
              </p>
            </div>
          )}
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