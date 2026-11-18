'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Mail, Power, PowerOff, RefreshCw } from 'lucide-react';
import { servicePersonnelAPI } from '@/lib/api';
import { Modal } from '@/components/ui/modal';
import type { PersonnelPortalAccess } from '@/types/personnelPortal';
import { actionsForPortalState, type PersonnelPortalAction } from '@/lib/personnelPortalAccess';

type Action = PersonnelPortalAction;

const STATE_STYLES = {
  NOT_GRANTED: 'bg-slate-100 text-slate-700',
  PENDING_ACTIVATION: 'bg-amber-100 text-amber-800',
  ENABLED: 'bg-emerald-100 text-emerald-800',
  DISABLED: 'bg-red-100 text-red-800'
};
const STATE_LABELS = {
  NOT_GRANTED: 'Not granted',
  PENDING_ACTIVATION: 'Pending activation',
  ENABLED: 'Active / enabled',
  DISABLED: 'Disabled'
};
const ACTION_COPY: Record<Action, { title: string; body: string; confirm: string }> = {
  invite: { title: 'Grant portal access?', body: 'A restricted personnel account will be created and an activation invitation sent to this worker.', confirm: 'Grant access' },
  resend: { title: 'Resend activation invitation?', body: 'The previous unused activation link will be invalidated.', confirm: 'Resend invitation' },
  disable: { title: 'Disable portal access?', body: 'The worker will be signed out on their next request. Their profile, assignments and schedules remain unchanged.', confirm: 'Disable access' },
  enable: { title: 'Re-enable portal access?', body: 'Activated workers keep their password. Workers who never activated will receive a new invitation.', confirm: 'Re-enable access' }
};

const formatDate = (value: string | null | undefined) => value
  ? new Date(value).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })
  : 'Not available';

export default function PersonnelPortalAccessPanel({ personnelId, canUseManagerEndpoints }: {
  personnelId: string;
  canUseManagerEndpoints: boolean;
}) {
  const [access, setAccess] = useState<PersonnelPortalAccess | null>(null);
  const [loading, setLoading] = useState(canUseManagerEndpoints);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Action | null>(null);
  const [checkedAt, setCheckedAt] = useState(0);

  const load = useCallback(async () => {
    if (!canUseManagerEndpoints) return;
    setLoading(true); setError(null);
    try { setAccess(await servicePersonnelAPI.getPortalAccess(personnelId)); setCheckedAt(Date.now()); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Portal access information is unavailable.'); }
    finally { setLoading(false); }
  }, [canUseManagerEndpoints, personnelId]);

  useEffect(() => {
    if (!canUseManagerEndpoints) return;
    let active = true;
    servicePersonnelAPI.getPortalAccess(personnelId)
      .then(result => { if (active) { setAccess(result); setCheckedAt(Date.now()); } })
      .catch(requestError => { if (active) setError(requestError instanceof Error ? requestError.message : 'Portal access information is unavailable.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canUseManagerEndpoints, personnelId]);

  const perform = async (action: Action) => {
    setBusy(true); setError(null); setNotice(null);
    try {
      const next = action === 'invite' ? await servicePersonnelAPI.invitePortalAccess(personnelId)
        : action === 'resend' ? await servicePersonnelAPI.resendPortalInvitation(personnelId)
          : action === 'disable' ? await servicePersonnelAPI.disablePortalAccess(personnelId)
            : await servicePersonnelAPI.enablePortalAccess(personnelId);
      setAccess(next);
      setNotice(action === 'disable' ? 'Portal access disabled.' : action === 'resend' ? 'Invitation accepted for delivery.' : action === 'invite' ? 'Portal access granted and invitation accepted for delivery.' : next.portalState === 'ENABLED' ? 'Portal access re-enabled.' : 'Portal access re-enabled; activation is still required.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update portal access.');
      await load();
    } finally { setBusy(false); setConfirming(null); }
  };

  if (!canUseManagerEndpoints) return null;
  if (loading) return <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">Loading portal access…</div>;
  if (!access) return <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><p>{error || 'Portal access controls are unavailable.'}</p><p className="mt-1 text-xs">Viewing a worker or assigned property does not necessarily grant account-management authority.</p></div>;

  const expired = access.invitation ? new Date(access.invitation.expiresAt).getTime() <= checkedAt : false;
  const actions = actionsForPortalState(access.portalState);
  return <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Personnel portal</p><div className="mt-1 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATE_STYLES[access.portalState]}`}>{STATE_LABELS[access.portalState]}</span>{access.email ? <span className="text-xs text-slate-500">{access.email}</span> : null}</div></div><button type="button" onClick={() => void load()} aria-label="Refresh portal access" className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-100"><RefreshCw className="h-4 w-4" /></button></div>
    {access.invitation ? <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2"><p>Delivery: <strong className={access.invitation.delivered ? 'text-emerald-700' : 'text-red-700'}>{access.invitation.deliveryStatus.toLowerCase()}</strong></p><p>Expires: <strong className={expired ? 'text-red-700' : 'text-slate-800'}>{formatDate(access.invitation.expiresAt)}{expired ? ' (expired)' : ''}</strong></p><p>Attempted: {formatDate(access.invitation.deliveryAttemptedAt)}</p><p>Delivered: {formatDate(access.invitation.deliveredAt)}</p></div> : null}
    {access.activatedAt ? <p className="mt-3 text-xs text-slate-600">Activated: <strong>{formatDate(access.activatedAt)}</strong></p> : null}
    {notice ? <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800">{notice}</p> : null}
    {error ? <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p> : null}
    <div className="mt-4 flex flex-wrap gap-2">
      {actions.includes('invite') ? <button disabled={busy} onClick={() => setConfirming('invite')} className="inline-flex items-center gap-1.5 rounded-lg bg-[#005478] px-3 py-2 text-xs font-semibold text-white"><KeyRound className="h-4 w-4" />Grant portal access</button> : null}
      {actions.includes('resend') ? <button disabled={busy} onClick={() => setConfirming('resend')} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white"><Mail className="h-4 w-4" />Resend invitation</button> : null}
      {actions.includes('disable') ? <button disabled={busy} onClick={() => setConfirming('disable')} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white"><PowerOff className="h-4 w-4" />Disable access</button> : null}
      {actions.includes('enable') ? <button disabled={busy} onClick={() => setConfirming('enable')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white"><Power className="h-4 w-4" />Re-enable access</button> : null}
    </div>
    <Modal isOpen={Boolean(confirming)} onClose={() => !busy && setConfirming(null)} title={confirming ? ACTION_COPY[confirming].title : ''}>
      {confirming ? <div><p className="text-sm text-slate-600">{ACTION_COPY[confirming].body}</p><div className="mt-5 flex justify-end gap-3"><button type="button" disabled={busy} onClick={() => setConfirming(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button type="button" disabled={busy} onClick={() => void perform(confirming)} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${confirming === 'disable' ? 'bg-red-600' : 'bg-[#005478]'}`}>{busy ? 'Working…' : ACTION_COPY[confirming].confirm}</button></div></div> : null}
    </Modal>
  </div>;
}
