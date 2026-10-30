import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import type { ReceivablesTrendPoint } from '@/types/analytics'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { AnalyticsEmpty } from '../AnalyticsStates'
import { currencyTick, tooltipRow } from './chartHelpers'

const config = {
  billed: { label: 'Billed rent', color: 'var(--chart-1)' },
  paid: { label: 'Allocated payments', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function CollectionsPerformanceChart({ data }: { data: ReceivablesTrendPoint[] }) {
  if (!data.length) return <AnalyticsEmpty title="No collections trend" detail="No rent invoices matched the selected period." />

  return (
    <ChartContainer config={config} className="h-full w-full aspect-auto">
      <LineChart accessibilityLayer data={data} margin={{ left: 0, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={currencyTick} width={58} />
        <ChartTooltip
          cursor={{ stroke: 'var(--border)' }}
          content={<ChartTooltipContent indicator="line" formatter={(value, name, item) => tooltipRow(value, config[name as keyof typeof config]?.label ?? name, item.color)} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line type="monotone" dataKey="billed" stroke="var(--color-billed)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="paid" stroke="var(--color-paid)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ChartContainer>
  )
}
