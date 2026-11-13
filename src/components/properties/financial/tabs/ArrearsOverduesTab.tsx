'use client'

import type { Dispatch, SetStateAction } from 'react'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { DetailItem, DetailList } from '@/components/ui/detail-list'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { SectionHeader } from '@/components/ui/section-header'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat'
import { PermissionCode, type ArrearsResponse, type OverdueTenantsResponse } from '@/types'
import type { GroupedArrears, OverdueTenant } from '../types'

const overdueDistributionConfig = {
  count: { label: 'Tenants', color: 'var(--chart-3)' },
} satisfies ChartConfig

interface ArrearsOverduesTabProps {
  arrearsData: ArrearsResponse | null
  overdueData: OverdueTenantsResponse | null
  groupedArrears: GroupedArrears[]
  filteredOverdueTenants: OverdueTenant[]
  arrearsLoading: boolean
  overduesLoading: boolean
  exportingCombinedArrears: boolean
  overdueFilter: string
  overdueCustomDays: number
  expandedArrearsTenant: string | null
  expandedOverdueTenant: string | null
  setOverdueFilter: Dispatch<SetStateAction<string>>
  setOverdueCustomDays: Dispatch<SetStateAction<number>>
  setExpandedArrearsTenant: Dispatch<SetStateAction<string | null>>
  setExpandedOverdueTenant: Dispatch<SetStateAction<string | null>>
  fetchArrearsData: () => Promise<void>
  fetchOverduesData: () => Promise<void>
  handleExportCombinedArrearsToPDF: () => Promise<void>
}

export function ArrearsOverduesTab({
  arrearsData,
  overdueData,
  groupedArrears,
  filteredOverdueTenants,
  arrearsLoading,
  overduesLoading,
  exportingCombinedArrears,
  overdueFilter,
  overdueCustomDays,
  expandedArrearsTenant,
  expandedOverdueTenant,
  setOverdueFilter,
  setOverdueCustomDays,
  setExpandedArrearsTenant,
  setExpandedOverdueTenant,
  fetchArrearsData,
  fetchOverduesData,
  handleExportCombinedArrearsToPDF,
}: ArrearsOverduesTabProps) {
  return (
<PermissionGuard 
  permissions={[
    PermissionCode.VIEW_ARREARS, 
    PermissionCode.VIEW_OVERDUE_INVOICES, 
    PermissionCode.VIEW_TENANT_FINANCIALS
  ]} 
  fallback={<EmptyState title="Access denied" description="You do not have permission to view arrears and overdue data." />}
>
  <Card>
    <CardHeader>
      <SectionHeader
        title="Arrears & overdues"
        description="Review outstanding invoice balances and tenants with overdue payment schedules."
        actions={(((arrearsData?.arrears?.length ?? 0) > 0) || ((overdueData?.tenants?.length ?? 0) > 0)) ? (
          <Button
            onClick={handleExportCombinedArrearsToPDF}
            disabled={exportingCombinedArrears}
            loading={exportingCombinedArrears}
          >
            {!exportingCombinedArrears && <Download className="size-4" aria-hidden="true" />}
            {exportingCombinedArrears ? 'Exporting…' : 'Export combined report'}
          </Button>
        ) : undefined}
      />
    </CardHeader>
    <CardContent className="space-y-8">

      {/* Overdue Filter - Only show if data is loaded */}
      {overdueData && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-medium text-foreground">Overdue period</span>
            {[
              ['all', 'All overdues'],
              ['7', '7 days'],
              ['30', '30 days'],
              ['60', '60 days'],
              ['90', '90 days'],
            ].map(([value, label]) => (
              <Button key={value} type="button" size="sm" variant={overdueFilter === value ? 'default' : 'outline'} onClick={() => setOverdueFilter(value)}>
                {label}
              </Button>
            ))}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={overdueFilter === 'custom' ? 'default' : 'outline'}
                onClick={() => setOverdueFilter('custom')}
              >
                Custom
              </Button>
              {overdueFilter === 'custom' && (
                <>
                  <Input
                    type="number"
                    value={overdueCustomDays}
                    onChange={(e) => setOverdueCustomDays(parseInt(e.target.value) || 0)}
                    placeholder="Days"
                    min="1"
                    className="w-20"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => overdueCustomDays > 0 && fetchOverduesData()}
                  >
                    Apply
                  </Button>
                </>
              )}
            </div>
          </div>
          {overdueFilter !== 'all' && (
            <p className="mt-3 text-sm text-muted-foreground">
              Showing tenants overdue by {overdueFilter === 'custom' ? overdueCustomDays : overdueFilter} days or more
            </p>
          )}
        </div>
      )}

      {/* Loading State */}
      {(arrearsLoading || overduesLoading) ? (
        <div className="flex min-h-48 items-center justify-center"><Spinner size="lg" label="Loading arrears data…" /></div>
      ) : (
        <>
          {/* Arrears */}
          {arrearsData && (
            <section className="space-y-5">
              <div className="rounded-lg border border-border bg-muted/20 p-5">
                <SectionHeader title="Arrears position" description="Outstanding invoice balances for this property." />
                <div className="mt-5 grid gap-5 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total arrears</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground" title={formatExactKes(arrearsData.summary.totalArrears)}>{formatCompactKes(arrearsData.summary.totalArrears)}</p>
                  </div>
                  <div className="border-t border-border pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                    <p className="text-xs text-muted-foreground">Total expected</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground" title={formatExactKes(arrearsData.summary.totalExpected)}>{formatCompactKes(arrearsData.summary.totalExpected)}</p>
                  </div>
                  <div className="border-t border-border pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                    <p className="text-xs text-muted-foreground">Total paid</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground" title={formatExactKes(arrearsData.summary.totalPaid)}>{formatCompactKes(arrearsData.summary.totalPaid)}</p>
                  </div>
                  <div className="border-t border-border pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                    <p className="text-xs text-muted-foreground">Outstanding invoices</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{arrearsData.summary.itemCount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {groupedArrears.length > 0 && (
                <div className="space-y-3">
                  <SectionHeader
                    title="Arrears by tenant"
                    description={`${groupedArrears.length} tenant${groupedArrears.length === 1 ? '' : 's'} with outstanding invoices.`}
                  />
                  <Accordion
                    value={expandedArrearsTenant ? [expandedArrearsTenant] : []}
                    onValueChange={(value) => setExpandedArrearsTenant(value[0] ?? null)}
                  >
                    {groupedArrears.map((group) => (
                      <AccordionItem key={group.tenantId} value={group.tenantId}>
                        <div className="flex min-w-0 items-center gap-3 py-5">
                          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              {group.tenantId ? (
                                <Link
                                  href={`/properties/${group.tenantId}/tenant-details`}
                                  className="inline-block max-w-full truncate text-base font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  {group.tenantName}
                                </Link>
                              ) : <p className="truncate text-base font-semibold text-foreground">{group.tenantName}</p>}
                              <p className="mt-1 text-sm font-normal text-muted-foreground">
                                {group.unitName} <span aria-hidden="true" className="px-1.5">•</span>
                                {group.items.length} outstanding {group.items.length !== 1 ? 'invoices' : 'invoice'}
                              </p>
                            </div>
                            <div className="grid shrink-0 grid-cols-2 gap-x-5 text-left sm:text-right">
                              <div>
                                <span className="block text-xs font-normal text-muted-foreground">Paid</span>
                                <span className="font-semibold tabular-nums text-success" title={formatExactKes(group.totalPaid)}>{formatCompactKes(group.totalPaid)}</span>
                              </div>
                              <div>
                                <span className="block text-xs font-normal text-muted-foreground">Balance</span>
                                <span className="font-semibold tabular-nums text-destructive" title={formatExactKes(group.totalArrears)}>{formatCompactKes(group.totalArrears)}</span>
                              </div>
                            </div>
                          </div>
                          <AccordionTrigger
                            className="flex-none rounded-md p-2 hover:bg-muted hover:no-underline"
                            aria-label={`${expandedArrearsTenant === group.tenantId ? 'Collapse' : 'Expand'} arrears details for ${group.tenantName}`}
                          >
                            <span className="sr-only">{expandedArrearsTenant === group.tenantId ? 'Collapse' : 'Expand'} arrears details</span>
                          </AccordionTrigger>
                        </div>

                        <AccordionContent className="pb-5">
                              <div className="pt-1">
                                <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                                  Outstanding Invoices
                                </h4>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHead>
                                        <TableHeader className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Invoice #</TableHeader>
                                        <TableHeader className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Type</TableHeader>
                                        <TableHeader className="text-right">Expected</TableHeader>
                                        <TableHeader className="text-right">Paid</TableHeader>
                                        <TableHeader className="text-right">Balance</TableHeader>
                                        <TableHeader className="text-left py-3 px-4 font-semibold text-muted-foreground text-sm">Status</TableHeader>
                                      </TableHead>
                                    <TableBody>
                                      {group.items.map((item) => (
                                        <TableRow
                                          key={item.id}
                                          className="border-b border-border last:border-0 hover:bg-muted/40"
                                        >
                                          <TableCell className="py-3 px-4 font-mono text-sm text-foreground">
                                            {item.invoiceNumber}
                                          </TableCell>
                                          <TableCell className="py-3 px-4">
                                            <Badge variant="info">{item.invoiceType === 'RENT' ? 'Rent' : item.billType}</Badge>
                                          </TableCell>
                                          <TableCell className="text-right tabular-nums">
                                            Ksh {item.expectedAmount?.toLocaleString() || '-'}
                                          </TableCell>
                                          <TableCell className="text-right tabular-nums">
                                            <span className="text-success font-medium">
                                              Ksh {item.paidAmount.toLocaleString()}
                                            </span>
                                          </TableCell>
                                          <TableCell className="text-right tabular-nums">
                                            <span className="font-bold text-destructive">
                                              Ksh {item.balance.toLocaleString()}
                                            </span>
                                          </TableCell>
                                          <TableCell className="py-3 px-4">
                                            <StatusBadge
                                              status={item.status === 'UNPAID' ? 'Unpaid' : 'Partial'}
                                              appearance={item.status === 'UNPAID' ? 'destructive' : 'warning'}
                                            />
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                    <TableBody>
                                      <TableRow className="bg-destructive/10/50 font-semibold">
                                        <TableCell className="py-3 px-4 text-foreground" colSpan={2}>Total Balance</TableCell>
                                        <TableCell className="py-3 px-4 text-muted-foreground">
                                          Ksh {group.items.reduce((sum, item) => sum + (item.expectedAmount || 0), 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-success">
                                          Ksh {group.totalPaid.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-destructive" colSpan={2}>
                                          Ksh {group.totalArrears.toLocaleString()}
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
              {groupedArrears.length === 0 && (
                <EmptyState title="No arrears found" description="There are no outstanding invoice balances for this property." />
              )}
            </section>
          )}

          {/* Overdues */}
          {overdueData && (
            <section className="space-y-5 border-t border-border pt-8">
              <div className="rounded-lg border border-border bg-muted/20 p-5">
                <SectionHeader title="Overdue position" description="Tenants whose payment schedules are past their due date." />
                <div className="mt-5 grid gap-5 md:grid-cols-[1.2fr_1fr_1fr] md:items-end">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total overdue amount</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground" title={formatExactKes(overdueData.summary.totalOverdueAmount)}>{formatCompactKes(overdueData.summary.totalOverdueAmount)}</p>
                  </div>
                  <div className="border-t border-border pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                    <p className="text-xs text-muted-foreground">Overdue tenants</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{overdueData.summary.totalOverdueTenants.toLocaleString()}</p>
                  </div>
                  <div className="border-t border-border pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                    <p className="text-xs text-muted-foreground">Average overdue</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground" title={formatExactKes(overdueData.summary.averageOverdueAmount)}>{formatCompactKes(overdueData.summary.averageOverdueAmount)}</p>
                  </div>
                </div>
              </div>

              {overdueData.summary.overdueCategories && filteredOverdueTenants.length > 0 && (
                <div className="space-y-3">
                  <SectionHeader title="Overdue distribution" />
                  {Object.values(overdueData.summary.overdueCategories).some(count => count > 0) ? (
                    <ChartContainer config={overdueDistributionConfig} className="h-64 w-full aspect-auto">
                      <BarChart
                        accessibilityLayer
                        layout="vertical"
                        data={[
                          { bucket: '1 week', count: overdueData.summary.overdueCategories.week1 },
                          { bucket: '2 weeks', count: overdueData.summary.overdueCategories.week2 },
                          { bucket: '1 month', count: overdueData.summary.overdueCategories.month1 },
                          { bucket: '2 months', count: overdueData.summary.overdueCategories.month2 },
                          { bucket: '3 months', count: overdueData.summary.overdueCategories.month3 },
                          { bucket: 'Over 3 months', count: overdueData.summary.overdueCategories.more },
                        ]}
                        margin={{ left: 4, right: 28 }}
                      >
                        <CartesianGrid horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                        <YAxis dataKey="bucket" type="category" width={88} tickLine={false} axisLine={false} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]}>
                          <LabelList dataKey="count" position="right" className="fill-foreground" fontSize={12} />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">No overdue tenants fall within the distribution buckets.</p>
                  )}
                </div>
              )}

              {filteredOverdueTenants.length > 0 ? (
                <div className="space-y-3">
                  <SectionHeader
                    title="Overdue tenants"
                    description={`${filteredOverdueTenants.length} tenant${filteredOverdueTenants.length === 1 ? '' : 's'} match the selected period.`}
                  />
                  <Accordion
                    value={expandedOverdueTenant ? [expandedOverdueTenant] : []}
                    onValueChange={(value) => setExpandedOverdueTenant(value[0] ?? null)}
                  >
                    {filteredOverdueTenants.map((tenant) => {
                      const outstandingBalance = tenant.paymentSummary?.paymentHistory?.outstandingBalance || 0;
                      const totalPaid = tenant.paymentSummary?.paymentHistory?.totalPaid || 0;
                      const nextDueDate = tenant.paymentSummary?.nextPayment?.dueDateFormatted || '-';
                      const paymentsBehind = tenant.paymentSummary?.nextPayment?.paymentsBehind || 0;
                      const paymentPerPeriod = tenant.paymentSummary?.paymentAmountPerPeriod || 0;
                      const unitLabel = [tenant.unit?.type, tenant.unit?.unitNo].filter(Boolean).join(' ') || 'Unit';
                      const overdueDays = tenant.overdueDetails?.daysOverdue || paymentsBehind * 30;

                      return (
                        <AccordionItem key={tenant.id} value={tenant.id}>
                          <div className="flex min-w-0 items-center gap-3 py-5">
                            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                {tenant.id ? (
                                  <Link
                                    href={`/properties/${tenant.id}/tenant-details`}
                                    className="inline-block max-w-full truncate text-base font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  >
                                    {tenant.fullName}
                                  </Link>
                                ) : <p className="truncate text-base font-semibold text-foreground">{tenant.fullName}</p>}
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-normal text-muted-foreground">
                                  <span>{unitLabel}</span>
                                  <span aria-hidden="true">•</span>
                                  <span className="truncate">{tenant.contact || tenant.email || 'No contact'}</span>
                                  <Badge variant="destructive">{tenant.overdueDetails?.periodText || `${overdueDays} days overdue`}</Badge>
                                </div>
                              </div>
                              <div className="grid shrink-0 grid-cols-2 gap-x-5 text-left sm:text-right">
                                <div>
                                  <span className="block text-xs font-normal text-muted-foreground">Payments behind</span>
                                  <span className="font-semibold tabular-nums text-foreground">{paymentsBehind}</span>
                                </div>
                                <div>
                                  <span className="block text-xs font-normal text-muted-foreground">Outstanding</span>
                                  <span className="font-semibold tabular-nums text-destructive" title={formatExactKes(outstandingBalance)}>{formatCompactKes(outstandingBalance)}</span>
                                </div>
                              </div>
                            </div>
                            <AccordionTrigger
                              className="flex-none rounded-md p-2 hover:bg-muted hover:no-underline"
                              aria-label={`${expandedOverdueTenant === tenant.id ? 'Collapse' : 'Expand'} overdue details for ${tenant.fullName}`}
                            >
                              <span className="sr-only">{expandedOverdueTenant === tenant.id ? 'Collapse' : 'Expand'} overdue details</span>
                            </AccordionTrigger>
                          </div>
                          <AccordionContent className="pb-5">
                            <DetailList>
                              <DetailItem label="Payment status">
                                <StatusBadge status={tenant.paymentSummary?.status || 'OVERDUE'} appearance="destructive" />
                              </DetailItem>
                              <DetailItem label="Next due date">{nextDueDate}</DetailItem>
                              <DetailItem label="Payment per period">
                                <span className="tabular-nums" title={formatExactKes(paymentPerPeriod)}>{formatCompactKes(paymentPerPeriod)}</span>
                              </DetailItem>
                              <DetailItem label="Total paid">
                                <span className="font-medium tabular-nums text-success" title={formatExactKes(totalPaid)}>{formatCompactKes(totalPaid)}</span>
                              </DetailItem>
                              <DetailItem label="Lease term">{tenant.leaseTerm || '-'}</DetailItem>
                            </DetailList>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              ) : (
                <EmptyState
                  title="No overdue tenants found"
                  description={overdueFilter === 'all'
                    ? 'All tenants in this property are up to date.'
                    : `No tenants are overdue by ${overdueFilter === 'custom' ? overdueCustomDays : overdueFilter} days or more.`}
                />
              )}
            </section>
          )}

          {/* No Data State */}
          {!arrearsData && !overdueData && (
            <EmptyState
              title="No arrears or overdue data available"
              description="Load the current property balances and overdue records."
              action={<Button onClick={() => { fetchArrearsData(); fetchOverduesData(); }}>Load data</Button>}
            />
          )}
        </>
      )}
    </CardContent>
  </Card>
</PermissionGuard>
  )
}
