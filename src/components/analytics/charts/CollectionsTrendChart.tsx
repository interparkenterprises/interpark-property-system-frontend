import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { CollectionTrendPoint } from '@/types/analytics'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { AnalyticsEmpty } from '../AnalyticsStates'
import { currencyTick, tooltipRow } from './chartHelpers'

const config = {
  collected: { label: 'Recorded collections', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function CollectionsTrendChart({ data }: { data: CollectionTrendPoint[] }) {
  if (!data.length) return <AnalyticsEmpty title="No recorded collections" detail="No payment records with a datePaid inside this range." />
  return (
    <ChartContainer config={config} className="h-full w-full aspect-auto">
      <AreaChart accessibilityLayer data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="analytics-collections-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-collected)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-collected)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={currencyTick} width={58} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" formatter={(value, name, item) => tooltipRow(value, config.collected.label, item.color)} />} />
        <Area type="monotone" dataKey="collected" stroke="var(--color-collected)" fill="url(#analytics-collections-fill)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ChartContainer>
  )
}
