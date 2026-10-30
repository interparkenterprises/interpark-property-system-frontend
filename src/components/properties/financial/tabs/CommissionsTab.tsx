'use client'

import { Calculator, LockKeyhole } from 'lucide-react'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatExactKes } from '@/lib/numberFormat'
import { PermissionCode, type Property } from '@/types'

function commissionAppearance(status: string) {
  return status === 'PAID' ? 'success' as const : status === 'PENDING' ? 'warning' as const : 'neutral' as const
}

export function CommissionsTab({ property }: { property: Property }) {
  const commissions = property.commissions ?? []

  return (
    <PermissionGuard
      permission={PermissionCode.VIEW_COMMISSIONS}
      fallback={<EmptyState icon={LockKeyhole} title="Access denied" description="You don't have permission to view commission records." />}
    >
      <Card>
        <CardHeader><SectionHeader title="Commission records" description={`${commissions.length} commission record${commissions.length === 1 ? '' : 's'}`} /></CardHeader>
        <CardContent>
          {commissions.length > 0 ? (
            <Table>
              <TableHead>
                <TableHeader>Period</TableHeader>
                <TableHeader>Manager</TableHeader>
                <TableHeader className="text-right">Income</TableHeader>
                <TableHeader className="text-right">Rate</TableHeader>
                <TableHeader className="text-right">Commission</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Paid date</TableHeader>
              </TableHead>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell><span className="block">{new Date(commission.periodStart).toLocaleDateString()}</span><span className="text-xs text-muted-foreground">to {new Date(commission.periodEnd).toLocaleDateString()}</span></TableCell>
                    <TableCell className="font-medium">{property.manager?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatExactKes(commission.incomeAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{commission.commissionFee}%</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatExactKes(commission.commissionAmount)}</TableCell>
                    <TableCell><StatusBadge status={commission.status} appearance={commissionAppearance(commission.status)} /></TableCell>
                    <TableCell>{commission.paidDate ? new Date(commission.paidDate).toLocaleDateString() : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={Calculator} title="No commission records found" description="Commission records will appear here when they become available." />
          )}
        </CardContent>
      </Card>
    </PermissionGuard>
  )
}
