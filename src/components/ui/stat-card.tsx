import * as React from 'react'
import { Card, CardContent } from './card'
import { cn } from '@/lib/utils'

type StatTone = 'default' | 'primary' | 'success' | 'info' | 'warning'

const toneClasses: Record<StatTone, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  info: 'bg-primary/10 text-primary',
  warning: 'bg-warning/10 text-warning',
}

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  tone?: StatTone
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, description, icon, tone = 'default', className, ...props }, ref) => (
    <Card ref={ref} className={cn('h-full', className)} {...props}>
      <CardContent className="flex items-start justify-between gap-4 pt-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {description && <div className="mt-1 text-xs text-muted-foreground">{description}</div>}
        </div>
        {icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', toneClasses[tone])} aria-hidden="true">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  ),
)
StatCard.displayName = 'StatCard'
