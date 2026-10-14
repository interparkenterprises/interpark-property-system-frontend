import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { AnalyticsEmpty } from '../AnalyticsStates'

const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--primary)', 'var(--warning)', 'var(--destructive)']

export function LeftReasonChart({ data }: { data: Record<string, number> }) {
  const values = Object.entries(data || {}).filter(([, value]) => Number(value) > 0).map(([key, value], index) => ({
    key,
    name: key.replace(/_/g, ' '),
    value: Number(value),
    fill: colors[index % colors.length],
  }))
  if (!values.length) return <AnalyticsEmpty title="No left reasons recorded" detail="Departed tenants in this range have no leftReason set." />
  const config = Object.fromEntries(values.map(item => [item.key, { label: item.name, color: item.fill }])) satisfies ChartConfig
  const total = values.reduce((sum, item) => sum + item.value, 0)
  return (
    <div className="relative h-full w-full">
      <ChartContainer config={config} className="h-full w-full aspect-auto">
        <PieChart accessibilityLayer>
          <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <ChartLegend content={<ChartLegendContent nameKey="key" />} />
          <Pie data={values} dataKey="value" nameKey="key" innerRadius={58} outerRadius={92} paddingAngle={3} strokeWidth={0}>
            {values.map(item => <Cell key={item.key} fill={item.fill} />)}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
        <span className="text-2xl font-semibold tabular-nums text-foreground">{total.toLocaleString('en-KE')}</span>
        <span className="text-xs text-muted-foreground">departures</span>
      </div>
    </div>
  )
}
