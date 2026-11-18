'use client';

import { Check, Circle } from 'lucide-react';
import { PasswordInput } from '@/components/personnel/PasswordInput';
import { personnelPasswordRequirements } from '@/lib/personnelSecurity';

export function PasswordFields({ password, confirmPassword, onPassword, onConfirm }: {
  password: string;
  confirmPassword: string;
  onPassword: (value: string) => void;
  onConfirm: (value: string) => void;
}) {
  const requirements = personnelPasswordRequirements(password);
  const matches = !confirmPassword || password === confirmPassword;
  const checklist = [
    ['minimumLength', 'At least 8 characters'],
    ['maximumLength', 'No more than 128 characters'],
    ['uppercase', 'One uppercase letter'],
    ['lowercase', 'One lowercase letter'],
    ['number', 'One number'],
    ['specialCharacter', 'One special character'],
    ['noWhitespace', 'No spaces'],
  ] as const;

  return (
    <>
      <PasswordInput id="personnel-new-password" label="New password" autoComplete="new-password" minLength={8} maxLength={128} value={password} onChange={onPassword} />
      <div aria-live="polite" className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Password requirements</p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {checklist.map(([key, label]) => {
            const met = requirements[key];
            return <li key={key} className={`flex items-center gap-2 text-xs ${met ? 'text-emerald-700' : 'text-slate-600'}`}>{met ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : <Circle aria-hidden="true" className="h-3.5 w-3.5" />}{label}</li>;
          })}
        </ul>
        <p className={`mt-2 text-xs font-medium ${requirements.recommendedLength ? 'text-emerald-700' : 'text-sky-800'}`}>{requirements.recommendedLength ? 'Strong length: 12 or more characters.' : 'For stronger security, use 12 or more characters.'}</p>
      </div>
      <div className="mt-4">
        <PasswordInput id="personnel-confirm-password" label="Confirm password" autoComplete="new-password" value={confirmPassword} onChange={onConfirm} />
      </div>
      {!matches ? <p role="alert" className="mt-2 text-xs text-red-600">Passwords do not match.</p> : null}
    </>
  );
}
