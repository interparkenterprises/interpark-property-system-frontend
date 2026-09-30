import { Suspense } from 'react'
import AuthForm from '@/components/auth/AuthForm'
import AuthShell from '@/components/auth/AuthShell'

export default function RegisterPage() {
  return (
    <AuthShell position="right">
      <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>}>
        <AuthForm mode="register" />
      </Suspense>
    </AuthShell>
  )
}
