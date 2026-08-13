'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, JSX, useMemo, useRef } from 'react'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'
import { LogOut, PanelLeftClose, PanelLeftOpen, UserCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

// Define menu items with their required permissions
interface MenuItem {
  name: string
  href: string
  icon: JSX.Element
  requiredPermissions?: string[] // If any of these permissions are present, show the item
  requiredRole?: string[] // If user has any of these roles, show the item
  requiresManagedUser?: boolean // Show only for managed users
  hideForManagedUser?: boolean // Hide for managed users
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const autoCollapseTimer = useRef<number | null>(null)
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
    canManageRoles
  } = useGlobalPermissions()

  const sidebarStorageKey = user?.id ? `interpark.sidebar.${user.id}` : null

  useEffect(() => {
    if (!sidebarStorageKey) return
    const saved = localStorage.getItem(`${sidebarStorageKey}.collapsed`)
    const autoCollapsed = localStorage.getItem(`${sidebarStorageKey}.autoCollapsed`) === 'true'
    const manuallySet = localStorage.getItem(`${sidebarStorageKey}.manual`) === 'true'

    setIsCollapsed(saved === 'true')
    if (saved !== null || autoCollapsed || manuallySet) return

    autoCollapseTimer.current = window.setTimeout(() => {
      setIsCollapsed(true)
      localStorage.setItem(`${sidebarStorageKey}.collapsed`, 'true')
      localStorage.setItem(`${sidebarStorageKey}.autoCollapsed`, 'true')
    }, 3000)
    return () => {
      if (autoCollapseTimer.current !== null) window.clearTimeout(autoCollapseTimer.current)
      autoCollapseTimer.current = null
    }
  }, [sidebarStorageKey])

  // Define all possible menu items with their access requirements
  const allMenuItems: MenuItem[] = useMemo(() => [
    {
      name: 'Dashboard', 
      href: '/dashboard',
      requiredRole: ['ADMIN', 'MANAGER', 'USER'], // Everyone
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Analytics',
      href: '/analytics',
      requiredPermissions: ['VIEW_PAYMENT_REPORTS', 'VIEW_UNITS', 'VIEW_TENANTS'],
      requiredRole: ['ADMIN', 'MANAGER', 'USER'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V9m5 10V5m5 14v-7m5 7V3M3 19h18" />
        </svg>
      )
    },
    { 
      name: 'Properties', 
      href: '/properties',
      requiredPermissions: ['VIEW_PROPERTIES'],
      requiredRole: ['ADMIN', 'MANAGER', 'USER'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      name: 'Employees Info', 
      href: '/employees',
      requiredRole: ['ADMIN', 'MANAGER'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      name: 'My Income', 
      href: '/myIncome',
      requiredPermissions: ['VIEW_COMMISSIONS'],
      requiredRole: ['ADMIN', 'MANAGER'],
      hideForManagedUser: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      name: 'Leads', 
      href: '/leads',
      requiredPermissions: ['VIEW_LEADS'],
      requiredRole: ['ADMIN', 'MANAGER', 'USER'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      name: 'Landlords', 
      href: '/landlords',
      requiredPermissions: ['VIEW_LANDLORDS'],
      requiredRole: ['ADMIN', 'MANAGER', 'USER'],
      hideForManagedUser: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      name: 'Offers', 
      href: '/offers',
      requiredPermissions: ['VIEW_OFFER_LETTERS'],
      requiredRole: ['ADMIN', 'MANAGER', 'USER'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v10a2 2 0 01-2 2z"
          />
        </svg>
      )
    },
    { 
      name: 'To-Dos', 
      href: '/todos',
      requiredRole: ['ADMIN', 'MANAGER', 'USER'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    { 
      name: 'News', 
      href: '/news',
      requiredRole: ['ADMIN', 'MANAGER', 'USER'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v12m0-12a2 2 0 012-2h2a2 2 0 012 2M9 6a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H9m0 0h6" />
        </svg>
      )
    },
  ], [])

  // Admin/Manager only menu items
  const adminManagerItems: MenuItem[] = useMemo(() => [
    { 
      name: 'User Management', 
      href: '/users',
      requiredPermissions: ['MANAGE_USERS'],
      requiredRole: ['ADMIN', 'MANAGER'],
      hideForManagedUser: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      name: 'Create Custom Role & User', 
      href: '/roles/create',
      requiredPermissions: ['MANAGE_ROLES', 'MANAGE_USERS'],
      requiredRole: ['ADMIN', 'MANAGER'],
      hideForManagedUser: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    { 
      name: 'Role Management', 
      href: '/roles',
      requiredPermissions: ['MANAGE_ROLES'],
      requiredRole: ['ADMIN', 'MANAGER'],
      hideForManagedUser: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
  ], [])

  // Check if a menu item should be shown using the global permissions
  const shouldShowItem = (item: MenuItem): boolean => {
    // First, check managed user restrictions
    if (isManagedUser && item.hideForManagedUser) {
      return false
    }

    // Check role-based access
    if (item.requiredRole) {
      const hasRequiredRole = item.requiredRole.some(role => {
        if (role === 'ADMIN') return isAdmin
        if (role === 'MANAGER') return isManager
        if (role === 'USER') return isManagedUser || (!isAdmin && !isManager)
        return false
      })
      if (!hasRequiredRole) return false
    }

    // For ADMIN and MANAGER, they have full access to certain items regardless of permissions
    if (isAdmin || isManager) {
      // Only ADMIN and MANAGER specific items that should ALWAYS be visible to them
      const adminManagerAlwaysVisible = [
        'User Management', 
        'Create Custom Role & User', 
        'Role Management'
      ]
      if (adminManagerAlwaysVisible.includes(item.name)) {
        return true
      }
    }

    // Check permission-based access for all users (including managed users)
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      // Build permission map dynamically from the permissions object
      const hasRequiredPermission = item.requiredPermissions.some(perm => {
        // Map the permission to the actual value from usePermissions
        switch(perm) {
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
      
      if (!hasRequiredPermission) return false
    }

    return true
  }

  // Filter menu items based on access - memoized for performance
  const visibleMenuItems = useMemo(() => 
    allMenuItems.filter(shouldShowItem), 
    [allMenuItems, isManagedUser, isAdmin, isManager, canViewProperties, canViewLeads, canViewLandlords, canViewOffers, permissions?.employees?.canView, permissions?.payments?.canView, permissions?.units?.canView, permissions?.tenants?.canView]
  )
  
  const visibleAdminManagerItems = useMemo(() => 
    adminManagerItems.filter(shouldShowItem), 
    [adminManagerItems, isManagedUser, isAdmin, isManager, canManageUsers, canManageRoles]
  )

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const closeSidebar = () => {
    setIsOpen(false)
  }

  const toggleDesktopSidebar = () => {
    if (!sidebarStorageKey) return
    if (autoCollapseTimer.current !== null) {
      window.clearTimeout(autoCollapseTimer.current)
      autoCollapseTimer.current = null
    }
    setIsCollapsed(current => {
      const next = !current
      localStorage.setItem(`${sidebarStorageKey}.collapsed`, String(next))
      localStorage.setItem(`${sidebarStorageKey}.manual`, 'true')
      return next
    })
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  return (
    <>
      {/* Hamburger Menu Button - Morphs to X when sidebar is open */}
      <button
        onClick={toggleSidebar}
        className={`md:hidden fixed top-4 left-4 z-60 p-2.5 rounded-xl shadow-lg transition-all duration-200 border ${
          isOpen 
            ? 'bg-white border-gray-200 hover:bg-gray-100' 
            : 'bg-[#005478] border-[#0078a3] hover:bg-[#0078a3]'
        }`}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <div className="w-6 h-5 flex flex-col justify-between relative">
          <span
            className={`block h-0.5 w-full transform transition-all duration-300 ease-in-out ${
              isOpen ? 'bg-slate-900 rotate-45 translate-y-2.25' : 'bg-white'
            }`}
          />
          <span
            className={`block h-0.5 w-full transition-all duration-300 ease-in-out ${
              isOpen ? 'opacity-0' : 'opacity-100 bg-white'
            }`}
          />
          <span
            className={`block h-0.5 w-full transform transition-all duration-300 ease-in-out ${
              isOpen ? 'bg-slate-900 -rotate-45 -translate-y-2.25' : 'bg-white'
            }`}
          />
        </div>
      </button>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-in-out z-40 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside
        className={`bg-slate-900 text-white w-64 flex flex-col fixed inset-y-0 left-0 transform transition-[width,transform] duration-300 ease-in-out z-50 shadow-2xl border-r border-slate-700/50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        <div className={`shrink-0 border-b border-slate-700/80 bg-slate-900 p-3 ${isCollapsed ? 'md:px-2' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'md:flex-col' : ''}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-[#005478] to-[#00a3d7] shadow-lg" title="Interpark" aria-label="Interpark logo">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2 4 14h7l-1 8 10-13h-7V2Z" />
              </svg>
            </div>
            <div className={`min-w-0 flex-1 ${isCollapsed ? 'md:hidden' : ''}`}>
              <p className="truncate text-base font-bold tracking-[0.16em] text-white">INTERPARK</p>
            </div>
          </div>

          <div className={`mt-4 flex items-center gap-3 ${isCollapsed ? 'md:mt-3 md:flex-col' : ''}`}>
            <UserCircle className="h-8 w-8 shrink-0 text-sky-300" aria-hidden="true" />
            <div className={`min-w-0 flex-1 ${isCollapsed ? 'md:hidden' : ''}`}>
              <p className="truncate text-sm font-semibold text-white" title={user?.name}>{user?.name || 'User'}</p>
              <p className="truncate text-xs text-slate-400">{isAdmin ? 'Administrator' : isManager ? 'Manager' : isManagedUser ? 'Managed User' : user?.role}</p>
            </div>
          </div>

          <div className={`mt-3 flex gap-2 ${isCollapsed ? 'md:flex-col md:items-center' : ''}`}>
            <button type="button" onClick={handleLogout} className={`inline-flex items-center rounded-lg text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-400 ${isCollapsed ? 'md:h-10 md:w-10 md:justify-center md:p-0' : 'flex-1 gap-2 px-3 py-2'}`} aria-label="Logout" title={isCollapsed ? 'Logout' : undefined}>
              <LogOut className="h-5 w-5 shrink-0" /><span className={isCollapsed ? 'md:hidden' : ''}>Logout</span>
            </button>
            <button type="button" onClick={toggleDesktopSidebar} className={`hidden items-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-400 md:inline-flex ${isCollapsed ? 'h-10 w-10 justify-center' : 'px-3 py-2'}`} aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto">
          <nav className="space-y-1 px-2 py-4">
            {visibleMenuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  aria-label={item.name}
                  title={isCollapsed ? item.name : undefined}
                  className={`group flex items-center py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isCollapsed ? 'md:justify-center md:px-2' : 'px-4'} ${
                    isActive
                      ? 'bg-linear-to-r from-[#005478] to-[#0078a3] text-white shadow-lg shadow-sky-900/40 border border-sky-500/30'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <div
                    className={`shrink-0 transition-all duration-200 ${isCollapsed ? 'md:mr-0' : 'mr-3'} ${
                      isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-white group-hover:scale-110'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className={`flex-1 font-semibold tracking-wide ${isCollapsed ? 'md:hidden' : ''}`}>{item.name}</span>

                  {/* Active indicator */}
                  {isActive && (
                    <div className={`w-2 h-2 bg-white rounded-full ml-2 animate-pulse shadow-sm ${isCollapsed ? 'md:hidden' : ''}`} />
                  )}
                </Link>
              )
            })}

            {/* Admin/Manager Section - Only show if there are items and user has admin/manager role */}
            {(isAdmin || isManager) && visibleAdminManagerItems.length > 0 && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700/80"></div>
                  </div>
                  <div className={`relative justify-center ${isCollapsed ? 'md:hidden' : 'flex'}`}>
                    <span className="px-3 bg-slate-900 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Administration
                    </span>
                  </div>
                </div>
                
                {visibleAdminManagerItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      aria-label={item.name}
                      title={isCollapsed ? item.name : undefined}
                      className={`group flex items-center py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isCollapsed ? 'md:justify-center md:px-2' : 'px-4'} ${
                        isActive
                          ? 'bg-linear-to-r from-[#005478] to-[#0078a3] text-white shadow-lg shadow-sky-900/40 border border-sky-500/30'
                          : 'text-slate-200 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-600/50'
                      }`}
                    >
                      <div
                        className={`shrink-0 transition-all duration-200 ${isCollapsed ? 'md:mr-0' : 'mr-3'} ${
                          isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-white group-hover:scale-110'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <span className={`flex-1 font-semibold tracking-wide ${isCollapsed ? 'md:hidden' : ''}`}>{item.name}</span>

                      {/* Active indicator */}
                      {isActive && (
                        <div className={`w-2 h-2 bg-white rounded-full ml-2 animate-pulse shadow-sm ${isCollapsed ? 'md:hidden' : ''}`} />
                      )}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>
        </div>
      </aside>
    </>
  )
}