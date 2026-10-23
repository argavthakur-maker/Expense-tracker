import { useState, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Bell,
  Calculator,
  Check,
  Compass,
  Gauge,
  LayoutDashboard,
  Lock,
  Menu,
  PieChart,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Logo } from '../shared/ui'
import { formatINR } from '../../lib/format'
import { GixChat } from '../shared/GixChatPanel';

/* ---------- Motion helpers ---------- */

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
}

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ---------- Navigation ---------- */

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
]

function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#home" aria-label="Hostelers home">
          <Logo />
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-ink/5 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link
            to="/login"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-[0_1px_2px_rgb(118_85_232/0.3)] transition-all hover:bg-[var(--c-primary-dark)] hover:shadow-pop"
          >
            Get started
          </Link>
        </div>

        <button
          className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-ink/5 hover:text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-card px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-secondary hover:bg-ink/5 hover:text-ink"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2.5">
              <Link
                to="/login"
                className="flex flex-1 items-center justify-center rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="flex flex-1 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white"
                onClick={() => setOpen(false)}
              >
                Get started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

/* ---------- Dashboard preview used in the hero ---------- */

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      {/* Main window */}
      <motion.div
        initial={{ opacity: 0, y: 32, rotate: 1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl border border-line bg-card p-5 shadow-lift"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-muted">October 2026</p>
            <p className="mt-1 text-[13px] font-semibold text-ink">This month at a glance</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[#e8f8f0] px-2.5 py-1 text-2xs font-semibold text-[#178a63]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#20a879]" />
            On track
          </span>
        </div>

        {/* Remaining balance */}
        <div className="mt-4 rounded-xl border border-line bg-card-soft p-4">
          <p className="text-xs text-ink-secondary">Remaining balance</p>
          <p className="mt-1 font-display text-3xl font-bold tnum text-ink">{formatINR(1150)}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/[0.08]">
            <div className="flex h-full w-[62%] rounded-full bg-primary" />
          </div>
          <p className="mt-2 text-2xs text-ink-muted">{formatINR(1850)} spent of {formatINR(3000)} · 62% used</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {/* Daily plan */}
          <div className="rounded-xl border border-line bg-card-soft p-3.5">
            <p className="text-2xs text-ink-secondary">Safe to spend today</p>
            <p className="mt-1 font-display text-xl font-bold tnum text-ink">{formatINR(95)}</p>
            <p className="mt-1 text-2xs text-ink-muted">12 days this month</p>
          </div>
          {/* Mini chart */}
          <div className="rounded-xl border border-line bg-card-soft p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-2xs text-ink-secondary">Daily spend</p>
              <span className="flex items-center gap-0.5 text-2xs font-medium text-[#178a63]">
                <TrendingDown className="h-3 w-3" />
                -18%
              </span>
            </div>
            <svg viewBox="0 0 120 40" className="mt-2 h-10 w-full" aria-hidden="true">
              <defs>
                <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7655E8" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#7655E8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 30 L12 24 L24 28 L36 16 L48 20 L60 10 L72 18 L84 12 L96 22 L108 16 L120 20"
                fill="none"
                stroke="#7655E8"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M0 30 L12 24 L24 28 L36 16 L48 20 L60 10 L72 18 L84 12 L96 22 L108 16 L120 20 L120 40 L0 40 Z"
                fill="url(#heroSpark)"
              />
            </svg>
          </div>
        </div>

        {/* Budget progress rows */}
        <div className="mt-3 rounded-xl border border-line bg-card-soft p-4">
          <div className="flex items-center justify-between">
            <p className="text-2xs font-semibold text-ink">Food budget</p>
            <p className="text-2xs tnum text-ink-muted">{formatINR(1120)} / {formatINR(1200)}</p>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
            <div className="h-full w-[93%] rounded-full bg-[#e9a23b]" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-2xs font-semibold text-ink">Transport budget</p>
            <p className="text-2xs tnum text-ink-muted">{formatINR(190)} / {formatINR(400)}</p>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
            <div className="h-full w-[48%] rounded-full bg-[#20a879]" />
          </div>
        </div>
      </motion.div>

      {/* Floating expense notification */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.85 }}
        className="absolute -right-3 -top-8 sm:-right-8"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3.5 py-2.5 shadow-lift"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f8f0] text-[#178a63]">
            <Check className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-ink">Expense logged</p>
            <p className="text-2xs text-ink-muted">Chai + sandwich · {formatINR(65)}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating budget nudge */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="absolute -bottom-8 -left-3 sm:-left-10"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3.5 py-2.5 shadow-lift"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0ecff] text-[#6a45dd]">
            <Bell className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-ink">You're on track</p>
            <p className="text-2xs text-ink-muted">{formatINR(1150)} for the last 12 days</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

/* ---------- Sections ---------- */

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <h2 className="text-[28px] font-bold leading-tight text-ink sm:text-[34px]">{title}</h2>
      {subtitle && <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">{subtitle}</p>}
    </Reveal>
  )
}

const PROBLEMS = [
  {
    title: 'Unplanned spending',
    description: 'Small purchases add up faster than you think.',
    icon: Compass,
  },
  {
    title: 'No spending limits',
    description: 'Without a daily plan, your budget disappears quickly.',
    icon: Gauge,
  },
  {
    title: 'Unclear spending habits',
    description: 'Understand where your pocket money actually goes.',
    icon: PieChart,
  },
  {
    title: 'End-of-month stress',
    description: 'Stop worrying about running out of money before payday.',
    icon: ShieldCheck,
  },
] as { title: string; description: string; icon: LucideIcon }[]

function ProblemSection() {
  return (
    <section id="about" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <SectionHeading
        title="Your Money Should Last the Whole Month."
        subtitle="Most students don't have a budget problem — they have a visibility problem. Hostelers fixes that."
      />
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PROBLEMS.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.07}>
            <div className="group h-full rounded-xl2 border border-line bg-card p-6 shadow-soft transition-shadow hover:shadow-lift">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0ecff] text-[#6a45dd] transition-colors group-hover:bg-[#f0ecff]">
                <p.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-ink">{p.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">{p.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const FEATURES = [
  {
    title: 'Smart Budget Planner',
    description: 'Split your pocket money into category limits that match real hostel life.',
    icon: Wallet,
  },
  {
    title: 'Daily Spending Suggestions',
    description: 'A safe-to-spend figure that recalculates as the month moves along.',
    icon: Calculator,
  },
  {
    title: 'Expense Tracking',
    description: 'Log every chai, canteen run and rickshaw ride in seconds.',
    icon: Receipt,
  },
  {
    title: 'Spending Analytics',
    description: 'Weekly comparisons and category breakdowns that explain your habits.',
    icon: PieChart,
  },
  {
    title: 'Savings Goals',
    description: 'Emergency funds, headphones, trips — save towards them a little at a time.',
    icon: Target,
  },
  {
    title: 'Monthly Financial Insights',
    description: 'See patterns month over month and adjust before money runs tight.',
    icon: LayoutDashboard,
  },
] as { title: string; description: string; icon: LucideIcon }[]

function FeaturesSection() {
  return (
    <section id="features" className="border-y border-line bg-card-soft">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <SectionHeading
          title="Everything You Need to Manage Your Money."
          subtitle="Built around how hostel students actually spend — one tool from pocket money to payday."
        />
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <div className="group h-full rounded-xl2 border border-line bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0ecff] text-[#6a45dd]">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">{f.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  {
    title: 'Set your monthly pocket money',
    description: 'Tell Hostelers what you receive each month. That number becomes the plan.',
  },
  {
    title: 'Track your everyday expenses',
    description: 'Log the canteen run, chai tapri and late-night snacks in a few taps.',
  },
  {
    title: 'Follow your personalized spending plan',
    description: 'Get a safe daily figure and category limits that keep you on pace.',
  },
  {
    title: 'Save more and stay in control',
    description: 'End the month with money left over — and start building savings goals.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <SectionHeading
        title="Four Steps, Thirty Seconds a Day."
        subtitle="No spreadsheets, no complicated finance apps designed for people with salaries."
      />
      <div className="mt-12 grid grid-cols-1 gap-8 sm:gap-6 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.08}>
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7655E8] font-display text-sm font-bold text-white shadow-[0_2px_8px_rgb(118_85_232/0.35)]">
                  {i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="hidden h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent lg:block" />
                )}
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">{s.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7655E8] to-[#5F3FD6] px-6 py-14 text-center sm:px-12 sm:py-16">
          <Sparkles className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 text-white/10" />
          <Sparkles className="pointer-events-none absolute -bottom-10 -right-10 h-52 w-52 text-white/10" />
          <h2 className="relative text-[28px] font-bold leading-tight text-white sm:text-[34px]">
            Your Next Month Can Start Smarter.
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/85">
            Take control of your spending and make every rupee count.
          </p>
          <div className="relative mt-8">
            <Link
              to="/signup"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-[15px] font-semibold text-[#5F3FD6] shadow-lift transition-all hover:bg-white/95 active:scale-[0.98]"
            >
              Start Managing Your Money
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-xs text-white/70">Free for students · No card required</p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-line bg-card-soft">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-5 py-14 sm:px-8 md:grid-cols-4">
        <div className="col-span-2 md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-ink-secondary">
            Spend smarter. Save better. Live freely. Hostelers helps hostel and college students make their pocket money last the whole month.
          </p>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-ink">Product</p>
          <ul className="mt-3 space-y-2.5">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Dashboard', href: '/app' },
            ].map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="text-[13px] text-ink-secondary transition-colors hover:text-ink"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-ink">Company</p>
          <ul className="mt-3 space-y-2.5">
            <li>
              <a href="#about" className="text-[13px] text-ink-secondary transition-colors hover:text-ink">
                About
              </a>
            </li>
            <li>
              <a
                href="mailto:hello@hostelers.app"
                className="text-[13px] text-ink-secondary transition-colors hover:text-ink"
              >
                Contact
              </a>
            </li>
            <li>
              <span className="flex cursor-default items-center gap-1.5 text-[13px] text-ink-secondary">
                <Lock className="h-3 w-3" />
                Privacy Policy
              </span>
            </li>
            <li>
              <span className="flex cursor-default items-center gap-1.5 text-[13px] text-ink-secondary">
                <Lock className="h-3 w-3" />
                Terms of Service
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5">
        <p className="text-center text-xs text-ink-muted">
          © {new Date().getFullYear()} Hostelers · Made for students, by students
        </p>
      </div>
    </footer>
  )
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      {/* Soft decorative glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-[#f0ecff] opacity-70 blur-3xl" />
        <div className="absolute -right-40 top-40 h-72 w-72 rounded-full bg-[#e8f8f0] opacity-60 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-2 lg:gap-10 lg:pb-32 lg:pt-24">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-[#f0ecff] px-3 py-1 text-xs font-medium text-[#5F3FD6]"
          >
            <Sparkles className="h-3 w-3" />
            Money management made for student life
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mt-5 text-[36px] font-bold leading-[1.12] tracking-tight text-ink sm:text-[44px] lg:text-[48px]"
          >
            Make Your Pocket Money{' '}
            <span className="bg-gradient-to-r from-[#7655E8] to-[#9F8DFF] bg-clip-text text-transparent">
              Last Longer.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mt-5 max-w-lg text-[16px] leading-relaxed text-ink-secondary"
          >
            Track your expenses, plan your daily spending, and build better money habits —
            without worrying about running out of cash before the month ends.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/signup"
              className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-[15px] font-semibold text-white shadow-[0_2px_10px_rgb(118_85_232/0.35)] transition-all hover:bg-[var(--c-primary-dark)] hover:shadow-pop active:scale-[0.98]"
            >
              Get Started — It's Free
            </Link>
            <Link
              to="/app"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-card px-5 text-[15px] font-medium text-ink transition-all hover:border-primary/40 hover:text-primary-dark active:scale-[0.98]"
            >
              Explore Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2"
          >
            {['Works on any phone', 'Built for hostel budgets', 'No spreadsheets'].map((t) => (
              <li key={t} className="flex items-center gap-1.5 text-[13px] text-ink-secondary">
                <Check className="h-3.5 w-3.5 text-[#20a879]" />
                {t}
              </li>
            ))}
          </motion.ul>
        </div>

        <div className="pb-10 lg:pb-0">
          <DashboardPreview />
        </div>
      </div>
    </section>
  )
}

export function Landing() {
  return (
    <div className="min-h-screen bg-bg">
      <LandingNav />
      <Hero />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorks />
      <FinalCTA />
      <Footer />

      <GixChat />
    </div>
  )
}
