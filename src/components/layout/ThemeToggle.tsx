'use client'

import { Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'interpark-theme'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

function subscribe(listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', handleStorage)
  window.addEventListener('interpark-theme-change', listener)
  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener('interpark-theme-change', listener)
  }
}

function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => 'light')

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    applyTheme(nextTheme)
    window.dispatchEvent(new Event('interpark-theme-change'))
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  )
}
