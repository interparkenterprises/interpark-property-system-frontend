'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { dailyReportsAPI } from '@/lib/api';
import { DailyReport, CreateDailyReportRequest, UpdateDailyReportRequest } from '@/types';

interface DailyReportFormProps {
  propertyId: string;
  report?: DailyReport | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormSection {
  id: string;
  title: string;
  icon: string;
}

const sections: FormSection[] = [
  { id: 'overview', title: 'Overview', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'occupancy', title: 'Occupancy', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'maintenance', title: 'Maintenance', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { id: 'financial', title: 'Financial', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'security', title: 'Security', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { id: 'cleanliness', title: 'Cleanliness', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  { id: 'tenantIssues', title: 'Tenant Issues', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'observations', title: 'Other Observations', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
];

export default function DailyReportForm({ propertyId, report, onSuccess, onCancel }: DailyReportFormProps) {
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [submitting, setSubmitting] = useState(false);
  const [repairs, setRepairs] = useState<Array<{ description: string; status: string; cost?: number; notes?: string }>>(
    report?.maintenance?.repairs || [{ description: '', status: 'PENDING', cost: 0, notes: '' }]
  );
  const [tenantIssues, setTenantIssues] = useState<Array<{ tenantName: string; unit: string; issue: string; status: string; dateReported: string }>>(
    report?.tenantIssues?.issues || [{ tenantName: '', unit: '', issue: '', status: 'PENDING', dateReported: new Date().toISOString().split('T')[0] }]
  );

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      reportDate: report?.reportDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      
      // Overview
      overviewSummary: report?.overview?.summary || '',
      overviewIssues: report?.overview?.issuesEncountered || '',
      overviewResolutions: report?.overview?.resolutions || '',
      overviewRecommendations: report?.overview?.recommendations || '',
      
      // Occupancy
      totalUnits: report?.occupancy?.totalUnits || 0,
      occupiedUnits: report?.occupancy?.occupiedUnits || 0,
      vacantUnits: report?.occupancy?.vacantUnits || 0,
      occupancyRate: report?.occupancy?.occupancyRate || 0,
      newTenants: report?.occupancy?.newTenants || 0,
      moveOuts: report?.occupancy?.moveOuts || 0,
      occupancyNotes: report?.occupancy?.notes || '',
      
      // Maintenance
      completedTasks: report?.maintenance?.completedTasks || 0,
      pendingTasks: report?.maintenance?.pendingTasks || 0,
      urgentIssues: report?.maintenance?.urgentIssues || 0,
      maintenanceNotes: report?.maintenance?.notes || '',
      
      // Financial
      rentCollected: report?.financial?.rentCollected || 0,
      pendingRent: report?.financial?.pendingRent || 0,
      arrears: report?.financial?.arrears || 0,
      expenses: report?.financial?.expenses || 0,
      netIncome: report?.financial?.netIncome || 0,
      billsPaid: report?.financial?.billsPaid || 0,
      pendingBills: report?.financial?.pendingBills || 0,
      financialNotes: report?.financial?.notes || '',
      
      // Security
      incidents: report?.security?.incidents || 0,
      patrols: report?.security?.patrols || 0,
      accessControl: report?.security?.accessControl || '',
      cctvStatus: report?.security?.cctvStatus || 'OPERATIONAL',
      securityNotes: report?.security?.notes || '',
      
      // Cleanliness
      cleanlinessRating: report?.cleanliness?.rating || 5,
      areasInspected: report?.cleanliness?.areasInspected?.join(', ') || '',
      cleanlinessIssues: report?.cleanliness?.issues?.join(', ') || '',
      cleanlinessNotes: report?.cleanliness?.notes || '',
      
      // Tenant Issues
      complaintsCount: report?.tenantIssues?.complaints || 0,
      resolvedCount: report?.tenantIssues?.resolved || 0,
      pendingCount: report?.tenantIssues?.pending || 0,
      tenantIssuesNotes: report?.tenantIssues?.notes || '',
      
      // Other Observations
      otherObservations: report?.otherObservations || '',
    }
  });

  // Auto-calculate occupancy rate
  const totalUnits = watch('totalUnits');
  const occupiedUnits = watch('occupiedUnits');
  const vacantUnits = watch('vacantUnits');

  useEffect(() => {
    if (totalUnits > 0) {
      const rate = Math.round((occupiedUnits / totalUnits) * 100);
      setValue('occupancyRate', rate);
      setValue('vacantUnits', totalUnits - occupiedUnits);
    }
  }, [totalUnits, occupiedUnits, setValue]);

  // Auto-calculate net income
  const rentCollected = watch('rentCollected');
  const expenses = watch('expenses');

  useEffect(() => {
    const net = rentCollected - expenses;
    setValue('netIncome', net);
  }, [rentCollected, expenses, setValue]);

  // Repairs management
  const addRepair = () => {
    setRepairs([...repairs, { description: '', status: 'PENDING', cost: 0, notes: '' }]);
  };

  const removeRepair = (index: number) => {
    const newRepairs = repairs.filter((_, i) => i !== index);
    setRepairs(newRepairs);
  };

  const updateRepair = (index: number, field: string, value: any) => {
    const newRepairs = [...repairs];
    newRepairs[index] = { ...newRepairs[index], [field]: value };
    setRepairs(newRepairs);
  };

  // Tenant issues management
  const addTenantIssue = () => {
    setTenantIssues([...tenantIssues, { tenantName: '', unit: '', issue: '', status: 'PENDING', dateReported: new Date().toISOString().split('T')[0] }]);
  };

  const removeTenantIssue = (index: number) => {
    const newIssues = tenantIssues.filter((_, i) => i !== index);
    setTenantIssues(newIssues);
  };

  const updateTenantIssue = (index: number, field: string, value: any) => {
    const newIssues = [...tenantIssues];
    newIssues[index] = { ...newIssues[index], [field]: value };
    setTenantIssues(newIssues);
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      const reportData: CreateDailyReportRequest | UpdateDailyReportRequest = {
        propertyId,
        reportDate: data.reportDate,
        overview: {
          summary: data.overviewSummary,
          issuesEncountered: data.overviewIssues,
          resolutions: data.overviewResolutions,
          recommendations: data.overviewRecommendations,
        },
        occupancy: {
          totalUnits: Number(data.totalUnits),
          occupiedUnits: Number(data.occupiedUnits),
          vacantUnits: Number(data.vacantUnits),
          occupancyRate: Number(data.occupancyRate),
          newTenants: Number(data.newTenants) || 0,
          moveOuts: Number(data.moveOuts) || 0,
          notes: data.occupancyNotes,
        },
        maintenance: {
          completedTasks: Number(data.completedTasks) || 0,
          pendingTasks: Number(data.pendingTasks) || 0,
          urgentIssues: Number(data.urgentIssues) || 0,
          repairs: repairs.filter(r => r.description),
          notes: data.maintenanceNotes,
        },
        financial: {
          rentCollected: Number(data.rentCollected) || 0,
          pendingRent: Number(data.pendingRent) || 0,
          arrears: Number(data.arrears) || 0,
          expenses: Number(data.expenses) || 0,
          netIncome: Number(data.netIncome) || 0,
          billsPaid: Number(data.billsPaid) || 0,
          pendingBills: Number(data.pendingBills) || 0,
          notes: data.financialNotes,
        },
        security: {
          incidents: Number(data.incidents) || 0,
          patrols: Number(data.patrols) || 0,
          accessControl: data.accessControl,
          cctvStatus: data.cctvStatus,
          notes: data.securityNotes,
        },
        cleanliness: {
          rating: Number(data.cleanlinessRating) || 5,
          areasInspected: data.areasInspected ? data.areasInspected.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
          issues: data.cleanlinessIssues ? data.cleanlinessIssues.split(',').map((i: string) => i.trim()).filter(Boolean) : [],
          notes: data.cleanlinessNotes,
        },
        tenantIssues: {
          complaints: Number(data.complaintsCount) || 0,
          resolved: Number(data.resolvedCount) || 0,
          pending: Number(data.pendingCount) || 0,
          issues: tenantIssues.filter(i => i.tenantName && i.issue),
          notes: data.tenantIssuesNotes,
        },
        otherObservations: data.otherObservations,
      };

      if (report) {
        await dailyReportsAPI.update(report.id, reportData);
      } else {
        await dailyReportsAPI.create(reportData as CreateDailyReportRequest);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving daily report:', error);
      alert(error.message || 'Failed to save daily report');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (data: any) => {
    try {
      setSubmitting(true);
      
      // First save the report
      await onSubmit(data);
      
      // If editing existing report, submit it
      if (report) {
        await dailyReportsAPI.submit(report.id);
      }
      
      alert('Report submitted successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting report:', error);
      alert(error.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Section Navigation */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-300 ${
                activeSection === section.id
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
              </svg>
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Report Date */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <label className="block text-sm font-semibold text-white mb-2">
            Report Date <span className="text-red-400">*</span>
        </label>
        <input
            type="date"
            {...register('reportDate', { required: 'Report date is required' })}
            className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
        />
        {errors.reportDate && <p className="text-red-400 text-sm mt-1 font-medium">{errors.reportDate.message}</p>}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-6"
        >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Overview
            </h3>

            <div>
            <label className="block text-sm font-bold text-white mb-2">
                Daily Summary <span className="text-red-400">*</span>
            </label>
            <textarea
                {...register('overviewSummary', { required: 'Summary is required' })}
                rows={4}
                placeholder="Provide a brief summary of today's operations..."
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
            />
            {errors.overviewSummary && <p className="text-red-400 text-sm mt-1">{errors.overviewSummary.message}</p>}
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Issues Encountered</label>
            <textarea
                {...register('overviewIssues')}
                rows={3}
                placeholder="List any issues or challenges encountered today..."
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
            />
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Resolutions</label>
            <textarea
                {...register('overviewResolutions')}
                rows={3}
                placeholder="Describe how issues were resolved..."
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
            />
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Recommendations</label>
            <textarea
                {...register('overviewRecommendations')}
                rows={3}
                placeholder="Provide recommendations for improvement..."
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
            />
            </div>
        </motion.div>
       )}
      

      {/* Occupancy Section */}
      {activeSection === 'occupancy' && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-6"
        >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Occupancy Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                Total Units <span className="text-red-400">*</span>
                </label>
                <input
                type="number"
                {...register('totalUnits', { required: 'Total units is required', min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
                {errors.totalUnits && <p className="text-red-400 text-sm mt-1">{errors.totalUnits.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                Occupied Units <span className="text-red-400">*</span>
                </label>
                <input
                type="number"
                {...register('occupiedUnits', { required: 'Occupied units is required', min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
                {errors.occupiedUnits && <p className="text-red-400 text-sm mt-1">{errors.occupiedUnits.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Vacant Units</label>
                <input
                type="number"
                {...register('vacantUnits')}
                disabled
                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 cursor-not-allowed text-gray-400"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Occupancy Rate (%)</label>
                <input
                type="number"
                {...register('occupancyRate')}
                disabled
                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 cursor-not-allowed font-bold text-blue-400"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">New Tenants</label>
                <input
                type="number"
                {...register('newTenants', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Move Outs</label>
                <input
                type="number"
                {...register('moveOuts', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Occupancy Notes</label>
            <textarea
                {...register('occupancyNotes')}
                rows={3}
                placeholder="Additional notes about occupancy status..."
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
            />
            </div>
        </motion.div>
      )}

      {/* Maintenance Section */}
      {activeSection === 'maintenance' && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-6"
        >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            Maintenance & Repairs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Completed Tasks</label>
                <input
                type="number"
                {...register('completedTasks', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Pending Tasks</label>
                <input
                type="number"
                {...register('pendingTasks', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Urgent Issues</label>
                <input
                type="number"
                {...register('urgentIssues', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>
            </div>

            {/* Repairs List */}
            <div>
            <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-300">Repair Details</label>
                <Button
                type="button"
                onClick={addRepair}
                variant="outline"
                className="text-sm bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                >
                + Add Repair
                </Button>
            </div>

            <div className="space-y-4">
                {repairs.map((repair, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-400">Repair #{index + 1}</span>
                    {repairs.length > 1 && (
                        <button
                        type="button"
                        onClick={() => removeRepair(index)}
                        className="text-red-400 hover:text-red-300"
                        >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        </button>
                    )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                        <input
                        type="text"
                        value={repair.description}
                        onChange={(e) => updateRepair(index, 'description', e.target.value)}
                        placeholder="Description of repair"
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-800 text-white placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <select
                        value={repair.status}
                        onChange={(e) => updateRepair(index, 'status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-800 text-white"
                        >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        </select>
                    </div>

                    <div>
                        <input
                        type="number"
                        value={repair.cost || ''}
                        onChange={(e) => updateRepair(index, 'cost', Number(e.target.value))}
                        placeholder="Cost (KES)"
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-800 text-white placeholder-gray-400"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <input
                        type="text"
                        value={repair.notes || ''}
                        onChange={(e) => updateRepair(index, 'notes', e.target.value)}
                        placeholder="Additional notes"
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-800 text-white placeholder-gray-400"
                        />
                    </div>
                    </div>
                </div>
                ))}
            </div>
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Maintenance Notes</label>
            <textarea
                {...register('maintenanceNotes')}
                rows={3}
                placeholder="Additional maintenance notes..."
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
            />
            </div>
        </motion.div>
      )}

      {/* Financial Section */}
      {activeSection === 'financial' && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-6"
        >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Financial Summary
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Rent Collected (KES)</label>
                <input
                type="number"
                step="0.01"
                {...register('rentCollected', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Pending Rent (KES)</label>
                <input
                type="number"
                step="0.01"
                {...register('pendingRent', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Arrears (KES)</label>
                <input
                type="number"
                step="0.01"
                {...register('arrears', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Expenses (KES)</label>
                <input
                type="number"
                step="0.01"
                {...register('expenses', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Bills Paid</label>
                <input
                type="number"
                step="0.01"
                {...register('billsPaid', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Pending Bills</label>
                <input
                type="number"
                step="0.01"
                {...register('pendingBills', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>

            <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-300 mb-2">Net Income (KES)</label>
                <input
                type="number"
                step="0.01"
                {...register('netIncome')}
                disabled
                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 cursor-not-allowed font-bold text-green-400"
                />
            </div>
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Financial Notes</label>
            <textarea
                {...register('financialNotes')}
                rows={3}
                placeholder="Additional financial notes..."
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
            />
            </div>
        </motion.div>
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-6"
        >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Security Report
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Incidents</label>
                <input
                type="number"
                {...register('incidents', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Patrols Conducted</label>
                <input
                type="number"
                {...register('patrols', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Access Control Status</label>
                <input
                type="text"
                {...register('accessControl')}
                placeholder="e.g., All gates functional"
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">CCTV Status</label>
                <select
                {...register('cctvStatus')}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                >
                <option value="OPERATIONAL">Operational</option>
                <option value="PARTIAL">Partially Operational</option>
                <option value="DOWN">Down</option>
                </select>
            </div>
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Security Notes</label>
            <textarea
                {...register('securityNotes')}
                rows={3}
                placeholder="Additional security notes..."
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
            />
            </div>
        </motion.div>
      )}

      {/* Cleanliness Section */}
      {activeSection === 'cleanliness' && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-6"
        >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Cleanliness & Sanitation
            </h3>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Rating (1-5)</label>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                <label key={rating} className="flex items-center text-gray-300">
                    <input
                    type="radio"
                    value={rating}
                    {...register('cleanlinessRating')}
                    className="mr-2"
                    />
                    <span className="flex items-center gap-1">
                    {rating}
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    </span>
                </label>
                ))}
            </div>
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Areas Inspected (comma-separated)</label>
            <input
                type="text"
                {...register('areasInspected')}
                placeholder="e.g., Lobby, Corridors, Parking, Common areas"
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
            />
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Issues Found (comma-separated)</label>
            <input
                type="text"
                {...register('cleanlinessIssues')}
                placeholder="e.g., Trash overflow in Unit A, Graffiti in stairwell"
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
            />
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Cleanliness Notes</label>
            <textarea
                {...register('cleanlinessNotes')}
                rows={3}
                placeholder="Additional cleanliness notes..."
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
            />
            </div>
        </motion.div>
      )}

      {/* Tenant Issues Section */}
      {activeSection === 'tenantIssues' && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-6"
        >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Tenant Issues & Complaints
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Total Complaints</label>
                <input
                type="number"
                {...register('complaintsCount', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Resolved</label>
                <input
                type="number"
                {...register('resolvedCount', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Pending</label>
                <input
                type="number"
                {...register('pendingCount', { min: 0 })}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white"
                />
            </div>
            </div>

            {/* Tenant Issues List */}
            <div>
            <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-300">Issue Details</label>
                <Button
                type="button"
                onClick={addTenantIssue}
                variant="outline"
                className="text-sm bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                >
                + Add Issue
                </Button>
            </div>

            <div className="space-y-4">
                {tenantIssues.map((issue, index) => (
                <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-400">Issue #{index + 1}</span>
                    {tenantIssues.length > 1 && (
                        <button
                        type="button"
                        onClick={() => removeTenantIssue(index)}
                        className="text-red-400 hover:text-red-300"
                        >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        </button>
                    )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <input
                        type="text"
                        value={issue.tenantName}
                        onChange={(e) => updateTenantIssue(index, 'tenantName', e.target.value)}
                        placeholder="Tenant name"
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-800 text-white placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <input
                        type="text"
                        value={issue.unit}
                        onChange={(e) => updateTenantIssue(index, 'unit', e.target.value)}
                        placeholder="Unit number"
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-800 text-white placeholder-gray-400"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <input
                        type="text"
                        value={issue.issue}
                        onChange={(e) => updateTenantIssue(index, 'issue', e.target.value)}
                        placeholder="Issue description"
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-800 text-white placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <select
                        value={issue.status}
                        onChange={(e) => updateTenantIssue(index, 'status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-800 text-white"
                        >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        </select>
                    </div>

                    <div>
                        <input
                        type="date"
                        value={issue.dateReported}
                        onChange={(e) => updateTenantIssue(index, 'dateReported', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-800 text-white"
                        />
                    </div>
                    </div>
                </div>
                ))}
            </div>
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Tenant Issues Notes</label>
            <textarea
                {...register('tenantIssuesNotes')}
                rows={3}
                placeholder="Additional notes about tenant issues..."
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
            />
            </div>
        </motion.div>
      )}

      {/* Other Observations Section */}
      {activeSection === 'observations' && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg space-y-6"
        >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Other Observations
            </h3>

            <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Additional Observations & Comments</label>
            <textarea
                {...register('otherObservations')}
                rows={6}
                placeholder="Any other observations, concerns, or notes about today's operations..."
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
            />
            </div>
        </motion.div>
      )}

      {/* Form Actions */}
      <div className="flex flex-wrap gap-4 justify-end bg-gray-50 p-6 rounded-xl border border-gray-200">
        <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="px-6 py-3"
        >
            Cancel
        </Button>
        
        {report && report.status === 'DRAFT' && (
            <>
            <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
                className="px-6 py-3 bg-gray-600 text-white hover:bg-gray-700"
            >
                {loading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                </>
                ) : (
                <>Update Draft</>
                )}
            </Button>
            <Button
                type="button"
                onClick={handleSubmit(handleSubmitReport)}
                disabled={submitting}
                className="px-6 py-3 bg-primary text-white hover:bg-primary/90"
            >
                {submitting ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                </>
                ) : (
                <>Submit Report</>
                )}
            </Button>
            </>
        )}
        
        {!report && (
            <>
            <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
                className="px-6 py-3 bg-gray-600 text-white hover:bg-gray-700"
            >
                {loading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                </>
                ) : (
                <>Save as Draft</>
                )}
            </Button>
            <Button
                type="button"
                onClick={handleSubmit(handleSubmitReport)}
                disabled={submitting}
                className="px-6 py-3 bg-primary text-white hover:bg-primary/90"
            >
                {submitting ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating and Submitting...
                </>
                ) : (
                <>Create & Submit</>
                )}
            </Button>
            </>
          )}
        </div>
    </form>
  );
}