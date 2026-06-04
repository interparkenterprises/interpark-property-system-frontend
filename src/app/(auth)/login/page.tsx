'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [redirectTo, setRedirectTo] = useState('/dashboard')
  const [mounted, setMounted] = useState(false)

  // Mark component as mounted to handle client-side only code
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get redirect URL from query params or session storage (client-side only)
  useEffect(() => {
    if (!mounted) return
    
    const redirect = searchParams.get('redirect')
    if (redirect) {
      setRedirectTo(redirect)
    } else {
      // Only access sessionStorage on the client side
      try {
        const storedRedirect = sessionStorage.getItem('redirectAfterLogin')
        if (storedRedirect) {
          setRedirectTo(storedRedirect)
          // Clear it after reading
          sessionStorage.removeItem('redirectAfterLogin')
        }
      } catch (error) {
        console.error('Error accessing sessionStorage:', error)
      }
    }
  }, [searchParams, mounted])

  // If already authenticated, redirect to the intended page
  useEffect(() => {
    if (!mounted) return
    
    if (isAuthenticated && !authLoading) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, authLoading, router, redirectTo, mounted])

  // Clear any stored redirect on mount if on login page
  useEffect(() => {
    if (!mounted) return
    
    try {
      const storedRedirect = sessionStorage.getItem('redirectAfterLogin')
      if (storedRedirect === '/login') {
        sessionStorage.removeItem('redirectAfterLogin')
      }
    } catch (error) {
      console.error('Error accessing sessionStorage:', error)
    }
  }, [mounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      // The useEffect above will handle the redirect after authentication
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Don't render anything during SSR to prevent hydration mismatches
  if (!mounted) {
    return null
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center 
        bg-linear-to-br from-[#005478] to-[#58595B] px-4 py-12"
      >
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/20 text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center 
      bg-linear-to-br from-[#005478] to-[#58595B] px-4 py-12"
    >
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl space-y-8 border border-white/20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="text-white/70 text-sm mt-2">Sign in to your account</p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <input
              type="email"
              placeholder="Email address"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg bg-white/90 
              placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#005478] text-gray-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-lg bg-white/90 
              placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#005478] text-gray-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-100 text-center text-sm">{error}</p>
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
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="text-center space-y-2">
            <Link
              href="/register"
              className="text-sm font-medium text-white hover:text-white/80 transition-colors block"
            >
              Don&apos;t have an account? Sign up
            </Link>
            {/*<Link
              href="/forgot-password"
              className="text-xs text-white/70 hover:text-white transition-colors block"
            >
              Forgot your password?
            </Link>*/}
          </div>
        </form>
      </div>
    </div>
  )
}