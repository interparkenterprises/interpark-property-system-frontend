'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  Menu,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Static content lives outside the component so it is not re-created */
/*  on every render.                                                   */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#lifecycle' },
  { label: 'Why Interpark', href: '#why' },
] as const;

const STATS = [
  { value: '1 Dashboard', label: 'For every property, unit and tenant' },
  { value: 'Any Device', label: 'Responsive access from phone or desktop' },
  { value: 'Role-Based', label: 'Granular access control per team member' },
  { value: 'PDF-Ready', label: 'Statements, arrears and payment reports' },
] as const;

const FEATURES: { icon: ReactNode; title: string; description: string }[] = [
  {
    icon: <Building2 className="h-7 w-7 text-[#005478]" />,
    title: 'Property Portfolio',
    description:
      'Every property in one register — landlord, location, land reference, usage type and settlement bank details.',
  },
  {
    icon: <Home className="h-7 w-7 text-[#005478]" />,
    title: 'Units & Occupancy',
    description:
      'Track units by type, floor, size, bedrooms and rent, so vacant and occupied space is visible at a glance.',
  },
  {
    icon: <Users className="h-7 w-7 text-[#005478]" />,
    title: 'Tenant Management',
    description:
      'Centralise tenant records, contacts, KRA PINs and move-out history — no more scattered files or lost contacts.',
  },
  {
    icon: <FileText className="h-7 w-7 text-[#005478]" />,
    title: 'Leases & Agreements',
    description:
      'Capture rent, term and rent start dates, deposits, escalation frequency and payment policy against each tenant.',
  },
  {
    icon: <Receipt className="h-7 w-7 text-[#005478]" />,
    title: 'Invoicing & Billing',
    description:
      'Generate rent, service charge and VAT invoices on the payment policy you set — monthly, quarterly or annually.',
  },
  {
    icon: <Wallet className="h-7 w-7 text-[#005478]" />,
    title: 'Payment Tracking',
    description:
      'Record every payment received, flag partial payments, and surface arrears while they are still small.',
  },
  {
    icon: <BarChart3 className="h-7 w-7 text-[#005478]" />,
    title: 'Reports & Statements',
    description:
      'Tenant statements, arrears and payment histories, exportable as clean PDFs for landlords and accountants.',
  },
  {
    icon: <TrendingUp className="h-7 w-7 text-[#005478]" />,
    title: 'Analytics & Insights',
    description:
      'Date-filtered dashboards — month, quarter, year or custom range — showing collections, occupancy and arrears trends.',
  },
  {
    icon: <ShieldCheck className="h-7 w-7 text-[#005478]" />,
    title: 'Secure, Role-Based Access',
    description:
      'Give managers, agents and landlords scoped permissions per property, with an audit trail of who changed what.',
  },
];

const LIFECYCLE = [
  { step: '01', title: 'Property', text: 'Register the property, landlord and bank details.' },
  { step: '02', title: 'Units', text: 'Add units with type, size, rent and status.' },
  { step: '03', title: 'Tenant', text: 'Capture contacts, KRA PIN, deposit and lease terms.' },
  { step: '04', title: 'Lease', text: 'Set rent, start dates, escalation and payment policy.' },
  { step: '05', title: 'Invoice', text: 'Generate rent, service charge and VAT invoices.' },
  { step: '06', title: 'Payment', text: 'Record and reconcile every payment received.' },
  { step: '07', title: 'Reports', text: 'Produce statements, arrears and exports in one click.' },
] as const;

const WHY_ITEMS = [
  'See arrears the moment they appear, not at month end',
  'One source of truth for every property, unit and tenant',
  'Invoices generated consistently on each payment policy',
  'Audit-ready payment history you can hand to a landlord or accountant',
  'Demand letters and notices raised straight from the tenant record',
  'Secure, role-based access for managers, agents and landlords',
] as const;

/* ------------------------------------------------------------------ */
/*  Shared motion presets                                              */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerParent = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const viewportOnce = { once: true, amount: 0.2 } as const;

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen scroll-smooth bg-linear-to-br from-[#005478] to-[#1C2B3A]">
      {/* Decorative background layers */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-[#00A8C6]/20 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#00A8C6]/10 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#00A8C6]/5 blur-3xl" />
      </div>

      {/* ============================= NAV ============================= */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1A26]/85 backdrop-blur-md">
        <nav
          aria-label="Main"
          className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
        >
          <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-[#00A8C6] focus-visible:outline-none">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00A8C6]">
              <Building2 className="h-5 w-5 text-white" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-extrabold tracking-wider text-white sm:text-base">
                INTERPARK
              </span>
              <span className="mt-0.5 hidden text-[10px] font-medium tracking-wide text-gray-400 sm:block">
                Property Management System
              </span>
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded text-sm font-medium text-gray-300 transition-colors hover:text-[#00A8C6] focus-visible:ring-2 focus-visible:ring-[#00A8C6] focus-visible:outline-none"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors hover:text-[#00A8C6] focus-visible:ring-2 focus-visible:ring-[#00A8C6] focus-visible:outline-none"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-[#00A8C6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#E6F8FA] hover:text-[#005478] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              Create Account
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#00A8C6] focus-visible:outline-none lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile panel */}
        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              key="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-white/10 bg-[#0B1A26] lg:hidden"
            >
              <ul className="mx-auto flex w-full max-w-7xl flex-col px-4 py-3 sm:px-6">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-2 py-3 text-base font-medium text-gray-200 transition-colors hover:bg-white/5 hover:text-[#00A8C6]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li className="mt-3 flex flex-col gap-3 px-2 pb-3">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="w-full rounded-xl border-2 border-white px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white hover:text-[#005478]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="w-full rounded-xl bg-[#00A8C6] px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#E6F8FA] hover:text-[#005478]"
                  >
                    Create Account
                  </Link>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ============================ HERO ============================ */}
        <section className="mx-auto max-w-3xl pt-12 pb-14 text-center sm:pt-16 md:pt-20 md:pb-20">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-5 inline-block rounded-full border border-[#00A8C6]/30 bg-[#00A8C6]/10 px-3.5 py-1.5 text-[11px] font-semibold tracking-wider text-[#00A8C6] uppercase sm:mb-6 sm:text-xs"
          >
            Property Management, Reimagined
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-balance text-3xl leading-[1.08] font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
          >
            INTERPARK ENTERPRISES LIMITED
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-gray-200 sm:text-lg md:text-xl"
          >
            Run your entire property portfolio from one dashboard — tenants, leases,
            invoices, payments, arrears and reports. No spreadsheets. No guesswork.
            No lost rent.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4"
          >
            <Link
              href="/login"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00A8C6] px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#E6F8FA] hover:text-[#005478] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:w-auto"
            >
              Login to Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center rounded-xl border-2 border-white bg-transparent px-7 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-[#005478] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-[#00A8C6] focus-visible:outline-none sm:w-auto"
            >
              Register Your Account
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-sm text-gray-300"
          >
            <li className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#00A8C6]" /> Secure access
            </li>
            <li className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-[#00A8C6]" /> Real-time updates
            </li>
            <li className="inline-flex items-center gap-2">
              <BarChart3 className="h-4 w-4 shrink-0 text-[#00A8C6]" /> Built-in analytics
            </li>
          </motion.ul>
        </section>

        {/* =========================== STATS =========================== */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerParent}
          className="mx-auto mb-16 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 md:mb-20 lg:grid-cols-4"
        >
          {STATS.map((stat) => (
            <StatCard key={stat.value} value={stat.value} label={stat.label} />
          ))}
        </motion.div>

        {/* ========================== FEATURES ========================= */}
        <section id="features" className="scroll-mt-24">
          <SectionHeading
            eyebrow="Capabilities"
            title="Everything you need, in one place"
            subtitle="From the first tenancy agreement to the final statement — the full property management lifecycle, handled."
          />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerParent}
            className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
          >
            {FEATURES.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </motion.div>
        </section>

        {/* ========================= LIFECYCLE ========================= */}
        <section id="lifecycle" className="scroll-mt-24 pt-16 md:pt-24">
          <SectionHeading
            eyebrow="How it works"
            title="One connected record, end to end"
            subtitle="Every stage builds on the last, so the data you enter once keeps working for you all year."
          />

          <motion.ol
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerParent}
            className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {LIFECYCLE.map((item) => (
              <motion.li
                key={item.step}
                variants={fadeUp}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <span className="text-xs font-bold tracking-widest text-[#00A8C6]">
                  {item.step}
                </span>
                <h3 className="mt-2 text-base font-bold text-white">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-300">{item.text}</p>
              </motion.li>
            ))}
          </motion.ol>
        </section>

        {/* ============================ WHY ============================ */}
        <section id="why" className="scroll-mt-24 pt-16 md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8 md:p-10"
          >
            <h2 className="text-balance text-center text-2xl font-bold text-white sm:text-3xl">
              Why property managers choose Interpark
            </h2>
            <ul className="mt-7 grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
              {WHY_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-200">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#00A8C6]" />
                  <span className="text-sm leading-relaxed md:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </section>

        {/* ============================ CTA ============================ */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6 }}
          className="pt-16 text-center md:pt-24"
        >
          <h2 className="text-balance text-2xl font-bold text-white sm:text-3xl">
            Ready to take control of your portfolio?
          </h2>
          <p className="mx-auto mt-4 mb-8 max-w-xl text-pretty text-gray-300">
            Sign in to your dashboard, or create an account to get started.
          </p>
          <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#00A8C6] px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#E6F8FA] hover:text-[#005478] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:w-auto"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center rounded-xl border-2 border-white px-7 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-[#005478] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-[#00A8C6] focus-visible:outline-none sm:w-auto"
            >
              Create Account
            </Link>
          </div>
        </motion.section>
      </main>

      {/* =========================== FOOTER =========================== */}
      <footer className="relative z-10 mt-16 border-t border-white/10 bg-black/20 md:mt-24">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00A8C6]">
                  <Building2 className="h-5 w-5 text-white" />
                </span>
                <span className="text-base font-extrabold tracking-wider text-white">
                  INTERPARK
                </span>
              </div>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-400">
                A property management platform for landlords, managers and agents —
                built to keep rent collection, tenant records and reporting in one
                reliable place.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
                Explore
              </h3>
              <ul className="mt-4 space-y-2.5">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-[#00A8C6]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
                Get started
              </h3>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-gray-400 transition-colors hover:text-[#00A8C6]"
                  >
                    Login to Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-sm text-gray-400 transition-colors hover:text-[#00A8C6]"
                  >
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-sm text-gray-400 transition-colors hover:text-[#00A8C6]"
                  >
                    Back to top
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
            <p className="text-xs text-gray-500">
              {'© '}
              {new Date().getFullYear()} Interpark Enterprises Limited. All rights reserved.
            </p>
            <p className="text-xs text-gray-500">Nairobi, Kenya</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable pieces                                                    */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.5 }}
      className="mx-auto mb-10 max-w-2xl text-center md:mb-12"
    >
      <span className="text-[11px] font-bold tracking-widest text-[#00A8C6] uppercase sm:text-xs">
        {eyebrow}
      </span>
      <h2 className="mt-2 text-balance text-2xl font-bold text-white sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-gray-300 sm:text-base">
        {subtitle}
      </p>
    </motion.div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-center backdrop-blur-sm"
    >
      <div className="text-xl font-extrabold text-[#00A8C6] sm:text-2xl md:text-3xl">
        {value}
      </div>
      <div className="mt-1.5 text-xs leading-snug text-gray-300 sm:text-sm">
        {label}
      </div>
    </motion.div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-shadow duration-300 hover:shadow-2xl"
    >
      <div className="mb-4 flex justify-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E6F8FA]">
          {icon}
        </span>
      </div>
      <h3 className="text-center text-lg font-bold text-[#231F20]">{title}</h3>
      <p className="mt-2 text-pretty text-center text-sm leading-relaxed text-gray-600">
        {description}
      </p>
    </motion.div>
  );
}
