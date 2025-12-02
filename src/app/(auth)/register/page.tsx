'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('https://api.interparkpropertysystem.co.ke/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        router.push('/dashboard')
      } else {
        setError(data.message || 'Registration failed.')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
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

          <input
            id="password"
            type="password"
            placeholder="Password"
            required
            autoComplete="new-password"
            className="w-full rounded-lg px-4 py-2 bg-white/90 border border-gray-300
                      text-gray-900 shadow-sm focus:outline-none focus:ring-2
                      focus:ring-[#00A8C6] focus:border-[#00A8C6]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

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
                {/* Unique modern loading indicator */}
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
