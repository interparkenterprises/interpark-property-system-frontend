import Link from 'next/link'
import { BarChart3, Building2, Home, Users } from 'lucide-react'
import { AuthBackground, AuthLogo } from '@/components/auth/AuthShell'

const features = [
  { icon: Building2, title: 'Properties', description: 'Track property performance, documents, and compliance.' },
  { icon: Home, title: 'Units', description: 'Organize and monitor every unit in one place.' },
  { icon: Users, title: 'Tenants', description: 'Manage tenant records, communication, and activity.' },
  { icon: BarChart3, title: 'Analytics', description: 'Review occupancy and performance insights.' },
]

export default function HomePage() {
  return (
    <AuthBackground>
      <main className="relative z-10 min-h-dvh px-4 py-20 sm:px-6 lg:py-0">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center lg:block">
          <AuthLogo className="mx-auto h-[68px] w-[260px] lg:absolute lg:left-1/2 lg:top-[clamp(3.25rem,9vh,6rem)] lg:-translate-x-1/2" />

          <section className="mt-8 w-full max-w-md rounded-xl border border-white/60 bg-card/88 p-8 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-card/88 sm:p-[52px] lg:absolute lg:left-1/2 lg:top-[38%] lg:mt-0 lg:-translate-x-1/2 lg:-translate-y-1/2">
            <div className="mb-7 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Interpark Property Management System
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Manage properties, units, tenants, and performance from one workspace.
              </p>
            </div>

            <div className="space-y-5">
              <Link href="/login" className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Login to your account
              </Link>

              <div className="flex items-center gap-4" aria-hidden="true">
                <span className="h-px flex-1 bg-border" />
                <span className="text-sm font-medium text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Link href="/register" className="inline-flex h-12 w-full items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Register a new account
              </Link>
            </div>
          </section>

          <section className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:absolute lg:inset-x-0 lg:bottom-[clamp(2.5rem,9vh,6.25rem)] lg:mx-auto lg:max-w-6xl lg:grid-cols-4" aria-label="Platform features">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-xl border border-white/60 bg-card/84 p-5 shadow-md backdrop-blur-md transition-colors hover:bg-card/94 dark:border-white/10 dark:bg-card/84">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="font-semibold text-foreground">{title}</h2>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
              </article>
            ))}
          </section>
        </div>
      </main>
    </AuthBackground>
  )
}
