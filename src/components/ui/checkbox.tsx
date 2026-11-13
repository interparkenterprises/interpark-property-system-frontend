import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <span className="relative inline-flex size-4 shrink-0 items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'peer size-4 appearance-none rounded border border-input bg-background shadow-xs outline-none transition-colors checked:border-primary checked:bg-primary focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
      <Check className="pointer-events-none absolute size-3 text-primary-foreground opacity-0 peer-checked:opacity-100" aria-hidden="true" />
    </span>
  ),
)
Checkbox.displayName = 'Checkbox'
