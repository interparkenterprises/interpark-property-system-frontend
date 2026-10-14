import Link from 'next/link'
import * as React from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from './card'
import { cn } from '@/lib/utils'

export interface InteractiveMetricCardProps {
  title: string
  value: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  href?: string
  onClick?: React.MouseEventHandler<HTMLDivElement>
  className?: string
  disabled?: boolean
}

export function InteractiveMetricCard({
  title,
  value,
  description,
  icon,
  href,
  onClick,
  className,
  disabled = false,
}: InteractiveMetricCardProps) {
  const interactive = !disabled && Boolean(href || onClick)
  const linked = Boolean(href && interactive)

  const card = (
    <Card
      role={!href && interactive ? 'button' : undefined}
      tabIndex={!href && interactive ? 0 : undefined}
      aria-disabled={disabled || undefined}
      onClick={!href && interactive ? onClick : undefined}
      onKeyDown={!href && interactive ? event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.click()
        }
      } : undefined}
      className={cn(
        'h-full min-w-0 transition-colors duration-200 motion-reduce:transition-none',
        href && interactive && 'cursor-pointer group-hover/metric:border-[#005478] group-hover/metric:bg-[#005478] group-hover/metric:[&_svg]:text-white group-focus-visible/metric:border-[#005478] group-focus-visible/metric:bg-[#005478] group-focus-visible/metric:[&_svg]:text-white',
        !href && interactive && 'group/metric cursor-pointer outline-none hover:border-[#005478] hover:bg-[#005478] hover:[&_svg]:text-white focus-visible:border-[#005478] focus-visible:bg-[#005478] focus-visible:[&_svg]:text-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        disabled && 'opacity-60',
        !linked && className,
      )}
    >
      <CardContent className="flex h-full min-w-0 flex-col pt-5">
        <div className="flex items-start justify-between gap-4">
          {icon ? (
            <span className={cn('text-primary transition-colors duration-200 motion-reduce:transition-none', interactive && 'group-hover/metric:text-white group-focus-visible/metric:text-white')} aria-hidden="true">
              {icon}
            </span>
          ) : <span />}
          {interactive && (
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors duration-200 group-hover/metric:text-white group-focus-visible/metric:text-white motion-reduce:transition-none" aria-hidden="true" />
          )}
        </div>
        <p className={cn('mt-5 text-sm font-semibold text-foreground transition-colors duration-200 motion-reduce:transition-none', interactive && 'group-hover/metric:text-white group-focus-visible/metric:text-white')}>{title}</p>
        <div className={cn('kpi-value mt-2 min-w-0 font-semibold tracking-tight text-foreground transition-colors duration-200 motion-reduce:transition-none', interactive && 'group-hover/metric:text-white group-focus-visible/metric:text-white')}>{value}</div>
        {description && (
          <div className={cn('mt-1 text-xs leading-5 text-muted-foreground transition-colors duration-200 motion-reduce:transition-none', interactive && 'group-hover/metric:text-white/80 group-focus-visible/metric:text-white/80 group-hover/metric:[&_svg]:text-white group-focus-visible/metric:[&_svg]:text-white')}>
            {description}
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href && linked) {
    return (
      <Link href={href} className={cn('group/metric block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background', className)}>
        {card}
      </Link>
    )
  }

  return card
}
