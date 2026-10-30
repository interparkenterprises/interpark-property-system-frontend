import type { Employee, SalaryPayment } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DetailItem, DetailList } from '@/components/ui/detail-list'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { employeeStatusAppearance, formatEmployeeCurrency, paymentStatusAppearance } from './employeePresentation'

export function EmployeeInformation({ employee }: { employee: Employee }) {
  return (
    <Card>
      <CardHeader><CardTitle>Employee information</CardTitle></CardHeader>
      <CardContent>
        <DetailList>
          <DetailItem label="Full name">{employee.name}</DetailItem>
          <DetailItem label="Email">{employee.email || 'Not provided'}</DetailItem>
          <DetailItem label="Phone number">{employee.phoneNumber || 'Not provided'}</DetailItem>
          <DetailItem label="Job title">{employee.jobTitle}</DetailItem>
          <DetailItem label="Job description">{employee.jobDescription || 'No description provided'}</DetailItem>
          <DetailItem label="Employment status"><StatusBadge status={employee.status} appearance={employeeStatusAppearance(employee.status)} /></DetailItem>
        </DetailList>
      </CardContent>
    </Card>
  )
}

export function EmployeeSalaryConfiguration({ employee }: { employee: Employee }) {
  const paymentStatus = employee.currentPaymentStatus || 'PENDING'
  return (
    <Card>
      <CardHeader><CardTitle>Salary configuration</CardTitle></CardHeader>
      <CardContent>
        <DetailList>
          <DetailItem label="Configured salary"><span className="font-semibold tabular-nums">{formatEmployeeCurrency(employee.salaryAmount)}</span></DetailItem>
          <DetailItem label="Payment frequency"><span className="capitalize">{employee.paymentFrequency.toLowerCase().replace('_', '-')}</span></DetailItem>
          <DetailItem label="Current period">{employee.currentPaymentPeriod || 'Not available'}</DetailItem>
          <DetailItem label="Payment status"><StatusBadge status={paymentStatus} appearance={paymentStatusAppearance(paymentStatus)} /></DetailItem>
        </DetailList>
      </CardContent>
    </Card>
  )
}

export function EmployeeCreatedBy({ employee }: { employee: Employee }) {
  return (
    <Card>
      <CardHeader><CardTitle>Created by</CardTitle></CardHeader>
      <CardContent>
        {employee.createdBy ? (
          <DetailList>
            <DetailItem label="Name">{employee.createdBy.name}</DetailItem>
            <DetailItem label="Email">{employee.createdBy.email}</DetailItem>
            <DetailItem label="Role"><StatusBadge status={employee.createdBy.role} appearance="info" /></DetailItem>
          </DetailList>
        ) : <p className="text-sm text-muted-foreground">Creator information is not available.</p>}
      </CardContent>
    </Card>
  )
}

export function EmployeePaymentHistory({ payments }: { payments: SalaryPayment[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Payment history</CardTitle></CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <EmptyState title="No payment records found" description="Recorded salary payments will appear here." className="min-h-40" />
        ) : (
          <Table className="min-w-[860px]">
            <TableHead>
              <TableHeader>Payment date</TableHeader>
              <TableHeader>Period</TableHeader>
              <TableHeader className="text-right">Amount</TableHeader>
              <TableHeader>Method</TableHeader>
              <TableHeader>Transaction ref</TableHeader>
              <TableHeader>Recorded by</TableHeader>
            </TableHead>
            <TableBody>
              {payments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell>{payment.paymentPeriod}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatEmployeeCurrency(payment.amount)}</TableCell>
                  <TableCell>{payment.paymentMethod}</TableCell>
                  <TableCell className="text-muted-foreground">{payment.transactionRef || 'Not provided'}</TableCell>
                  <TableCell className="text-muted-foreground">{payment.recordedBy?.name || 'System'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

