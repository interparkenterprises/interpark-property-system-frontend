import Link from 'next/link'
import { Eye, Pencil } from 'lucide-react'
import type { Employee, EmployeeStatus } from '@/types'
import { buttonStyles } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const salaryFormatter = new Intl.NumberFormat('en-KE', {
  maximumFractionDigits: 2,
})

function formatSalary(amount: number) {
  return `KES ${salaryFormatter.format(amount)}`
}

interface EmployeeListProps {
  employees: Employee[]
  canEdit: boolean
}

function statusAppearance(status: EmployeeStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'success' as const
    case 'ON_LEAVE':
      return 'warning' as const
    case 'TERMINATED':
      return 'destructive' as const
    default:
      return 'neutral' as const
  }
}

function EmployeeIdentity({ employee }: { employee: Employee }) {
  return (
    <div className="min-w-0">
      <Link
        href={`/employees/${employee.id}`}
        className="block truncate font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {employee.name}
      </Link>
      {employee.email && <p className="mt-0.5 truncate text-xs text-muted-foreground">{employee.email}</p>}
    </div>
  )
}

function JobDetails({ employee }: { employee: Employee }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-foreground">{employee.jobTitle}</p>
      {employee.jobDescription && (
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{employee.jobDescription}</p>
      )}
    </div>
  )
}

function EmployeeStatuses({ employee }: { employee: Employee }) {
  const paymentStatus = employee.currentPaymentStatus || 'PENDING'

  return (
    <>
      <StatusBadge status={employee.status} appearance={statusAppearance(employee.status)} />
      <StatusBadge
        status={paymentStatus}
        appearance={paymentStatus === 'PAID' ? 'success' : 'warning'}
      />
    </>
  )
}

function EmployeeActions({ employee, canEdit }: { employee: Employee; canEdit: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link href={`/employees/${employee.id}`} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        View
      </Link>
      {canEdit && (
        <Link href={`/employees/${employee.id}/edit`} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </Link>
      )}
    </div>
  )
}

export function EmployeeList({ employees, canEdit }: EmployeeListProps) {
  return (
    <div className="space-y-3">
      <div className="hidden md:block">
        <Table className="min-w-[900px]">
          <TableHead>
            <TableHeader>Name</TableHeader>
            <TableHeader className="hidden lg:table-cell">Job Title</TableHeader>
            <TableHeader className="hidden 2xl:table-cell">Contact</TableHeader>
            <TableHeader className="hidden xl:table-cell">Salary</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Payment Status</TableHeader>
            <TableHeader>Actions</TableHeader>
          </TableHead>
          <TableBody>
            {employees.map((employee) => {
              const paymentStatus = employee.currentPaymentStatus || 'PENDING'

              return (
                <TableRow key={employee.id}>
                  <TableCell className="min-w-52 whitespace-normal">
                    <EmployeeIdentity employee={employee} />
                  </TableCell>
                  <TableCell className="hidden min-w-52 whitespace-normal lg:table-cell">
                    <JobDetails employee={employee} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground 2xl:table-cell">
                    {employee.phoneNumber || 'Not provided'}
                  </TableCell>
                  <TableCell className="hidden font-medium text-foreground xl:table-cell">
                    {formatSalary(employee.salaryAmount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={employee.status} appearance={statusAppearance(employee.status)} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={paymentStatus}
                      appearance={paymentStatus === 'PAID' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell className="min-w-36">
                    <EmployeeActions employee={employee} canEdit={canEdit} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {employees.map((employee) => (
          <Card key={employee.id}>
            <CardHeader className="pb-3">
              <EmployeeIdentity employee={employee} />
            </CardHeader>
            <CardContent className="space-y-4">
              <JobDetails employee={employee} />
              <div className="flex flex-wrap gap-2">
                <EmployeeStatuses employee={employee} />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Contact</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{employee.phoneNumber || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Salary</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{formatSalary(employee.salaryAmount)}</dd>
                </div>
              </dl>
            </CardContent>
            <CardFooter className="px-3 py-2">
              <EmployeeActions employee={employee} canEdit={canEdit} />
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {employees.length} employee{employees.length === 1 ? '' : 's'}
      </p>
    </div>
  )
}

export function EmployeeListSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading employees" aria-busy="true">
      <div className="rounded-md border border-border p-4">
        <Skeleton className="h-4 w-40" />
        <div className="mt-5 space-y-5">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="grid grid-cols-[minmax(0,1fr)_7rem] gap-6 border-t border-border pt-4 sm:grid-cols-[minmax(0,1fr)_8rem_10rem]"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-44 max-w-full" />
                <Skeleton className="h-3 w-64 max-w-full" />
              </div>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="hidden h-8 w-32 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
