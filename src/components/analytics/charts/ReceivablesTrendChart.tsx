import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'
import type { ReceivablesTrendPoint } from '@/types/analytics'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { AnalyticsEmpty } from '../AnalyticsStates'
import { formatPercent } from '../AnalyticsCore'
import { currencyTick, tooltipRow } from './chartHelpers'

const config: ChartConfig = {
  billed: { label: 'Billed', color: 'var(--chart-1)' },
  outstanding: { label: 'Outstanding', color: 'var(--destructive)' },
  collectionRate: { label: 'Collection rate', color: 'var(--chart-3)' },
}

export function ReceivablesTrendChart({ data }: { data: ReceivablesTrendPoint[] }) {
  if (!data.length) return <AnalyticsEmpty title="No receivables in this period" detail="No invoices were due inside this range." />
  return (
    <ChartContainer config={config} className="h-full w-full aspect-auto">
      <ComposedChart accessibilityLayer data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis yAxisId="money" tickLine={false} axisLine={false} tickFormatter={currencyTick} width={58} />
        <YAxis yAxisId="rate" orientation="right" tickLine={false} axisLine={false} tickFormatter={value => `${value}%`} width={44} />
        <ChartTooltip content={<ChartTooltipContent formatter={(value, name, item) => {
          const key = String(item.dataKey ?? name)
          const label = config[key]?.label ?? name
          return key === 'collectionRate' ? (
            <div className="flex min-w-44 items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-muted-foreground">{label}</span><span className="ml-auto font-mono font-medium">{formatPercent(Number(value))}</span></div>
          ) : tooltipRow(value, label, item.color)
        }} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar yAxisId="money" dataKey="billed" fill="var(--color-billed)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar yAxisId="money" dataKey="outstanding" fill="var(--color-outstanding)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Line yAxisId="rate" type="monotone" dataKey="collectionRate" stroke="var(--color-collectionRate)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
      </ComposedChart>
    </ChartContainer>
  )
}
