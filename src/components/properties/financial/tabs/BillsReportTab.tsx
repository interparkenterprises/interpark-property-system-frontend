'use client'

import type { Dispatch, SetStateAction } from 'react'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PermissionCode } from '@/types'
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat'
import type { BillsReportData, BillsReportFilters } from '../types'

const billsTrendConfig = {
  expected: { label: 'Total billed', color: 'var(--chart-1)' },
  collected: { label: 'Total collected', color: 'var(--chart-2)' },
  arrears: { label: 'Total arrears', color: 'var(--chart-5)' },
} satisfies ChartConfig

interface BillsReportTabProps {
  billsReportData: BillsReportData | null
  billsReportLoading: boolean
  exportingBillsReport: boolean
  billsReportFilters: BillsReportFilters
  setBillsReportFilters: Dispatch<SetStateAction<BillsReportFilters>>
  fetchBillsReport: () => Promise<void>
  handleExportBillsReport: () => Promise<void>
}

export function BillsReportTab({
  billsReportData,
  billsReportLoading,
  exportingBillsReport,
  billsReportFilters,
  setBillsReportFilters,
  fetchBillsReport,
  handleExportBillsReport,
}: BillsReportTabProps) {
  return (
<PermissionGuard permission={PermissionCode.VIEW_BILL_INVOICES} fallback={<EmptyState title="Access denied" description="You do not have permission to view bills reports." />}>
  <Card>
    <CardHeader>
      <SectionHeader
        title="Bills payment report"
        description="Water and electricity bill collection analysis."
        actions={(
          <Button onClick={handleExportBillsReport} disabled={!billsReportData} loading={exportingBillsReport}>
            {!exportingBillsReport && <Download className="size-4" aria-hidden="true" />}
            {exportingBillsReport ? 'Exporting…' : 'Export to Excel'}
          </Button>
        )}
      />
    </CardHeader>
    <CardContent className="space-y-6">

      {/* Filters */}
      <div className="mb-6 rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          <div className="min-w-0">
            <DateRangePicker
              value={{ from: billsReportFilters.dateFrom, to: billsReportFilters.dateTo }}
              onChange={({ from, to }) => setBillsReportFilters((current) => ({ ...current, dateFrom: from, dateTo: to }))}
              disabled={billsReportLoading}
              aria-label="Select bills report date range"
            />
          </div>
          <div className="min-w-44">
            <label className="sr-only">Bill type</label>
            <Select
              value={billsReportFilters.billType || 'all'}
              onValueChange={(billType) => setBillsReportFilters({ ...billsReportFilters, billType: billType === 'all' ? '' : billType })}
            >
              <SelectTrigger aria-label="Bill type"><SelectValue placeholder="All bill types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="WATER">Water</SelectItem>
                <SelectItem value="ELECTRICITY">Electricity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-44">
            <label className="sr-only">Status</label>
            <Select
              value={billsReportFilters.status || 'all'}
              onValueChange={(status) => setBillsReportFilters({ ...billsReportFilters, status: status === 'all' ? '' : status })}
            >
              <SelectTrigger aria-label="Invoice status"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button onClick={fetchBillsReport} disabled={billsReportLoading} loading={billsReportLoading}>
              Apply Filters
            </Button>
          </div>
        </div>
        {/* Show active filters */}
        {(billsReportFilters.billType || billsReportFilters.status) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Additional filters:</span>
            {billsReportFilters.billType && (
              <Badge variant="info">Type: {billsReportFilters.billType}</Badge>
            )}
            {billsReportFilters.status && (
              <StatusBadge status={billsReportFilters.status} />
            )}
          </div>
        )}
      </div>

      {billsReportLoading ? (
        <div className="flex min-h-48 items-center justify-center"><Spinner size="lg" label="Loading bills report…" /></div>
      ) : billsReportData ? (
        <>
          <div className="rounded-lg border border-border bg-muted/20 p-5">
            <SectionHeader title="Bills performance" description="Water and electricity collection for the selected reporting period." />
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Water collection</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{billsReportData.summary.water.collectionRate}%</p>
                <p className="mt-1 text-xs text-muted-foreground"><span title={formatExactKes(billsReportData.summary.water.totalCollected)}>{formatCompactKes(billsReportData.summary.water.totalCollected)}</span> collected of <span title={formatExactKes(billsReportData.summary.water.totalBilled)}>{formatCompactKes(billsReportData.summary.water.totalBilled)}</span> billed</p>
              </div>
              <div className="border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                <p className="text-sm font-medium text-muted-foreground">Electricity collection</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{billsReportData.summary.electricity.collectionRate}%</p>
                <p className="mt-1 text-xs text-muted-foreground"><span title={formatExactKes(billsReportData.summary.electricity.totalCollected)}>{formatCompactKes(billsReportData.summary.electricity.totalCollected)}</span> collected of <span title={formatExactKes(billsReportData.summary.electricity.totalBilled)}>{formatCompactKes(billsReportData.summary.electricity.totalBilled)}</span> billed</p>
              </div>
              <div className="border-t border-border pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                <p className="text-sm font-medium text-muted-foreground">Total arrears</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground" title={formatExactKes(billsReportData.summary.overall.totalArrears)}>{formatCompactKes(billsReportData.summary.overall.totalArrears)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{billsReportData.summary.totalTenants} tenants with bills</p>
              </div>
              <div className="border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                <p className="text-sm font-medium text-muted-foreground">Delinquent bills</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{billsReportData.summary.overall.delinquentBillsCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">Over 30 days overdue</p>
                {(billsReportData.summary.totalCredit ?? 0) > 0 && <p className="mt-1 text-xs text-muted-foreground">Credit: <span title={formatExactKes(billsReportData.summary.totalCredit ?? 0)}>{formatCompactKes(billsReportData.summary.totalCredit ?? 0)}</span></p>}
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="space-y-3">
            <SectionHeader title="Bill payment breakdown" />
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/20 p-4 md:grid-cols-4">
              {([
                ['Paid', billsReportData.summary.overall.paymentBreakdown.paid],
                ['Partial', billsReportData.summary.overall.paymentBreakdown.partial],
                ['Unpaid', billsReportData.summary.overall.paymentBreakdown.unpaid],
                ['Overdue', billsReportData.summary.overall.paymentBreakdown.overdue],
              ] as const).map(([label, count]) => (
                <div key={label} className="flex items-center justify-between gap-3 md:block">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground md:mt-1">{count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trends */}
          {billsReportData.monthlyTrends && billsReportData.monthlyTrends.length > 0 && (
            <div className="space-y-3">
              <SectionHeader title="Monthly trends" />
              {billsReportData.monthlyTrends.some(trend => trend.total.expected !== 0 || trend.total.collected !== 0 || trend.total.arrears !== 0) && (
                <ChartContainer config={billsTrendConfig} className="h-72 w-full aspect-auto">
                  <LineChart accessibilityLayer data={billsReportData.monthlyTrends.map(trend => ({ month: trend.month, expected: trend.total.expected, collected: trend.total.collected, arrears: trend.total.arrears }))} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={value => formatCompactKes(Number(value)).replace('Ksh ', '')} width={62} />
                    <ChartTooltip content={<ChartTooltipContent indicator="line" formatter={(value, name, item) => (
                      <div className="flex min-w-44 items-center justify-between gap-4"><span className="text-muted-foreground">{billsTrendConfig[name as keyof typeof billsTrendConfig]?.label ?? name}</span><span className="font-mono font-medium text-foreground" style={{ color: item.color }}>{formatExactKes(Number(value))}</span></div>
                    )} />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="expected" stroke="var(--color-expected)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="collected" stroke="var(--color-collected)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="arrears" stroke="var(--color-arrears)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Month</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Water Expected</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Water Collected</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Water Arrears</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Elec Expected</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Elec Collected</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Elec Arrears</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Total Expected</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Total Collected</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Total Arrears</TableHeader>
                    </TableHead>
                  <TableBody>
                    {billsReportData.monthlyTrends.map((trend, idx: number) => (
                      <TableRow key={idx} className="border-b border-border hover:bg-muted/40">
                        <TableCell className="py-3 px-4 font-medium text-foreground">{trend.month}</TableCell>
                        <TableCell className="py-3 px-4 text-right text-foreground">Ksh {trend.water.expected.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4 text-right text-success">Ksh {trend.water.collected.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4 text-right text-destructive">Ksh {trend.water.arrears.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4 text-right text-foreground">Ksh {trend.electricity.expected.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4 text-right text-success">Ksh {trend.electricity.collected.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4 text-right text-destructive">Ksh {trend.electricity.arrears.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4 text-right font-semibold text-foreground">Ksh {trend.total.expected.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4 text-right font-semibold text-success">Ksh {trend.total.collected.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4 text-right font-semibold text-destructive">Ksh {trend.total.arrears.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Tenant Outstanding Bills */}
          {billsReportData.tenantOutstanding && billsReportData.tenantOutstanding.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground mb-3">Tenants with Outstanding Bills</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Tenant</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Unit</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Water Total</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Water Outstanding</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Water Status</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Elec Total</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Elec Outstanding</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Elec Status</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Total Outstanding</TableHeader>
                    </TableHead>
                  <TableBody>
                    {billsReportData.tenantOutstanding.map((tenant, idx: number) => (
                      <TableRow key={idx} className="border-b border-border hover:bg-muted/40">
                        <TableCell className="py-3 px-4 font-medium text-foreground">
                          {tenant.tenantId ? (
                            <Link
                              href={`/properties/${tenant.tenantId}/tenant-details`}
                              className="inline-block max-w-full truncate underline-offset-4 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {tenant.tenantName}
                            </Link>
                          ) : tenant.tenantName}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-foreground">{tenant.unitNo}</TableCell>
                        <TableCell className="py-3 px-4 text-right text-foreground">Ksh {tenant.water.total.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4 text-right text-destructive font-semibold">Ksh {tenant.water.outstanding.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4">
                          <StatusBadge status={tenant.water.status} appearance={tenant.water.status === 'PAID' ? 'success' : tenant.water.status === 'PARTIAL' ? 'warning' : 'destructive'} />
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right text-foreground">Ksh {tenant.electricity.total.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4 text-right text-destructive font-semibold">Ksh {tenant.electricity.outstanding.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4">
                          <StatusBadge status={tenant.electricity.status} appearance={tenant.electricity.status === 'PAID' ? 'success' : tenant.electricity.status === 'PARTIAL' ? 'warning' : 'destructive'} />
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-bold text-destructive">Ksh {tenant.totalOutstanding.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Delinquent Bills Table */}
          {billsReportData.delinquentBills && billsReportData.delinquentBills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground mb-3">Delinquent Bills (Over 30 Days)</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Invoice #</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Tenant</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Unit</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Type</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Amount</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Paid</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Balance</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Days Overdue</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Status</TableHeader>
                    </TableHead>
                  <TableBody>
                    {billsReportData.delinquentBills.map((bill, idx: number) => (
                      <TableRow key={idx} className="border-b border-border hover:bg-muted/40">
                        <TableCell className="py-3 px-4 font-mono text-sm text-foreground">{bill.invoiceNumber}</TableCell>
                        <TableCell className="py-3 px-4 text-foreground">{bill.tenantName}</TableCell>
                        <TableCell className="py-3 px-4 text-foreground">{bill.unitNo}</TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant={bill.billType === 'WATER' ? 'info' : 'warning'}>{bill.billType}</Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right text-foreground">Ksh {bill.amount.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4 text-right text-success">Ksh {bill.amountPaid.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4 text-right text-destructive font-semibold">Ksh {bill.balance.toLocaleString()}</TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <span className={`font-semibold ${
                            bill.daysOverdue > 90 ? 'text-destructive' :
                            bill.daysOverdue > 60 ? 'text-destructive' :
                            bill.daysOverdue > 30 ? 'text-warning' : 'text-muted-foreground'
                          }`}>
                            {bill.daysOverdue} days
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <StatusBadge status={bill.status} appearance="destructive" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* No Data Message */}
          {!billsReportData.tenantOutstanding?.length && !billsReportData.delinquentBills?.length && (
            <EmptyState title="All bills are up to date" description="No outstanding or delinquent bills were found for the selected period." />
          )}
        </>
      ) : (
        <EmptyState title="No bills report data available" description="Load the report to view bill collection activity." action={<Button onClick={fetchBillsReport}>Load report</Button>} />
      )}
    </CardContent>
  </Card>
</PermissionGuard>
  )
}
