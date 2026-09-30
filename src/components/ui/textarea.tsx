import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, id, className, required, 'aria-describedby': describedBy, ...props }, ref) => {
    const generatedId = React.useId()
    const textareaId = id ?? generatedId
    const messageId = `${textareaId}-message`
    const control = (
      <textarea
        ref={ref}
        id={textareaId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error || helperText ? messageId : describedBy}
        className={cn(
          'flex min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60',
          error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
          className,
        )}
        {...props}
      />
    )

    if (!label && !error && !helperText) return control
    return (
      <div className="w-full space-y-1.5">
        {label && <Label htmlFor={textareaId} required={required}>{label}</Label>}
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
Textarea.displayName = 'Textarea'
