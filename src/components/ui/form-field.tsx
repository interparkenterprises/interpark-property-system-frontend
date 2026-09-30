import { cn } from '@/lib/utils'
import { Label } from './label'

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  htmlFor?: string
  description?: string
  error?: string
  required?: boolean
  optional?: boolean
}

export function FormField({ label, htmlFor, description, error, required, optional, children, className, ...props }: FormFieldProps) {
  const messageId = htmlFor ? `${htmlFor}-field-message` : undefined
  return (
    <div className={cn('space-y-1.5', className)} {...props}>
      <Label htmlFor={htmlFor} required={required} optional={optional}>{label}</Label>
      {children}
      {(error || description) && (
        <p id={messageId} className={cn('text-xs leading-5 text-muted-foreground', error && 'text-destructive')}>
          {error || description}
        </p>
      )}
    </div>
  )
}
