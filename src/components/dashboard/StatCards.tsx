import { motion } from 'framer-motion'
import { CalendarClock, PiggyBank, Wallet, TrendingDown } from 'lucide-react'
import { Card } from '../shared/ui'
import { formatINR } from '../../lib/format'
import type { SpendingPlan } from '../../lib/finance'
import { monthLabel } from '../../lib/format'

const cards = [
  {
    key: 'budget',
    label: 'Monthly budget',
    get: (p: SpendingPlan) => formatINR(p.budget),
    description: 'Your planned amount, minus what you have left.',
    icon: Wallet,
    iconClass: 'bg-primary-soft text-primary',
  },
  {
    key: 'spent',
    label: 'Total spent',
    get: (p: SpendingPlan) => formatINR(p.spent),
    description: 'So far this month.',
    icon: TrendingDown,
    iconClass: 'bg-[#fdeaea] text-[#c24040]',
  },
  {
    key: 'remaining',
    label: 'Remaining balance',
    get: (p: SpendingPlan) => formatINR(p.remaining),
    description: 'Available if you follow your plan.',
    icon: PiggyBank,
    iconClass: 'bg-[#e8f8f0] text-[#178a63]',
  },
  {
    key: 'daily',
    label: 'Safe daily budget',
    get: (p: SpendingPlan) => formatINR(Math.round(p.safeDaily)),
    description: 'Suggested to make the month last.',
    icon: CalendarClock,
    iconClass: 'bg-[#fdf3e3] text-[#b97d1e]',
  },
]

export function StatCards({ plan, month }: { plan: SpendingPlan; month: string }) {
  return (
    <>
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.3 }}
        >
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink-secondary">{card.label}</p>
                <p className="mt-1.5 font-display text-[28px] font-bold leading-none tnum text-ink">
                  {card.get(plan)}
                </p>
              </div>
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconClass}`}>
                <card.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2.5 text-xs text-ink-muted">
              {card.key === 'budget' ? `Planned for ${monthLabel(month, true)}.` : card.description}
            </p>
          </Card>
        </motion.div>
      ))}
    </>
  )
}
