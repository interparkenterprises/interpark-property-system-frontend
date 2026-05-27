'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { employeesAPI } from '@/lib/api'
import { Employee, SalaryPayment, PaymentMethod, PaymentFrequency } from '@/types'

// For Next.js 15, params is a Promise that needs to be unwrapped
interface EmployeeDetailsPageProps {
  params: Promise<{ id: string }>
}

export default function EmployeeDetailsPage({ params }: EmployeeDetailsPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { canViewEmployees, canCreateEmployee, isAdmin, isManager } = useGlobalPermissions()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [payments, setPayments] = useState<SalaryPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentPeriod: '',
    paymentMethod: 'BANK_TRANSFER' as PaymentMethod,
    transactionRef: '',
    notes: ''
  })
  const [recordingPayment, setRecordingPayment] = useState(false)
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [periodValidationError, setPeriodValidationError] = useState<string | null>(null)

  // Unwrap params
  useEffect(() => {
    const unwrapParams = async () => {
      const unwrappedParams = await params
      setEmployeeId(unwrappedParams.id)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeDetails()
    }
  }, [employeeId])

  // Check for payment modal trigger from URL
  useEffect(() => {
    const shouldOpenModal = searchParams.get('openPaymentModal')
    if (shouldOpenModal === 'true' && employee && canCreateEmployee && (isAdmin || isManager)) {
      setShowPaymentModal(true)
      // Remove the query parameter from URL without refreshing the page
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams, employee, canCreateEmployee, isAdmin, isManager])

  const fetchEmployeeDetails = async () => {
    if (!employeeId) return
    
    try {
      setLoading(true)
      const employeeData = await employeesAPI.getById(employeeId)
      setEmployee(employeeData)
      
      // Auto-fill payment period when employee loads
      if (employeeData) {
        const currentPeriod = getCurrentPaymentPeriod(employeeData.paymentFrequency)
        setPaymentData(prev => ({ ...prev, paymentPeriod: currentPeriod, amount: employeeData.salaryAmount }))
      }
      
      // Fetch payment history
      const historyResponse = await employeesAPI.getPaymentHistory(employeeId)
      setPayments(historyResponse.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId || !employee) return
    
    // Validate payment period format
    if (!validatePaymentPeriod(paymentData.paymentPeriod, employee.paymentFrequency)) {
      setPeriodValidationError(`Invalid format. Expected: ${getPaymentPeriodFormatHint(employee.paymentFrequency)}`)
      return
    }
    
    setPeriodValidationError(null)
    setRecordingPayment(true)
    
    try {
      await employeesAPI.recordPayment(employeeId, paymentData)
      setShowPaymentModal(false)
      fetchEmployeeDetails() // Refresh data
      // Reset form with new current period
      if (employee) {
        const currentPeriod = getCurrentPaymentPeriod(employee.paymentFrequency)
        setPaymentData({
          amount: employee.salaryAmount,
          paymentPeriod: currentPeriod,
          paymentMethod: 'BANK_TRANSFER',
          transactionRef: '',
          notes: ''
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRecordingPayment(false)
    }
  }

  const getStatusColor = (status: string) => {
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

  // Helper function to get the current date in the correct format based on payment frequency
  const getCurrentPaymentPeriod = (frequency: PaymentFrequency): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    
    switch (frequency) {
      case 'MONTHLY':
        return `${year}-${month}`
      case 'DAILY':
        return `${year}-${month}-${day}`
      case 'WEEKLY': {
        // Get ISO week number
        const firstDayOfYear = new Date(year, 0, 1)
        const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
        return `${year}-W${String(weekNumber).padStart(2, '0')}`
      }
      case 'BI_WEEKLY': {
        // Calculate bi-weekly periods
        const startDate = new Date(year, 0, 1)
        const dayOfYear = Math.floor((now.getTime() - startDate.getTime()) / 86400000)
        const biWeekNumber = Math.floor(dayOfYear / 14)
        const periodStart = new Date(year, 0, 1 + biWeekNumber * 14)
        const periodEnd = new Date(year, 0, 1 + (biWeekNumber + 1) * 14 - 1)
        
        const startYear = periodStart.getFullYear()
        const startMonth = String(periodStart.getMonth() + 1).padStart(2, '0')
        const startDay = String(periodStart.getDate()).padStart(2, '0')
        const endYear = periodEnd.getFullYear()
        const endMonth = String(periodEnd.getMonth() + 1).padStart(2, '0')
        const endDay = String(periodEnd.getDate()).padStart(2, '0')
        
        return `${startYear}-${startMonth}-${startDay}_to_${endYear}-${endMonth}-${endDay}`
      }
      default:
        return `${year}-${month}`
    }
  }

  // Validate payment period format
  const validatePaymentPeriod = (period: string, frequency: PaymentFrequency): boolean => {
    const patterns: Record<PaymentFrequency, RegExp> = {
      'MONTHLY': /^\d{4}-\d{2}$/,
      'DAILY': /^\d{4}-\d{2}-\d{2}$/,
      'WEEKLY': /^\d{4}-W\d{2}$/,
      'BI_WEEKLY': /^\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}$/
    }
    return patterns[frequency]?.test(period) || false
  }

  // Get format hint
  const getPaymentPeriodFormatHint = (frequency: PaymentFrequency): string => {
    const hints: Record<PaymentFrequency, string> = {
      'MONTHLY': 'YYYY-MM (e.g., 2026-05)',
      'DAILY': 'YYYY-MM-DD (e.g., 2026-05-26)',
      'WEEKLY': 'YYYY-WXX (e.g., 2026-W21)',
      'BI_WEEKLY': 'YYYY-MM-DD_to_YYYY-MM-DD (e.g., 2026-05-01_to_2026-05-14)'
    }
    return hints[frequency]
  }

  // Get previous payment period
  const getPreviousPaymentPeriod = (): string => {
    if (!employee) return ''
    const current = paymentData.paymentPeriod
    const frequency = employee.paymentFrequency
    
    switch (frequency) {
      case 'MONTHLY': {
        const [year, month] = current.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 2, 1)
        return getCurrentPaymentPeriodForDate(frequency, date)
      }
      case 'DAILY': {
        const date = new Date(current)
        date.setDate(date.getDate() - 1)
        return getCurrentPaymentPeriodForDate(frequency, date)
      }
      case 'WEEKLY': {
        const weekNum = parseInt(current.split('-W')[1])
        const year = parseInt(current.split('-')[0])
        const prevWeek = weekNum - 1
        if (prevWeek < 1) {
          return `${year - 1}-W52`
        }
        return `${year}-W${String(prevWeek).padStart(2, '0')}`
      }
      case 'BI_WEEKLY': {
        const [startDateStr] = current.split('_to_')
        const startDate = new Date(startDateStr)
        startDate.setDate(startDate.getDate() - 14)
        return getCurrentPaymentPeriodForDate(frequency, startDate)
      }
      default:
        return current
    }
  }

  // Get next payment period
  const getNextPaymentPeriod = (): string => {
    if (!employee) return ''
    const current = paymentData.paymentPeriod
    const frequency = employee.paymentFrequency
    
    switch (frequency) {
      case 'MONTHLY': {
        const [year, month] = current.split('-')
        const date = new Date(parseInt(year), parseInt(month), 1)
        return getCurrentPaymentPeriodForDate(frequency, date)
      }
      case 'DAILY': {
        const date = new Date(current)
        date.setDate(date.getDate() + 1)
        return getCurrentPaymentPeriodForDate(frequency, date)
      }
      case 'WEEKLY': {
        const weekNum = parseInt(current.split('-W')[1])
        const year = parseInt(current.split('-')[0])
        const nextWeek = weekNum + 1
        if (nextWeek > 52) {
          return `${year + 1}-W01`
        }
        return `${year}-W${String(nextWeek).padStart(2, '0')}`
      }
      case 'BI_WEEKLY': {
        const [startDateStr] = current.split('_to_')
        const startDate = new Date(startDateStr)
        startDate.setDate(startDate.getDate() + 14)
        return getCurrentPaymentPeriodForDate(frequency, startDate)
      }
      default:
        return current
    }
  }

  const getCurrentPaymentPeriodForDate = (frequency: PaymentFrequency, date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    switch (frequency) {
      case 'MONTHLY':
        return `${year}-${month}`
      case 'DAILY':
        return `${year}-${month}-${day}`
      case 'WEEKLY': {
        const firstDayOfYear = new Date(year, 0, 1)
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
        return `${year}-W${String(weekNumber).padStart(2, '0')}`
      }
      case 'BI_WEEKLY': {
        const startDate = new Date(year, 0, 1)
        const dayOfYear = Math.floor((date.getTime() - startDate.getTime()) / 86400000)
        const biWeekNumber = Math.floor(dayOfYear / 14)
        const periodStart = new Date(year, 0, 1 + biWeekNumber * 14)
        const periodEnd = new Date(year, 0, 1 + (biWeekNumber + 1) * 14 - 1)
        
        const startYear = periodStart.getFullYear()
        const startMonth = String(periodStart.getMonth() + 1).padStart(2, '0')
        const startDay = String(periodStart.getDate()).padStart(2, '0')
        const endYear = periodEnd.getFullYear()
        const endMonth = String(periodEnd.getMonth() + 1).padStart(2, '0')
        const endDay = String(periodEnd.getDate()).padStart(2, '0')
        
        return `${startYear}-${startMonth}-${startDay}_to_${endYear}-${endMonth}-${endDay}`
      }
      default:
        return `${year}-${month}`
    }
  }

  // Handle period navigation
  const handlePreviousPeriod = () => {
    if (employee) {
      const prevPeriod = getPreviousPaymentPeriod()
      setPaymentData({ ...paymentData, paymentPeriod: prevPeriod })
      setPeriodValidationError(null)
    }
  }

  const handleNextPeriod = () => {
    if (employee) {
      const nextPeriod = getNextPaymentPeriod()
      setPaymentData({ ...paymentData, paymentPeriod: nextPeriod })
      setPeriodValidationError(null)
    }
  }

  const handleAutoFillPeriod = () => {
    if (employee) {
      const currentPeriod = getCurrentPaymentPeriod(employee.paymentFrequency)
      setPaymentData({ ...paymentData, paymentPeriod: currentPeriod })
      setPeriodValidationError(null)
    }
  }

  if (!canViewEmployees) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">You don't have permission to view employees.</p>
        <Link href="/employees" className="mt-4 inline-block text-[#005478] hover:underline">
          Back to Employees
        </Link>
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

  if (error || !employee) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error || 'Employee not found'}</p>
        <Link href="/employees" className="mt-4 inline-block text-[#005478] hover:underline">
          Back to Employees
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/employees"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                {employee.status}
              </span>
            </div>
            <p className="text-gray-600 mt-1">{employee.email}</p>
          </div>
          <div className="flex gap-3">
            {canCreateEmployee && (isAdmin || isManager) && (
              <>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Record Payment
                </button>
                <Link
                  href={`/employees/${employee.id}/edit`}
                  className="px-4 py-2 bg-[#ffffff] text-blue-800 rounded-lg hover:bg-[#e2e2e2] transition-colors"
                >
                  Edit Employee
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Full Name</label>
                <p className="text-gray-900 font-medium">{employee.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="text-gray-900">{employee.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone Number</label>
                <p className="text-gray-900">{employee.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Job Title</label>
                <p className="text-gray-900">{employee.jobTitle}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-500">Job Description</label>
                <p className="text-gray-900">{employee.jobDescription || 'No description provided'}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Salary Amount</label>
                <p className="text-xl font-bold text-gray-900">KES {employee.salaryAmount.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Payment Frequency</label>
                <p className="text-gray-900">{employee.paymentFrequency}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Current Period</label>
                <p className="text-gray-900">{employee.currentPaymentPeriod || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Payment Status</label>
                <p className={`font-semibold ${employee.currentPaymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                  {employee.currentPaymentStatus || 'PENDING'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Created By Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Created By</h2>
            {employee.createdBy ? (
              <div>
                <p className="text-gray-900 font-medium">{employee.createdBy.name}</p>
                <p className="text-sm text-gray-500">{employee.createdBy.email}</p>
                <p className="text-sm text-gray-500 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    employee.createdBy.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {employee.createdBy.role}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-gray-500">N/A</p>
            )}
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction Ref
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recorded By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No payment records found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentPeriod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      KES {payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.transactionRef || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.recordedBy?.name || 'System'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300"
            onClick={() => setShowPaymentModal(false)}
          />
          
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Record Salary Payment</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleRecordPayment}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (KES) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#005478] focus:border-[#005478] text-gray-900 placeholder-gray-500"
                      placeholder="Enter amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Expected salary: KES {employee.salaryAmount.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Payment Period *
                      </label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={handlePreviousPeriod}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          title="Previous period"
                        >
                          ← Prev
                        </button>
                        <button
                          type="button"
                          onClick={handleAutoFillPeriod}
                          className="text-xs px-2 py-1 bg-[#005478] text-white rounded hover:bg-[#0078a3] transition-colors"
                        >
                          Current
                        </button>
                        <button
                          type="button"
                          onClick={handleNextPeriod}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          title="Next period"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      required
                      value={paymentData.paymentPeriod}
                      onChange={(e) => {
                        setPaymentData({ ...paymentData, paymentPeriod: e.target.value })
                        setPeriodValidationError(null)
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-[#005478] focus:border-[#005478] text-gray-900 placeholder-gray-500 ${
                        periodValidationError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={getPaymentPeriodFormatHint(employee.paymentFrequency)}
                    />
                    {periodValidationError ? (
                      <p className="text-xs text-red-600 mt-1">{periodValidationError}</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        📅 Payment Type: <span className="font-medium">{employee.paymentFrequency}</span><br/>
                        Format: {getPaymentPeriodFormatHint(employee.paymentFrequency)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method *
                    </label>
                    <select
                      value={paymentData.paymentMethod}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value as PaymentMethod })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#005478] focus:border-[#005478] text-gray-900"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="MPESA">M-PESA</option>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction Reference
                    </label>
                    <input
                      type="text"
                      value={paymentData.transactionRef}
                      onChange={(e) => setPaymentData({ ...paymentData, transactionRef: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#005478] focus:border-[#005478] text-gray-900 placeholder-gray-500"
                      placeholder="Optional - e.g., TRX-123456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#005478] focus:border-[#005478] text-gray-900 placeholder-gray-500 resize-none"
                      placeholder="Optional notes about this payment"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recordingPayment}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {recordingPayment ? 'Processing Payment...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}