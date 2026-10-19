import { CATEGORIES, type Category, type Expense, type SavingsGoal } from '../types'
import { daysInMonth, monthKey, isoDate } from './format'

/**
 * All financial figures displayed anywhere in the app are derived here.
 * Components never hardcode totals, so the numbers stay consistent when
 * the mock data — or a future API — changes.
 */

export function totalSpent(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}

/** Expenses within a single month, grouped by ISO day. */
export function dailyTotals(expenses: Expense[]): { date: string; amount: number }[] {
  const map = new Map<string, number>()
  for (const e of expenses) {
    map.set(e.date, (map.get(e.date) ?? 0) + e.amount)
  }
  return [...map.entries()]
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Totals per category for breakdowns and donut charts. */
export function categoryTotals(expenses: Expense[]): { category: Category; amount: number }[] {
  const totals = CATEGORIES.map((category) => ({ category, amount: 0 }))
  const index = new Map<Category, number>(totals.map((t, i) => [t.category, i]))
  for (const e of expenses) {
    const i = index.get(e.category)
    if (i !== undefined) totals[i].amount += e.amount
  }
  return totals.filter((t) => t.amount > 0).sort((a, b) => b.amount - a.amount)
}

export interface MonthSummary {
  month: string
  total: number
}

/** Expenses bucketed by month, ascending — used for monthly history. */
export function monthlyTotals(expenses: Expense[]): MonthSummary[] {
  const map = new Map<string, number>()
  for (const e of expenses) {
    const key = monthKey(e.date)
    map.set(key, (map.get(key) ?? 0) + e.amount)
  }
  return [...map.keys()]
    .sort()
    .map((month) => ({ month, total: map.get(month) ?? 0 }))
}

/** Days elapsed and remaining within the month of an ISO date. */
export function monthProgress(isoToday: string): { daysElapsed: number; daysRemaining: number; totalDays: number } {
  const totalDays = daysInMonth(isoToday.slice(0, 7))
  const dayOfMonth = Number(isoToday.slice(8, 10))
  return {
    daysElapsed: dayOfMonth,
    daysRemaining: totalDays - dayOfMonth,
    totalDays,
  }
}

export interface SpendingPlan {
  budget: number
  spent: number
  remaining: number
  usagePct: number
  daysRemaining: number
  safeDaily: number
  avgDaily: number
}

/** The single source of truth for headline dashboard figures. */
export function spendingPlan(expenses: Expense[], budget: number, isoToday: string): SpendingPlan {
  const spent = totalSpent(expenses)
  const { daysRemaining, } = monthProgress(isoToday)
  const remaining = budget - spent
  return {
    budget,
    spent,
    remaining,
    usagePct: budget > 0 ? Math.min(100, (spent / budget) * 100) : 0,
    daysRemaining,
    safeDaily: daysRemaining > 0 ? Math.max(0, remaining / daysRemaining) : 0,
    avgDaily: monthProgress(isoToday).daysElapsed > 0 ? spent / monthProgress(isoToday).daysElapsed : 0,
  }
}

/** All expenses within a calendar "week so far", Monday to today. */
export function thisWeeksExpenses(expenses: Expense[], isoToday: string): Expense[] {
  const today = new Date(isoToday + 'T00:00:00')
  const day = today.getDay() === 0 ? 6 : today.getDay() - 1 // Monday index
  const monday = new Date(today)
  monday.setDate(today.getDate() - day)
  const mondayIso = isoDate(monday)
  return expenses.filter((e) => e.date >= mondayIso && e.date <= isoToday)
}

/** Expenses for the previous full Monday–Sunday week relative to isoToday. */
export function lastWeeksExpenses(expenses: Expense[], isoToday: string): Expense[] {
  const today = new Date(isoToday + 'T00:00:00')
  const day = today.getDay() === 0 ? 6 : today.getDay() - 1
  const thisMonday = new Date(today)
  thisMonday.setDate(today.getDate() - day)
  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(thisMonday.getDate() - 7)
  const thisMondayIso = isoDate(thisMonday)
  const lastMondayIso = isoDate(lastMonday)
  return expenses.filter((e) => e.date >= lastMondayIso && e.date < thisMondayIso)
}

export interface GoalProgress {
  goal: SavingsGoal
  remaining: number
  pct: number
  complete: boolean
  daysLeft: number
}

export function goalProgress(goal: SavingsGoal, isoToday: string): GoalProgress {
  const remaining = Math.max(0, goal.target - goal.saved)
  const pct = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0
  const target = new Date(goal.targetDate + 'T00:00:00')
  const today = new Date(isoToday + 'T00:00:00')
  const daysLeft = Math.max(0, Math.round((target.getTime() - today.getTime()) / 86400000))
  return { goal, remaining, pct, complete: remaining === 0, daysLeft }
}

export function uid(): string {
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
