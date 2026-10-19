import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Pencil, Wallet } from 'lucide-react'
import { CATEGORIES, CATEGORY_COLORS, type Category } from '../types'
import { useAppData } from '../hooks/useAppData'
import { spendingPlan, totalSpent } from '../lib/finance'
import { formatINR, monthLabel } from '../lib/format'
import { Card, CardHeader, ProgressBar } from '../components/shared/ui'
import { Button } from '../components/shared/Button'
import { Field, Input } from '../components/shared/Input'
import { Modal } from '../components/shared/Modal'
import { useToast } from '../components/shared/Toast'

export function Budget() {
  const { data, monthExpenses, month, today, setMonthlyBudget, setCategoryBudget } = useAppData()
  const { toast } = useToast()

  const [budgetOpen, setBudgetOpen] = useState(false)
  const [budgetDraft, setBudgetDraft] = useState('')
  const [budgetErr, setBudgetErr] = useState<string | undefined>()

  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [catDraft, setCatDraft] = useState('')
  const [catErr, setCatErr] = useState<string | undefined>()

  if (!data) return null

  const budget = data.budget.monthly
  const { categoryBudgets } = data.budget
  const plan = spendingPlan(monthExpenses, budget, today)
  const allocated = CATEGORIES.reduce((s, c) => s + (categoryBudgets[c] ?? 0), 0)
  const unallocated = budget - allocated

  const saveBudget = () => {
    const n = Number(budgetDraft)
    if (!Number.isFinite(n) || n <= 0) {
      setBudgetErr('Enter your monthly pocket money, for example 3000.')
      return
    }
    setMonthlyBudget(n)
    setBudgetOpen(false)
    toast(`Monthly budget set to ${formatINR(n)}`, 'success')
  }

  const saveCategory = () => {
    if (!editingCat) return
    const n = Number(catDraft)
    if (!Number.isFinite(n) || n < 0) {
      setCatErr('Enter an amount, or zero for no allocation.')
      return
    }
    setCategoryBudget(editingCat, n)
    setEditingCat(null)
    toast(`${editingCat} allocation set to ${formatINR(n)}`, 'success')
  }

  return (
    <div className="space-y-5">
      {/* Monthly summary */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">{monthLabel(month)} pocket money</h2>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              {Math.round(plan.usagePct)}% used · {plan.daysRemaining} days remaining
            </p>
          </div>
          <Button
            variant="outline"
            icon={<Pencil />}
            onClick={() => {
              setBudgetDraft(String(budget))
              setBudgetErr(undefined)
              setBudgetOpen(true)
            }}
          >
            Edit pocket money
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Pocket money', value: formatINR(budget) },
            { label: 'Spent so far', value: formatINR(plan.spent) },
            {
              label: 'Remaining',
              value: formatINR(plan.remaining),
              tone: plan.remaining < 0 ? 'text-danger' : 'text-mint',
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-line bg-card-soft p-4">
              <p className="text-xs font-medium text-ink-secondary">{s.label}</p>
              <p className={`mt-1 font-display text-2xl font-bold tnum ${s.tone ?? 'text-ink'}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <ProgressBar pct={plan.usagePct} className="mt-5" color={plan.usagePct > 100 ? 'var(--c-danger)' : 'var(--c-primary)'} />
      </Card>

      {/* Category allocations */}
      <Card className="p-6">
        <CardHeader
          title="Category-wise plan"
          description={`Allocated ${formatINR(allocated)} of ${formatINR(budget)} · ${formatINR(unallocated)} unallocated.`}
          action={
            <span className="hidden rounded-lg bg-card-soft px-3 py-1.5 text-xs font-medium text-ink-secondary sm:block">
              Spent · budget
            </span>
          }
        />
        <ul className="mt-5 space-y-5">
          {CATEGORIES.map((cat) => {
            const limit = categoryBudgets[cat] ?? 0
            const spent = totalSpent(monthExpenses.filter((e) => e.category === cat))
            const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
            const nearLimit = limit > 0 && pct >= 80
            const overLimit = limit > 0 && spent > limit
            return (
              <motion.li
                key={cat}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                    aria-hidden="true"
                  />
                  <p className="flex-1 text-sm font-medium text-ink">{cat}</p>
                  <p className="text-[13px] tnum text-ink-secondary">
                    {formatINR(spent)}{' '}
                    <span className="text-ink-muted">/ {limit > 0 ? formatINR(limit) : 'no limit'}</span>
                  </p>
                  <button
                    aria-label={`Edit ${cat} budget`}
                    onClick={() => {
                      setEditingCat(cat)
                      setCatDraft(String(limit))
                      setCatErr(undefined)
                    }}
                    className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                {limit > 0 && (
                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar
                      pct={pct}
                      color={overLimit ? 'var(--c-danger)' : nearLimit ? 'var(--c-warning)' : CATEGORY_COLORS[cat]}
                      className="flex-1 h-1.5"
                    />
                    <span className="w-9 text-right text-2xs font-medium tnum text-ink-muted">
                      {Math.round(pct)}%
                    </span>
                  </div>
                )}
                {(overLimit || nearLimit) && limit > 0 && (
                  <p
                    className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${
                      overLimit ? 'text-danger' : 'text-[var(--c-warning)]'
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {overLimit
                      ? `Over budget by ${formatINR(spent - limit)} — consider reallocating.`
                      : `Approaching your ${formatINR(limit)} ${cat.toLowerCase()} limit.`}
                  </p>
                )}
              </motion.li>
            )
          })}
        </ul>
        {unallocated > 0 && (
          <p className="mt-5 flex items-center gap-2 rounded-lg bg-primary-soft px-3.5 py-2.5 text-[13px] text-primary-dark">
            <Wallet className="h-4 w-4 shrink-0" />
            {formatINR(unallocated)} of your pocket money is not allocated yet — give it a purpose below.
          </p>
        )}
      </Card>

      {/* Pocket money modal */}
      <Modal
        open={budgetOpen}
        onClose={() => setBudgetOpen(false)}
        title="Monthly pocket money"
        description="How much do you receive each month?"
        footer={
          <div className="flex justify-end gap-2.5">
            <Button variant="ghost" onClick={() => setBudgetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveBudget}>Save budget</Button>
          </div>
        }
      >
        <Field label="Amount" required error={budgetErr} hint="Category allocations do not change when you edit this.">
          <Input
            inputMode="decimal"
            value={budgetDraft}
            prefix="₹"
            error={!!budgetErr}
            onChange={(e) => setBudgetDraft(e.target.value)}
            className="text-lg"
          />
        </Field>
      </Modal>

      {/* Category allocation modal */}
      <Modal
        open={editingCat !== null}
        onClose={() => setEditingCat(null)}
        title={`${editingCat ?? ''} allocation`}
        description="Optional limit to keep one category in check."
        footer={
          <div className="flex justify-end gap-2.5">
            <Button variant="ghost" onClick={() => setEditingCat(null)}>
              Cancel
            </Button>
            <Button onClick={saveCategory}>Save allocation</Button>
          </div>
        }
      >
        <Field label="Amount" required error={catErr}>
          <Input
            inputMode="decimal"
            value={catDraft}
            prefix="₹"
            error={!!catErr}
            onChange={(e) => setCatDraft(e.target.value)}
            className="text-lg"
          />
        </Field>
      </Modal>
    </div>
  )
}
