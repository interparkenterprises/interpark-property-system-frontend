'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ActivationRequest,
  CreateActivationRequest,
  UpdateActivationRequest,
  ActivationType,
} from '@/types';
import { activationsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface ActivationFormProps {
  propertyId: string;
  activation?: ActivationRequest | null;
  onSuccess: () => void;
  onCancel: () => void;
}



export default function ActivationForm({
  propertyId,
  activation,
  onSuccess,
  onCancel,
}: ActivationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state with only fields from backend model
  const [formData, setFormData] = useState({
    // Part 1 - Client Information
    companyName: '',
    postalAddress: '',
    telephone: '',
    contactPerson: '',
    designation: '',
    email: '',
    mobileNo: '',
    
    // Part 2 - Description of Activation/Exhibition
    activationType: 'OFFICE_SPACE' as ActivationType,
    startDate: '',
    setupTime: '9:00 AM',
    endDate: '',
    tearDownTime: '5:00 PM',
    description: '',
    expectedVisitors: '',
    soundSystem: false,
    
    // Part 3 - Cost of Activation/Exhibition
    licenseFeePerDay: '',
    numberOfDays: '',
    proposedBudget: '',
    
    // Payment Details
    bankName: '',
    bankBranch: '',
    accountName: '',
    accountNumber: '',
    swiftCode: '',
    paybillNumber: '',
    mpesaAccount: '',
    
    // Manager Information (for submission)
    managerName: '',
    managerDesignation: '',
  });

  // Load activation data if editing
  useEffect(() => {
    if (activation) {
      setFormData({
        // Part 1 - Client Information
        companyName: activation.companyName || '',
        postalAddress: activation.postalAddress || '',
        telephone: activation.telephone || '',
        contactPerson: activation.contactPerson || '',
        designation: activation.designation || '',
        email: activation.email || '',
        mobileNo: activation.mobileNo || '',
        
        // Part 2 - Description of Activation/Exhibition
        activationType: activation.activationType || 'OFFICE_SPACE',
        startDate: activation.startDate ? activation.startDate.split('T')[0] : '',
        setupTime: activation.setupTime || '9:00 AM',
        endDate: activation.endDate ? activation.endDate.split('T')[0] : '',
        tearDownTime: activation.tearDownTime || '5:00 PM',
        description: activation.description || '',
        expectedVisitors: activation.expectedVisitors?.toString() || '',
        soundSystem: activation.soundSystem || false,
        
        // Part 3 - Cost of Activation/Exhibition
        licenseFeePerDay: activation.licenseFeePerDay?.toString() || '',
        numberOfDays: activation.numberOfDays?.toString() || '',
        proposedBudget: activation.proposedBudget?.toString() || '',
        
        // Payment Details
        bankName: activation.bankName || '',
        bankBranch: activation.bankBranch || '',
        accountName: activation.accountName || '',
        accountNumber: activation.accountNumber || '',
        swiftCode: activation.swiftCode || '',
        paybillNumber: activation.paybillNumber || '',
        mpesaAccount: activation.mpesaAccount || '',
        
        // Manager Information
        managerName: activation.managerName || '',
        managerDesignation: activation.managerDesignation || '',
      });
    }
  }, [activation]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate required fields from backend model
    const requiredFields = [
      'companyName', 'postalAddress', 'telephone', 'contactPerson',
      'designation', 'email', 'mobileNo', 'startDate', 'setupTime',
      'endDate', 'tearDownTime', 'activationType'
    ];

    const missingFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.map(field => 
        field.replace(/([A-Z])/g, ' $1').toLowerCase()
      ).join(', ')}`);
      setLoading(false);
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (startDate >= endDate) {
      setError('End date must be after start date');
      setLoading(false);
      return;
    }

    try {
      const data: CreateActivationRequest | UpdateActivationRequest = {
        // Part 1 - Client Information
        companyName: formData.companyName.trim(),
        postalAddress: formData.postalAddress.trim(),
        telephone: formData.telephone.trim(),
        contactPerson: formData.contactPerson.trim(),
        designation: formData.designation.trim(),
        email: formData.email.trim(),
        mobileNo: formData.mobileNo.trim(),
        
        // Part 2 - Description of Activation/Exhibition
        activationType: formData.activationType,
        startDate: formData.startDate,
        setupTime: formData.setupTime.trim(),
        endDate: formData.endDate,
        tearDownTime: formData.tearDownTime.trim(),
        description: formData.description.trim() || undefined,
        expectedVisitors: formData.expectedVisitors ? parseInt(formData.expectedVisitors) : undefined,
        soundSystem: formData.soundSystem,
        
        // Part 3 - Cost of Activation/Exhibition
        licenseFeePerDay: formData.licenseFeePerDay ? parseFloat(formData.licenseFeePerDay) : undefined,
        numberOfDays: formData.numberOfDays ? parseInt(formData.numberOfDays) : undefined,
        proposedBudget: formData.proposedBudget ? parseFloat(formData.proposedBudget) : undefined,
        
        // Payment Details
        bankName: formData.bankName.trim() || undefined,
        bankBranch: formData.bankBranch.trim() || undefined,
        accountName: formData.accountName.trim() || undefined,
        accountNumber: formData.accountNumber.trim() || undefined,
        swiftCode: formData.swiftCode.trim() || undefined,
        paybillNumber: formData.paybillNumber.trim() || undefined,
        mpesaAccount: formData.mpesaAccount.trim() || undefined,
        
        // Manager Information
        managerName: formData.managerName.trim() || undefined,
        managerDesignation: formData.managerDesignation.trim() || undefined,
      };

      if (activation) {
        // Update existing activation
        await activationsAPI.update(activation.id, data);
      } else {
        // Create new activation with propertyId
        await activationsAPI.create({
          ...data,
          propertyId,
        } as CreateActivationRequest);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save activation request');
      console.error('Error saving activation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {/* Part 1 - Client Information */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Company Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Company Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="Enter company name"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Postal Address <span className="text-red-400">*</span>
            </label>
            <textarea
              name="postalAddress"
              value={formData.postalAddress}
              onChange={handleChange}
              required
              rows={2}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="Enter company postal address"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Telephone <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="Company telephone number"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Contact Person <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="Enter contact person name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Designation <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="e.g., Marketing Manager"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Mobile Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              name="mobileNo"
              value={formData.mobileNo}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="+254 XXX XXX XXX"
            />
          </div>
        </div>
      </div>

      {/* Part 2 - Description of Activation/Exhibition */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Activation Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
                Activation Type <span className="text-red-400">*</span>
            </label>
            <input
                type="text"
                name="activationType"
                value={formData.activationType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
                placeholder="e.g., Product Launch, Exhibition, Pop-up Store, etc."
                list="activation-types-suggestions"
            />
            
            {/* Optional datalist for autocomplete suggestions */}
            <datalist id="activation-types-suggestions">
                <option value="OFFICE_SPACE">Office Space</option>
                <option value="RETAIL_SPACE">Retail Space</option>
                <option value="WAREHOUSE">Warehouse</option>
                <option value="EVENT_SPACE">Event Space</option>
                <option value="POP_UP_STORE">Pop-up Store</option>
                <option value="SHOWROOM">Showroom</option>
                <option value="PRODUCT_LAUNCH">Product Launch</option>
                <option value="PROMOTIONAL_EVENT">Promotional Event</option>
                <option value="EXHIBITION">Exhibition</option>
                <option value="MARKETING_CAMPAIGN">Marketing Campaign</option>
                <option value="BRAND_ACTIVATION">Brand Activation</option>
                <option value="TRADE_SHOW">Trade Show</option>
                <option value="ROADSHOW">Roadshow</option>
                <option value="SAMPLE_DISTRIBUTION">Sample Distribution</option>
                <option value="MEDIA_EVENT">Media Event</option>
                <option value="CORPORATE_EVENT">Corporate Event</option>
                <option value="FITNESS_CLASS">Fitness Class</option>
                <option value="WORKSHOP">Workshop</option>
                <option value="SEMINAR">Seminar</option>
                <option value="CONFERENCE">Conference</option>
                <option value="OTHER">Other</option>
            </datalist>
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
                Start Date <span className="text-red-400">*</span>
            </label>
            <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white"
            />
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
                Setup Time <span className="text-red-400">*</span>
            </label>
            <input
                type="text"
                name="setupTime"
                value={formData.setupTime}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
                placeholder="e.g., 9:00 AM"
            />
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
                End Date <span className="text-red-400">*</span>
            </label>
            <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white"
            />
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
                Tear Down Time <span className="text-red-400">*</span>
            </label>
            <input
                type="text"
                name="tearDownTime"
                value={formData.tearDownTime}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
                placeholder="e.g., 5:00 PM"
            />
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
                Expected Visitors
            </label>
            <input
                type="number"
                name="expectedVisitors"
                value={formData.expectedVisitors}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
                placeholder="Estimated number of visitors"
            />
            </div>

            <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
                Description
            </label>
            <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
                placeholder="Describe the activation/exhibition"
            />
            </div>

            <div className="flex items-center gap-3">
            <input
                type="checkbox"
                name="soundSystem"
                checked={formData.soundSystem}
                onChange={handleChange}
                className="w-5 h-5 text-blue-500 border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-gray-800 transition-all cursor-pointer bg-gray-700"
            />
            <label className="text-sm font-medium text-gray-300">
                Sound System Required
            </label>
            </div>
        </div>
      </div>

      {/* Part 3 - Cost of Activation/Exhibition */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Financial Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              License Fee per Day (KES)
            </label>
            <input
              type="number"
              name="licenseFeePerDay"
              value={formData.licenseFeePerDay}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Number of Days
            </label>
            <input
              type="number"
              name="numberOfDays"
              value={formData.numberOfDays}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Proposed Budget (KES)
            </label>
            <input
              type="number"
              name="proposedBudget"
              value={formData.proposedBudget}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Payment Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Bank Name
            </label>
            <input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="e.g., Standard Chartered"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Bank Branch
            </label>
            <input
              type="text"
              name="bankBranch"
              value={formData.bankBranch}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="e.g., Westlands"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Account Name
            </label>
            <input
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="Account holder name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Account Number
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="Bank account number"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              SWIFT Code
            </label>
            <input
              type="text"
              name="swiftCode"
              value={formData.swiftCode}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="e.g., SCBLKENX"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-700">
          <h4 className="text-md font-semibold text-white mb-4">M-Pesa Payment Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Paybill Number
              </label>
              <input
                type="text"
                name="paybillNumber"
                value={formData.paybillNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
                placeholder="e.g., 123456"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Account Number
              </label>
              <input
                type="text"
                name="mpesaAccount"
                value={formData.mpesaAccount}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
                placeholder="M-Pesa account number"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Manager Information Section (for submission) */}
      {(!activation || activation.status === 'DRAFT') && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Manager Information (for submission)
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            This information will be used for the manager's signature when submitting the request.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Manager's Name
              </label>
              <input
                type="text"
                name="managerName"
                value={formData.managerName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
                placeholder="Manager's full name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Manager's Designation
              </label>
              <input
                type="text"
                name="managerDesignation"
                value={formData.managerDesignation}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
                placeholder="e.g., Property Manager"
              />
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          disabled={loading}
          className="px-6 py-2.5 bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="px-8 py-2.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {activation ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            <span>{activation ? 'Update Activation Request' : 'Create Activation Request'}</span>
          )}
        </Button>
      </div>
    </form>
  );
}