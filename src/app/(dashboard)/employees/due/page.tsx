'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { employeesAPI } from '@/lib/api'

export default function DueEmployeesPage() {
  const { canViewEmployees } = useGlobalPermissions()
  const [dueEmployees, setDueEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDueEmployees()
  }, [])

  const fetchDueEmployees = async () => {
    try {
      setLoading(true)
      const result = await employeesAPI.getDueForPayment()
      setDueEmployees(result.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRecordPayment = async (employeeId: string, amount: number, period: string) => {
    // Implement payment recording modal or redirect to payment page
    window.location.href = `/employees/${employeeId}?openPaymentModal=true`
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

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employees Due for Payment</h1>
            <p className="text-gray-600 mt-1">Employees who haven't received payment for the current period</p>
          </div>
          <Link
            href="/employees"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to All Employees
          </Link>
        </div>
      </div>

      {dueEmployees.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <p className="text-green-800">All employees have been paid for the current period!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
            <p className="text-yellow-800">
              ⚠️ {dueEmployees.length} employee(s) have not received payment for the current period.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dueEmployees.map((employee: any) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.jobTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      KES {employee.salaryAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.paymentFrequency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRecordPayment(employee.id, employee.salaryAmount, employee.currentPaymentPeriod)}
                        className="px-3 py-1 bg-[#005478] text-white rounded hover:bg-[#0078a3]"
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}