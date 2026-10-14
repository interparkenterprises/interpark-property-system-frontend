import type { ReactNode } from 'react'
import { formatMoney } from '../AnalyticsCore'

export const currencyTick = (value: number) =>
  value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}m` : value >= 1_000 ? `${Math.round(value / 1_000)}k` : String(value)

export function tooltipRow(value: unknown, name: ReactNode, color?: string) {
  return (
    <div className="flex min-w-44 items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{name}</span>
      <span className="ml-auto font-mono font-medium tabular-nums text-foreground">{formatMoney(Number(value))}</span>
    </div>
  )
}
