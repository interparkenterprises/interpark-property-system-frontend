'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { PersonnelShell } from '@/components/personnel/PersonnelShell';
import { personnelAuthAPI } from '@/lib/personnelPortalApi';

export default function PersonnelForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSubmitting(true); setError(null);
    try {
      setMessage(await personnelAuthAPI.forgotPassword(email));
      setEmail('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit the request.');
    } finally { setSubmitting(false); }
  };
  return <PersonnelShell title="Reset your password" description="We will send a secure, time-limited reset link if the account is eligible.">
    {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div> : <form onSubmit={submit}>
      {error ? <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <label className="block text-sm font-semibold text-slate-700">Email address
        <input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#005478] focus:ring-2 focus:ring-cyan-100" />
      </label>
      <button disabled={submitting} className="mt-5 w-full rounded-lg bg-[#005478] px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting ? 'Submitting…' : 'Send reset instructions'}</button>
    </form>}
    <p className="mt-5 text-center text-sm"><Link href="/personnel/login" className="font-semibold text-[#005478] hover:underline">Back to personnel sign in</Link></p>
  </PersonnelShell>;
}
