import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Receipt, TrendingUp } from 'lucide-react'
import type { Category, Expense, RangeFilter } from '../types'
import { CATEGORY_COLORS } from '../types'
import { useAppData } from '../hooks/useAppData'
import {
  categoryTotals,
  lastWeeksExpenses,
  spendingPlan,
  thisWeeksExpenses,
  totalSpent,
  monthlyTotals,
} from '../lib/finance'
import { formatINR, monthKey, monthLabel, daysInMonth } from '../lib/format'
import { Card, CardHeader, ProgressBar } from '../components/shared/ui'
import { CategoryIcon } from '../components/shared/CategoryIcon'
import { cn } from '../components/shared/Button'

type TimeFilter = RangeFilter

const FILTERS: { value: TimeFilter; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
]

export function Analytics() {
  const { data, monthExpenses, month, today } = useAppData()
  const [filter, setFilter] = useState<TimeFilter>('month')

  const scoped: Expense[] = useMemo(() => {
    if (!data) return []
    if (filter === 'month') return monthExpenses
    if (filter === 'week') return thisWeeksExpenses(data.expenses, today)
    // Last month, resolved from the selected month
    const [y, m] = month.split('-').map(Number)
    const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
    return data.expenses.filter((e) => monthKey(e.date) === prev)
  }, [data, filter, monthExpenses, month, today])

  const computed = useMemo(() => {
    const spent = totalSpent(scoped)
    const count = scoped.length
    const cats = categoryTotals(scoped).map((c) => ({
      ...c,
      pct: spent > 0 ? Math.round((c.amount / spent) * 100) : 0,
    }))
    const topCategory = cats[0]
    const highest = scoped.reduce<Expense | null>(
      (max, e) => (!max || e.amount > max.amount ? e : max),
      null,
    )
    const days =
      filter === 'week'
        ? 7
        : filter === 'month'
          ? Number(today.slice(8, 10))
          : daysInMonth(
              (() => {
                const [y, m] = month.split('-').map(Number)
                return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
              })()
            )
    const avg = spent / Math.max(1, days)
    const thisWeek = totalSpent(thisWeeksExpenses(data?.expenses ?? [], today))
    const lastWeek = totalSpent(lastWeeksExpenses(data?.expenses ?? [], today))
    const weekDelta = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0
    const history = monthlyTotals(data?.expenses ?? []).map((m) => ({
      ...m,
      label: monthLabel(m.month, true).split(' ')[0],
    }))
    const weekBars = [
      { label: 'Last week', amount: lastWeek },
      { label: 'This week', amount: thisWeek },
    ]
    return { spent, count, cats, topCategory, highest, avg, weekDelta, history, weekBars }
  }, [scoped, data, today, filter, month])

  if (!data) return null

  const plan = spendingPlan(monthExpenses, data.budget.monthly, today)

  return (
    <div className="space-y-5">
      {/* Time filter */}
      <div className="flex items-center gap-1.5 rounded-lg border border-line bg-card p-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'h-8 rounded-md px-3.5 text-[13px] font-medium transition-colors',
              filter === f.value
                ? 'bg-primary-soft text-primary-dark'
                : 'text-ink-secondary hover:text-ink',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total spent', value: formatINR(computed.spent) },
          { label: 'Average per day', value: formatINR(Math.round(computed.avg)) },
          {
            label: 'Top category',
            value: computed.topCategory ? `${computed.topCategory.category}` : '—',
            sub: computed.topCategory ? formatINR(computed.topCategory.amount) : '',
          },
          {
            label: 'Highest expense',
            value: computed.highest ? formatINR(computed.highest.amount) : '—',
            sub: computed.highest?.title,
          },
        ].map((k) => (
          <Card key={k.label} className="p-5">
            <p className="text-xs font-medium text-ink-secondary">{k.label}</p>
            <p className="mt-1.5 font-display text-xl font-bold tnum text-ink">{k.value}</p>
            {k.sub && <p className="mt-0.5 truncate text-xs text-ink-muted">{k.sub}</p>}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Weekly comparison */}
        <Card className="p-6">
          <CardHeader title="Weekly comparison" description="Two most recent calendar weeks." />
          <div className="mt-4" data-testid="weekly-comparison">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={computed.weekBars} barSize={48} margin={{ top: 8, right: 8, left: -16 }}>
                <CartesianGrid vertical={false} stroke="var(--c-border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: 'var(--c-text-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--c-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `₹${v}`}
                />
                <Tooltip
                  cursor={{ fill: 'var(--c-card-soft)' }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border border-line bg-card px-3 py-2 shadow-lift">
                        <p className="text-xs font-semibold text-ink">{label}</p>
                        <p className="mt-0.5 text-xs tnum text-ink-secondary">
                          {formatINR(Number(payload[0].value))} spent
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="amount" fill="#7655E8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p
            className={cn(
              'mt-3 flex items-center gap-1.5 text-[13px] font-medium',
              computed.weekDelta > 0 ? 'text-danger' : 'text-mint',
            )}
          >
            <TrendingUp className={cn('h-3.5 w-3.5', computed.weekDelta > 0 ? '' : 'rotate-180')} />
            {computed.weekDelta >= 0
              ? `You're spending ${Math.abs(Math.round(computed.weekDelta))}% more than last week`
              : `You're spending ${Math.abs(Math.round(computed.weekDelta))}% less than last week`}
          </p>
        </Card>

        {/* Monthly history */}
        <Card className="p-6">
          <CardHeader title="Monthly history" description="Totals across the tracked months." />
          <div className="mt-4" data-testid="monthly-history">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={computed.history} barSize={36} margin={{ top: 8, right: 8, left: -16 }}>
                <CartesianGrid vertical={false} stroke="var(--c-border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: 'var(--c-text-secondary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--c-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `₹${v}`}
                />
                <Tooltip
                  cursor={{ fill: 'var(--c-card-soft)' }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border border-line bg-card px-3 py-2 shadow-lift">
                        <p className="text-xs font-semibold text-ink">{label} 2026</p>
                        <p className="mt-0.5 text-xs tnum text-ink-secondary">
                          {formatINR(Number(payload[0].value))} spent
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="total" fill="#20A879" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Category breakdown table */}
      <Card className="p-6">
        <CardHeader
          title="Category breakdown"
          description={`${FILTERS.find((f) => f.value === filter)?.label}: ${formatINR(computed.spent)} across ${computed.count} ${computed.count === 1 ? 'transaction' : 'transactions'}.`}
        />
        {computed.cats.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Receipt className="h-10 w-10 text-ink-muted" />
            <p className="mt-3 text-sm font-semibold text-ink">Nothing to analyse yet</p>
            <p className="mt-1 max-w-xs text-[13px] text-ink-muted">
              Track expenses in this period and the breakdown appears here.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-4">
            {computed.cats.map((c) => (
              <li key={c.category} className="flex items-center gap-4">
                <CategoryIcon category={c.category as Category} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[13px] font-medium text-ink">{c.category}</p>
                    <p className="text-[13px] tnum text-ink-secondary">
                      {formatINR(c.amount)}
                      <span className="ml-1.5 text-ink-muted">{c.pct}%</span>
                    </p>
                  </div>
                  <ProgressBar
                    pct={c.pct}
                    color={CATEGORY_COLORS[c.category]}
                    className="mt-1.5 h-1.5"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 rounded-lg bg-card-soft px-3.5 py-2.5 text-[13px] text-ink-secondary">
          {monthLabel(month)} budget pace: {Math.round(plan.usagePct)}% of {formatINR(data.budget.monthly)} used
          with {plan.daysRemaining} days to go.
        </p>
      </Card>
    </div>
  )
}
