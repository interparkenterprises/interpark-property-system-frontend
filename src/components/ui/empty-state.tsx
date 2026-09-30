import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div className={cn('flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center', className)} {...props}>
      {Icon && <div className="mb-4 rounded-full bg-muted p-3 text-muted-foreground"><Icon className="h-5 w-5" aria-hidden="true" /></div>}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm leading-5 text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
