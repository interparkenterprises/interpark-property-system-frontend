'use client'

import Image from 'next/image'
import ThemeToggle from '@/components/layout/ThemeToggle'
import { cn } from '@/lib/utils'

interface AuthBackgroundProps {
  children: React.ReactNode
  className?: string
}

interface AuthShellProps {
  children: React.ReactNode
  className?: string
  position?: 'center' | 'right'
}

export function AuthLogo({ className }: { className?: string }) {
  return (
    <div className={cn('relative h-[46px] w-[176px]', className)}>
      <Image src="/brand/interpark-logo-light.svg" alt="Interpark" fill priority className="object-contain dark:hidden" sizes="176px" />
      <Image src="/brand/interpark-logo-dark.svg" alt="Interpark" fill priority className="hidden object-contain dark:block" sizes="176px" />
    </div>
  )
}

export function AuthBackground({ children, className }: AuthBackgroundProps) {
  return (
    <div className={cn('relative min-h-dvh overflow-hidden bg-background', className)}>
      <Image src="/brand/auth-background-nairobi.webp" alt="" fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] dark:bg-background/82" aria-hidden="true" />
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      {children}
    </div>
  )
}

export default function AuthShell({ children, className, position = 'center' }: AuthShellProps) {
  const authCard = (
    <section className="rounded-xl border border-white/60 bg-card/88 p-6 text-card-foreground shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-card/88 sm:p-8">
      {children}
    </section>
  )

  return (
    <AuthBackground>
      <main className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-16 sm:px-6">
        {position === 'right' ? (
          <div className={cn('grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(400px,448px)] lg:gap-20', className)}>
            <div className="hidden items-center justify-center lg:flex">
              <AuthLogo className="h-[75px] w-full max-w-[288px]" />
            </div>
            <div className="mx-auto w-full max-w-md">
              <AuthLogo className="mx-auto mb-5 lg:hidden" />
              {authCard}
            </div>
          </div>
        ) : (
          <div className={cn('w-full max-w-md', className)}>
            <AuthLogo className="mx-auto mb-5" />
            {authCard}
          </div>
        )}
      </main>
    </AuthBackground>
  )
}
