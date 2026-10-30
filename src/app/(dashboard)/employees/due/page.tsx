'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, ShieldX, WalletCards } from 'lucide-react'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { formatEmployeeCurrency } from '@/components/employees/employeePresentation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonStyles } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { employeesAPI } from '@/lib/api'
import type { Employee } from '@/types'

export default function DueEmployeesPage() {
  const router = useRouter()
  const { canViewEmployees, canCreateEmployee, isAdmin, isManager } = useGlobalPermissions()
  const [dueEmployees, setDueEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canRecordPayment = canCreateEmployee && (isAdmin || isManager)

  const fetchDueEmployees = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await employeesAPI.getDueForPayment()
      setDueEmployees(result.data)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Employees due for payment could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void fetchDueEmployees())
    return () => window.cancelAnimationFrame(frame)
  }, [fetchDueEmployees])

  if (!canViewEmployees) {
    return <EmptyState icon={ShieldX} title="You don't have permission to view employees." description="Contact an administrator if you need access to employee records." className="min-h-64" />
  }

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader
        title="Employees due for payment"
        description="Employees who have not received payment for the current period."
        actions={<Link href="/employees" className={buttonStyles({ variant: 'outline', size: 'sm' })}><ArrowLeft className="size-4" />Back to employees</Link>}
      />

      {loading ? (
        <div className="flex min-h-64 items-center justify-center"><Spinner size="lg" label="Loading employees due for payment…" /></div>
      ) : error ? (
        <Alert variant="destructive" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><AlertTitle>Unable to load payment status</AlertTitle><AlertDescription>{error}</AlertDescription></div>
          <Button variant="outline" size="sm" onClick={() => void fetchDueEmployees()}><RefreshCw className="size-4" />Retry</Button>
        </Alert>
      ) : dueEmployees.length === 0 ? (
        <EmptyState icon={WalletCards} title="All employees are up to date" description="No employee salary payments are currently due." />
      ) : (
        <div className="space-y-4">
          <Alert><AlertTitle>Salary payments due</AlertTitle><AlertDescription>{dueEmployees.length} employee{dueEmployees.length === 1 ? '' : 's'} require payment for the current period.</AlertDescription></Alert>
          <Table className="min-w-[900px]">
            <TableHead>
              <TableHeader>Employee</TableHeader>
              <TableHeader>Job title</TableHeader>
              <TableHeader>Contact</TableHeader>
              <TableHeader className="text-right">Salary amount</TableHeader>
              <TableHeader>Payment frequency</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableHead>
            <TableBody>
              {dueEmployees.map(employee => (
                <TableRow key={employee.id}>
                  <TableCell className="min-w-52 whitespace-normal">
                    <Link href={`/employees/${employee.id}`} className="font-medium underline-offset-4 hover:text-primary hover:underline">{employee.name}</Link>
                    {employee.email && <p className="mt-0.5 text-xs text-muted-foreground">{employee.email}</p>}
                  </TableCell>
                  <TableCell>{employee.jobTitle}</TableCell>
                  <TableCell className="text-muted-foreground">{employee.phoneNumber || 'Not provided'}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatEmployeeCurrency(employee.salaryAmount)}</TableCell>
                  <TableCell className="capitalize">{employee.paymentFrequency.toLowerCase().replace('_', '-')}</TableCell>
                  <TableCell>
                    {canRecordPayment ? (
                      <Button size="sm" onClick={() => router.push(`/employees/${employee.id}?openPaymentModal=true`)}>Record payment</Button>
                    ) : <span className="text-sm text-muted-foreground">View only</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
