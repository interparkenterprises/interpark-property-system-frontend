import { cn } from '@/lib/utils'

export interface RankedComparisonColumn {
  key: string
  label: string
  emphasized?: boolean
}

export interface RankedComparisonValue {
  value: number | null
  display: string
  title?: string
}

export interface RankedComparisonItem {
  id: string
  label: string
  values: Record<string, RankedComparisonValue>
}

export interface RankedComparisonBar {
  key: string
  color: string
}

const gridClasses: Record<number, string> = {
  1: 'grid-cols-[minmax(0,1fr)_minmax(4.5rem,auto)]',
  2: 'grid-cols-[minmax(0,1fr)_repeat(2,minmax(4.5rem,auto))]',
  3: 'grid-cols-[minmax(0,1fr)_repeat(3,minmax(4.5rem,auto))]',
}

export function RankedComparison({
  items,
  columns,
  bars,
  barMode = 'overlay',
  maxItems = 5,
  labelHeading = 'Item',
  emptyMessage = 'No comparison data is available.',
  className,
}: {
  items: RankedComparisonItem[]
  columns: RankedComparisonColumn[]
  bars: RankedComparisonBar[]
  barMode?: 'overlay' | 'stacked'
  maxItems?: number
  labelHeading?: string
  emptyMessage?: string
  className?: string
}) {
  const rows = items.slice(0, maxItems)
  if (!rows.length) return <div className="flex h-full min-h-48 items-center justify-center text-center text-sm text-muted-foreground">{emptyMessage}</div>

  const scaleMaximum = Math.max(1, ...rows.map(item => {
    const values = bars.map(bar => Math.max(0, item.values[bar.key]?.value || 0))
    return barMode === 'stacked' ? values.reduce((sum, value) => sum + value, 0) : Math.max(...values, 0)
  }))
  const gridClass = gridClasses[Math.min(columns.length, 3)] || gridClasses[3]

  return (
    <div className={cn('min-w-0', className)}>
      <div className={cn('grid gap-3 border-b border-border pb-2 text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground', gridClass)}>
        <span>{labelHeading}</span>
        {columns.map(column => <span key={column.key} className="text-right">{column.label}</span>)}
      </div>
      <div className="divide-y divide-border">
        {rows.map((item, index) => (
          <div key={item.id} className={cn('grid items-center gap-x-3 gap-y-1.5 py-2.5', gridClass)}>
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[0.65rem] font-medium text-muted-foreground">{index + 1}</span>
              <span className="truncate text-sm font-medium text-foreground">{item.label}</span>
            </div>
            {columns.map(column => {
              const metric = item.values[column.key]
              return (
                <span
                  key={column.key}
                  className={cn('truncate text-right text-xs tabular-nums', column.emphasized ? 'font-medium text-foreground' : 'text-muted-foreground')}
                  title={metric?.title}
                >
                  {metric?.display ?? '—'}
                </span>
              )
            })}
            <div className={cn('relative col-span-full flex h-1.5 overflow-hidden rounded-full bg-muted', barMode === 'overlay' && 'block')} aria-hidden="true">
              {bars.map((bar, barIndex) => {
                const value = Math.max(0, item.values[bar.key]?.value || 0)
                const width = `${Math.min(100, (value / scaleMaximum) * 100)}%`
                return (
                  <span
                    key={bar.key}
                    className={cn('h-full rounded-full', barMode === 'overlay' && 'absolute inset-y-0 left-0')}
                    style={{ width, backgroundColor: bar.color, zIndex: barMode === 'overlay' ? barIndex + 1 : undefined }}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
