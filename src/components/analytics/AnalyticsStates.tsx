import { AlertCircle, BarChart3, LockKeyhole, RefreshCw, ServerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AnalyticsLoading() {
  return (
    <div className="space-y-6" aria-live="polite" aria-label="Loading analytics">
      <div className="h-32 animate-pulse rounded-2xl bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map(item => <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-800" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl bg-slate-800" />
        <div className="h-80 animate-pulse rounded-2xl bg-slate-800" />
      </div>
    </div>
  );
}

export function AnalyticsError({ message, backendUnavailable, retry }: { message: string; backendUnavailable?: boolean; retry: () => void }) {
  const Icon = backendUnavailable ? ServerOff : AlertCircle;
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-8 text-center text-white">
      <Icon className="mx-auto h-10 w-10 text-red-300" />
      <h2 className="mt-4 text-xl font-semibold">{backendUnavailable ? 'Analytics backend unavailable' : 'Unable to load analytics'}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-red-100">{message}</p>
      <Button className="mt-5" onClick={retry}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button>
    </div>
  );
}

export function AnalyticsUnauthorized({ detail = 'Your account does not have the permissions required for this analytics view.' }: { detail?: string }) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-8 text-center text-white">
      <LockKeyhole className="mx-auto h-10 w-10 text-amber-300" />
      <h2 className="mt-4 text-xl font-semibold">Analytics access required</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-amber-100">{detail}</p>
    </div>
  );
}

export function AnalyticsEmpty({ title = 'No analytics records', detail = 'No supported records matched the selected filters.' }: { title?: string; detail?: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-8 text-center">
      <BarChart3 className="h-9 w-9 text-slate-500" />
      <p className="mt-3 font-medium text-slate-200">{title}</p>
      <p className="mt-1 max-w-md text-sm text-slate-400">{detail}</p>
    </div>
  );
}
