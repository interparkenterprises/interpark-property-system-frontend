'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, LogOut } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  /** Explicit active override (defaults to pathname match incl. child routes). */
  active?: boolean;
}

interface DashboardShellProps {
  /** 'dark' = navy sidebar (landlord/provider), 'light' = white sidebar (tenant). */
  theme: 'dark' | 'light';
  brandIcon: ReactNode;
  navItems: NavItem[];
  onLogout: () => void;
  /** Header title block (left side). */
  title: ReactNode;
  /** Header right side (avatar, name, etc.). */
  headerRight?: ReactNode;
  children: ReactNode;
}

/**
 * App frame: fixed sidebar + fixed top bar, single scroll container for content.
 * Rendered ONCE per portal layout so it survives client-side navigation:
 * - The shell is `h-screen overflow-hidden`, so the page itself never scrolls.
 * - The sidebar and header are `shrink-0` flex children, so they stay pinned.
 * - `<main>` is the ONLY scroll container (`overflow-y-auto`), and it resets to
 *   the top on every route change.
 */
export default function DashboardShell({
  theme,
  brandIcon,
  navItems,
  onLogout,
  title,
  headerRight,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollRef = useRef<HTMLElement | null>(null);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Reset the content scroller on navigation so new pages start at the top
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  // Close drawer on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const isDark = theme === 'dark';

  // ── Sidebar internals ──────────────────────────────────────
  const sidebarBg = isDark ? 'bg-[#0B1A2B] text-white' : 'bg-white border-r border-slate-200';
  const brandText = isDark ? 'text-white' : 'text-slate-900';
  // Contrast fix: secondary brand text darkened (slate-600 → slate-700) on light sidebars.
  const brandSub = isDark ? 'text-white/70' : 'text-slate-700';
  const border = isDark ? 'border-white/10' : 'border-slate-200';
  const logoutText = isDark
    ? 'text-white/90 hover:bg-white/10'
    : 'text-slate-800 hover:bg-slate-100';

  const isItemActive = (item: NavItem) =>
    item.active !== undefined
      ? item.active
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const renderLink = (item: NavItem) => {
    const active = isItemActive(item);

    const base =
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors';

    // Active: always white text on brand blue — works for BOTH themes.
    const activeCls = 'bg-[#005478] text-white font-semibold shadow-sm';

    // Contrast fix: idle labels lifted from white/80 → white/90 (dark) and
    // slate-700 → slate-800 (light) so navigation labels stay clearly readable.
    const idleCls = isDark
      ? 'text-white/90 hover:bg-white/10 hover:text-white'
      : 'text-slate-800 hover:bg-slate-100 hover:text-slate-900';

    // Force the text + icon color at the child level so no global
    // `a { color: ... }` rule can win the specificity battle.
    const contentColor = active ? 'text-white' : '';
    const iconColor = active ? 'text-white' : '';

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        onClick={() => setMobileOpen(false)}
        className={`${base} ${active ? activeCls : idleCls}`}
      >
        <span className={`shrink-0 ${iconColor}`}>{item.icon}</span>
        <span className={`flex-1 truncate ${contentColor}`}>{item.label}</span>
        {item.badge ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              active ? 'bg-white text-[#005478]' : 'bg-red-600 text-white'
            }`}
          >
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <div className={`flex items-center gap-3 px-6 py-5 border-b ${border} shrink-0`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#005478]">
          {brandIcon}
        </div>
        <div className="min-w-0">
          <p className={`font-bold text-lg leading-tight truncate ${brandText}`}>InterPark</p>
          <p className={`text-xs truncate ${brandSub}`}>Property Management</p>
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(renderLink)}
      </nav>

      <div className={`px-3 py-4 border-t ${border} shrink-0`}>
        <button
          onClick={onLogout}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${logoutText}`}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* ── Desktop sidebar: pinned, own scroll ── */}
      <aside
        className={`hidden lg:flex w-64 shrink-0 flex-col h-full ${sidebarBg} z-30`}
        aria-label="Primary navigation"
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile drawer backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        id="mobile-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col lg:hidden ${sidebarBg} transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0 visible' : '-translate-x-full invisible'
        }`}
        aria-label="Primary navigation"
        aria-hidden={!mobileOpen}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className={`absolute right-3 top-4 rounded-lg p-2 ${
            isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-800'
          }`}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* ── Main column: fixed header + only-this-scrolls content ── */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 z-20 flex items-center justify-between gap-3 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden rounded-lg p-2 hover:bg-slate-100 shrink-0"
              aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-sidebar"
            >
              <Menu className="h-5 w-5 text-slate-700" />
            </button>
            <div className="min-w-0">{title}</div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">{headerRight}</div>
        </header>

        {/* The one and only scroll container */}
        <main
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/** Shared stat-card used by all dashboards. */
export function StatCard({
  icon,
  iconBg,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className={`rounded-xl p-2 sm:p-2.5 shrink-0 ${iconBg}`}>{icon}</span>
          <span className="text-xs sm:text-sm font-medium text-slate-800 truncate">{label}</span>
        </div>
      </div>
      <p className="mt-3 text-xl sm:text-2xl font-bold text-slate-900 truncate">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-700 truncate">{hint}</p>}
    </div>
  );
}
