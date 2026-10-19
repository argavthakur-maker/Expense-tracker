import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Logo } from '../../components/shared/ui'
import { cn } from '../../components/shared/Button'
import { formatINR } from '../../lib/format'

const POINTS = [
  'A safe daily spending figure that updates itself',
  'Category limits built for hostel life',
  'Savings goals that actually stick',
]

/** Split-screen shell: brand story on desktop, form card beside it. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-bg">
      {/* Brand panel — hidden on mobile */}
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#7655E8] to-[#4b32b4] p-10 text-white lg:flex xl:p-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <Link to="/" className="relative">
          <Logo tone="light" />
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-[30px] font-bold leading-tight">
            Make your pocket money last the whole month.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[14px] text-white/85">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3 w-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-10 inline-flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div>
              <p className="text-2xs text-white/70">Safe to spend today</p>
              <p className="font-display text-2xl font-bold tnum">{formatINR(95)}</p>
            </div>
            <div className="h-9 w-px bg-white/15" />
            <div>
              <p className="text-2xs text-white/70">Remaining balance</p>
              <p className="font-display text-2xl font-bold tnum">{formatINR(1150)}</p>
            </div>
          </div>
        </div>
        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Hostelers · Spend smarter. Save better. Live freely.</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px]"
        >
          <div className="mb-8 text-center lg:text-left">
            <Link to="/" className="inline-block lg:hidden">
              <Logo />
            </Link>
            <h1 className="mt-6 text-[28px] font-bold leading-tight text-ink lg:mt-0">{title}</h1>
            <p className="mt-2 text-sm text-ink-secondary">{subtitle}</p>
          </div>
          {children}
          <div className={cn('mt-6 text-center text-sm text-ink-secondary')}>
            {footer}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
