import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className, required, 'aria-describedby': describedBy, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const messageId = `${inputId}-message`
    const control = (
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error || helperText ? messageId : describedBy}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60',
          error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
          className,
        )}
        {...props}
      />
    )

    if (!label && !error && !helperText) return control
    return (
      <div className="w-full space-y-1.5">
        {label && <Label htmlFor={inputId} required={required}>{label}</Label>}
        {control}
        {(error || helperText) && (
          <p id={messageId} className={cn('text-xs text-muted-foreground', error && 'text-destructive')}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
