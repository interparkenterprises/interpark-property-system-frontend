// components/layout/Header.tsx
'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
  const router = useRouter()
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      // The logout function already handles redirect, but we can add a fallback
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback redirect
      router.push('/login')
    }
  }

  return (
    <header className="bg-white shadow">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Spacer div that matches hamburger menu width on mobile */}
        <div className="md:hidden w-14"></div>
        
        {/* Centered header title on mobile, left-aligned on desktop */}
        <h1 className="text-xl font-semibold text-gray-800 md:text-left text-center flex-1 md:flex-none">
          Property Management
        </h1>

        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user.name}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}