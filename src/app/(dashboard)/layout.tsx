'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user, refreshUserData } = useAuth()
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
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005478] mx-auto"></div>
          <p className="mt-4 text-white">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-900">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}