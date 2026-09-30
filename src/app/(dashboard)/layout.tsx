'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AppShell from '@/components/layout/AppShell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, refreshUserData } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const hasRefreshed = useRef(false)
  const isRedirecting = useRef(false)

  // Handle authentication check - only redirect once
  useEffect(() => {
    // Don't redirect while still loading or if already redirecting
    if (!isLoading && !isRedirecting.current) {
      if (!isAuthenticated) {
        isRedirecting.current = true
        // Store the attempted URL to redirect back after login
        sessionStorage.setItem('redirectAfterLogin', pathname)
        router.push('/login')
      } else {
        isRedirecting.current = false
      }
    }
  }, [isLoading, isAuthenticated, router, pathname])

  // Refresh user data only once after initial load, not on every route change
  useEffect(() => {
    if (isAuthenticated && !isLoading && !hasRefreshed.current) {
      hasRefreshed.current = true
      refreshUserData()
    }
  }, [isAuthenticated, isLoading, refreshUserData])

  // Show proper loading state
  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return <AppShell>{children}</AppShell>
}
