'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { employeesAPI } from '@/lib/api'
import { CreateEmployeeRequest } from '@/types'

export default function CreateEmployeePage() {
  const router = useRouter()
  const { canCreateEmployee, isAdmin, isManager } = useGlobalPermissions()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    name: '',
    phoneNumber: '',
    email: '',
    jobTitle: '',
    jobDescription: '',
    salaryAmount: 0,
    paymentFrequency: 'MONTHLY',
    status: 'ACTIVE'
  })

  // Redirect if no permission
  if (!canCreateEmployee || (!isAdmin && !isManager)) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">You don't have permission to create employees.</p>
        <Link href="/employees" className="mt-4 inline-block text-[#005478] hover:underline">
          Back to Employees
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await employeesAPI.create(formData)
      router.push('/employees')
    } catch (err: any) {
      setError(err.message || 'Failed to create employee')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'salaryAmount' ? parseFloat(value) || 0 : value
    }))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Employee</h1>
            <p className="text-gray-600 mt-1">Create a new employee record</p>
          </div>
          <Link
            href="/employees"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#005478] focus:border-[#005478] text-gray-900 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="employee@gmail/yahoo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#005478] focus:border-[#005478] text-gray-900 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+254XXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#005478] focus:border-[#005478] text-gray-900 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#005478] focus:border-[#005478] text-gray-900"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>

          {/* Job Information */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 mt-4">Job Information</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              name="jobTitle"
              required
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="e.g., Software Engineer"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#005478] focus:border-[#005478] text-gray-900 placeholder-gray-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description
            </label>
            <textarea
              name="jobDescription"
              rows={3}
              value={formData.jobDescription}
              onChange={handleChange}
              placeholder="Brief description of the role and responsibilities"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#005478] focus:border-[#005478] text-gray-900 placeholder-gray-500 resize-none"
            />
          </div>

          {/* Compensation Information */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 mt-4">Compensation Information</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salary Amount (KES) *
            </label>
            <input
              type="number"
              name="salaryAmount"
              required
              min="0"
              step="0.01"
              value={formData.salaryAmount || ''}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#005478] focus:border-[#005478] text-gray-900 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Frequency *
            </label>
            <select
              name="paymentFrequency"
              value={formData.paymentFrequency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#005478] focus:border-[#005478] text-gray-900"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="BI_WEEKLY">Bi-Weekly</option>
              <option value="WEEKLY">Weekly</option>
              <option value="DAILY">Daily</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
          <Link
            href="/employees"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#005478] text-white rounded-lg hover:bg-[#0078a3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Employee'}
          </button>
        </div>
      </form>
    </div>
  )
}