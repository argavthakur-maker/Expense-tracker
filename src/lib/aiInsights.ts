import type { AppData, Category, AppNotification } from '../types'
import { formatINR, monthKey } from './format'
import { categoryTotals, monthProgress, spendingPlan } from './finance'

/**
 * Gix suggestions derived locally from the user's own numbers.
 *
 * Why rules instead of a Gemini call per notification:
 * - Values are read from the user's real expenses and budgets, so every line
 *   can be traced back to actual figures — no hallucinated amounts.
 * - Zero network latency and cost; insights recompute in microseconds on
 *   every data change, exactly like the dashboard does.
 *
 * Each insight has a stable signature (what happened + the month) printed
 * into the notification id, so the same event can never notify twice.
 */

export interface AiInsight {
  /** Deduped signature id — also the id of the generated notification. */
  id: string
  title: string
  body: string
  /** Priority decides which insight to surface when several apply at once. */
  priority: number
}

const MACRO_STEPS = [50, 75, 90] as const

/** Highest-priority insight that currently applies, or null when nothing does. */
export function bestAiInsight(data: AppData, isoToday: string): AiInsight | null {
  const insights = aiInsights(data, isoToday)
  if (insights.length === 0) return null
  return insights.reduce((a, b) => (a.priority >= b.priority ? a : b))
}

/** All insights that currently apply, sorted by priority (highest first). */
export function aiInsights(data: AppData, isoToday: string): AiInsight[] {
  const now = monthKey(isoToday)
  const monthExpenses = data.expenses.filter((e) => monthKey(e.date) === now)
  const budget = data.budget.monthly
  const results: AiInsight[] = []

  // No budget yet, but the user is already spending — the single most useful nudge.
  if (budget <= 0) {
    if (monthExpenses.length > 0) {
      const spent = monthExpenses.reduce((s, e) => s + e.amount, 0)
      results.push({
        id: `ai_setup_${now}`,
        title: 'Set a monthly budget to unlock suggestions',
        body: `You have spent ${formatINR(spent)} this month without a budget. Open the Budget Planner and enter your monthly pocket money so I can keep you on track.`,
        priority: 100,
      })
    }
    return results
  }

  const plan = spendingPlan(monthExpenses, budget, isoToday)
  const topCategory = categoryTotals(monthExpenses)[0]

  // Budget exhausted.
  if (plan.spent >= budget) {
    const overBy = formatINR(plan.spent - budget)
    const cut = topCategory
      ? ` Biggest pressure point: ${topCategory.category} at ${formatINR(topCategory.amount)}. Pausing non-essential spending there helps the most.`
      : ''
    results.push({
      id: `ai_exhausted_${now}`,
      title: 'Budget used up',
      body: `You are ${overBy} over your ${formatINR(budget)} budget this month.${cut}`,
      priority: 90,
    })
    return results
  }

  if (monthExpenses.length === 0) return results
  if (!data.preferences.monthlyBudgetReminder) return budgetMilestonesOnly(budget, plan, now)

  // Track where the month stands so "pace" advice stays honest.
  const { daysElapsed, daysRemaining, totalDays } = monthProgress(isoToday)
  const elapsedPct = (daysElapsed / totalDays) * 100
  const bucket = [...MACRO_STEPS].reverse().find((s) => plan.usagePct >= s)

  if (bucket) {
    results.push({
      id: `ai_milestone_${bucket}_${now}`,
      title: `${bucket} of your budget is gone`,
      body: `${formatINR(plan.spent)} spent with ${daysRemaining} days left. Staying within about ${formatINR(plan.safeDaily)} a day gets you to the end of the month.`,
      priority: 80,
    })
  } else if (plan.usagePct > elapsedPct + 12 && elapsedPct >= 10) {
    const endOfTrack = Math.max(0, elapsedPct)
    results.push({
      id: `ai_pace_${now}`,
      title: 'Spending faster than the month',
      body: `By day ${daysElapsed} of ${totalDays} you would have used about ${Math.round(endOfTrack)}% of your budget — you are at ${Math.round(plan.usagePct)}%. Keep daily spending near ${formatINR(plan.safeDaily)} to recalibrate.`,
      priority: 70,
    })
  }

  const catInsight = categoryInsight(data, now)
  if (catInsight) results.push(catInsight)

  return results
}

/** Milestone alerts that survive even when the reminder preference is off. */
function budgetMilestonesOnly(budget: number, plan: ReturnType<typeof spendingPlan>, now: string): AiInsight[] {
  if (plan.spent >= budget) {
    return [
      {
        id: `ai_exhausted_${now}`,
        title: 'Budget used up',
        body: `You are ${formatINR(plan.spent - budget)} over your ${formatINR(budget)} budget this month.`,
        priority: 90,
      },
    ]
  }
  return []
}

/** Over-budget beats "almost over-budget": one category nudge at a time. */
function categoryInsight(data: AppData, now: string): AiInsight | null {
  if (!data.preferences.categoryLimitAlerts) return null

  const monthExpenses = data.expenses.filter((e) => monthKey(e.date) === now)
  const spentByCat = new Map<Category, number>()
  for (const e of monthExpenses) {
    spentByCat.set(e.category, (spentByCat.get(e.category) ?? 0) + e.amount)
  }

  let over: { category: Category; spent: number; limit: number } | null = null
  let near: { category: Category; spent: number; limit: number } | null = null
  for (const [category, spent] of spentByCat) {
    const limit = data.budget.categoryBudgets[category] ?? 0
    if (limit <= 0) continue
    if (spent > limit && (!over || spent - limit > over.spent - over.limit)) {
      over = { category, spent, limit }
    } else if (spent >= limit * 0.8 && spent <= limit && (!near || spent / limit > near.spent / near.limit)) {
      near = { category, spent, limit }
    }
  }

  if (over) {
    return {
      id: `ai_cat_over_${over.category}_${now}`,
      title: `${over.category} is over its limit`,
      body: `${over.category} hit ${formatINR(over.spent)} against a ${formatINR(over.limit)} limit — ${formatINR(over.spent - over.limit)} over. Consider pausing ${over.category.toLowerCase()} spending for the rest of the month, or raising its limit in the Budget Planner.`,
      priority: 85,
    }
  }
  if (near) {
    return {
      id: `ai_cat_near_${near.category}_${now}`,
      title: `${near.category} nearing its limit`,
      body: `${near.category} has used ${formatINR(near.spent)} of its ${formatINR(near.limit)} limit. About ${formatINR(near.limit - near.spent)} left this month.`,
      priority: 60,
    }
  }
  return null
}

/** Turns an insight into the persisted notification record. */
export function insightToNotification(insight: AiInsight, isoToday: string): AppNotification {
  return { id: insight.id, title: insight.title, body: insight.body, date: isoToday, read: false }
}

