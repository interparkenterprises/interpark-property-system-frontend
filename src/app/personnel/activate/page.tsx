'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { PasswordFields } from '@/components/personnel/PasswordFields';
import { PersonnelShell } from '@/components/personnel/PersonnelShell';
import { usePersonnelLinkToken } from '@/hooks/usePersonnelLinkToken';
import { personnelAuthAPI } from '@/lib/personnelPortalApi';
import { passwordMeetsPersonnelPolicy } from '@/lib/personnelSecurity';

export default function PersonnelActivationPage() {
  const { token, ready } = usePersonnelLinkToken();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !passwordMeetsPersonnelPolicy(password) || password !== confirmation) {
      setError('Enter matching passwords that meet the security requirements.');
      return;
    }
    setSubmitting(true); setError(null);
    try {
      await personnelAuthAPI.activate(token, password);
      setPassword(''); setConfirmation(''); setSuccess(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'This activation link is invalid or expired.');
    } finally { setSubmitting(false); }
  };

  return <PersonnelShell title="Activate your account" description="Create your private password to access the personnel portal.">
    {!ready ? <p className="text-center text-sm text-slate-500">Checking activation link…</p> : !token ? <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">This activation link is missing or invalid. Ask your manager to resend the invitation.</div> : success ? <div className="text-center"><div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">Your account is active and your password has been saved.</div><Link href="/personnel/login" className="mt-5 inline-flex rounded-lg bg-[#005478] px-5 py-2.5 font-semibold text-white">Continue to sign in</Link></div> : <form onSubmit={submit}>
      {error ? <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <PasswordFields password={password} confirmPassword={confirmation} onPassword={setPassword} onConfirm={setConfirmation} />
      <button disabled={submitting} className="mt-5 w-full rounded-lg bg-[#005478] px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting ? 'Activating…' : 'Activate account'}</button>
    </form>}
  </PersonnelShell>;
}
