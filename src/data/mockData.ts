import type {
  AppData,
  Category,
  Expense,
  SavingsGoal,
} from '../types'

/**
 * Mock data layer.
 * In this phase every read/write stays in local state; the future
 * Node.js + Express service will implement the same actions.
 */

// Current month in the mock timeline: October 2026.
export const MOCK_TODAY = '2026-10-20'
export const CURRENT_MONTH = '2026-10'

const e = (id: string, title: string, amount: number, category: Category, date: string, notes?: string): Expense => ({
  id,
  title,
  amount,
  category,
  date,
  notes,
})

const october: Expense[] = [
  e('oct-01', 'Stationery restock', 95, 'Study', '2026-10-01', 'Pens, sticky notes and registers'),
  e('oct-02', 'Chai at the hostel tapri', 30, 'Snacks', '2026-10-02'),
  e('oct-03', 'Canteen breakfast', 60, 'Food', '2026-10-03'),
  e('oct-04', 'Rickshaw to campus', 40, 'Transport', '2026-10-04'),
  e('oct-05', 'Assignment photocopies', 25, 'Study', '2026-10-05'),
  e('oct-06', 'Chai and biscuits', 35, 'Snacks', '2026-10-06'),
  e('oct-07', 'Canteen lunch', 90, 'Food', '2026-10-07'),
  e('oct-08', 'Weekend movie with friends', 140, 'Entertainment', '2026-10-08'),
  e('oct-09', 'Fruit stall basket', 120, 'Food', '2026-10-09', 'Bananas and apples for the week'),
  e('oct-10', 'Bus to market', 50, 'Transport', '2026-10-10'),
  e('oct-11', 'Notebook and pens', 85, 'Study', '2026-10-11'),
  e('oct-12', 'Cafe with roommate', 140, 'Food', '2026-10-12'),
  e('oct-13', 'Laundry tokens', 60, 'Other', '2026-10-13'),
  e('oct-14', 'Evening chai', 30, 'Snacks', '2026-10-14'),
  e('oct-15', "Cake for flatmate's birthday", 220, 'Food', '2026-10-15'),
  e('oct-16', 'Bus card recharge', 100, 'Transport', '2026-10-16'),
  e('oct-17', 'Haircut', 120, 'Other', '2026-10-17'),
  e('oct-18', 'Reference book (used)', 199, 'Study', '2026-10-18', 'Second-hand from the senior book sale'),
  e('oct-19', 'Canteen dinner', 110, 'Food', '2026-10-19'),
  e('oct-20', 'Chai and sandwich', 65, 'Snacks', '2026-10-20'),
  e('oct-21', 'Mobile data pack', 199, 'Other', '2026-10-20', '28-day plan'),
  e('oct-22', 'Snacks for late night study', 55, 'Snacks', '2026-10-19'),
]

const september: Expense[] = [
  e('sep-01', 'Canteen lunch', 85, 'Food', '2026-09-01'),
  e('sep-02', 'Rickshaw to campus', 40, 'Transport', '2026-09-02'),
  e('sep-03', 'Chai at the tapri', 30, 'Snacks', '2026-09-03'),
  e('sep-04', 'Photocopies and printing', 40, 'Study', '2026-09-04'),
  e('sep-05', 'Dinner out with friends', 180, 'Food', '2026-09-05'),
  e('sep-06', 'Movie at the nearby cinema', 150, 'Entertainment', '2026-09-06'),
  e('sep-08', 'Laundry and misc', 80, 'Other', '2026-09-08'),
  e('sep-09', 'Canteen breakfast', 55, 'Food', '2026-09-09'),
  e('sep-11', 'Notebook and pens', 75, 'Study', '2026-09-11'),
  e('sep-12', 'Bus card recharge', 100, 'Transport', '2026-09-12'),
  e('sep-14', 'Chai and samosa', 45, 'Snacks', '2026-09-14'),
  e('sep-15', 'Cafe with roommate', 130, 'Food', '2026-09-15'),
  e('sep-17', 'Phone case', 149, 'Shopping', '2026-09-17'),
  e('sep-19', 'Late night maggi', 50, 'Snacks', '2026-09-19'),
  e('sep-21', 'Groceries from the nearby store', 210, 'Food', '2026-09-21'),
  e('sep-23', 'Rickshaw and metro', 60, 'Transport', '2026-09-23'),
  e('sep-25', 'Fest entry and food stalls', 170, 'Entertainment', '2026-09-25', 'Freshers fest'),
  e('sep-28', 'Canteen dinner', 95, 'Food', '2026-09-28'),
  e('sep-30', 'Chai and sandwich', 60, 'Snacks', '2026-09-30'),
]

const august: Expense[] = [
  e('aug-02', 'Canteen lunch', 80, 'Food', '2026-08-02'),
  e('aug-05', 'Rickshaw to campus', 35, 'Transport', '2026-08-05'),
  e('aug-08', 'Snacks run', 65, 'Snacks', '2026-08-08'),
  e('aug-11', 'Photocopies', 30, 'Study', '2026-08-11'),
  e('aug-14', 'Dinner out', 160, 'Food', '2026-08-14'),
  e('aug-17', 'Bus card recharge', 100, 'Transport', '2026-08-17'),
  e('aug-20', 'Haircut', 100, 'Other', '2026-08-20'),
  e('aug-24', 'Notebook pack', 90, 'Study', '2026-08-24'),
  e('aug-27', 'Weekend movie', 130, 'Entertainment', '2026-08-27'),
  e('aug-30', 'Groceries', 205, 'Food', '2026-08-30'),
]

const goals: SavingsGoal[] = [
  {
    id: 'goal-1',
    name: 'Emergency fund',
    target: 5000,
    saved: 1500,
    targetDate: '2026-12-31',
  },
  {
    id: 'goal-2',
    name: 'New headphones',
    target: 1200,
    saved: 780,
    targetDate: '2026-11-15',
  },
]

export const mockData: AppData = {
  expenses: [...october, ...september, ...august],
  budget: {
    monthly: 3000,
    categoryBudgets: {
      Food: 1200,
      Transport: 400,
      Snacks: 350,
      Study: 250,
      Shopping: 300,
      Entertainment: 100,
      Other: 400,
    },
  },
  goals,
  profile: {
    name: 'Aarav Sharma',
    nickname: 'Aarav',
    email: 'aarav.sharma@university.edu',
    college: 'Green Valley University',
  },
  preferences: {
    theme: 'light',
    currency: 'INR',
    monthlyBudgetReminder: true,
    categoryLimitAlerts: true,
    weeklySummary: false,
    savingsGoalUpdates: true,
  },
  notifications: [
    {
      id: 'n-1',
      title: 'You are on track',
      body: "You have spent ₹1,850 of your ₹3,000 October budget. Keep going!",
      date: '2026-10-20',
      read: false,
    },
    {
      id: 'n-2',
      title: 'Snacks budget 45% used',
      body: '₹130 of ₹350 used this month.',
      date: '2026-10-19',
      read: false,
    },
    {
      id: 'n-3',
      title: 'Weekly summary ready',
      body: 'Tap Analytics to review last week compared to this week.',
      date: '2026-10-18',
      read: true,
    },
  ],
}
