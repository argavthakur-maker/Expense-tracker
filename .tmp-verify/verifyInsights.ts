import { bestAiInsight } from '../../src/lib/aiInsights'
import { monthKey } from '../../src/lib/format'
import type { AppData, Expense } from '../../src/types'

const today = '2026-10-28'
const thisMonth = monthKey(today)

function exp(amount: number, category: Expense['category']): Expense {
  return { id: `e${amount}${category}`, title: 'x', amount, category, date: today }
}

const base: AppData = {
  expenses: [],
  budget: { monthly: 3000, categoryBudgets: { Food: 1000 } as Record<string, number> },
  goals: [],
  profile: { name: 'T', nickname: '', email: '', college: '' },
  preferences: {
    theme: 'light',
    currency: 'INR',
    monthlyBudgetReminder: true,
    categoryLimitAlerts: true,
    weeklySummary: false,
    savingsGoalUpdates: true,
  },
  notifications: [],
}

function check(name: string, data: AppData, expect: string) {
  const insight = bestAiInsight(data, today)
  const got = insight ? insight.id : 'none'
  const pass = expect === got
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}: got ${got}${insight ? ` — "${insight.title}: ${insight.body}"` : ''}`)
  if (!pass) process.exitCode = 1
}

// 1. Spending with no budget → setup nudge
check('no budget set', { ...base, budget: { ...base.budget, monthly: 0 }, expenses: [exp(200, 'Food')] }, `ai_setup_${thisMonth}`)

// 2. Under budget, on pace, category fine → none
check('on track', { ...base, expenses: [exp(500, 'Food')] }, 'none')

// 3. Category over its limit → per-category nudge
check('category over limit', { ...base, expenses: [exp(1200, 'Food')] }, `ai_cat_over_Food_${thisMonth}`)

// 4. Category near limit (1000 * 0.9) → near nudge (pace rule must not win)
check('category near limit', { ...base, expenses: [exp(900, 'Food')] }, `ai_cat_near_Food_${thisMonth}`)

// 5. On pace overall but 50% milestone crossed
check('milestone 50pct', { ...base, expenses: [exp(1600, 'Snacks')] }, `ai_milestone_50_${thisMonth}`)

// 6. Ahead of pace before any milestone → pace advice
//    Day 28 of 31 → elapsed 90%; can't be ahead of pace at day 28 without milestone.
//    Use a mid-month date instead.
const midMonth = '2026-10-15'
const midInsight = bestAiInsight({ ...base, expenses: [exp(1800, 'Snacks')] }, midMonth)
console.log(`${midInsight?.id === `ai_pace_${thisMonth}` ? 'PASS' : 'FAIL'} ahead of pace mid-month: got ${midInsight?.id} — "${midInsight?.title}: ${midInsight?.body}"`)
if (midInsight?.id !== `ai_pace_${thisMonth}`) process.exitCode = 1

// 7. Budget exhausted → exhausted nudge wins over category
check('exhausted', { ...base, expenses: [exp(3100, 'Food')] }, `ai_exhausted_${thisMonth}`)

// 8. Milestones don't spam: 50% notified already (read), 75% now → new insight
check('milestone escalation', { ...base, expenses: [exp(1600, 'Snacks'), exp(900, 'Food')], notifications: [{ id: `ai_milestone_50_${thisMonth}`, title: '', body: '', date: today, read: false }] }, `ai_milestone_75_${thisMonth}`)

// 9. No repeat of the same insight
check('no duplicates', { ...base, expenses: [exp(1600, 'Snacks')], notifications: [{ id: `ai_milestone_50_${thisMonth}`, title: '', body: '', date: today, read: true }] }, 'none')

// 10. Preference off → no category nudge
check('cat alerts off', { ...base, preferences: { ...base.preferences, categoryLimitAlerts: false }, expenses: [exp(1200, 'Food')] }, 'none')
