'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, JSX, useMemo } from 'react'
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider'

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
  const [isOpen, setIsOpen] = useState(false)
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
    canViewIncome,
    canManageUsers,
    canManageRoles
  } = useGlobalPermissions()

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
    // ADD EMPLOYEES MENU ITEM HERE
    { 
      name: 'Employees Info', 
      href: '/employees',
      requiredPermissions: ['VIEW_EMPLOYEES'],
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
      requiredPermissions: ['VIEW_COMMISSIONS', 'VIEW_TENANT_FINANCIALS'],
      requiredRole: ['ADMIN', 'MANAGER'],
      hideForManagedUser: true, // Hide for managed users (they don't have income)
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      name: 'Leads', 
      href: '/leads',
      requiredPermissions: ['VIEW_LEADS', 'MANAGE_LEADS'],
      requiredRole: ['ADMIN', 'MANAGER', 'USER'],
      // REMOVED hideForManagedUser: true - managed users can see if they have permissions
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      name: 'Landlords', 
      href: '/landlords',
      requiredPermissions: ['VIEW_LANDLORDS', 'MANAGE_LANDLORDS'],
      requiredRole: ['ADMIN', 'MANAGER', 'USER'],
      hideForManagedUser: true, // Keep hidden for managed users based on your business logic
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

    // For ADMIN and MANAGER, they have full access to Leads, Landlords, and My Income
    if (isAdmin || isManager) {
      // These items are always visible to ADMIN and MANAGER regardless of specific permissions
      const adminManagerAlwaysVisible = ['Leads', 'Landlords', 'My Income', 'Employees Info','User Management', 'Create Custom Role & User', 'Role Management']
      if (adminManagerAlwaysVisible.includes(item.name)) {
        return true
      }
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

    // Check permission-based access for all users
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      // Map menu items to their corresponding permission checks
      const permissionMap: Record<string, boolean> = {
        'VIEW_PROPERTIES': canViewProperties,
        'VIEW_LEADS': canViewLeads,
        'MANAGE_LEADS': canViewLeads,
        'VIEW_LANDLORDS': canViewLandlords,
        'MANAGE_LANDLORDS': canViewLandlords,
        'VIEW_OFFER_LETTERS': canViewOffers,
        'VIEW_COMMISSIONS': canViewIncome,
        'VIEW_TENANT_FINANCIALS': canViewIncome,
        'VIEW_EMPLOYEES': permissions?.employees?.canView || false, 
        'MANAGE_USERS': canManageUsers,
        'MANAGE_ROLES': canManageRoles,
      }
      
      // Check if any of the required permissions are granted
      const hasRequiredPermission = item.requiredPermissions.some(perm => 
        permissionMap[perm] === true
      )
      
      if (!hasRequiredPermission) return false
    }

    return true
  }

  // Filter menu items based on access - memoized for performance
  const visibleMenuItems = useMemo(() => 
    allMenuItems.filter(shouldShowItem), 
    [allMenuItems, isManagedUser, isAdmin, isManager, canViewProperties, canViewLeads, canViewLandlords, canViewOffers, canViewIncome, permissions?.employees?.canView]
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
              isOpen ? 'bg-slate-900 rotate-45 translate-y-[9px]' : 'bg-white'
            }`}
          />
          <span
            className={`block h-0.5 w-full transition-all duration-300 ease-in-out ${
              isOpen ? 'opacity-0' : 'opacity-100 bg-white'
            }`}
          />
          <span
            className={`block h-0.5 w-full transform transition-all duration-300 ease-in-out ${
              isOpen ? 'bg-slate-900 -rotate-45 -translate-y-[9px]' : 'bg-white'
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
      <div
        className={`bg-slate-900 text-white w-64 flex flex-col fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out z-50 shadow-2xl border-r border-slate-700/50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        {/* Logo/Brand Area - Fixed Header */}
        <div className="shrink-0 px-4 py-4 border-b border-slate-700/80 bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-linear-to-r from-[#005478] to-[#00a3d7] rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide drop-shadow-sm">INTERPARK</h1>
          </div>
          {/* User Role Badge */}
          {user && (
            <div className="mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-linear-to-r from-[#005478] to-[#0078a3] text-white shadow-md border border-sky-500/30">
                {isAdmin ? 'Administrator' : isManager ? 'Manager' : isManagedUser ? 'Managed User' : user.role}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto">
          <nav className="space-y-1 px-2 py-4">
            {visibleMenuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-linear-to-r from-[#005478] to-[#0078a3] text-white shadow-lg shadow-sky-900/40 border border-sky-500/30'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <div
                    className={`mr-3 transition-all duration-200 ${
                      isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-white group-hover:scale-110'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className="flex-1 font-semibold tracking-wide">{item.name}</span>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full ml-2 animate-pulse shadow-sm" />
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
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-slate-900 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Administration
                    </span>
                  </div>
                </div>
                
                {visibleAdminManagerItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-linear-to-r from-[#005478] to-[#0078a3] text-white shadow-lg shadow-sky-900/40 border border-sky-500/30'
                          : 'text-slate-200 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-600/50'
                      }`}
                    >
                      <div
                        className={`mr-3 transition-all duration-200 ${
                          isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-white group-hover:scale-110'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <span className="flex-1 font-semibold tracking-wide">{item.name}</span>

                      {/* Active indicator */}
                      {isActive && (
                        <div className="w-2 h-2 bg-white rounded-full ml-2 animate-pulse shadow-sm" />
                      )}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>
        </div>
      </div>
    </>
  )
}