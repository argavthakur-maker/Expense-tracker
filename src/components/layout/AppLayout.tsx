import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { AppHeader } from './AppHeader'
import { Logo } from '../shared/ui'
import { AskGix } from '../ai/AskGix'

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setDrawerOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <AskGix />

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-[#172033]/45"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-y-0 left-0 w-64 flex flex-col border-r border-line bg-card p-4"
            >
              <div className="flex items-center justify-between px-2 pb-4">
                <Logo />
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              <MobileNavItems onNavigate={() => setDrawerOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-60">
        <AppHeader onMenu={() => setDrawerOpen(true)} />
        <main className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-8">
          {/* Subtle page transition */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

/** Same nav links as the sidebar, reused inside the mobile drawer. */
function MobileNavItems({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate()
  const links = [
    { to: '/app', label: 'Overview' },
    { to: '/app/expenses', label: 'Expenses' },
    { to: '/app/budget', label: 'Budget Planner' },
    { to: '/app/analytics', label: 'Analytics' },
    { to: '/app/savings', label: 'Savings Goals' },
    { to: '/app/settings', label: 'Settings' },
  ]
  return (
    <nav className="flex-1 space-y-1 px-2" aria-label="Primary">
      {links.map(({ to, label }) => (
        <button
          key={to}
          onClick={() => {
            navigate(to)
            onNavigate()
          }}
          className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-secondary transition-colors hover:bg-ink/5 hover:text-ink"
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
