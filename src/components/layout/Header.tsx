'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react' // <-- IMPORT ICON

export default function Header() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
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

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}