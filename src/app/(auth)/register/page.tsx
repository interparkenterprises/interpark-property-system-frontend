'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      await register(name, email, password)
      // AuthContext handles token storage, state update, and navigation
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative
                    bg-linear-to-br from-[#005478] to-[#1C2B3A]">
      
      {/* Soft overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="max-w-md w-full space-y-8 relative z-10 bg-white/10 backdrop-blur-xl p-8
                      rounded-2xl shadow-lg border border-white/20">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-white drop-shadow-md">
            Create Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-200">
            Join Interpark Property Management System
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <input
            id="name"
            type="text"
            placeholder="Full Name"
            required
            autoComplete="name"
            className="w-full rounded-lg px-4 py-2 bg-white/90 border border-gray-300
                      text-gray-900 shadow-sm focus:outline-none focus:ring-2
                      focus:ring-[#00A8C6] focus:border-[#00A8C6]"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            id="email"
            type="email"
            placeholder="Email Address"
            required
            autoComplete="email"
            className="w-full rounded-lg px-4 py-2 bg-white/90 border border-gray-300
                      text-gray-900 shadow-sm focus:outline-none focus:ring-2
                      focus:ring-[#00A8C6] focus:border-[#00A8C6]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password field with eye icon */}
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              autoComplete="new-password"
              className="w-full rounded-lg px-4 py-2 pr-10 bg-white/90 border border-gray-300
                        text-gray-900 shadow-sm focus:outline-none focus:ring-2
                        focus:ring-[#00A8C6] focus:border-[#00A8C6]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500
                        hover:text-gray-700 focus:outline-none cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Confirm Password field with eye icon */}
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              required
              autoComplete="new-password"
              className="w-full rounded-lg px-4 py-2 pr-10 bg-white/90 border border-gray-300
                        text-gray-900 shadow-sm focus:outline-none focus:ring-2
                        focus:ring-[#00A8C6] focus:border-[#00A8C6]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500
                        hover:text-gray-700 focus:outline-none cursor-pointer"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center font-medium">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`group relative w-full flex justify-center py-3 px-4 text-sm font-semibold
                      rounded-lg transition-all duration-300 shadow-lg
                      text-white bg-[#00A8C6] hover:bg-[#E6F8FA] hover:text-[#005478]
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00A8C6]
                      disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150"></span>
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-300"></span>
                <span>Creating...</span>
              </div>
            ) : (
              'Sign Up'
            )}
          </button>

          <div className="text-center">
            <Link href="/login" className="text-sm font-semibold text-white! hover:text-white/80 transition-colors">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}