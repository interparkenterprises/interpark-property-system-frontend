'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { authAPI } from '@/lib/api'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user, logout, refreshUserData } = useAuth()
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Protect route - redirect if no user or user doesn't need password change
  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    // If user doesn't need to change password, redirect to dashboard
    if (user && !user.requiresPasswordChange) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation
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
      
      // Refresh user data to update requiresPasswordChange flag
      await refreshUserData()
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err?.message || 'Failed to change password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // If no user is logged in, show nothing (will redirect via useEffect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#005478] to-[#58595B] px-4 py-12">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl space-y-8 border border-white/20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Change Password</h2>
          <p className="mt-2 text-white/80 text-sm">
            {user?.requiresPasswordChange 
              ? 'As this is your first login, please set a new password.' 
              : 'Please change your password to continue.'}
          </p>
        </div>

        {success ? (
          <div className="rounded-lg bg-green-500/20 border border-green-500/50 p-4 text-center">
            <p className="text-green-200 font-medium">Password changed successfully!</p>
            <p className="text-green-200/80 text-sm mt-1">Redirecting to dashboard...</p>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Current Password
              </label>
              <input
                type="password"
                placeholder="Enter your current password"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/90 placeholder-gray-600 focus:outline-none text-gray-900"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
              />
            </div>

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
                Password must be at least 6 characters long
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
              className={`relative w-full flex justify-center items-center 
                py-3 px-4 rounded-lg
                text-white font-semibold
                bg-[#231F20] hover:bg-black/80 
                transition duration-300
                disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Update Password'
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={logout}
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}