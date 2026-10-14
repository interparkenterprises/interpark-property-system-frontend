import { AlertCircle, BarChart3, LockKeyhole, RefreshCw, ServerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton with a subtle staggered pulse so loading feels calm, not broken. */
export function AnalyticsLoading() {
  return (
    <div className="space-y-6" aria-live="polite" aria-label="Loading analytics">
      <Skeleton className="h-24" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map(item => (
          <Skeleton key={item} className="h-32" style={{ animationDelay: `${item * 120}ms` }} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" style={{ animationDelay: '150ms' }} />
      </div>
    </div>
  );
}

export function AnalyticsError({ message, backendUnavailable, retry }: { message: string; backendUnavailable?: boolean; retry: () => void }) {
  const Icon = backendUnavailable ? ServerOff : AlertCircle;
  return (
    <Card className="border-destructive/30"><CardContent className="py-8 text-center">
      <Icon className="mx-auto h-10 w-10 text-destructive" />
      <h2 className="mt-4 text-xl font-semibold text-foreground">{backendUnavailable ? 'Analytics backend unavailable' : 'Unable to load analytics'}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{message}</p>
      <Button className="mt-5" onClick={retry}><RefreshCw className="h-4 w-4" />Try again</Button>
    </CardContent></Card>
  );
}

export function AnalyticsUnauthorized({ detail = 'Your account does not have the permissions required for this analytics view.' }: { detail?: string }) {
  return (
    <EmptyState icon={LockKeyhole} title="Analytics access required" description={detail} />
  );
}

export function AnalyticsEmpty({ title = 'No analytics records', detail = 'No supported records matched the selected filters.' }: { title?: string; detail?: string }) {
  return (
    <EmptyState className="h-full min-h-56" icon={BarChart3} title={title} description={detail} />
  );
}
