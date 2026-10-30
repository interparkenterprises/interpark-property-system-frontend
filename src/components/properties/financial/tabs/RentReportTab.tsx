'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Download, FileText, LockKeyhole } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { EmptyState } from '@/components/ui/empty-state'
import { Progress } from '@/components/ui/progress'
import { SectionHeader } from '@/components/ui/section-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat'
import { PermissionCode } from '@/types'
import type { RentReportData, RentReportFilters } from '../types'

const rentTrendConfig = {
  expected: { label: 'Expected rent', color: 'var(--chart-1)' },
  collected: { label: 'Collected rent', color: 'var(--chart-2)' },
  arrears: { label: 'Arrears', color: 'var(--chart-5)' },
} satisfies ChartConfig

interface RentReportTabProps {
  rentReportData: RentReportData | null
  rentReportLoading: boolean
  exportingRentReport: boolean
  rentReportFilters: RentReportFilters
  setRentReportFilters: Dispatch<SetStateAction<RentReportFilters>>
  fetchRentReport: () => Promise<void>
  handleExportRentReport: () => Promise<void>
}

function paymentAppearance(status: string) {
  if (status === 'PAID') return 'success' as const
  if (status === 'PARTIAL' || status === 'PENDING') return 'warning' as const
  if (status === 'UNPAID' || status === 'OVERDUE') return 'destructive' as const
  return 'neutral' as const
}

export function RentReportTab({
  rentReportData,
  rentReportLoading,
  exportingRentReport,
  rentReportFilters,
  setRentReportFilters,
  fetchRentReport,
  handleExportRentReport,
}: RentReportTabProps) {
  return (
    <PermissionGuard
      permission={PermissionCode.VIEW_PAYMENT_REPORTS}
      fallback={<EmptyState icon={LockKeyhole} title="Access denied" description="You don't have permission to view rent reports." />}
    >
      <Card>
        <CardHeader>
          <SectionHeader
            title="Rent payment report"
            description="Comprehensive rent collection analysis for this property."
            actions={
              <Button onClick={handleExportRentReport} disabled={!rentReportData} loading={exportingRentReport}>
                {!exportingRentReport && <Download className="h-4 w-4" aria-hidden="true" />}
                {exportingRentReport ? 'Exporting…' : 'Export to Excel'}
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4 lg:flex-row lg:items-end">
            <DateRangePicker
              value={{ from: rentReportFilters.dateFrom, to: rentReportFilters.dateTo }}
              onChange={({ from, to }) => setRentReportFilters((current) => ({ ...current, dateFrom: from, dateTo: to }))}
              disabled={rentReportLoading}
              className="min-w-0"
              aria-label="Select rent report date range"
            />
            <div className="min-w-44">
              <Select
                value={rentReportFilters.status || 'all'}
                onValueChange={(status) => setRentReportFilters((current) => ({ ...current, status: status === 'all' ? '' : status }))}
              >
                <SelectTrigger aria-label="Payment status"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PREPAID">Prepaid</SelectItem>
                  <SelectItem value="CREDIT">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchRentReport} disabled={rentReportLoading} loading={rentReportLoading}>Apply filters</Button>
          </div>

          {rentReportLoading ? (
            <div className="flex min-h-48 items-center justify-center"><Spinner size="lg" label="Loading rent report…" /></div>
          ) : rentReportData ? (
            <>
              <div className="rounded-lg border border-border bg-muted/20 p-5">
                <SectionHeader title="Rent performance" description="Collection performance for the selected reporting period." />
                <div className="mt-5 grid gap-5 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total collected</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground" title={formatExactKes(rentReportData.summary.totalRentCollected)}>{formatCompactKes(rentReportData.summary.totalRentCollected)}</p>
                  </div>
                  <div className="border-t border-border pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                    <p className="text-xs text-muted-foreground">Collection rate</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{rentReportData.summary.collectionRate}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">{rentReportData.summary.collectionRateStatus}</p>
                  </div>
                  <div className="border-t border-border pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                    <p className="text-xs text-muted-foreground">Total arrears</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground" title={formatExactKes(rentReportData.summary.totalArrears)}>{formatCompactKes(rentReportData.summary.totalArrears)}</p>
                  </div>
                  <div className="border-t border-border pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                    <p className="text-xs text-muted-foreground">Total tenants</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{rentReportData.summary.totalTenants.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <section className="space-y-3">
                <SectionHeader title="Payment breakdown" />
                <div className="grid gap-4 rounded-lg bg-muted/20 p-4 sm:grid-cols-2 xl:grid-cols-4">
                  {([
                    ['Fully paid', rentReportData.summary.paymentBreakdown.fullyPaid, 'bg-success'],
                    ['Partially paid', rentReportData.summary.paymentBreakdown.partiallyPaid, 'bg-warning'],
                    ['Unpaid', rentReportData.summary.paymentBreakdown.unpaid, 'bg-destructive'],
                    ['Overdue', rentReportData.summary.paymentBreakdown.overdue, 'bg-[var(--chart-5)]'],
                  ] as const).map(([label, count, color]) => (
                    <div key={label}>
                      <div className="mb-2 flex items-center justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold tabular-nums text-foreground">{count}</span></div>
                      <Progress value={count} max={Math.max(rentReportData.summary.totalTenants, 1)} label={`${label}: ${count}`} indicatorClassName={color} />
                    </div>
                  ))}
                </div>
              </section>

              {rentReportData.monthlyTrends?.length > 0 && (
                <section className="space-y-3">
                  <SectionHeader title="Monthly trends" />
                  <ChartContainer config={rentTrendConfig} className="h-72 w-full aspect-auto">
                    <LineChart accessibilityLayer data={rentReportData.monthlyTrends} margin={{ left: 8, right: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={value => formatCompactKes(Number(value)).replace('Ksh ', '')} width={62} />
                      <ChartTooltip content={<ChartTooltipContent indicator="line" formatter={(value, name, item) => (
                        <div className="flex min-w-44 items-center justify-between gap-4"><span className="text-muted-foreground">{rentTrendConfig[name as keyof typeof rentTrendConfig]?.label ?? name}</span><span className="font-mono font-medium text-foreground" style={{ color: item.color }}>{formatExactKes(Number(value))}</span></div>
                      )} />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="expected" stroke="var(--color-expected)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="collected" stroke="var(--color-collected)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="arrears" stroke="var(--color-arrears)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                  <Table>
                    <TableHead>
                      <TableHeader>Month</TableHeader><TableHeader className="text-right">Expected</TableHeader><TableHeader className="text-right">Collected</TableHeader><TableHeader className="text-right">Arrears</TableHeader><TableHeader className="text-right">Collection rate</TableHeader>
                    </TableHead>
                    <TableBody>
                      {rentReportData.monthlyTrends.map((trend, index) => {
                        const rate = trend.expected > 0 ? ((trend.collected / trend.expected) * 100).toFixed(1) : '0'
                        return <TableRow key={index}><TableCell className="font-medium">{trend.month}</TableCell><TableCell className="text-right tabular-nums">{formatExactKes(trend.expected)}</TableCell><TableCell className="text-right tabular-nums">{formatExactKes(trend.collected)}</TableCell><TableCell className="text-right font-medium tabular-nums">{formatExactKes(trend.arrears)}</TableCell><TableCell className="text-right tabular-nums">{rate}%</TableCell></TableRow>
                      })}
                    </TableBody>
                  </Table>
                </section>
              )}

              {rentReportData.tenantOutstanding?.length > 0 && (
                <section className="space-y-3">
                  <SectionHeader title="Tenants with outstanding balances" />
                  <Table>
                    <TableHead>
                      <TableHeader>Tenant</TableHeader><TableHeader>Unit</TableHeader><TableHeader className="text-right">Expected</TableHeader><TableHeader className="text-right">Paid</TableHeader><TableHeader className="text-right">Outstanding</TableHeader><TableHeader>Status</TableHeader>
                    </TableHead>
                    <TableBody>
                      {rentReportData.tenantOutstanding.map((tenant, index) => <TableRow key={index}><TableCell className="font-medium">{tenant.tenantName}</TableCell><TableCell>{tenant.unitNo}</TableCell><TableCell className="text-right tabular-nums">{formatExactKes(tenant.expectedTotal)}</TableCell><TableCell className="text-right tabular-nums">{formatExactKes(tenant.paidTotal)}</TableCell><TableCell className="text-right font-medium tabular-nums">{formatExactKes(tenant.outstandingBalance)}</TableCell><TableCell><StatusBadge status={tenant.paymentStatus} appearance={paymentAppearance(tenant.paymentStatus)} /></TableCell></TableRow>)}
                    </TableBody>
                  </Table>
                </section>
              )}

              {!rentReportData.monthlyTrends?.length && !rentReportData.tenantOutstanding?.length && (
                <EmptyState icon={FileText} title="No rent records found" description="No rent activity matches the selected filters." />
              )}
            </>
          ) : (
            <EmptyState icon={FileText} title="No rent report data available" description="Load the report to view rent performance." action={<Button onClick={fetchRentReport}>Load report</Button>} />
          )}
        </CardContent>
      </Card>
    </PermissionGuard>
  )
}
