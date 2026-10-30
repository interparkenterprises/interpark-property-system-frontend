'use client'

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Download } from 'lucide-react'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { DetailItem, DetailList } from '@/components/ui/detail-list'
import { EmptyState } from '@/components/ui/empty-state'
import { Progress } from '@/components/ui/progress'
import { SectionHeader } from '@/components/ui/section-header'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/ui/status-badge'
import { PermissionCode, type NextPaymentItem, type NextPaymentsResponse } from '@/types'
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat'

interface UpcomingPaymentsTabProps {
  nextPaymentsData: NextPaymentsResponse | null
  nextPaymentsLoading: boolean
  filteredPayments: NextPaymentItem[]
  upcomingDateFrom: string
  upcomingDateTo: string
  expandedPaymentTenant: string | null
  exportingUpcomingPayments: boolean
  setUpcomingDateFrom: Dispatch<SetStateAction<string>>
  setUpcomingDateTo: Dispatch<SetStateAction<string>>
  setExpandedPaymentTenant: Dispatch<SetStateAction<string | null>>
  clearUpcomingFilters: () => void
  fetchNextPaymentsData: () => Promise<void>
  handleExportUpcomingPayments: () => Promise<void>
}

type PaymentFilter = 'all' | 'overdue' | 'upcoming' | 'overpaid'

function paymentAppearance(payment: NextPaymentItem) {
  if (payment.payment.isOverdue) return 'destructive' as const
  if (payment.payment.status === 'OVERPAID') return 'info' as const
  if (payment.payment.status === 'GRACE_PERIOD_SOON') return 'warning' as const
  return 'success' as const
}

function displayStatus(payment: NextPaymentItem) {
  return payment.payment.isOverdue ? 'OVERDUE' : payment.payment.status
}

export function UpcomingPaymentsTab({
  nextPaymentsData,
  nextPaymentsLoading,
  filteredPayments,
  upcomingDateFrom,
  upcomingDateTo,
  expandedPaymentTenant,
  exportingUpcomingPayments,
  setUpcomingDateFrom,
  setUpcomingDateTo,
  setExpandedPaymentTenant,
  clearUpcomingFilters,
  fetchNextPaymentsData,
  handleExportUpcomingPayments,
}: UpcomingPaymentsTabProps) {
  const [draftDateRange, setDraftDateRange] = useState({ from: upcomingDateFrom, to: upcomingDateTo })
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all')

  const statusCounts = useMemo(() => {
    const payments = nextPaymentsData?.payments ?? []
    return {
      all: nextPaymentsData?.summary.total ?? payments.length,
      overdue: nextPaymentsData?.summary.overdue ?? 0,
      upcoming: nextPaymentsData?.summary.upcoming ?? 0,
      overpaid: payments.filter(payment => payment.payment.status === 'OVERPAID').length,
    }
  }, [nextPaymentsData])

  const visiblePayments = useMemo(() => {
    if (paymentFilter === 'overdue') return filteredPayments.filter(payment => payment.payment.isOverdue)
    if (paymentFilter === 'upcoming') return filteredPayments.filter(payment => !payment.payment.isOverdue)
    if (paymentFilter === 'overpaid') return filteredPayments.filter(payment => payment.payment.status === 'OVERPAID')
    return filteredPayments
  }, [filteredPayments, paymentFilter])

  return (
    <PermissionGuard
      permissions={[PermissionCode.PREVIEW_PAYMENTS, PermissionCode.VIEW_TENANT_FINANCIALS]}
      fallback={<EmptyState title="Access denied" description="You do not have permission to view upcoming payments." />}
    >
      <Card>
        <CardHeader>
          <SectionHeader
            title="Upcoming payments"
            description="Track tenant payment schedules, deadlines, and outstanding balances."
            actions={nextPaymentsData?.payments.length ? (
              <Button onClick={handleExportUpcomingPayments} disabled={exportingUpcomingPayments} loading={exportingUpcomingPayments}>
                {!exportingUpcomingPayments && <Download className="size-4" aria-hidden="true" />}
                {exportingUpcomingPayments ? 'Exporting…' : 'Export to Excel'}
              </Button>
            ) : undefined}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 p-4">
            <DateRangePicker
              value={draftDateRange}
              onChange={setDraftDateRange}
              disabled={nextPaymentsLoading}
              aria-label="Upcoming payments reporting period"
            />
            <Button
              onClick={() => {
                setUpcomingDateFrom(draftDateRange.from)
                setUpcomingDateTo(draftDateRange.to)
              }}
              disabled={nextPaymentsLoading}
            >
              Apply filters
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDraftDateRange({ from: '', to: '' })
                clearUpcomingFilters()
              }}
              disabled={nextPaymentsLoading || (!draftDateRange.from && !draftDateRange.to)}
            >
              Clear
            </Button>
            <p className="ml-auto text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{visiblePayments.length}</span> of{' '}
              <span className="font-semibold text-foreground">{nextPaymentsData?.payments.length ?? 0}</span> tenants
            </p>
          </div>

          {nextPaymentsLoading ? (
            <div className="flex min-h-48 items-center justify-center"><Spinner size="lg" label="Loading payment schedules…" /></div>
          ) : nextPaymentsData ? (
            <>
              <section className="rounded-lg border border-border bg-muted/20 p-5">
                <SectionHeader title="Payment schedule overview" description="Current scheduled amounts, policies and payment classifications." />
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_1fr_1fr]">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Outstanding amount</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground" title={formatExactKes(nextPaymentsData.summary.amounts.outstanding)}>
                      {formatCompactKes(nextPaymentsData.summary.amounts.outstanding)}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total tenants</p>
                        <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{nextPaymentsData.summary.total}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Upcoming amount</p>
                        <p className="mt-1 font-semibold tabular-nums text-foreground" title={formatExactKes(nextPaymentsData.summary.amounts.upcoming)}>
                          {formatCompactKes(nextPaymentsData.summary.amounts.upcoming)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 border-t border-border pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                    <p className="text-sm font-medium text-foreground">Payment policies</p>
                    <div className="mt-3 space-y-3">
                      {([
                        ['Monthly', nextPaymentsData.summary.byPolicy.MONTHLY],
                        ['Quarterly', nextPaymentsData.summary.byPolicy.QUARTERLY],
                        ['Annual', nextPaymentsData.summary.byPolicy.ANNUAL],
                      ] as const).map(([label, count]) => (
                        <div key={label} className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium tabular-nums text-foreground">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0 border-t border-border pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                    <p className="text-sm font-medium text-foreground">Payment status comparison</p>
                    <div className="mt-3 space-y-3">
                      {([
                        ['Overdue', statusCounts.overdue, 'bg-destructive'],
                        ['Upcoming', statusCounts.upcoming, 'bg-primary'],
                        ['Overpaid', statusCounts.overpaid, 'bg-success'],
                      ] as const).map(([label, count, color]) => (
                        <div key={label}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium tabular-nums text-foreground">{count}</span>
                          </div>
                          <Progress value={count} max={Math.max(statusCounts.all, 1)} label={`${label}: ${count}`} indicatorClassName={color} />
                        </div>
                      ))}
                    </div>
                    {((nextPaymentsData.summary.dueToday ?? 0) > 0 || (nextPaymentsData.summary.inGracePeriod ?? 0) > 0) && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {nextPaymentsData.summary.dueToday ?? 0} due today · {nextPaymentsData.summary.inGracePeriod ?? 0} in grace period
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {nextPaymentsData.payments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {([
                    ['all', 'All', statusCounts.all],
                    ['overdue', 'Overdue', statusCounts.overdue],
                    ['upcoming', 'Upcoming', statusCounts.upcoming],
                    ['overpaid', 'Overpaid', statusCounts.overpaid],
                  ] as const).map(([value, label, count]) => (
                    <Button key={value} type="button" size="sm" variant={paymentFilter === value ? 'default' : 'outline'} onClick={() => setPaymentFilter(value)}>
                      {label} ({count})
                    </Button>
                  ))}
                </div>
              )}

              {visiblePayments.length > 0 ? (
                <section className="space-y-3">
                  <SectionHeader title="Tenant payment schedules" description={`${visiblePayments.length} tenant record${visiblePayments.length === 1 ? '' : 's'}.`} />
                  <div className="hidden grid-cols-[minmax(12rem,1.5fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)_minmax(8rem,0.9fr)] gap-4 border-b border-border pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:grid">
                    <span>Tenant</span><span>Policy / regular</span><span>Schedule</span><span className="text-right">Outstanding</span><span>Status</span>
                  </div>
                  <Accordion value={expandedPaymentTenant ? [expandedPaymentTenant] : []} onValueChange={value => setExpandedPaymentTenant(value[0] ?? null)}>
                    {visiblePayments.map(payment => {
                      const data = payment.payment
                      const paymentsBehind = data.paymentsBehind ?? 0
                      const totalPaid = data.totalPaid ?? 0
                      const totalExpected = data.totalExpected ?? 0
                      const totalDuePerPeriod = data.totalDuePerPeriod ?? 0
                      const outstandingBalance = data.outstandingBalance ?? 0
                      const overdueSince = data.overdueSince || data.dueDate
                      const daysOverdue = data.daysOverdue ?? 0
                      const regularAmount = data.regularPeriodAmount ?? data.totalDuePerPeriod ?? data.amount.total

                      return (
                        <AccordionItem key={payment.id} value={payment.id}>
                          <AccordionTrigger className="py-4 hover:no-underline">
                            <div className="grid min-w-0 gap-3 pr-2 lg:grid-cols-[minmax(12rem,1.5fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)_minmax(8rem,0.9fr)] lg:items-center lg:gap-4">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{payment.name}</p>
                                <p className="mt-1 truncate text-xs font-normal text-muted-foreground">{payment.unit.type} {payment.unit.number}</p>
                              </div>
                              <div>
                                <p className="text-xs font-normal capitalize text-muted-foreground">{data.policy.toLowerCase()}</p>
                                <p className="mt-1 text-sm font-medium tabular-nums text-foreground" title={formatExactKes(regularAmount)}>{formatCompactKes(regularAmount)}</p>
                              </div>
                              <div className="text-xs font-normal text-muted-foreground">
                                {data.isOverdue ? (
                                  <><p className="text-destructive">Since {overdueSince}</p><p className="mt-1">{daysOverdue} days · {paymentsBehind} behind</p></>
                                ) : (
                                  <><p>Due {data.dueDate}</p><p className="mt-1">{data.daysUntilDue} days remaining</p></>
                                )}
                              </div>
                              <p className="text-sm font-semibold tabular-nums text-foreground lg:text-right" title={formatExactKes(outstandingBalance)}>
                                {formatCompactKes(outstandingBalance)}
                              </p>
                              <div><StatusBadge status={displayStatus(payment)} appearance={paymentAppearance(payment)} /></div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-5">
                            <div className="grid gap-6 pt-1 lg:grid-cols-3">
                              <section>
                                <h4 className="mb-2 text-sm font-semibold text-foreground">Payment details</h4>
                                <DetailList>
                                  <DetailItem label="Tenant">{payment.name}</DetailItem>
                                  <DetailItem label="Unit">{payment.unit.number}</DetailItem>
                                  <DetailItem label="Email">{payment.contact.email || '—'}</DetailItem>
                                  <DetailItem label="Phone">{payment.contact.phone || '—'}</DetailItem>
                                  <DetailItem label="KRA PIN">{payment.contact.kra || '—'}</DetailItem>
                                  <DetailItem label="Policy"><span className="capitalize">{data.policy.toLowerCase()}</span></DetailItem>
                                  <DetailItem label="Regular period amount"><span title={formatExactKes(regularAmount)}>{formatCompactKes(regularAmount)}</span></DetailItem>
                                </DetailList>
                              </section>
                              <section>
                                <h4 className="mb-2 text-sm font-semibold text-foreground">Payment status</h4>
                                <DetailList>
                                  <DetailItem label="Current status"><StatusBadge status={displayStatus(payment)} appearance={paymentAppearance(payment)} /></DetailItem>
                                  <DetailItem label={data.isOverdue ? 'Overdue since' : 'Due date'}>{data.isOverdue ? overdueSince : data.dueDate}</DetailItem>
                                  <DetailItem label={data.isOverdue ? 'Days overdue' : 'Days until due'}>{data.isOverdue ? daysOverdue : data.daysUntilDue}</DetailItem>
                                  <DetailItem label="Payments behind">{paymentsBehind}</DetailItem>
                                  <DetailItem label="Grace period">{data.isInGracePeriod ? `Yes${data.daysUntilGraceEnd != null ? ` · ${data.daysUntilGraceEnd} days remaining` : ''}` : 'No'}</DetailItem>
                                  <DetailItem label="Grace period end">{data.gracePeriodEnd || '—'}</DetailItem>
                                </DetailList>
                              </section>
                              <section>
                                <h4 className="mb-2 text-sm font-semibold text-foreground">Financial details</h4>
                                <DetailList>
                                  <DetailItem label="Rent"><span title={formatExactKes(data.amount.rent)}>{formatCompactKes(data.amount.rent)}</span></DetailItem>
                                  <DetailItem label="Service charge"><span title={formatExactKes(data.amount.serviceCharge)}>{formatCompactKes(data.amount.serviceCharge)}</span></DetailItem>
                                  <DetailItem label="VAT"><span title={formatExactKes(data.amount.vat)}>{formatCompactKes(data.amount.vat)}</span></DetailItem>
                                  {data.amount.vatOnRent != null && <DetailItem label="VAT on rent"><span title={formatExactKes(data.amount.vatOnRent)}>{formatCompactKes(data.amount.vatOnRent)}</span></DetailItem>}
                                  {data.amount.vatOnServiceCharge != null && <DetailItem label="VAT on service charge"><span title={formatExactKes(data.amount.vatOnServiceCharge)}>{formatCompactKes(data.amount.vatOnServiceCharge)}</span></DetailItem>}
                                  <DetailItem label="Total amount due"><span title={formatExactKes(data.amount.total)}>{formatCompactKes(data.amount.total)}</span></DetailItem>
                                  <DetailItem label="Due per period"><span title={formatExactKes(totalDuePerPeriod)}>{formatCompactKes(totalDuePerPeriod)}</span></DetailItem>
                                  <DetailItem label="Total paid"><span title={formatExactKes(totalPaid)}>{formatCompactKes(totalPaid)}</span></DetailItem>
                                  <DetailItem label="Total expected"><span title={formatExactKes(totalExpected)}>{formatCompactKes(totalExpected)}</span></DetailItem>
                                  <DetailItem label="Outstanding balance"><span title={formatExactKes(outstandingBalance)}>{formatCompactKes(outstandingBalance)}</span></DetailItem>
                                </DetailList>
                              </section>
                            </div>
                            <div className="mt-5 grid gap-3 border-t border-border pt-4 md:grid-cols-3">
                              <div className="text-sm"><span className="text-muted-foreground">Unit details:</span> <span className="text-foreground">{payment.unit.type} · {payment.unit.size} sq ft · Floor {payment.unit.floor}</span></div>
                              <div className="text-sm"><span className="text-muted-foreground">Payment history:</span> <span className="text-foreground">{payment.history ? `${payment.history.lastPayment} · ${payment.history.paymentsMade} recorded` : 'No payments recorded'}</span></div>
                              <div className="text-sm"><span className="text-muted-foreground">Rent escalation:</span> <span className="text-foreground">{payment.rent.escalation ? `${payment.rent.escalation.rate}% ${payment.rent.escalation.frequency.toLowerCase()} · next ${new Date(payment.rent.escalation.nextDate).toLocaleDateString()}` : 'None'}</span></div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </section>
              ) : (
                <EmptyState
                  title={upcomingDateFrom || upcomingDateTo ? 'No payments in selected date range' : 'No tenant payments found'}
                  description={upcomingDateFrom || upcomingDateTo ? 'Try adjusting the date range to see more results.' : 'No tenants have payment schedules for this property.'}
                  action={(upcomingDateFrom || upcomingDateTo) ? <Button onClick={clearUpcomingFilters}>Clear filters</Button> : undefined}
                />
              )}
            </>
          ) : (
            <EmptyState title="Payment schedules unavailable" description="The payment schedules could not be loaded." action={<Button onClick={fetchNextPaymentsData}>Retry</Button>} />
          )}
        </CardContent>
      </Card>
    </PermissionGuard>
  )
}
