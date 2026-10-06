'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  BadgeDollarSign,
  BarChart3,
  Building2,
  Contact,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UserRoundPlus,
  UserRoundSearch,
  Users,
  UsersRound,
  X,
} from 'lucide-react'
import { useMemo } from 'react'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

interface MenuItem {
  name: string
  href: string
  icon: LucideIcon
  requiredPermissions?: string[]
  requiredRole?: string[]
  hideForManagedUser?: boolean
}

interface AppSidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onDesktopToggle: () => void
  onMobileClose: () => void
}

const mainItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, requiredRole: ['ADMIN', 'MANAGER', 'USER'] },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, requiredPermissions: ['VIEW_PAYMENT_REPORTS', 'VIEW_UNITS', 'VIEW_TENANTS'], requiredRole: ['ADMIN', 'MANAGER', 'USER'] },
  { name: 'Properties', href: '/properties', icon: Building2, requiredPermissions: ['VIEW_PROPERTIES'], requiredRole: ['ADMIN', 'MANAGER', 'USER'] },
  { name: 'Employees Info', href: '/employees', icon: UsersRound, requiredRole: ['ADMIN', 'MANAGER'] },
  { name: 'My Income', href: '/myIncome', icon: BadgeDollarSign, requiredPermissions: ['VIEW_COMMISSIONS'], requiredRole: ['ADMIN', 'MANAGER'], hideForManagedUser: true },
  { name: 'Leads', href: '/leads', icon: UserRoundSearch, requiredPermissions: ['VIEW_LEADS'], requiredRole: ['ADMIN', 'MANAGER', 'USER'] },
  { name: 'Landlords', href: '/landlords', icon: Contact, requiredPermissions: ['VIEW_LANDLORDS'], requiredRole: ['ADMIN', 'MANAGER', 'USER'], hideForManagedUser: true },
  { name: 'Offers', href: '/offers', icon: FileText, requiredPermissions: ['VIEW_OFFER_LETTERS'], requiredRole: ['ADMIN', 'MANAGER', 'USER'] },
  { name: 'To-Dos', href: '/todos', icon: ListChecks, requiredRole: ['ADMIN', 'MANAGER', 'USER'] },
  { name: 'News', href: '/news', icon: Newspaper, requiredRole: ['ADMIN', 'MANAGER', 'USER'] },
]

const administrationItems: MenuItem[] = [
  { name: 'User Management', href: '/users', icon: Users, requiredPermissions: ['MANAGE_USERS'], requiredRole: ['ADMIN', 'MANAGER'], hideForManagedUser: true },
  { name: 'Create Custom Role & User', href: '/roles/create', icon: UserRoundPlus, requiredPermissions: ['MANAGE_ROLES', 'MANAGE_USERS'], requiredRole: ['ADMIN', 'MANAGER'], hideForManagedUser: true },
  { name: 'Role Management', href: '/roles', icon: ShieldCheck, requiredPermissions: ['MANAGE_ROLES'], requiredRole: ['ADMIN', 'MANAGER'], hideForManagedUser: true },
]

export default function AppSidebar({ collapsed, mobileOpen, onDesktopToggle, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const {
    permissions,
    isAdmin,
    isManager,
    isManagedUser,
    user,
    canViewProperties,
    canViewLeads,
    canViewLandlords,
    canViewOffers,
    canManageUsers,
    canManageRoles,
  } = useGlobalPermissions()

  const visibleItems = useMemo(() => {
    const shouldShowItem = (item: MenuItem) => {
      if (isManagedUser && item.hideForManagedUser) return false

      if (item.requiredRole) {
        const hasRequiredRole = item.requiredRole.some((role) => {
          if (role === 'ADMIN') return isAdmin
          if (role === 'MANAGER') return isManager
          if (role === 'USER') return isManagedUser || (!isAdmin && !isManager)
          return false
        })
        if (!hasRequiredRole) return false
      }

      if ((isAdmin || isManager) && administrationItems.some(({ name }) => name === item.name)) {
        return true
      }

      if (!item.requiredPermissions?.length) return true

      return item.requiredPermissions.some((permission) => {
        switch (permission) {
          case 'VIEW_PROPERTIES':
            return canViewProperties
          case 'VIEW_LEADS':
          case 'MANAGE_LEADS':
            return canViewLeads
          case 'VIEW_LANDLORDS':
          case 'MANAGE_LANDLORDS':
            return canViewLandlords
          case 'VIEW_OFFER_LETTERS':
            return canViewOffers
          case 'VIEW_COMMISSIONS':
          case 'VIEW_EMPLOYEES':
            return permissions?.employees?.canView || false
          case 'VIEW_PAYMENT_REPORTS':
            return isAdmin || isManager || permissions?.payments?.canView || false
          case 'VIEW_UNITS':
            return isAdmin || isManager || permissions?.units?.canView || false
          case 'VIEW_TENANTS':
            return isAdmin || isManager || permissions?.tenants?.canView || false
          case 'MANAGE_USERS':
            return canManageUsers
          case 'MANAGE_ROLES':
            return canManageRoles
          default:
            return false
        }
      })
    }

    return {
      main: mainItems.filter(shouldShowItem),
      administration: administrationItems.filter(shouldShowItem),
    }
  }, [
    canManageRoles,
    canManageUsers,
    canViewLandlords,
    canViewLeads,
    canViewOffers,
    canViewProperties,
    isAdmin,
    isManagedUser,
    isManager,
    permissions,
  ])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  const roleLabel = isAdmin
    ? 'Administrator'
    : isManager
      ? 'Manager'
      : isManagedUser
        ? 'Managed User'
        : user?.role || 'User'

  const renderItems = (items: MenuItem[]) => items.map((item) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
    const Icon = item.icon

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={onMobileClose}
        aria-current={isActive ? 'page' : undefined}
        aria-label={collapsed ? item.name : undefined}
        title={collapsed ? item.name : undefined}
        className={cn(
          'group flex min-h-9 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive && 'bg-sidebar-active text-sidebar-active-foreground',
          collapsed && 'md:justify-center md:px-2',
        )}
      >
        <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
        <span className={cn('truncate', collapsed && 'md:hidden')}>{item.name}</span>
      </Link>
    )
  })

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onMobileClose}
        className={cn(
          'fixed inset-0 z-40 bg-black/45 transition-opacity md:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-dvh w-64 min-h-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-200 md:relative md:z-auto md:shrink-0 md:translate-x-0 md:shadow-none md:transition-[width]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'md:w-16' : 'md:w-64',
        )}
      >
        <div className={cn('relative flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-3', collapsed && 'md:justify-center md:px-2')}>
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            className={cn('flex min-w-0 flex-1 items-center', collapsed && 'md:flex-none')}
            aria-label="Interpark dashboard"
          >
            <span className={cn('flex items-center', collapsed && 'md:hidden')}>
              <Image
                src="/brand/interpark-logo-light.svg"
                alt="Interpark Enterprises"
                width={109}
                height={29}
                priority
                className="h-auto w-40 object-contain dark:hidden"
              />
              <Image
                src="/brand/interpark-logo-dark.svg"
                alt="Interpark Enterprises"
                width={109}
                height={29}
                priority
                className="hidden h-auto w-40 object-contain dark:block"
              />
            </span>
            {collapsed && (
              <div className="hidden h-8 w-8 overflow-hidden md:block" aria-hidden="true">
                <Image
                  src="/brand/interpark-logo-light.svg"
                  alt=""
                  width={109}
                  height={29}
                  className="h-8 w-auto max-w-none dark:hidden"
                />
                <Image
                  src="/brand/interpark-logo-dark.svg"
                  alt=""
                  width={109}
                  height={29}
                  className="hidden h-8 w-auto max-w-none dark:block"
                />
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={onDesktopToggle}
            className={cn(
              'hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex',
              collapsed && 'absolute -right-3 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border border-sidebar-border bg-sidebar shadow-xs',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden="true" /> : <PanelLeftClose className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="sidebar-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-3">
          <nav aria-label="Main navigation" className="space-y-1">
            {renderItems(visibleItems.main)}
          </nav>
        </div>

        {visibleItems.administration.length > 0 && (
          <div className="shrink-0 border-t border-sidebar-border px-2 py-3">
            <p className={cn('mb-2 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground', collapsed && 'md:sr-only')}>
              Administration
            </p>
            <nav aria-label="Administration" className="space-y-1">
              {renderItems(visibleItems.administration)}
            </nav>
          </div>
        )}

        <div className="shrink-0 border-t border-sidebar-border p-2">
          <div className={cn('flex items-center gap-3 rounded-md px-2 py-2', collapsed && 'md:justify-center md:px-0')}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground" aria-hidden="true">
              {(user?.name || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
              <p className="truncate text-sm font-medium text-foreground">{user?.name || 'User'}</p>
              <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                collapsed && 'md:hidden',
              )}
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          {collapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="hidden h-9 w-full items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
