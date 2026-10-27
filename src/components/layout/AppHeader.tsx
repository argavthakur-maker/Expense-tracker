import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CalendarDays, CheckIcon, LogOut, Menu } from 'lucide-react'
import { useAppData } from '../../hooks/useAppData'
import { Avatar, Logo } from '../shared/ui'
import { cn } from '../shared/Button'
import { monthKey, monthLabel } from '../../lib/format'
import * as api from '../../services/api'

import { SELECTABLE_MONTHS } from '../../lib/utils'

const TITLES: { match: string; title: string; subtitle: string }[] = [
  { match: '/app/expenses', title: 'Your Expenses', subtitle: 'Keep track of every rupee you spend.' },
  { match: '/app/budget', title: 'Budget Planner', subtitle: 'Plan where your pocket money goes.' },
  { match: '/app/analytics', title: 'Analytics', subtitle: 'Understand your spending habits.' },
  { match: '/app/savings', title: 'Savings Goals', subtitle: 'Set targets and save towards them.' },
  { match: '/app/settings', title: 'Settings', subtitle: 'Personalize your Hostelers experience.' },
]

export function AppHeader({ onMenu }: { onMenu: () => void }) {
  const { data, month, setMonth, markNotificationRead } = useAppData()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const isOverview = pathname === '/app'
  const title = TITLES.find((t) => pathname.startsWith(t.match))
  const unread = data?.notifications.filter((n) => !n.read).length ?? 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (!data) return null

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        {/* Mobile brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenu}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-ink-secondary transition-colors hover:bg-ink/5 hover:text-ink lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="lg:hidden">
            <Logo compact />
          </span>
        </div>

        <div className="hidden min-w-0 flex-1 lg:block">
          {isOverview ? (
            <>
              <h1 className="truncate text-[26px] font-bold leading-tight text-ink">
                {greeting}, {data.profile.nickname || data.profile.name || 'there'} 👋
              </h1>
              <p className="mt-0.5 text-sm text-ink-muted">
                Here's how your money is looking this month.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[24px] font-bold leading-tight text-ink">{title?.title}</h1>
              <p className="mt-0.5 text-sm text-ink-muted">{title?.subtitle}</p>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Month selector */}
          <div className="relative">
            <label htmlFor="month-select" className="sr-only">
              Select month
            </label>
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted">
              <CalendarDays className="h-4 w-4" />
            </span>
            <select
              id="month-select"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-line bg-card py-0 pl-8 pr-7 text-[13px] font-medium text-ink outline-none transition-colors hover:border-primary/40"
            >
              {SELECTABLE_MONTHS.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen((v) => !v)
                setProfileOpen(false)
              }}
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
              className="relative rounded-lg border border-line bg-card p-2 text-ink-secondary transition-colors hover:border-primary/40 hover:text-ink"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-card shadow-lift"
                  >
                    <p className="border-b border-line px-4 py-3 text-[13px] font-semibold text-ink">
                      Notifications
                    </p>
                    <ul className="max-h-80 overflow-y-auto scroll-slim">
                      {data.notifications.map((n) => (
                        <li key={n.id}>
                          <button
                            onClick={() => markNotificationRead(n.id)}
                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-card-soft"
                          >
                            <span
                              className={cn(
                                'mt-1 h-2 w-2 shrink-0 rounded-full',
                                n.read ? 'bg-transparent' : 'bg-primary',
                              )}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-[13px] font-semibold text-ink">{n.title}</span>
                              <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                                {n.body}
                              </span>
                              <span className="mt-1 block text-2xs text-ink-muted">{monthLabel(monthKey(n.date), true)} {n.date.slice(8, 10)}</span>
                            </span>
                            {!n.read && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-mint" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile menu */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen((v) => !v)
                setNotifOpen(false)
              }}
              aria-label="Profile menu"
              className="flex rounded-full ring-black/5 transition-shadow hover:ring-4"
            >
              <Avatar name={data.profile.name} />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-card shadow-lift"
                  >
                    <div className="border-b border-line px-4 py-3">
                      <p className="text-sm font-semibold text-ink">{data.profile.name}</p>
                      <p className="truncate text-xs text-ink-muted">{data.profile.email}</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          setProfileOpen(false)
                          void api.logout()
                          navigate('/')
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-secondary transition-colors hover:bg-ink/5 hover:text-ink"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
