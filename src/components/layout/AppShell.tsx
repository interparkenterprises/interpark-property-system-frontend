'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import { BreadcrumbProvider } from './BreadcrumbContext'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const sidebarStorageKey = user?.id ? `interpark.sidebar.${user.id}.collapsed` : null

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [])

  useEffect(() => {
    if (!sidebarStorageKey) return
    const frame = window.requestAnimationFrame(() => {
      const legacyBaseKey = sidebarStorageKey.replace(/\.collapsed$/, '')
      const wasAutoCollapsed = localStorage.getItem(`${legacyBaseKey}.autoCollapsed`) === 'true'
      const wasManuallySet = localStorage.getItem(`${legacyBaseKey}.manual`) === 'true'

      if (wasAutoCollapsed && !wasManuallySet) {
        localStorage.removeItem(sidebarStorageKey)
        localStorage.removeItem(`${legacyBaseKey}.autoCollapsed`)
        setCollapsed(false)
        return
      }

      setCollapsed(localStorage.getItem(sidebarStorageKey) === 'true')
    })
    return () => window.cancelAnimationFrame(frame)
  }, [sidebarStorageKey])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMobileOpen(false))
    return () => window.cancelAnimationFrame(frame)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [mobileOpen])

  const toggleDesktopSidebar = () => {
    setCollapsed((current) => {
      const next = !current
      if (sidebarStorageKey) {
        const legacyBaseKey = sidebarStorageKey.replace(/\.collapsed$/, '')
        localStorage.setItem(sidebarStorageKey, String(next))
        localStorage.setItem(`${legacyBaseKey}.manual`, 'true')
        localStorage.removeItem(`${legacyBaseKey}.autoCollapsed`)
      }
      return next
    })
  }

  return (
    <BreadcrumbProvider>
      <div className="flex h-dvh min-h-0 min-w-0 overflow-hidden bg-background text-foreground">
        <AppSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onDesktopToggle={toggleDesktopSidebar}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AppHeader
            onMobileOpen={() => setMobileOpen(true)}
            userName={user?.name}
          />
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background">
            <div className="mx-auto w-full max-w-400 min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  )
}
