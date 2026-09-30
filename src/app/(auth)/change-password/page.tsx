'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthShell from '@/components/auth/AuthShell'
import PasswordField from '@/components/auth/PasswordField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { authAPI } from '@/lib/api'

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return 'Failed to change password. Please try again.'
}

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user, logout, refreshUserData } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!user.requiresPasswordChange) router.push('/dashboard')
  }, [router, user])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      return
    }

    setLoading(true)
    try {
      await authAPI.changePassword(currentPassword, newPassword)
      setSuccess(true)
      await refreshUserData()
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (submitError) {
      setError(errorMessage(submitError))
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Change password</h1>
        <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
          {user.requiresPasswordChange ? 'As this is your first login, please set a new password.' : 'Please change your password to continue.'}
        </p>
      </div>

      {success ? (
        <Alert variant="success" className="text-center">
          <AlertTitle>Password changed successfully</AlertTitle>
          <AlertDescription>Redirecting to dashboard...</AlertDescription>
        </Alert>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <PasswordField id="currentPassword" label="Current password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" placeholder="Enter your current password" disabled={loading} />
          <PasswordField id="newPassword" label="New password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" placeholder="Enter your new password" description="Use at least 6 characters." disabled={loading} />
          <PasswordField id="confirmPassword" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" placeholder="Enter your new password again" disabled={loading} />
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>Update password</Button>
          <button type="button" onClick={logout} className="mx-auto block cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline">Logout</button>
        </form>
      )}
    </AuthShell>
  )
}
