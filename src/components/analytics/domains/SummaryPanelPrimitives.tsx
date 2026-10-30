import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { exactMoneyTitle, formatCompactMoney, formatPercent } from '../AnalyticsCore'

const number = new Intl.NumberFormat('en-KE')

export function summaryNumber(summary: Record<string, unknown>, key: string): number | null {
  const value = summary[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function SummaryHeading({ drill }: { drill: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold text-foreground">Summary</h2><p className="text-sm text-muted-foreground">Backend-calculated metrics for the selected reporting scope.</p></div>
      <Link href={drill} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Open source records <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
    </div>
  )
}

export function SummaryCard({ title, description, children, className = '' }: { title: string; description: string; children: React.ReactNode; className?: string }) {
  return <Card className={className}><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent>{children}</CardContent></Card>
}

export function PrimaryMetric({ label, value, kind = 'money' }: { label: string; value: number | null; kind?: 'money' | 'count' | 'percent' }) {
  const display = value == null ? 'Not available' : kind === 'money' ? formatCompactMoney(value) : kind === 'percent' ? formatPercent(value) : number.format(value)
  const title = kind === 'money' && value != null ? exactMoneyTitle(value) : undefined
  return <div className="min-w-0 rounded-lg bg-muted/45 p-4"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 truncate text-2xl font-semibold tabular-nums text-foreground" title={title}>{display}</p></div>
}

export function MetricRow({ label, value, kind = 'money', detail }: { label: string; value: number | null; kind?: 'money' | 'count' | 'percent'; detail?: string }) {
  const display = value == null ? 'Not available' : kind === 'money' ? formatCompactMoney(value) : kind === 'percent' ? formatPercent(value) : number.format(value)
  const title = kind === 'money' && value != null ? exactMoneyTitle(value) : undefined
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 border-b border-border/60 py-2.5 last:border-b-0">
      <div><dt className="text-sm text-muted-foreground">{label}</dt>{detail && <p className="text-xs text-muted-foreground">{detail}</p>}</div>
      <dd className="min-w-0 shrink-0 truncate text-right text-sm font-semibold tabular-nums text-foreground" title={title}>{display}</dd>
    </div>
  )
}

export function CompositionBar({ segments, label }: { segments: Array<{ label: string; value: number; className: string }>; label: string }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  if (total <= 0) return null
  return (
    <div className="space-y-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={label}>
        {segments.filter(segment => segment.value > 0).map(segment => <span key={segment.label} className={segment.className} style={{ width: `${segment.value / total * 100}%` }} />)}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map(segment => <span key={segment.label} className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${segment.className}`} />{segment.label}</span>)}
      </div>
    </div>
  )
}
