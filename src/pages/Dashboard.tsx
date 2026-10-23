import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Lightbulb, Plus, Receipt } from 'lucide-react'
import { useAppData } from '../hooks/useAppData'
import { categoryTotals, dailyTotals, spendingPlan, totalSpent } from '../lib/finance'
import { formatINR, dayLabel, monthLabel } from '../lib/format'
import { Card, CardHeader, ProgressBar, Skeleton } from '../components/shared/ui'
import { Button } from '../components/shared/Button'
import { CategoryIcon } from '../components/shared/CategoryIcon'
import { StatCards } from '../components/dashboard/StatCards'
import { CategoryDonut, CategoryLegend, SpendingTrend } from '../components/dashboard/charts'
import { cn } from '../components/shared/Button'
import { categoryBadgeStyle } from '../lib/utils'
import { EmptyState } from '../components/shared/ui'

export function Dashboard() {
  const { data, monthExpenses, month, today, loading } = useAppData()
  const navigate = useNavigate()

  if (loading || !data) {
    return <DashboardSkeleton />
  }

  const plan = spendingPlan(monthExpenses, data.budget.monthly, today)
  const donut = categoryTotals(monthExpenses).map((c) => ({
    ...c,
    pct: totalSpent(monthExpenses) > 0 ? Math.round((c.amount / totalSpent(monthExpenses)) * 100) : 0,
  }))
  const recent = [...monthExpenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <StatCards plan={plan} month={month} />

      {/* Budget overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="md:col-span-2 xl:col-span-4"
      >
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-semibold text-ink">{monthLabel(month)} budget</h3>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                {plan.daysRemaining} days left to keep things on track.
              </p>
            </div>
            <div className="flex items-baseline gap-2 rounded-lg bg-primary-soft px-3 py-1.5">
              <span className="text-lg font-bold tnum text-primary-dark">{Math.round(plan.usagePct)}%</span>
              <span className="text-xs font-medium text-primary-dark/80">of budget used</span>
            </div>
          </div>

          <ProgressBar pct={plan.usagePct} className="mt-4 h-2.5" color={'var(--c-primary)'} />

          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
            <div>
              <span className="text-ink-muted">Budget</span>{' '}
              <span className="font-semibold tnum text-ink">{formatINR(plan.budget)}</span>
            </div>
            <div>
              <span className="text-ink-muted">Spent</span>{' '}
              <span className="font-semibold tnum text-ink">{formatINR(plan.spent)}</span>
            </div>
            <div>
              <span className="text-ink-muted">Remaining</span>{' '}
              <span
                className={cn(
                  'font-semibold tnum',
                  plan.remaining < 0 ? 'text-danger' : 'text-mint',
                )}
              >
                {formatINR(plan.remaining)}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Spending trend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="xl:col-span-2"
      >
        <Card className="p-6">
          <CardHeader
            title="Spending trend"
            description="Day-wise spending across the selected month."
          />
          {monthExpenses.length === 0 ? (
            <EmptyState
              icon={<Receipt />}
              title="No spending recorded"
              message="Track expenses this month to see your day-by-day spending trend."
              className="py-10"
            />
          ) : (
            <div className="mt-4">
              <SpendingTrend data={dailyTotals(monthExpenses)} />
            </div>
          )}
        </Card>
      </motion.div>

      {/* Category breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <Card className="p-6">
          <CardHeader title="Where it goes" description="Breakdown by category." />
          {donut.length === 0 ? (
            <EmptyState
              icon={<Receipt />}
              title="No expenses yet"
              message="Add your first expense to see the category split."
              className="py-8"
            />
          ) : (
            <>
              <div className="mt-2">
                <CategoryDonut data={donut} />
              </div>
              <div className="mt-4">
                <CategoryLegend data={donut} />
              </div>
            </>
          )}
        </Card>
      </motion.div>

      {/* Right column: smart tip + recent */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="flex flex-col gap-5 xl:col-span-1"
      >
        <div className="overflow-hidden rounded-xl2 border border-line bg-gradient-to-br from-[#7655E8] to-[#5F3FD6] p-5 text-white shadow-pop">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <Lightbulb className="h-4 w-4" />
            </span>
            <p className="text-[13px] font-semibold">Smart money tip</p>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-white/90">
            {tipCopy(plan.remaining, plan.daysRemaining, Math.round(plan.safeDaily))}
          </p>
        </div>

        <Card className="flex flex-1 flex-col p-6">
          <CardHeader
            title="Recent expenses"
            action={
              <button
                onClick={() => navigate('/app/expenses')}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-primary transition-colors hover:text-[var(--c-primary-dark)]"
              >
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            }
          />
          {recent.length === 0 ? (
            <EmptyState
              icon={<Receipt />}
              title="Nothing tracked yet"
              message="Your latest entries will appear here."
              className="py-8"
            />
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {recent.map((e) => {
                const badge = categoryBadgeStyle(e.category)
                return (
                  <li key={e.id} className="flex items-center gap-3 py-3">
                    <CategoryIcon category={e.category} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{e.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {dayLabel(e.date)} · <span style={{ color: badge.text }}>{e.category}</span>
                      </p>
                    </div>
                    <span className="shrink-0 text-[13px] font-semibold tnum text-ink">
                      {formatINR(e.amount)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="mt-auto pt-4">
            <Button
              variant="secondary"
              className="w-full"
              icon={<Plus />}
              onClick={() => navigate('/app/expenses?new=1')}
            >
              Add expense
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

/** Same guidance as the highlighted card, computed from live figures. */
function tipCopy(remaining: number, daysRemaining: number, safeDaily: number): string {
  if (remaining <= 0) {
    return 'You have used up your planned budget for this month. Try pausing non-essential spending for the rest of the month, or review your category limits in the Budget Planner.'
  }
  if (daysRemaining <= 0) {
    return `The month is nearly over with ${formatINR(remaining)} unspent — a good moment to move it into a savings goal.`
  }
  return `You have ${formatINR(remaining)} remaining and ${daysRemaining} days left. Consider limiting your spending to around ${formatINR(safeDaily)} per day.`
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[132px]" />
      ))}
      <Skeleton className="h-[145px] md:col-span-2 xl:col-span-4" />
      <Skeleton className="h-[320px] xl:col-span-2" />
      <Skeleton className="h-[320px]" />
      <Skeleton className="h-[320px]" />
    </div>
  )
}

