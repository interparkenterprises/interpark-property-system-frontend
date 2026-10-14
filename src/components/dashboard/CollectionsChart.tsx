'use client'

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { Banknote } from 'lucide-react'
import type { CollectionTrendPoint } from '@/types/analytics'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

const chartConfig = {
  collected: {
    label: 'Cash collected',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

function periodLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-KE', { month: 'short', year: '2-digit' }).format(date)
}

interface CollectionsChartProps {
  data: CollectionTrendPoint[]
  authorized: boolean
  loading: boolean
  error: string | null
}

export function CollectionsChart({ data, authorized, loading, error }: CollectionsChartProps) {
  if (!authorized) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collections trend</CardTitle>
        <CardDescription>Payments received during the selected reporting period.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Collections chart unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading ? (
          <Skeleton className="h-72 w-full" />
        ) : data.length === 0 ? (
          <EmptyState icon={Banknote} title="No collections in this period" description="Recorded payments will appear here when they fall within the selected filters." />
        ) : (
          <ChartContainer config={chartConfig} className="h-72 w-full aspect-auto">
            <AreaChart accessibilityLayer data={data} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="dashboard-fill-collected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-collected)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-collected)" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="period"
                tickFormatter={periodLabel}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="collected"
                type="natural"
                fill="url(#dashboard-fill-collected)"
                fillOpacity={0.4}
                stroke="var(--color-collected)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
