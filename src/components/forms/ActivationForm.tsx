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

const ACTIVATION_TYPES: { value: ActivationType; label: string }[] = [
  { value: 'OFFICE_SPACE', label: 'Office Space' },
  { value: 'RETAIL_SPACE', label: 'Retail Space' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'EVENT_SPACE', label: 'Event Space' },
  { value: 'POP_UP_STORE', label: 'Pop-up Store' },
  { value: 'SHOWROOM', label: 'Showroom' },
  { value: 'OTHER', label: 'Other' },
];

export default function ActivationForm({
  propertyId,
  activation,
  onSuccess,
  onCancel,
}: ActivationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state with all required fields
  const [formData, setFormData] = useState({
    // Part 1 - Client Information
    companyName: '',
    postalAddress: '',
    telephone: '',
    contactPerson: '',
    designation: '',
    email: '',
    mobileNo: '',
    alternativeContact: '',
    
    // Part 2 - Description of Activation/Exhibition
    activationType: 'OFFICE_SPACE' as ActivationType,
    startDate: '',
    setupTime: '9:00 AM',
    endDate: '',
    tearDownTime: '5:00 PM',
    description: '',
    expectedVisitors: '',
    
    // Part 3 - Space Requirements
    spaceRequired: '',
    specificLocation: '',
    powerRequirement: '',
    waterRequirement: false,
    internetRequired: false,
    
    // Part 4 - Equipment & Setup
    ownEquipment: true,
    equipmentList: [] as any[],
    furnitureNeeded: [] as any[],
    
    // Part 5 - Branding & Marketing
    brandingMaterials: [] as any[],
    soundSystem: false,
    displayScreens: false,
    
    // Part 6 - Health & Safety
    insuranceCover: false,
    insuranceDetails: '',
    safetyMeasures: [] as any[],
    firstAidKit: false,
    
    // Part 7 - Financial Information
    proposedBudget: '',
    proposedRent: '',
    proposedServiceCharge: '',
    proposedDeposit: '',
    paymentTerms: '',
    
    // Part 8 - Additional Services
    securityRequired: false,
    cleaningRequired: false,
    cateringRequired: false,
    parkingSpaces: '',
    
    // Part 9 - Terms & Conditions
    termsAccepted: false,
    
    // Additional Notes
    specialRequests: '',
    
    // Supporting documents
    companyRegistration: '',
    kraPinCertificate: '',
    businessPermit: '',
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
        alternativeContact: activation.alternativeContact || '',
        
        // Part 2 - Description of Activation/Exhibition
        activationType: activation.activationType || 'OFFICE_SPACE',
        startDate: activation.startDate ? activation.startDate.split('T')[0] : '',
        setupTime: activation.setupTime || '9:00 AM',
        endDate: activation.endDate ? activation.endDate.split('T')[0] : '',
        tearDownTime: activation.tearDownTime || '5:00 PM',
        description: activation.description || '',
        expectedVisitors: activation.expectedVisitors?.toString() || '',
        
        // Part 3 - Space Requirements
        spaceRequired: activation.spaceRequired?.toString() || '',
        specificLocation: activation.location || '',
        powerRequirement: activation.powerRequirement || '',
        waterRequirement: activation.waterRequirement || false,
        internetRequired: activation.internetRequired || false,
        
        // Part 4 - Equipment & Setup
        ownEquipment: activation.ownEquipment !== undefined ? activation.ownEquipment : true,
        equipmentList: activation.equipmentList || [],
        furnitureNeeded: activation.furnitureNeeded || [],
        
        // Part 5 - Branding & Marketing
        brandingMaterials: activation.brandingMaterials || [],
        soundSystem: activation.soundSystem || false,
        displayScreens: activation.displayScreens || false,
        
        // Part 6 - Health & Safety
        insuranceCover: activation.insuranceCover || false,
        insuranceDetails: activation.insuranceDetails || '',
        safetyMeasures: activation.safetyMeasures || [],
        firstAidKit: activation.firstAidKit || false,
        
        // Part 7 - Financial Information
        proposedBudget: activation.proposedBudget?.toString() || '',
        proposedRent: activation.proposedRent?.toString() || '',
        proposedServiceCharge: activation.proposedServiceCharge?.toString() || '',
        proposedDeposit: activation.proposedDeposit?.toString() || '',
        paymentTerms: activation.paymentTerms || '',
        
        // Part 8 - Additional Services
        securityRequired: activation.securityRequired || false,
        cleaningRequired: activation.cleaningRequired || false,
        cateringRequired: activation.cateringRequired || false,
        parkingSpaces: activation.parkingSpaces?.toString() || '',
        
        // Part 9 - Terms & Conditions
        termsAccepted: activation.termsAccepted || false,
        
        // Additional Notes
        specialRequests: activation.specialRequests || '',
        
        // Supporting documents
        companyRegistration: activation.companyRegistration || '',
        kraPinCertificate: activation.kraPinCertificate || '',
        businessPermit: activation.businessPermit || '',
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

    // Validate required fields
    if (!formData.termsAccepted) {
      setError('You must accept the terms and conditions');
      setLoading(false);
      return;
    }

    // Validate required date fields
    if (!formData.startDate || !formData.endDate) {
      setError('Start date and end date are required');
      setLoading(false);
      return;
    }

    // Validate required contact fields
    if (!formData.companyName || !formData.contactPerson || !formData.email || !formData.mobileNo) {
      setError('Company name, contact person, email, and mobile number are required');
      setLoading(false);
      return;
    }

    // Validate space required
    if (!formData.spaceRequired || parseFloat(formData.spaceRequired) <= 0) {
      setError('Space required must be greater than 0');
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
        alternativeContact: formData.alternativeContact.trim() || undefined,
        
        // Part 2 - Description of Activation/Exhibition
        activationType: formData.activationType,
        startDate: formData.startDate, // Send as YYYY-MM-DD, backend will convert
        setupTime: formData.setupTime.trim(),
        endDate: formData.endDate, // Send as YYYY-MM-DD, backend will convert
        tearDownTime: formData.tearDownTime.trim(),
        description: formData.description.trim() || undefined,
        expectedVisitors: formData.expectedVisitors ? parseInt(formData.expectedVisitors) : undefined,
        
        // Part 3 - Space Requirements
        spaceRequired: parseFloat(formData.spaceRequired),
        location: formData.specificLocation.trim() || undefined,
        powerRequirement: formData.powerRequirement.trim() || undefined,
        waterRequirement: formData.waterRequirement,
        internetRequired: formData.internetRequired,
        
        // Part 4 - Equipment & Setup
        ownEquipment: formData.ownEquipment,
        equipmentList: formData.equipmentList.length > 0 ? formData.equipmentList : undefined,
        furnitureNeeded: formData.furnitureNeeded.length > 0 ? formData.furnitureNeeded : undefined,
        
        // Part 5 - Branding & Marketing
        brandingMaterials: formData.brandingMaterials.length > 0 ? formData.brandingMaterials : undefined,
        soundSystem: formData.soundSystem,
        displayScreens: formData.displayScreens,
        
        // Part 6 - Health & Safety
        insuranceCover: formData.insuranceCover,
        insuranceDetails: formData.insuranceDetails.trim() || undefined,
        safetyMeasures: formData.safetyMeasures.length > 0 ? formData.safetyMeasures : undefined,
        firstAidKit: formData.firstAidKit,
        
        // Part 7 - Financial Information
        proposedBudget: formData.proposedBudget ? parseFloat(formData.proposedBudget) : undefined,
        proposedRent: formData.proposedRent ? parseFloat(formData.proposedRent) : undefined,
        proposedServiceCharge: formData.proposedServiceCharge ? parseFloat(formData.proposedServiceCharge) : undefined,
        proposedDeposit: formData.proposedDeposit ? parseFloat(formData.proposedDeposit) : undefined,
        paymentTerms: formData.paymentTerms.trim() || undefined,
        
        // Part 8 - Additional Services
        securityRequired: formData.securityRequired,
        cleaningRequired: formData.cleaningRequired,
        cateringRequired: formData.cateringRequired,
        parkingSpaces: formData.parkingSpaces ? parseInt(formData.parkingSpaces) : undefined,
        
        // Part 9 - Terms & Conditions
        termsAccepted: formData.termsAccepted,
        
        // Additional Notes
        specialRequests: formData.specialRequests.trim() || undefined,
        
        // Supporting documents
        companyRegistration: formData.companyRegistration.trim() || undefined,
        kraPinCertificate: formData.kraPinCertificate.trim() || undefined,
        businessPermit: formData.businessPermit.trim() || undefined,
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

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Alternative Contact
            </label>
            <input
              type="tel"
              name="alternativeContact"
              value={formData.alternativeContact}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="Alternative phone number"
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
            <select
              name="activationType"
              value={formData.activationType}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white"
            >
              {ACTIVATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Space Required (sq m) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="spaceRequired"
              value={formData.spaceRequired}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="Enter space in square meters"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Preferred Location
            </label>
            <input
              type="text"
              name="specificLocation"
              value={formData.specificLocation}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="e.g., Ground Floor, Wing A"
            />
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
        </div>
      </div>

      {/* Part 3 - Space Requirements & Additional Services */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Requirements & Services
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'waterRequirement', label: 'Water Required' },
            { name: 'internetRequired', label: 'Internet Required' },
            { name: 'securityRequired', label: 'Security Required' },
            { name: 'cleaningRequired', label: 'Cleaning Required' },
            { name: 'cateringRequired', label: 'Catering Required' },
            { name: 'soundSystem', label: 'Sound System Required' },
            { name: 'displayScreens', label: 'Display Screens Required' },
            { name: 'insuranceCover', label: 'Insurance Cover' },
            { name: 'firstAidKit', label: 'First Aid Kit' },
            { name: 'ownEquipment', label: 'Bring Own Equipment' },
          ].map((requirement) => (
            <label key={requirement.name} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name={requirement.name}
                checked={formData[requirement.name as keyof typeof formData] as boolean}
                onChange={handleChange}
                className="w-5 h-5 text-blue-500 border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-gray-800 transition-all cursor-pointer bg-gray-700"
              />
              <span className="text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
                {requirement.label}
              </span>
            </label>
          ))}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Power Requirement
          </label>
          <input
            type="text"
            name="powerRequirement"
            value={formData.powerRequirement}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
            placeholder="e.g., 240V, 3-phase, 100A"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Parking Spaces Required
          </label>
          <input
            type="number"
            name="parkingSpaces"
            value={formData.parkingSpaces}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
            placeholder="Number of parking spaces needed"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Insurance Details
          </label>
          <textarea
            name="insuranceDetails"
            value={formData.insuranceDetails}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
            placeholder="Provide insurance details if applicable"
          />
        </div>
      </div>

      {/* Part 7 - Financial Information */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Financial Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Proposed Rent (KES)
            </label>
            <input
              type="number"
              name="proposedRent"
              value={formData.proposedRent}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Proposed Service Charge (KES)
            </label>
            <input
              type="number"
              name="proposedServiceCharge"
              value={formData.proposedServiceCharge}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Proposed Deposit (KES)
            </label>
            <input
              type="number"
              name="proposedDeposit"
              value={formData.proposedDeposit}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Payment Terms
          </label>
          <textarea
            name="paymentTerms"
            value={formData.paymentTerms}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
            placeholder="Describe payment terms and conditions"
          />
        </div>
      </div>

      {/* Supporting Documents */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Supporting Documents (URLs)
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Company Registration Document URL
            </label>
            <input
              type="url"
              name="companyRegistration"
              value={formData.companyRegistration}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              KRA PIN Certificate URL
            </label>
            <input
              type="url"
              name="kraPinCertificate"
              value={formData.kraPinCertificate}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Business Permit URL
            </label>
            <input
              type="url"
              name="businessPermit"
              value={formData.businessPermit}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Additional Notes
        </h3>
        
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Special Requests
          </label>
          <textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-900 text-white placeholder-gray-400"
            placeholder="Any special requests or additional requirements"
          />
        </div>
      </div>

      {/* Part 9 - Terms & Conditions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Terms & Conditions
        </h3>
        
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-300 mb-4">
            By submitting this activation request, you agree to the following terms:
          </p>
          <ul className="space-y-2 text-sm text-gray-400 mb-4">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              All information provided is accurate and complete
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              You will comply with all property rules and regulations
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              You are responsible for any damages caused during the activation
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approval is subject to property management's discretion
            </li>
          </ul>
          
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              required
              className="w-5 h-5 text-blue-500 border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-gray-800 transition-all cursor-pointer bg-gray-700"
            />
            <span className="text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
              I accept the terms and conditions <span className="text-red-400">*</span>
            </span>
          </label>
        </div>
      </div>

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
          disabled={loading || !formData.termsAccepted}
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
