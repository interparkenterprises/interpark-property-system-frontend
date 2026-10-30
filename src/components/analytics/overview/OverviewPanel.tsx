'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowUpRight, RefreshCw } from 'lucide-react'
import type { AnalyticsApiFailure } from '@/types/analytics'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function OverviewPanel({
  title,
  description,
  href,
  loading,
  error,
  onRetry,
  className,
  contentClassName,
  children,
}: {
  title: string
  description: string
  href: string
  loading: boolean
  error?: AnalyticsApiFailure
  onRetry: () => void
  className?: string
  contentClassName?: string
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const persistentHref = search ? `${href}?${search}` : href

  return (
    <Card className={cn('min-w-0 overflow-hidden', className)}>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Link
          href={persistentHref}
          aria-label={`Open ${title}`}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className={contentClassName}>
        {loading ? (
          <div className="space-y-4" aria-label={`Loading ${title}`} aria-live="polite">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
            <Skeleton className="h-48" />
          </div>
        ) : error ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-md border border-destructive/25 bg-destructive/5 p-5 text-center">
            <AlertCircle className="h-7 w-7 text-destructive" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-foreground">This panel could not be loaded</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{error.message}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </Button>
          </div>
        ) : children}
      </CardContent>
    </Card>
  )
}
