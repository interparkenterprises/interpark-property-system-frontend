'use client'

import type { Dispatch, SetStateAction } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Banknote, ChevronDown, LockKeyhole } from 'lucide-react'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatExactKes } from '@/lib/numberFormat'
import { PermissionCode } from '@/types'
import type { GroupedIncome } from '../types'

interface IncomeDetailsTabProps {
  groupedIncome: GroupedIncome[]
  expandedTenantId: string | null
  onExpandedTenantChange: Dispatch<SetStateAction<string | null>>
}

export function IncomeDetailsTab({ groupedIncome, expandedTenantId, onExpandedTenantChange }: IncomeDetailsTabProps) {
  return (
    <PermissionGuard
      permissions={[PermissionCode.VIEW_TENANT_FINANCIALS, PermissionCode.VIEW_PAYMENT_REPORTS]}
      fallback={<EmptyState icon={LockKeyhole} title="Access denied" description="You don't have permission to view income details." />}
    >
      <Card>
        <CardHeader>
          <SectionHeader title="Income by tenant" description={`${groupedIncome.length} tenant${groupedIncome.length === 1 ? '' : 's'} with income records`} />
        </CardHeader>
        <CardContent>
          {groupedIncome.length > 0 ? (
            <div className="space-y-3">
              {groupedIncome.map((group) => {
                const expanded = expandedTenantId === group.tenantId
                return (
                  <div key={group.tenantId} className="overflow-hidden rounded-lg border border-border">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => onExpandedTenantChange(expanded ? null : group.tenantId)}
                      className="flex w-full min-w-0 items-center justify-between gap-4 bg-muted/20 p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{group.tenantName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{group.unitName} · {group.incomes.length} payment{group.incomes.length === 1 ? '' : 's'}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total paid</p>
                          <p className="font-semibold tabular-nums text-foreground" title={formatExactKes(group.totalAmount)}>{formatExactKes(group.totalAmount)}</p>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border">
                          <div className="p-4">
                            <Table>
                              <TableHead>
                                <TableHeader>Date</TableHeader>
                                <TableHeader className="text-right">Amount</TableHeader>
                                <TableHeader>Frequency</TableHeader>
                                <TableHeader>Invoice #</TableHeader>
                              </TableHead>
                              <TableBody>
                                {group.incomes.map((income) => (
                                  <TableRow key={income.id}>
                                    <TableCell>{new Date(income.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</TableCell>
                                    <TableCell className="text-right font-medium tabular-nums">{formatExactKes(income.amount)}</TableCell>
                                    <TableCell><Badge variant="neutral">{income.frequency}</Badge></TableCell>
                                    <TableCell><Badge variant="success">Recorded</Badge></TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="bg-muted/30 font-semibold hover:bg-muted/30">
                                  <TableCell>Total</TableCell>
                                  <TableCell className="text-right tabular-nums" colSpan={3}>{formatExactKes(group.totalAmount)}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={Banknote} title="No income records found" description="Tenant income records will appear here when they become available." />
          )}
        </CardContent>
      </Card>
    </PermissionGuard>
  )
}
