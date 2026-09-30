'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import PasswordField from './PasswordField'

type AuthMode = 'login' | 'register'

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return fallback
}

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = useRef(searchParams.get('redirect') || '/dashboard')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode !== 'login') return
    const redirect = searchParams.get('redirect')
    if (redirect) {
      redirectTo.current = redirect
      return
    }
    try {
      const storedRedirect = sessionStorage.getItem('redirectAfterLogin')
      if (storedRedirect === '/login') {
        sessionStorage.removeItem('redirectAfterLogin')
      } else if (storedRedirect) {
        redirectTo.current = storedRedirect
        sessionStorage.removeItem('redirectAfterLogin')
      }
    } catch {
      // Storage may be unavailable in privacy-restricted browsing contexts.
    }
  }, [mode, searchParams])

  useEffect(() => {
    if (mode === 'login' && isAuthenticated && !authLoading) router.push(redirectTo.current)
  }, [authLoading, isAuthenticated, mode, router])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(name, email, password)
    } catch (submitError) {
      setError(errorMessage(submitError, mode === 'login' ? 'An error occurred. Please try again.' : 'Registration failed. Please try again.'))
      setLoading(false)
    }
  }

  const isLogin = mode === 'login'
  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{isLogin ? 'Sign in to your Interpark account' : 'Get started with Interpark'}</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {!isLogin && (
          <FormField label="Full name" htmlFor="name" required>
            <Input id="name" type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Enter your full name" disabled={loading} required />
          </FormField>
        )}
        <FormField label="Email" htmlFor="email" required>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" disabled={loading} required />
        </FormField>
        <PasswordField id="password" label="Password" value={password} onChange={setPassword} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="Enter your password" description={isLogin ? undefined : 'Use at least 6 characters.'} disabled={loading} />
        {!isLogin && <PasswordField id="confirmPassword" label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" placeholder="Enter your password again" disabled={loading} />}
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <Button type="submit" className="w-full" size="lg" loading={loading || (isLogin && authLoading)}>{isLogin ? 'Sign in' : 'Create account'}</Button>
        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <Link href={isLogin ? '/register' : '/login'} className="font-medium text-primary underline-offset-4 transition-colors hover:underline">{isLogin ? 'Create an account' : 'Sign in'}</Link>
        </p>
      </form>
    </div>
  )
}
