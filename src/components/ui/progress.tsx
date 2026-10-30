import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  label?: string
  indicatorClassName?: string
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, max = 100, label, className, indicatorClassName, ...props }, ref) => {
    const safeMax = max > 0 ? max : 100
    const safeValue = Math.min(Math.max(value, 0), safeMax)
    const percentage = (safeValue / safeMax) * 100

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
        {...props}
      >
        <div
          className={cn('h-full rounded-full bg-primary transition-[width] duration-300', indicatorClassName)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  },
)
Progress.displayName = 'Progress'
