import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MOCK_TODAY } from '../data/mockData'
import * as api from '../services/api'
import type {
  AppData,
  AppNotification,
  Budget,
  Expense,
  ExpenseDraft,
  Preferences,
  SavingsGoal,
  UserProfile,
} from '../types'
import { uid } from '../lib/finance'
import { monthKey } from '../lib/format'
import { SELECTABLE_MONTHS } from '../lib/utils'

interface AppDataValue {
  /** Null while the (mock) data service is hydrating. */
  data: AppData | null
  loading: boolean
  today: string
  /** Month currently selected in the app header, as "yyyy-mm". */
  month: string
  setMonth: (month: string) => void
  /** Expenses of the selected month only. */
  monthExpenses: Expense[]
  addExpense: (draft: ExpenseDraft) => void
  updateExpense: (id: string, draft: ExpenseDraft) => void
  deleteExpense: (id: string) => void
  setMonthlyBudget: (monthly: number) => void
  setCategoryBudget: (category: string, amount: number) => void
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void
  updateGoal: (id: string, goal: Omit<SavingsGoal, 'id'>) => void
  deleteGoal: (id: string) => void
  updateSavedAmount: (id: string, saved: number) => void
  updateProfile: (profile: UserProfile) => void
  updatePreferences: (patch: Partial<Preferences>) => void
  /** Appends a notification unless one with the same id already exists. */
  addNotification: (n: AppNotification) => void
  markNotificationRead: (id: string) => void
}

const AppDataContext = createContext<AppDataValue | null>(null)

/** Months the header offers for selection (mock timeline). */
export { SELECTABLE_MONTHS }

function defaultMonth(): string {
  return MOCK_TODAY.slice(0, 7)
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const [month, setMonth] = useState<string>(defaultMonth)

  useEffect(() => {
    const unsubscribe = api.subscribe(setData)
    api.loadAppData().then((next) => setData(next))
    return unsubscribe
  }, [])

  const mutate = useCallback((fn: (prev: AppData) => AppData) => {
    setData((prev) => {
      if (!prev) return prev
      const next = fn(prev)
      api.saveAppData(next)
      return next
    })
  }, [])

  const value = useMemo<AppDataValue>(() => {
    return {
      data,
      loading: data === null,
      today: MOCK_TODAY,
      month,
      setMonth,
      monthExpenses: data ? data.expenses.filter((e) => monthKey(e.date) === month) : [],
      addExpense: (draft) =>
        mutate((prev) => ({
          ...prev,
          expenses: [{ id: uid(), ...draft }, ...prev.expenses],
        })),
      updateExpense: (id, draft) =>
        mutate((prev) => ({
          ...prev,
          expenses: prev.expenses.map((e) => (e.id === id ? { ...e, ...draft } : e)),
        })),
      deleteExpense: (id) =>
        mutate((prev) => ({ ...prev, expenses: prev.expenses.filter((e) => e.id !== id) })),
      setMonthlyBudget: (monthly) =>
        mutate((prev) => ({ ...prev, budget: { ...prev.budget, monthly } })),
      setCategoryBudget: (category, amount) =>
        mutate((prev) => {
          const categoryBudgets: Budget['categoryBudgets'] = {
            ...prev.budget.categoryBudgets,
            [category]: amount,
          }
          return { ...prev, budget: { ...prev.budget, categoryBudgets } }
        }),
      addGoal: (goal) => mutate((prev) => ({ ...prev, goals: [...prev.goals, { id: uid(), ...goal }] })),
      updateGoal: (id, goal) =>
        mutate((prev) => ({
          ...prev,
          goals: prev.goals.map((g) => (g.id === id ? { ...g, ...goal } : g)),
        })),
      deleteGoal: (id) => mutate((prev) => ({ ...prev, goals: prev.goals.filter((g) => g.id !== id) })),
      updateSavedAmount: (id, saved) =>
        mutate((prev) => ({
          ...prev,
          goals: prev.goals.map((g) => (g.id === id ? { ...g, saved: Math.max(0, saved) } : g)),
        })),
      updateProfile: (profile) => mutate((prev) => ({ ...prev, profile })),
      updatePreferences: (patch) =>
        mutate((prev) => ({ ...prev, preferences: { ...prev.preferences, ...patch } })),
      addNotification: (n) =>
        mutate((prev) => {
          if (prev.notifications.some((m) => m.id === n.id)) return prev
          const notifications = [n, ...prev.notifications].slice(0, 30)
          return { ...prev, notifications }
        }),
      markNotificationRead: (id) =>
        mutate((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
    }
  }, [data, month, mutate])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

/** Hook used by every page to read and mutate app data. */
export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}

