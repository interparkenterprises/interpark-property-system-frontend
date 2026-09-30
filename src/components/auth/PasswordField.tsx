'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  placeholder?: string
  description?: string
  disabled?: boolean
}

export default function PasswordField({ id, label, value, onChange, autoComplete, placeholder, description, disabled }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <FormField label={label} htmlFor={id} description={description} required>
      <div className="relative">
        <Input id={id} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} placeholder={placeholder} disabled={disabled} className="pr-10" required />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </FormField>
  )
}
