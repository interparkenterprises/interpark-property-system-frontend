'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  minLength?: number;
  maxLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  const visibilityLabel = `${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`;

  return (
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
      {label}
      <span className="relative mt-1 block">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={maxLength}
          value={value}
          onChange={event => onChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 py-2.5 pl-3 pr-11 outline-none focus:border-[#005478] focus:ring-2 focus:ring-cyan-100"
        />
        <button
          type="button"
          onClick={() => setVisible(current => !current)}
          aria-label={visibilityLabel}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-[#005478] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500"
        >
          {visible ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
        </button>
      </span>
    </label>
  );
}
