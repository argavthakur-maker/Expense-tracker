import type {
  AppData,
} from '../types'

/**
  * Dynamic initial application date helpers.
 */
const now = new Date()
export const CURRENT_DATE = now.toISOString().slice(0, 10)
export const CURRENT_MONTH = CURRENT_DATE.slice(0, 7)
export const MOCK_TODAY = CURRENT_DATE

/**
 * Clean initial data schema for deployment.
 */
export const initialData: AppData = {
  expenses: [],
  budget: {
    monthly: 0,
    categoryBudgets: {
      Food: 0,
      Snacks: 0,
      Transport: 0,
      Study: 0,
      Shopping: 0,
      Entertainment: 0,
      Other: 0,
    },
  },
  goals: [],
  profile: {
    name: '',
    nickname: '',
    email: '',
    college: '',
  },
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

export const mockData = initialData
