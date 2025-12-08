'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
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
      const res = await fetch('https://api.interparkpropertysystem.co.ke/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        router.push('/dashboard')
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center 
      bg-linear-to-br from-[#005478] to-[#58595B] px-4 py-12">
      
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl space-y-8 border border-white/20">
        <h2 className="text-center text-3xl font-bold text-white">
          Welcome Back
        </h2>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            required
            className="w-full px-4 py-3 rounded-lg bg-white/90 
            placeholder-gray-600 focus:outline-none text-gray-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            className="w-full px-4 py-3 rounded-lg bg-white/90 
            placeholder-gray-600 focus:outline-none text-gray-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-300 text-center text-sm">{error}</p>}

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
              'Sign In'
            )}
          </button>

          <div className="text-center">
            <Link
              href="/register"
              className="text-sm font-medium text-white! hover:text-white/80 transition-colors"
            >
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
