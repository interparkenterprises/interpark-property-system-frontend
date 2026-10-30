'use client'

import Link from 'next/link'
import { ArrowLeft, ChevronRight, Menu } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from './ThemeToggle'
import { useBreadcrumbState, type BreadcrumbOverride } from './BreadcrumbContext'

interface AppHeaderProps {
  onMobileOpen: () => void
  userName?: string
}

interface BreadcrumbItem {
  label: string
  href?: string
  path: string
}

const segmentLabels: Record<string, string> = {
  analytics: 'Analytics',
  bills: 'Bills',
  'bill-invoices': 'Bill Invoices',
  commissions: 'Commissions',
  components: 'Components',
  create: 'Create',
  'create-with-property': 'Create with Property',
  dashboard: 'Dashboard',
  'demand-letters': 'Demand Letters',
  details: 'Financial Details',
  due: 'Due for Payment',
  edit: 'Edit',
  employees: 'Employees',
  income: 'Income',
  invoices: 'Invoices',
  landlords: 'Landlords',
  leads: 'Leads',
  left: 'Former Tenants',
  myIncome: 'My Income',
  news: 'News',
  occupancy: 'Occupancy',
  offers: 'Offers',
  other: 'Other Income',
  'other-income': 'Other Income',
  payments: 'Payments',
  properties: 'Properties',
  rent: 'Rent',
  roles: 'Roles',
  'service-provider-detail': 'Service Provider',
  'service-providers': 'Service Providers',
  'tenant-details': 'Tenant Details',
  tenants: 'Tenants',
  todos: 'To-Dos',
  'unit-details': 'Unit Details',
  users: 'Users',
  workforce: 'Workforce',
}

const entityLabels: Record<string, string> = {
  employees: 'Employee',
  landlords: 'Landlord',
  leads: 'Lead',
  news: 'News Item',
  properties: 'Property',
  todos: 'To-Do',
}

const staticEntityChildren = new Set(['create', 'create-with-property', 'due'])

function isDynamicEntitySegment(segments: string[], index: number) {
  if (index === 1 && entityLabels[segments[0]] && !staticEntityChildren.has(segments[index])) {
    return true
  }

  return segments[0] === 'myIncome' && segments[1] === 'other' && index === 2
}

function looksLikeDatabaseId(segment: string) {
  return /^\d+$/.test(segment)
    || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment)
    || /^[0-9a-z]{20,}$/i.test(segment)
}

function formatSegment(segment: string) {
  return segment
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getBreadcrumbLabel(segments: string[], index: number) {
  const segment = segments[index]

  if (isDynamicEntitySegment(segments, index) || looksLikeDatabaseId(segment)) {
    if (index === 2 && segments[0] === 'myIncome') return 'Income'
    return entityLabels[segments[0]] ?? 'Record'
  }

  return segmentLabels[segment] ?? formatSegment(segment)
}

function buildBreadcrumbs(pathname: string, overrides: Record<string, BreadcrumbOverride>, trail: BreadcrumbOverride[], trailRoot: string | null, action: string | null): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
    return [{ label: 'Dashboard', path: '/dashboard' }]
  }

  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Dashboard', href: '/dashboard', path: '/dashboard' }]

  segments.forEach((segment, index) => {
    if (index === 0 && segment === 'dashboard') return

    const path = `/${segments.slice(0, index + 1).join('/')}`
    if (trailRoot && path.length > trailRoot.length && path.startsWith(`${trailRoot}/`)) return
    const override = overrides[path]
    const isCurrent = index === segments.length - 1 && !trail.length && !action
    breadcrumbs.push({
      label: override?.label || getBreadcrumbLabel(segments, index),
      href: isCurrent ? undefined : (override?.href || path),
      path,
    })
  })

  trail.forEach((item, index) => {
    const isCurrent = index === trail.length - 1 && !action
    breadcrumbs.push({
      label: item.label || 'Record details',
      href: isCurrent ? undefined : item.href,
      path: `${pathname}#breadcrumb-${index}`,
    })
  })

  if (action) breadcrumbs.push({ label: action, path: pathname })

  return breadcrumbs
}

export default function AppHeader({ onMobileOpen, userName }: AppHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { overrides, trail, trailRoot, backHref, action } = useBreadcrumbState()
  const breadcrumbs = buildBreadcrumbs(pathname, overrides, trail, trailRoot, action)

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-3 text-card-foreground sm:gap-3 sm:px-4">
      <button
        type="button"
        onClick={onMobileOpen}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => backHref ? router.push(backHref) : router.back()}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Go back"
        title="Go back"
      >
        <ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1 overflow-hidden">
        <ol className="flex min-w-0 items-center gap-1 whitespace-nowrap text-sm sm:gap-1.5">
          {breadcrumbs.map((breadcrumb, index) => {
            const isCurrent = index === breadcrumbs.length - 1
            const hideOnMobile = !isCurrent

            return (
              <li
                key={`${breadcrumb.path}-${index}`}
                className={`min-w-0 items-center gap-1 sm:gap-1.5 ${hideOnMobile ? 'hidden sm:flex' : 'flex'}`}
              >
                {index > 0 && (
                  <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/70 sm:block" aria-hidden="true" />
                )}
                {breadcrumb.href ? (
                  <Link
                    href={breadcrumb.href}
                    className="max-w-40 truncate text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {breadcrumb.label}
                  </Link>
                ) : (
                  <span
                    className="max-w-48 truncate font-semibold text-foreground sm:max-w-64"
                    aria-current="page"
                  >
                    {breadcrumb.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {userName && (
        <span className="hidden max-w-48 shrink-0 truncate text-sm text-muted-foreground sm:block">
          {userName}
        </span>
      )}
      <ThemeToggle />
    </header>
  )
}
