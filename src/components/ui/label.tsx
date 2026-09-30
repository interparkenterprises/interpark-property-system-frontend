import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  optional?: boolean
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, required, optional, className, ...props }, ref) => (
    <label ref={ref} className={cn('block text-sm font-medium leading-none text-foreground', className)} {...props}>
      {children}
      {required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
      {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
    </label>
  ),
)
Label.displayName = 'Label'
