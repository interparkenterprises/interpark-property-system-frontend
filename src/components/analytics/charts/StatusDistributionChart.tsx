import { Cell, Pie, PieChart } from 'recharts'
import type { ReceivablesStatusDistribution } from '@/types/analytics'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { AnalyticsEmpty } from '../AnalyticsStates'

const config = {
  Paid: { label: 'Paid', color: 'var(--chart-2)' },
  Partial: { label: 'Partial', color: 'var(--chart-3)' },
  Unpaid: { label: 'Unpaid', color: 'var(--chart-5)' },
  Overdue: { label: 'Overdue', color: 'var(--destructive)' },
} satisfies ChartConfig

export function StatusDistributionChart({ data }: { data: ReceivablesStatusDistribution }) {
  const values = [
    { name: 'Paid', value: data.paid.count, fill: 'var(--color-Paid)' },
    { name: 'Partial', value: data.partial.count, fill: 'var(--color-Partial)' },
    { name: 'Unpaid', value: data.unpaid.count, fill: 'var(--color-Unpaid)' },
    { name: 'Overdue', value: data.overdue?.count || 0, fill: 'var(--color-Overdue)' },
  ].filter(item => item.value > 0)
  if (!values.length) return <AnalyticsEmpty title="No invoice statuses" detail="Cancelled invoices are excluded from this breakdown." />
  const total = values.reduce((sum, item) => sum + item.value, 0)
  return (
    <div className="relative h-full w-full">
      <ChartContainer config={config} className="h-full w-full aspect-auto">
        <PieChart accessibilityLayer>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          <Pie data={values} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3} strokeWidth={0}>
            {values.map(item => <Cell key={item.name} fill={item.fill} />)}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
        <span className="text-2xl font-semibold tabular-nums text-foreground">{total.toLocaleString('en-KE')}</span>
        <span className="text-xs text-muted-foreground">invoices</span>
      </div>
    </div>
  )
}
