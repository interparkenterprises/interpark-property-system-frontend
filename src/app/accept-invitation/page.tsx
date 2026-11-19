'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authAPI } from '@/lib/api'

// Portal -> dashboard route mapping. Adjust paths if your dashboards
// live somewhere else.
const PORTAL_HOME = {
  LANDLORD: '/landlord/dashboard',
  TENANT: '/tenant/dashboard',
  SERVICE_PROVIDER: '/service-provider/dashboard',
  ADMIN: '/dashboard',
  MANAGER: '/dashboard',
  USER: '/dashboard',
}

function AcceptInvitationInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const userId = searchParams.get('userId') || ''
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // If the URL is missing the token/userId, don't even render the form.
  const linkInvalid = !userId || !token

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }
    if (newPassword.length < 8) {
      // Backend requires >= 8 (see acceptInvitation in auth.controller.js)
      setError('Password must be at least 8 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const result = await authAPI.acceptInvitation(userId, token, newPassword)

      // Persist the session exactly like your login flow does.
      // Adjust to match whatever your AuthContext exposes — if
      // authAPI.login already stores the token, mimic that here.
      if (result?.token) {
        localStorage.setItem('token', result.token)
      }
      if (result?.user) {
        localStorage.setItem('user', JSON.stringify(result.user))
      }

      setSuccess(true)

      const portal = result?.portal?.portal
      const destination = portal && PORTAL_HOME[portal]
        ? PORTAL_HOME[portal]
        : '/dashboard'

      // Give the success panel a beat to render, then redirect.
      setTimeout(() => {
        // Full reload so AuthContext re-hydrates from localStorage
        // with the freshly-issued token. If your app uses a
        // refreshUserData() helper, call that instead and use
        // router.push(destination).
        window.location.href = destination
      }, 1500)
    } catch (err: any) {
      setError(err?.message || 'Failed to accept invitation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (linkInvalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#005478] to-[#58595B] px-4 py-12">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/20 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Invalid Invitation Link</h2>
          <p className="text-white/80 text-sm mb-6">
            This link is missing its invitation token. Please ask your administrator to resend it.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 rounded-lg text-white font-semibold bg-[#231F20] hover:bg-black/80 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#005478] to-[#58595B] px-4 py-12">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl space-y-8 border border-white/20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Accept Invitation</h2>
          <p className="mt-2 text-white/80 text-sm">
            Set a password to activate your account.
          </p>
        </div>

        {success ? (
          <div className="rounded-lg bg-green-500/20 border border-green-500/50 p-4 text-center">
            <p className="text-green-200 font-medium">Account activated!</p>
            <p className="text-green-200/80 text-sm mt-1">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/90 placeholder-gray-600 focus:outline-none text-gray-900"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              <p className="text-white/60 text-xs mt-1">
                Password must be at least 8 characters long
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/90 placeholder-gray-600 focus:outline-none text-gray-900"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-3">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full flex justify-center items-center py-3 px-4 rounded-lg text-white font-semibold bg-[#231F20] hover:bg-black/80 transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Activate Account'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// useSearchParams() must be wrapped in <Suspense> at the page level
// in the App Router, otherwise the build warns / bails to CSR.
export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={null}>
      <AcceptInvitationInner />
    </Suspense>
  )
}