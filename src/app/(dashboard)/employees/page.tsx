'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw, ShieldX, UserRoundPlus, UsersRound, WalletCards } from 'lucide-react'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { employeesAPI } from '@/lib/api'
import type { Employee } from '@/types'
import { EmployeeList, EmployeeListSkeleton } from '@/components/employees/EmployeeList'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonStyles } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export default function EmployeesPage() {
  const { canViewEmployees, canCreateEmployee, isAdmin, isManager } = useGlobalPermissions()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await employeesAPI.getAll({ page: 1, limit: 100 })
      setEmployees(result.employees)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Employees could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void fetchEmployees())
    return () => window.cancelAnimationFrame(frame)
  }, [fetchEmployees])

  if (!canViewEmployees) {
    return (
      <EmptyState
        icon={ShieldX}
        title="You don't have permission to view employees."
        description="Contact an administrator if you need access to employee records."
        className="min-h-64"
      />
    )
  }

  const canAddEmployee = canCreateEmployee && (isAdmin || isManager)

  return (
    <div className="min-w-0 space-y-6 pb-4">
      <PageHeader
        title="Employees"
        description="View and manage employees."
        actions={
          <>
            <Link href="/employees/due" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
              <WalletCards className="h-4 w-4" aria-hidden="true" />
              View Due for Payment
            </Link>
            {canAddEmployee && (
              <Link href="/employees/create" className={buttonStyles({ size: 'sm' })}>
                <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
                Add New Employee
              </Link>
            )}
          </>
        }
      />

      {loading ? (
        <EmployeeListSkeleton />
      ) : error ? (
        <Alert variant="destructive" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <AlertTitle>Unable to load employees</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchEmployees()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        </Alert>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No employees found"
          description="Employee records will appear here once they are added."
          action={
            canAddEmployee ? (
              <Link href="/employees/create" className={buttonStyles({ size: 'sm' })}>
                <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
                Add New Employee
              </Link>
            ) : undefined
          }
        />
      ) : (
        <EmployeeList employees={employees} canEdit={canAddEmployee} />
      )}
    </div>
  )
}
