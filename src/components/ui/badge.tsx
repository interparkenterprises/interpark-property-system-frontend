import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'neutral' | 'info' | 'success' | 'warning' | 'destructive'

const variants: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  outline: 'border-border bg-background text-foreground',
  neutral: 'border-transparent bg-muted text-muted-foreground',
  info: 'border-primary/20 bg-primary/10 text-primary',
  success: 'border-success/20 bg-success/10 text-success',
  warning: 'border-warning/20 bg-warning/10 text-warning',
  destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', variants[variant], className)} {...props} />
}
