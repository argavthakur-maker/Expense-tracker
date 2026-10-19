import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Wallet } from 'lucide-react'
import { cn } from './Button'
import { CATEGORY_COLORS, type Category } from '../../types'

export { Card, CardHeader } from './Card'

export function Badge({
  children,
  color,
  className,
}: {
  children: ReactNode
  color?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
      style={
        color
          ? { color: DARKENED[color] ?? color, backgroundColor: `${color}14` }
          : { color: 'var(--c-text-secondary)', backgroundColor: 'var(--c-card-soft)' }
      }
    >
      {children}
    </span>
  )
}

/* Slightly darker text tones so white/ pastel badge backgrounds stay readable. */
const DARKENED: Record<string, string> = {
  '#7655E8': '#6a45dd',
  '#E9A23B': '#b97d1e',
  '#20A879': '#178a63',
  '#5B9CF5': '#2f7fe0',
  '#E46B9C': '#c74478',
  '#9F8DFF': '#7661f0',
  '#929BAD': '#6f7891',
}

export function categoryBadgeStyle(category: Category) {
  return { bg: `${CATEGORY_COLORS[category]}14`, text: DARKENED[category] ?? CATEGORY_COLORS[category] }
}

export function ProgressBar({
  pct,
  color,
  className,
  animate = true,
}: {
  pct: number
  color?: string
  className?: string
  animate?: boolean
}) {
  const clamped = Math.min(100, Math.max(0, pct))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-ink/[0.08]', className)}>
      {animate ? (
        <motion.div
          className="h-full rounded-full"
          style={{ background: color ?? 'var(--c-primary)' }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      ) : (
        <div
          className="h-full rounded-full"
          style={{ width: `${clamped}%`, background: color ?? 'var(--c-primary)' }}
        />
      )}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: {
  icon: ReactNode
  title: string
  message: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary [&>svg]:h-5.5 [&>svg]:w-5.5">
        {icon}
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-ink-muted">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-ink/[0.07]', className)} />
}

/** Hostelers wordmark with the minimal wallet-inspired icon. */
export function Logo({ compact = false, tone = 'dark' }: { compact?: boolean; tone?: 'dark' | 'light' }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7655E8] to-[#9F8DFF] text-white shadow-[0_2px_8px_rgb(118_85_232/0.35)]',
        )}
      >
        <Wallet className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </span>
      {!compact && (
        <span
          className={cn(
            'font-display text-[19px] font-bold tracking-tight',
            tone === 'dark' ? 'text-ink' : 'text-white',
          )}
        >
          Hostelers
        </span>
      )}
    </span>
  )
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-[13px] font-semibold text-primary-dark',
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
