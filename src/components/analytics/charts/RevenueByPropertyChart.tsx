import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { PropertyRevenue } from '@/types/analytics'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { AnalyticsEmpty } from '../AnalyticsStates'
import { currencyTick, tooltipRow } from './chartHelpers'

const config: ChartConfig = {
  billed: { label: 'Billed', color: 'var(--chart-1)' },
  paid: { label: 'Allocated collections', color: 'var(--chart-2)' },
}

export function RevenueByPropertyChart({ data }: { data: PropertyRevenue[] }) {
  if (!data.length) return <AnalyticsEmpty title="No property revenue" detail="No invoice activity matched the selected filters." />
  return (
    <ChartContainer config={config} className="h-full w-full aspect-auto">
      <BarChart accessibilityLayer data={data.slice(0, 10)} layout="vertical" margin={{ left: 16, right: 16 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={currencyTick} />
        <YAxis type="category" dataKey="propertyName" tickLine={false} axisLine={false} width={105} />
        <ChartTooltip cursor={{ fill: 'var(--muted)', opacity: 0.45 }} content={<ChartTooltipContent formatter={(value, name, item) => {
          const key = String(item.dataKey ?? name)
          return tooltipRow(value, config[key]?.label ?? name, item.color)
        }} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="billed" fill="var(--color-billed)" radius={[0, 4, 4, 0]} maxBarSize={16} />
        <Bar dataKey="paid" fill="var(--color-paid)" radius={[0, 4, 4, 0]} maxBarSize={16} />
      </BarChart>
    </ChartContainer>
  )
}
