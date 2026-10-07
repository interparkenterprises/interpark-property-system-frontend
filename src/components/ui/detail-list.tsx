import * as React from 'react'
import { cn } from '@/lib/utils'

export const DetailList = React.forwardRef<HTMLDListElement, React.HTMLAttributes<HTMLDListElement>>(
  ({ className, ...props }, ref) => (
    <dl ref={ref} className={cn('divide-y divide-border', className)} {...props} />
  ),
)
DetailList.displayName = 'DetailList'

export interface DetailItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode
  icon?: React.ReactNode
}

export const DetailItem = React.forwardRef<HTMLDivElement, DetailItemProps>(
  ({ label, icon, children, className, ...props }, ref) => (
    <div ref={ref} className={cn('grid gap-1 py-3 sm:grid-cols-[minmax(8rem,0.4fr)_1fr] sm:gap-4', className)} {...props}>
      <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon && <span className="text-muted-foreground" aria-hidden="true">{icon}</span>}
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  ),
)
DetailItem.displayName = 'DetailItem'
