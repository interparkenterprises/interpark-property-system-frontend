import { cn } from '@/lib/utils'

interface FormSectionProps extends React.HTMLAttributes<HTMLElement> {
  title: string
  description?: string
  footer?: React.ReactNode
}

export function FormSection({ title, description, children, footer, className, ...props }: FormSectionProps) {
  return (
    <section className={cn('rounded-lg border border-border bg-card text-card-foreground', className)} {...props}>
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
      {footer && <div className="border-t border-border bg-muted/30 px-5 py-4">{footer}</div>}
    </section>
  )
}
