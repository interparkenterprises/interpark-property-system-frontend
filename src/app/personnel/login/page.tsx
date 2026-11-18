'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PersonnelShell } from '@/components/personnel/PersonnelShell';
import { PasswordInput } from '@/components/personnel/PasswordInput';
import { usePersonnelAuth } from '@/context/PersonnelAuthContext';

export default function PersonnelLoginPage() {
  const router = useRouter();
  const { login, sessionError } = usePersonnelAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      router.replace('/personnel');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return <PersonnelShell title="Personnel sign in" description="View your property assignments and current work schedules.">
    <form onSubmit={submit} className="space-y-4">
      {(error || sessionError) ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error || sessionError}</div> : null}
      <label className="block text-sm font-semibold text-slate-700">Email address
        <input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#005478] focus:ring-2 focus:ring-cyan-100" />
      </label>
      <PasswordInput id="personnel-login-password" label="Password" autoComplete="current-password" value={password} onChange={setPassword} />
      <div className="text-right"><Link href="/personnel/forgot-password" className="text-sm font-semibold text-[#005478] hover:underline">Forgot password?</Link></div>
      <button disabled={submitting} className="w-full rounded-lg bg-[#005478] px-4 py-3 font-semibold text-white hover:bg-[#006b91] disabled:opacity-60">{submitting ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </PersonnelShell>;
}
