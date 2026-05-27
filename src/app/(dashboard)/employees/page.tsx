
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { employeesAPI } from '@/lib/api'
import { Employee, EmployeeStatus } from '@/types'

export default function EmployeesPage() {
  const { canViewEmployees, canCreateEmployee, isAdmin, isManager } = useGlobalPermissions()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDueOnly, setShowDueOnly] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const result = await employeesAPI.getAll({ page: 1, limit: 100 })
      setEmployees(result.employees)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: EmployeeStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'ON_LEAVE':
        return 'bg-yellow-100 text-yellow-800'
      case 'TERMINATED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status?: string) => {
    return status === 'PAID' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-orange-100 text-orange-800'
  }

  if (!canViewEmployees) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">You don't have permission to view employees.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005478]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error: {error}</p>
        <button 
          onClick={fetchEmployees}
          className="mt-4 px-4 py-2 bg-[#005478] text-white rounded-lg hover:bg-[#0078a3]"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Employees Management</h1>
        <p className="text-gray-600 mt-1">View and manage all employees</p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-4">
        {canCreateEmployee && (isAdmin || isManager) && (
          <Link
            href="/employees/create"
            className="px-4 py-2 bg-white text-[#005478] border-2 border-[#005478] rounded-lg hover:bg-[#bac9cf] hover:text-white transition-all font-medium"
          >
            + Add New Employee
          </Link>
        )}
        
        <Link
          href="/employees/due"
          className="px-4 py-2 bg-white text-orange-600 border-2 border-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-all font-medium"
        >
          View Due for Payment
        </Link>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    <div className="text-sm text-gray-500">{employee.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.jobTitle}</div>
                    <div className="text-sm text-gray-500">{employee.jobDescription}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.phoneNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KES {employee.salaryAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(employee.currentPaymentStatus)}`}>
                      {employee.currentPaymentStatus || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/employees/${employee.id}`}
                      className="text-[#005478] hover:text-[#0078a3] mr-3"
                    >
                      View
                    </Link>
                    {canCreateEmployee && (
                      <Link
                        href={`/employees/${employee.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}