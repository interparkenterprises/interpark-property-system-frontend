'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { History, LockKeyhole, Snowflake, UnlockKeyhole } from 'lucide-react'
import { toast } from 'sonner'
import type { FreezeSummary, Tenant } from '@/types'
import { tenantsAPI } from '@/lib/api'
import { getEffectiveFreeze } from '@/lib/tenantFreeze'
import { toNairobiDateKey } from '@/lib/calendarDate'
import { formatExactKes } from '@/lib/numberFormat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormDatePicker } from '@/components/ui/form-date-picker'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type FreezeAction = 'freeze' | 'unfreeze'

const today = () => toNairobiDateKey()
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`)) : 'Open-ended'

export function TenantFreezePanel({ tenant, canManage, onTenantChange, onFinancialRefresh }: {
  tenant: Tenant
  canManage: boolean
  onTenantChange: (tenant: Tenant) => void
  onFinancialRefresh: () => void | Promise<void>
}) {
  const effective = useMemo(() => getEffectiveFreeze(tenant), [tenant])
  const [action, setAction] = useState<FreezeAction | null>(null)
  const [startDate, setStartDate] = useState(today())
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<FreezeSummary[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const loadHistory = useCallback(async () => {
    if (!canManage) return
    setHistoryLoading(true)
    try {
      const response = await tenantsAPI.getFreezeHistory(tenant.id)
      setHistory(response.data.freezeSummaries)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load freeze history')
    } finally {
      setHistoryLoading(false)
    }
  }, [canManage, tenant.id])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadHistory(), 0)
    return () => window.clearTimeout(timer)
  }, [loadHistory])

  const openAction = (next: FreezeAction) => {
    setAction(next)
    setStartDate(today())
    setEndDate('')
    setReason('')
  }

  const submit = async () => {
    if (!action) return
    if (action === 'freeze' && endDate && endDate < startDate) {
      toast.error('Freeze end date cannot be before the start date')
      return
    }
    setSubmitting(true)
    try {
      const response = action === 'freeze'
        ? await tenantsAPI.freeze(tenant.id, { freezeStartDate: startDate || undefined, freezeEndDate: endDate || undefined, reason: reason.trim() || undefined })
        : await tenantsAPI.unfreeze(tenant.id, { unfreezeDate: startDate || undefined, reason: reason.trim() || undefined })
      onTenantChange(response.data.tenant)
      await Promise.all([loadHistory(), Promise.resolve(onFinancialRefresh())])
      toast.success(response.message)
      setAction(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${action} tenant`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Snowflake className="size-5 text-primary" />Tenant freeze</CardTitle>
            <CardDescription>Manage period-based financial restrictions without changing tenant lifecycle status.</CardDescription>
          </div>
          <Badge variant={effective.state === 'active' ? 'destructive' : effective.state === 'scheduled' ? 'warning' : 'neutral'}>
            {effective.state === 'active' ? 'Frozen' : effective.state === 'scheduled' ? 'Freeze scheduled' : 'Not frozen'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {effective.period && (
            <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 text-sm sm:grid-cols-3">
              <div><p className="text-muted-foreground">Starts</p><p className="font-medium">{formatDate(effective.period.startDate)}</p></div>
              <div><p className="text-muted-foreground">Ends</p><p className="font-medium">{formatDate(effective.period.endDate)}</p></div>
              <div><p className="text-muted-foreground">Reason</p><p className="font-medium">{effective.period.reason || 'Not provided'}</p></div>
            </div>
          )}
          {canManage && (
            <div className="flex flex-wrap gap-2">
              {effective.state === 'none' && <Button onClick={() => openAction('freeze')}><LockKeyhole className="size-4" />Freeze tenant</Button>}
              {effective.state === 'active' && <Button variant="outline" onClick={() => openAction('unfreeze')}><UnlockKeyhole className="size-4" />Unfreeze tenant</Button>}
              <Button variant="outline" onClick={() => void loadHistory()} disabled={historyLoading}><History className="size-4" />Refresh history</Button>
            </div>
          )}
          {canManage && history.length > 0 && (
            <div className="space-y-2 border-t border-border pt-4">
              <h3 className="text-sm font-semibold">Freeze history</h3>
              {history.map((item) => (
                <div key={item.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{formatDate(item.startDate)} – {formatDate(item.endDate)}</span><Badge variant={item.isOpen ? 'warning' : 'neutral'}>{item.isOpen ? 'Open' : `${item.durationDays} days`}</Badge></div>
                  <p className="mt-1 text-muted-foreground">{item.reason || 'No reason provided'} · Arrears at start {formatExactKes(item.arrearsAtStart)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(action)} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === 'freeze' ? 'Freeze tenant' : 'Unfreeze tenant'}</DialogTitle>
            <DialogDescription>{action === 'freeze' ? 'Choose the effective freeze period. Financial actions remain governed by the selected billing period.' : 'Close the active freeze period without changing the tenant lifecycle.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-5 py-5">
            <FormDatePicker value={startDate} onChange={setStartDate} label={action === 'freeze' ? 'Freeze start date' : 'Unfreeze date'} required />
            {action === 'freeze' && <FormDatePicker value={endDate} onChange={setEndDate} min={startDate} label="Freeze end date" helperText="Optional. Leave blank for an open-ended freeze." />}
            <div className="space-y-2"><Label htmlFor="freeze-reason">Reason (optional)</Label><Textarea id="freeze-reason" value={reason} onChange={(event) => setReason(event.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAction(null)} disabled={submitting}>Cancel</Button><Button onClick={() => void submit()} disabled={submitting || !startDate} loading={submitting}>{action === 'freeze' ? 'Freeze tenant' : 'Unfreeze tenant'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
