import { Badge } from './badge'

type StatusAppearance = 'neutral' | 'info' | 'success' | 'warning' | 'destructive'

interface StatusBadgeProps {
  status?: string
  appearance?: StatusAppearance
  children?: React.ReactNode
  className?: string
}

export function StatusBadge({ status, appearance = 'neutral', children, className }: StatusBadgeProps) {
  return <Badge variant={appearance} className={className}>{children ?? status}</Badge>
}
