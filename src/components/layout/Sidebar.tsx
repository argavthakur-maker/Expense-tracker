import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Settings,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Logo } from '../shared/ui'
import { formatINR } from '../../lib/format'
import { cn } from '../shared/Button'
import { useAppData } from '../../hooks/useAppData'
import { monthLabel } from '../../lib/format'
import { totalSpent } from '../../lib/finance'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const items: NavItem[] = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/expenses', label: 'Expenses', icon: Receipt },
  { to: '/app/budget', label: 'Budget Planner', icon: Wallet },
  { to: '/app/analytics', label: 'Analytics', icon: PiggyBank },
  { to: '/app/savings', label: 'Savings Goals', icon: Target },
  { to: '/app/settings', label: 'Settings', icon: Settings, end: true },
]

export function Sidebar() {
  const { data, monthExpenses, month } = useAppData()
  if (!data) return null
  const spent = totalSpent(monthExpenses)

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-card lg:flex">
      <div className="px-5 pb-2 pt-6">
        <NavLink to="/" aria-label="Hostelers home">
          <Logo />
        </NavLink>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3" aria-label="Primary">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-soft text-primary-dark'
                  : 'text-ink-secondary hover:bg-ink/5 hover:text-ink',
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <div className="rounded-xl border border-line bg-card-soft p-4">
          <p className="text-[13px] font-semibold text-ink">{monthLabel(month, true)} spending</p>
          <p className="mt-1 text-2xl font-display font-bold tnum text-ink">{formatINR(spent)}</p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${data.budget.monthly > 0 ? Math.min(100, (spent / data.budget.monthly) * 100) : 0}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            {formatINR(Math.max(0, data.budget.monthly - spent))} left of{' '}
            {formatINR(data.budget.monthly)}
          </p>
        </div>
      </div>
    </aside>
  )
}
