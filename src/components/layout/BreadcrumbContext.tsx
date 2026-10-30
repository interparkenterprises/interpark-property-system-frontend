'use client'

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react'

export interface BreadcrumbOverride {
  label?: string | null
  href?: string
}

interface BreadcrumbRegistration {
  path?: string
  override?: BreadcrumbOverride
  action?: string | null
  trail?: BreadcrumbOverride[]
  trailRoot?: string
  backHref?: string
}

interface BreadcrumbContextValue {
  overrides: Record<string, BreadcrumbOverride>
  action: string | null
  trail: BreadcrumbOverride[]
  trailRoot: string | null
  backHref: string | null
  register: (id: string, registration: BreadcrumbRegistration) => void
  unregister: (id: string) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [registrations, setRegistrations] = useState<Record<string, BreadcrumbRegistration>>({})

  const register = useCallback((id: string, registration: BreadcrumbRegistration) => {
    setRegistrations(current => ({ ...current, [id]: registration }))
  }, [])

  const unregister = useCallback((id: string) => {
    setRegistrations(current => {
      if (!(id in current)) return current
      const next = { ...current }
      delete next[id]
      return next
    })
  }, [])

  const value = useMemo<BreadcrumbContextValue>(() => {
    const overrides: Record<string, BreadcrumbOverride> = {}
    let action: string | null = null
    let trail: BreadcrumbOverride[] = []
    let trailRoot: string | null = null
    let backHref: string | null = null
    Object.values(registrations).forEach(registration => {
      if (registration.path && registration.override) overrides[registration.path] = registration.override
      if (registration.action) action = registration.action
      if (registration.trail?.length) trail = [...trail, ...registration.trail]
      if (registration.trailRoot) trailRoot = registration.trailRoot
      if (registration.backHref) backHref = registration.backHref
    })
    return { overrides, action, trail, trailRoot, backHref, register, unregister }
  }, [register, registrations, unregister])

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
}

export function useBreadcrumbOverride(path: string, label?: string | null, href?: string) {
  const context = useContext(BreadcrumbContext)
  const id = useId()
  const register = context?.register
  const unregister = context?.unregister

  useEffect(() => {
    if (!register || !unregister || !path || !label) return
    register(id, { path, override: { label, href } })
    return () => unregister(id)
  }, [href, id, label, path, register, unregister])
}

export function useBreadcrumbAction(action?: string | null) {
  const context = useContext(BreadcrumbContext)
  const id = useId()
  const register = context?.register
  const unregister = context?.unregister

  useEffect(() => {
    if (!register || !unregister || !action) return
    register(id, { action })
    return () => unregister(id)
  }, [action, id, register, unregister])
}

export function useBreadcrumbTrail(label?: string | null, href?: string) {
  const context = useContext(BreadcrumbContext)
  const id = useId()
  const register = context?.register
  const unregister = context?.unregister

  useEffect(() => {
    if (!register || !unregister || !label) return
    register(id, { trail: [{ label, href }] })
    return () => unregister(id)
  }, [href, id, label, register, unregister])
}

export function useBreadcrumbRouteTrail(items: BreadcrumbOverride[], rootPath: string, backHref?: string) {
  const context = useContext(BreadcrumbContext)
  const id = useId()
  const register = context?.register
  const unregister = context?.unregister
  const serializedItems = JSON.stringify(items)
  const stableItems = useMemo<BreadcrumbOverride[]>(() => JSON.parse(serializedItems), [serializedItems])

  useEffect(() => {
    if (!register || !unregister || !rootPath || stableItems.length === 0) return
    register(id, { trail: stableItems, trailRoot: rootPath, backHref })
    return () => unregister(id)
  }, [backHref, id, register, rootPath, stableItems, unregister])
}

export function useBreadcrumbState() {
  const context = useContext(BreadcrumbContext)
  return context ?? { overrides: {}, action: null, trail: [], trailRoot: null, backHref: null }
}
