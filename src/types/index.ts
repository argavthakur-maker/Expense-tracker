/**
 * Hostelers — shared TypeScript interfaces.
 * These mirror the shape a future Node.js API will return, so the UI
 * layer survives the backend integration unchanged.
 */

export type Category =
  | 'Food'
  | 'Snacks'
  | 'Transport'
  | 'Study'
  | 'Shopping'
  | 'Entertainment'
  | 'Other'

export const CATEGORIES: Category[] = [
  'Food',
  'Snacks',
  'Transport',
  'Study',
  'Shopping',
  'Entertainment',
  'Other',
]

export interface Expense {
  id: string
  title: string
  amount: number
  category: Category
  /** ISO date string, yyyy-mm-dd */
  date: string
  notes?: string
}

export interface ExpenseDraft {
  title: string
  amount: number
  category: Category
  date: string
  notes?: string
}

export interface CategoryBudgets {
  [category: string]: number
}

export interface Budget {
  monthly: number
  categoryBudgets: CategoryBudgets
}

export interface SavingsGoal {
  id: string
  name: string
  target: number
  saved: number
  /** ISO date string, yyyy-mm-dd */
  targetDate: string
}

export interface UserProfile {
  name: string
  nickname: string
  email: string
  college: string
}

export type ThemePreference = 'light' | 'dark'
export type CurrencyPreference = 'INR'
export type RangeFilter = 'week' | 'month' | 'last-month'

export interface Preferences {
  theme: ThemePreference
  currency: CurrencyPreference
  monthlyBudgetReminder: boolean
  categoryLimitAlerts: boolean
  weeklySummary: boolean
  savingsGoalUpdates: boolean
}

export interface AppData {
  expenses: Expense[]
  budget: Budget
  goals: SavingsGoal[]
  profile: UserProfile
  preferences: Preferences
  notifications: AppNotification[]
}

export interface AppNotification {
  id: string
  title: string
  body: string
  date: string
  read: boolean
}

/** Chart token — one color per category for charts and badges. */
export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#7655E8',
  Snacks: '#E9A23B',
  Transport: '#20A879',
  Study: '#5B9CF5',
  Shopping: '#E46B9C',
  Entertainment: '#9F8DFF',
  Other: '#929BAD',
}
