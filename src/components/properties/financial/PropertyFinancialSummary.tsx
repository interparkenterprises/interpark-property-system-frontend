import { Banknote, Calculator, CheckCircle2, Clock3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCompactKes, formatExactKes } from '@/lib/numberFormat'

export interface PropertyFinancialTotals {
  totalIncome: number
  totalCommissions: number
  pendingCommissions: number
  paidCommissions: number
}

interface PropertyFinancialSummaryProps {
  totals: PropertyFinancialTotals
  showCommissionMetrics: boolean
}

export function PropertyFinancialSummary({ totals, showCommissionMetrics }: PropertyFinancialSummaryProps) {
  const metrics = [
    { label: 'Total collection', value: totals.totalIncome, icon: Banknote },
    ...(showCommissionMetrics ? [
      { label: 'Total commissions', value: totals.totalCommissions, icon: Calculator },
      { label: 'Pending commissions', value: totals.pendingCommissions, icon: Clock3 },
      { label: 'Paid commissions', value: totals.paidCommissions, icon: CheckCircle2 },
    ] : []),
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial summary</CardTitle>
        <CardDescription>Current property collection and commission totals.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="min-w-0 rounded-lg bg-muted/60 p-4" title={formatExactKes(value)}>
            <div className="mb-3 flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className="truncate text-xl font-semibold text-foreground sm:text-2xl">{formatCompactKes(value)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
