import * as React from 'react'
import { cn } from '@/lib/utils'

type AlertVariant = 'default' | 'info' | 'success' | 'warning' | 'destructive'

const variants: Record<AlertVariant, string> = {
  default: 'border-border bg-card text-card-foreground',
  info: 'border-primary/25 bg-primary/8 text-foreground',
  success: 'border-success/25 bg-success/8 text-foreground',
  warning: 'border-warning/25 bg-warning/8 text-foreground',
  destructive: 'border-destructive/25 bg-destructive/8 text-foreground',
}

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
}

export function Alert({ variant = 'default', className, ...props }: AlertProps) {
  return <div role="alert" className={cn('relative rounded-md border px-4 py-3 text-sm', variants[variant], className)} {...props} />
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h4 className={cn('mb-1 font-medium leading-none', className)} {...props} />
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('leading-5 text-muted-foreground', className)} {...props} />
}
