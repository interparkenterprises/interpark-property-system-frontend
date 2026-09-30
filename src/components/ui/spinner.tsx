import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg'
  label?: string
}

const sizes = { sm: 'h-3.5 w-3.5', default: 'h-5 w-5', lg: 'h-8 w-8' }

export function Spinner({ size = 'default', label = 'Loading', className, ...props }: SpinnerProps) {
  return (
    <div className={cn('inline-flex items-center gap-2 text-sm text-muted-foreground', className)} role="status" {...props}>
      <Loader2 className={cn('animate-spin text-primary', sizes[size])} aria-hidden="true" />
      {label && <span>{label}</span>}
    </div>
  )
}

export const LoadingIndicator = Spinner
