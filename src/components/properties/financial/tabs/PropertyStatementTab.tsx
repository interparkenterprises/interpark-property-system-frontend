'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Download } from 'lucide-react'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'
import { Spinner } from '@/components/ui/spinner'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PermissionCode } from '@/types'
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat'
import type { CollectionStatementData } from '../types'

interface PropertyStatementTabProps {
  collectionStatement: CollectionStatementData | null
  collectionStatementLoading: boolean
  collectionDateFrom: string
  collectionDateTo: string
  exporting: boolean
  setCollectionDateFrom: Dispatch<SetStateAction<string>>
  setCollectionDateTo: Dispatch<SetStateAction<string>>
  fetchCollectionStatement: () => Promise<void>
  handleOpenExportModal: () => Promise<void>
}

export function PropertyStatementTab({
  collectionStatement,
  collectionStatementLoading,
  collectionDateFrom,
  collectionDateTo,
  exporting,
  setCollectionDateFrom,
  setCollectionDateTo,
  fetchCollectionStatement,
  handleOpenExportModal,
}: PropertyStatementTabProps) {
  return (
<PermissionGuard permission={PermissionCode.VIEW_PAYMENT_REPORTS} fallback={<EmptyState title="Access denied" description="You do not have permission to view property statements." />}>
  <Card>
    <CardHeader>
      <SectionHeader
        title="Property collection statement"
        description="Comprehensive financial overview with date filtering."
        actions={(
          <Button onClick={handleOpenExportModal} disabled={exporting || !collectionStatement} loading={exporting}>
            {!exporting && <Download className="size-4" aria-hidden="true" />}
            {exporting ? 'Exporting…' : 'Export to Excel'}
          </Button>
        )}
      />
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 p-4">
        <DateRangePicker
          value={{ from: collectionDateFrom, to: collectionDateTo }}
          onChange={({ from, to }) => {
            setCollectionDateFrom(from)
            setCollectionDateTo(to)
          }}
          disabled={collectionStatementLoading}
          aria-label="Property statement reporting period"
        />
        <Button onClick={fetchCollectionStatement} disabled={collectionStatementLoading} loading={collectionStatementLoading}>
          Apply filters
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setCollectionDateFrom('')
            setCollectionDateTo('')
          }}
          disabled={collectionStatementLoading || (!collectionDateFrom && !collectionDateTo)}
        >
          Clear
        </Button>
      </div>

      {/* Loading State */}
      {collectionStatementLoading ? (
        <div className="flex min-h-48 items-center justify-center"><Spinner size="lg" label="Loading collection statement…" /></div>
      ) : collectionStatement ? (
        <>
          {/* Date Range Display */}
          <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-border">
            <p className="text-sm text-primary">
              <span className="font-semibold">Reporting Period:</span>{' '}
              {new Date(collectionStatement.dateRange.startDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
              {' - '}
              {new Date(collectionStatement.dateRange.endDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>

          {/* Statement Overview */}
          <div className="rounded-lg border border-border bg-muted/20 p-5">
            <SectionHeader title="Statement overview" description="Revenue, collections and outstanding balances for the reporting period." />
            <div className="mt-5 grid gap-5 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:items-end">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total revenue</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground" title={formatExactKes(collectionStatement.summary.totalRevenue)}>{formatCompactKes(collectionStatement.summary.totalRevenue)}</p>
                <p className="mt-1 text-xs text-muted-foreground">From {collectionStatement.summary.totalUnits} units</p>
              </div>
              <div className="border-t border-border pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                <p className="text-xs text-muted-foreground">Rent collected</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground" title={formatExactKes(collectionStatement.summary.totalRentCollected)}>{formatCompactKes(collectionStatement.summary.totalRentCollected)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{collectionStatement.summary.occupiedUnits} occupied units</p>
              </div>
              <div className="border-t border-border pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                <p className="text-xs text-muted-foreground">Total outstanding</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground" title={formatExactKes(collectionStatement.summary.totalOutstanding)}>{formatCompactKes(collectionStatement.summary.totalOutstanding)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Occupancy rate: {collectionStatement.summary.occupancyRate}%</p>
              </div>
              <div className="border-t border-border pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                <p className="text-xs text-muted-foreground">Net revenue</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground" title={formatExactKes(collectionStatement.summary.netRevenue)}>{formatCompactKes(collectionStatement.summary.netRevenue)}</p>
                <p className="mt-1 text-xs text-muted-foreground">After commissions</p>
              </div>
            </div>
          </div>

          {/* Income & Commission Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="rounded-lg border border-border bg-card p-5">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Income Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly:</span>
                  <span className="font-semibold text-foreground">
                    Ksh {collectionStatement.incomeSummary.monthly.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quarterly:</span>
                  <span className="font-semibold text-foreground">
                    Ksh {collectionStatement.incomeSummary.quarterly.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Annual:</span>
                  <span className="font-semibold text-foreground">
                    Ksh {collectionStatement.incomeSummary.annual.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                  <span className="font-semibold text-muted-foreground">Total Other Income:</span>
                  <span className="font-bold text-primary">
                    Ksh {collectionStatement.summary.totalOtherIncomes.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Commission Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Commissions:</span>
                  <span className="font-semibold text-foreground">
                    Ksh {collectionStatement.summary.totalCommissions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending:</span>
                  <span className="font-semibold text-warning">
                    Ksh {collectionStatement.commissionSummary.pending.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid:</span>
                  <span className="font-semibold text-success">
                    Ksh {collectionStatement.commissionSummary.paid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                  <span className="font-semibold text-muted-foreground">Commission Rate:</span>
                  <span className="font-bold text-primary">
                    {collectionStatement.property.commissionFee || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Units & Tenants with Financials */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary/100 rounded-full"></span>
              Units & Tenants Financial Summary
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                    <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Unit</TableHeader>
                    <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Tenant</TableHeader>
                    <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Rent</TableHeader>
                    <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Deposit</TableHeader>
                    <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Rent Collected</TableHeader>
                    <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Service Charge</TableHeader>
                    <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Bills</TableHeader>
                    <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Outstanding</TableHeader>
                    <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Status</TableHeader>
                  </TableHead>
                <TableBody>
                  {collectionStatement.unitSummaries && collectionStatement.unitSummaries.length > 0 ? (
                    collectionStatement.unitSummaries.map((unit) => (
                      <TableRow
                        key={unit.unitId}
                        className="border-b border-border hover:bg-muted/40"
                      >
                        <TableCell className="py-3 px-4">
                          <div className="font-medium text-foreground">{unit.unitNo || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{unit.unitType}</div>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          {unit.tenant ? (
                            <div>
                              <div className="font-medium text-foreground">{unit.tenant.fullName}</div>
                              <div className="text-xs text-muted-foreground">{unit.tenant.contact}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Vacant</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-semibold text-foreground">
                          Ksh {unit.rentAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right text-primary">
                          Ksh {unit.financialSummary.deposit.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right text-success font-semibold">
                          Ksh {unit.financialSummary.rentCollected.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right text-primary">
                          Ksh {unit.financialSummary.serviceCharge.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right text-warning">
                          Ksh {unit.financialSummary.billsAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <span className={`font-bold ${unit.financialSummary.outstanding > 0 ? 'text-destructive' : 'text-success'}`}>
                            Ksh {unit.financialSummary.outstanding.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <StatusBadge status={unit.isOccupied ? 'Occupied' : 'Vacant'} appearance={unit.isOccupied ? 'success' : 'neutral'} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        No units found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Service Providers */}
          {collectionStatement.serviceProviders && collectionStatement.serviceProviders.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary/100 rounded-full"></span>
                Service Providers
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Provider</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Contact</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Service</TableHeader>
                      <TableHeader className="text-right py-3 px-4 font-semibold text-foreground">Charge</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Frequency</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Contract Period</TableHeader>
                    </TableHead>
                  <TableBody>
                    {collectionStatement.serviceProviders.map((provider) => (
                      <TableRow
                        key={provider.id}
                        className="border-b border-border hover:bg-muted/40"
                      >
                        <TableCell className="py-3 px-4 font-medium text-foreground">{provider.name}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{provider.contact || '-'}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{provider.serviceContract || '-'}</TableCell>
                        <TableCell className="py-3 px-4 text-right font-semibold text-destructive">
                          Ksh {provider.chargeAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant="neutral">{provider.chargeFrequency}</Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{provider.contractPeriod || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Lead Summary */}
          {collectionStatement.leadSummary && collectionStatement.leadSummary.total > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-warning/100 rounded-full"></span>
                Leads ({collectionStatement.leadSummary.total})
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Name</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Contact</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Email</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Company</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Nature</TableHeader>
                      <TableHeader className="text-left py-3 px-4 font-semibold text-foreground">Date</TableHeader>
                    </TableHead>
                  <TableBody>
                    {collectionStatement.leadSummary.leads.map((lead) => (
                      <TableRow
                        key={lead.id}
                        className="border-b border-border hover:bg-muted/40"
                      >
                        <TableCell className="py-3 px-4 font-medium text-foreground">{lead.name}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{lead.phone}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{lead.email || '-'}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{lead.companyName || '-'}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{lead.natureOfLead || '-'}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-GB') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="No collection statement data available"
          description="Select a date range and refresh to load statement data."
          action={<Button
            onClick={() => {
              const now = new Date();
              const threeMonthsAgo = new Date(now);
              threeMonthsAgo.setMonth(now.getMonth() - 3);
              setCollectionDateFrom(threeMonthsAgo.toISOString().split('T')[0]);
              setCollectionDateTo(now.toISOString().split('T')[0]);
              fetchCollectionStatement();
            }} 
          >
            Load default range
          </Button>}
        />
      )}
    </CardContent>
  </Card>
</PermissionGuard>
  )
}
