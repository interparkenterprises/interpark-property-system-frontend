'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Pencil, ShieldX, WalletCards } from 'lucide-react'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { EmployeeCreatedBy, EmployeeInformation, EmployeePaymentHistory, EmployeeSalaryConfiguration } from '@/components/employees/EmployeeDetailsSections'
import { RecordSalaryPaymentDialog } from '@/components/employees/RecordSalaryPaymentDialog'
import { employeeStatusAppearance } from '@/components/employees/employeePresentation'
import { useBreadcrumbOverride } from '@/components/layout/BreadcrumbContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonStyles } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/ui/status-badge'
import { employeesAPI } from '@/lib/api'
import type { Employee, RecordSalaryPaymentRequest, SalaryPayment } from '@/types'

interface EmployeeDetailsPageProps { params: Promise<{ id: string }> }

export default function EmployeeDetailsPage({ params }: EmployeeDetailsPageProps) {
  const searchParams = useSearchParams()
  const { canViewEmployees, canCreateEmployee, isAdmin, isManager } = useGlobalPermissions()
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [payments, setPayments] = useState<SalaryPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [recordingPayment, setRecordingPayment] = useState(false)
  const paymentDeepLinkHandled = useRef(false)
  useBreadcrumbOverride(employeeId ? `/employees/${employeeId}` : '', loading ? 'Loading…' : employee?.name ?? 'Employee details')

  const canManageEmployee = canCreateEmployee && (isAdmin || isManager)

  useEffect(() => { void params.then(value => setEmployeeId(value.id)) }, [params])

  const fetchEmployeeDetails = useCallback(async () => {
    if (!employeeId) return
    setLoading(true)
    setError(null)
    try {
      const employeeData = await employeesAPI.getById(employeeId)
      setEmployee(employeeData)
      const historyResponse = await employeesAPI.getPaymentHistory(employeeId)
      setPayments(historyResponse.data)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Employee details could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void fetchEmployeeDetails())
    return () => window.cancelAnimationFrame(frame)
  }, [fetchEmployeeDetails])

  useEffect(() => {
    if (paymentDeepLinkHandled.current || searchParams.get('openPaymentModal') !== 'true' || !employee || !canManageEmployee) return
    paymentDeepLinkHandled.current = true
    window.history.replaceState({}, '', window.location.pathname)
    const frame = window.requestAnimationFrame(() => setShowPaymentModal(true))
    return () => window.cancelAnimationFrame(frame)
  }, [canManageEmployee, employee, searchParams])

  const recordPayment = async (data: RecordSalaryPaymentRequest) => {
    if (!employeeId) return
    setRecordingPayment(true)
    setError(null)
    try {
      await employeesAPI.recordPayment(employeeId, data)
      setShowPaymentModal(false)
      await fetchEmployeeDetails()
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'Salary payment could not be recorded.')
    } finally {
      setRecordingPayment(false)
    }
  }

  if (!canViewEmployees) {
    return <EmptyState icon={ShieldX} title="You don't have permission to view employees." description="Contact an administrator if you need access to employee records." className="min-h-64" />
  }
  if (loading) return <div className="flex min-h-64 items-center justify-center"><Spinner size="lg" label="Loading employee details…" /></div>
  if (!employee) {
    return <EmptyState title="Employee unavailable" description={error || 'The employee record could not be found.'} action={<Link href="/employees" className={buttonStyles({ variant: 'outline' })}>Back to employees</Link>} />
  }

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader
        title={employee.name}
        description={[employee.jobTitle, employee.email].filter(Boolean).join(' · ')}
        leading={<StatusBadge status={employee.status} appearance={employeeStatusAppearance(employee.status)} className="mt-1" />}
        actions={
          <>
            <Link href="/employees" className={buttonStyles({ variant: 'outline', size: 'sm' })}><ArrowLeft className="size-4" />Back</Link>
            {canManageEmployee && (
              <>
                <Button size="sm" onClick={() => setShowPaymentModal(true)}><WalletCards className="size-4" />Record payment</Button>
                <Link href={`/employees/${employee.id}/edit`} className={buttonStyles({ variant: 'outline', size: 'sm' })}><Pencil className="size-4" />Edit employee</Link>
              </>
            )}
          </>
        }
      />

      {error && <Alert variant="destructive"><AlertTitle>Employee action failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div className="min-w-0 space-y-6">
          <EmployeeInformation employee={employee} />
          <EmployeeSalaryConfiguration employee={employee} />
        </div>
        <EmployeeCreatedBy employee={employee} />
      </div>

      <EmployeePaymentHistory payments={payments} />

      {canManageEmployee && showPaymentModal && (
        <RecordSalaryPaymentDialog employee={employee} open={showPaymentModal} onOpenChange={setShowPaymentModal} submitting={recordingPayment} onSubmit={recordPayment} />
      )}
    </div>
  )
}
