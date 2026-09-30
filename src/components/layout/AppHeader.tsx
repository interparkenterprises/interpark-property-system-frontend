'use client'

import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

interface AppHeaderProps {
  collapsed: boolean
  onDesktopToggle: () => void
  onMobileOpen: () => void
  userName?: string
}

const sectionNames: Record<string, string> = {
  analytics: 'Analytics',
  dashboard: 'Dashboard',
  employees: 'Employees',
  landlords: 'Landlords',
  leads: 'Leads',
  myIncome: 'My Income',
  news: 'News',
  offers: 'Offers',
  payments: 'Payments',
  properties: 'Properties',
  roles: 'Roles',
  todos: 'To-Dos',
  users: 'Users',
}

export default function AppHeader({
  collapsed,
  onDesktopToggle,
  onMobileOpen,
  userName,
}: AppHeaderProps) {
  const pathname = usePathname()
  const firstSegment = pathname.split('/').filter(Boolean)[0] ?? 'dashboard'
  const sectionName = sectionNames[firstSegment] ?? 'Workspace'

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3 text-card-foreground sm:px-4">
      <button
        type="button"
        onClick={onMobileOpen}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={onDesktopToggle}
        className="hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{sectionName}</p>
      </div>

      {userName && (
        <span className="hidden max-w-48 truncate text-sm text-muted-foreground sm:block">
          {userName}
        </span>
      )}
      <ThemeToggle />
    </header>
  )
}
