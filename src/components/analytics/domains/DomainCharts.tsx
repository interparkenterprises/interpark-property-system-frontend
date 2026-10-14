'use client'

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts'
import type { DomainDistributionItem, DomainTrendPoint } from '@/types/analytics'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatMoney } from '../AnalyticsCore'
import { AnalyticsEmpty } from '../AnalyticsStates'
import type { PropertyBreakdownRow } from './types'

const moneyTick = (value: number) => new Intl.NumberFormat('en-KE', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--primary)', 'var(--warning)']

const moneyTooltip = (value: unknown) => (
  <span className="ml-auto font-mono font-medium tabular-nums text-foreground">{formatMoney(Number(value))}</span>
)

export function DomainTrendChart({ data }: { data: DomainTrendPoint[] }) {
  if (!data.length) return <AnalyticsEmpty title="No data for selected period" detail="No records matched the selected date and property filters." />
  const config = { amount: { label: 'Amount', color: 'var(--chart-1)' } } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="h-full w-full aspect-auto">
      <LineChart accessibilityLayer data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickFormatter={moneyTick} tickLine={false} axisLine={false} width={58} />
        <ChartTooltip content={<ChartTooltipContent formatter={moneyTooltip} />} />
        <Line dataKey="amount" type="monotone" stroke="var(--color-amount)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ChartContainer>
  )
}

export function TenantAdditionsChart({ data }: { data: DomainTrendPoint[] }) {
  if (!data.length) return <AnalyticsEmpty title="No tenant additions" detail="No tenant records were added in the selected period." />
  const config = { count: { label: 'New tenants', color: 'var(--chart-1)' } } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="h-full w-full aspect-auto">
      <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ChartContainer>
  )
}

export function DomainStatusChart({ data, centerLabel = 'records' }: { data: DomainDistributionItem[]; centerLabel?: string }) {
  const values = data.filter(item => Number(item.count) > 0).map((item, index) => ({
    key: `item${index}`,
    name: item.label,
    value: item.count,
    fill: palette[index % palette.length],
  }))
  if (!values.length) return <AnalyticsEmpty title="No status data available" detail="This domain has no status dimension, or no status records matched the selected filters." />
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
        <span className="text-xs text-muted-foreground">{centerLabel}</span>
      </div>
    </div>
  )
}

export function CategoryDistributionChart({ data }: { data: DomainDistributionItem[] }) {
  if (!data.length) return <AnalyticsEmpty title="No category data available" detail="This domain has no category dimension, or no category records matched the selected filters." />
  const config = { amount: { label: 'Amount', color: 'var(--chart-2)' } } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="h-full w-full aspect-auto">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickFormatter={moneyTick} tickLine={false} axisLine={false} width={58} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={moneyTooltip} />} />
        <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ChartContainer>
  )
}

export function PropertyBreakdownChart({ data }: { data: PropertyBreakdownRow[] }) {
  if (!data.length) return <AnalyticsEmpty title="No property records matched" detail="Try another date range or choose all accessible properties." />
  const config = {
    totalAmount: { label: 'Total amount', color: 'var(--chart-3)' },
    rentAmount: { label: 'Rent amount', color: 'var(--chart-1)' },
    billAmount: { label: 'Bill amount', color: 'var(--chart-2)' },
  } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="h-full w-full aspect-auto">
      <BarChart accessibilityLayer data={data.slice(0, 10)} layout="vertical" margin={{ left: 12, right: 12 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickFormatter={moneyTick} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="propertyName" width={110} tickLine={false} axisLine={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={moneyTooltip} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="totalAmount" fill="var(--color-totalAmount)" radius={[0, 5, 5, 0]} maxBarSize={16} />
        <Bar dataKey="rentAmount" fill="var(--color-rentAmount)" radius={[0, 5, 5, 0]} maxBarSize={16} />
        <Bar dataKey="billAmount" fill="var(--color-billAmount)" radius={[0, 5, 5, 0]} maxBarSize={16} />
      </BarChart>
    </ChartContainer>
  )
}
