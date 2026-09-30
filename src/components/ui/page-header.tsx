import { cn } from '@/lib/utils'

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  leading?: React.ReactNode
  breadcrumbs?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({ title, description, leading, breadcrumbs, actions, className, ...props }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)} {...props}>
      <div className="min-w-0">
        {breadcrumbs && <div className="mb-2 text-sm text-muted-foreground">{breadcrumbs}</div>}
        <div className="flex min-w-0 items-start gap-3">
          {leading}
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>}
          </div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
