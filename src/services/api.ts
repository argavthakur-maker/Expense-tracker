import { mockData } from '../data/mockData'
import type { AppData } from '../types'

const STORAGE_KEY = 'hostelers_app_data'
/** Remembers which account the local data belongs to. */
const ACCOUNT_KEY = 'hostelers_current_account'
/** Legacy single-user key used before per-account storage; migrated once. */
const LEGACY_KEY = STORAGE_KEY

// In production, set VITE_API_URL to the deployed backend URL.
// In local development, an empty base URL keeps using the Vite /api proxy.
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

/** Data slice key for an account ('guest' when nobody is signed in). */
function accountKey(email: string | null): string {
  return `${STORAGE_KEY}:${email ? email.toLowerCase().trim() : 'guest'}`
}

function storedAccount(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(ACCOUNT_KEY)
  } catch (e) {
    console.warn('Failed to read current account', e)
    return null
  }
}

function loadStateFor(email: string | null): AppData {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(accountKey(email))
      if (stored) {
        return JSON.parse(stored) as AppData
      }

      // One-time migration: old builds kept everything under one shared key.
      // Tie that data to the first account that signs in after this update,
      // then remove the shared key so later accounts get a fresh dashboard
      // instead of inheriting it.
      if (email) {
        const legacy = window.localStorage.getItem(LEGACY_KEY)
        if (legacy) {
          window.localStorage.setItem(accountKey(email), legacy)
          window.localStorage.removeItem(LEGACY_KEY)
          return JSON.parse(legacy) as AppData
        }
      }
    } catch (e) {
      console.warn('Failed to load data from localStorage', e)
    }
  }
  return JSON.parse(JSON.stringify(mockData)) as AppData
}

function getInitialState(): AppData {
  return loadStateFor(storedAccount())
}

/**
 * Switches the local data store to the given account's own slice so each
 * signed-in user gets a fresh dashboard instead of another user's data.
 * Pass null to return to the unsigned 'guest' slice (used on logout).
 */
export function setCurrentAccount(email: string | null): void {
  if (typeof window !== 'undefined') {
    try {
      if (email) {
        window.localStorage.setItem(ACCOUNT_KEY, email.toLowerCase().trim())
      } else {
        window.localStorage.removeItem(ACCOUNT_KEY)
      }
    } catch (e) {
      console.warn('Failed to remember current account', e)
    }
  }
  state = loadStateFor(email)
  emit()
}

type Listener = (data: AppData) => void

const listeners = new Set<Listener>()
let state: AppData = getInitialState()

function persistState() {
  if (typeof window !== 'undefined') {
    try {
      // Write into the signed-in account's own slice ('guest' when nobody
      // is signed in) so data never leaks between accounts.
      window.localStorage.setItem(accountKey(storedAccount()), JSON.stringify(state))
    } catch (e) {
      console.warn('Failed to save data to localStorage', e)
    }
  }
}

function emit() {
  persistState()
  for (const fn of listeners) fn(state)
}

/** Notifies components when data changes. */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getState(): AppData {
  return state
}

/** Loads app data with simulated latency for smooth transitions. */
export function loadAppData(delay = 150): Promise<AppData> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(JSON.parse(JSON.stringify(state)) as AppData), delay)
  })
}

export function saveAppData(next: AppData): AppData {
  state = next
  emit()
  return state
}

/** Shape of the authenticated user returned by the backend. */
export interface AuthUser {
  id: string
  email: string
  name: string
  image: string | null
  provider: string
}

/** Standard authentication endpoints */
export async function login(_email: string, _password: string): Promise<{ ok: boolean }> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve({ ok: true }), 400)
  })
}

export async function signup(_payload: unknown): Promise<{ ok: boolean }> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve({ ok: true }), 400)
  })
}

export async function requestPasswordReset(_email: string): Promise<{ ok: boolean }> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve({ ok: true }), 400)
  })
}

/**
 * Ask Gix — sends the chat history plus a snapshot of the user's real
 * finances to the backend, which forwards it to Gemini. The API key
 * never leaves the server.
 */
export interface GixChatMessage {
  role: 'user' | 'assistant'
  text: string
}

export interface GixChatContext {
  profile?: { name: string; college: string }
  month?: string
  monthlyBudget?: number
  spentThisMonth?: number
  daysRemaining?: number
  weeklyTotal?: number
  categoryTotals?: { category: string; amount: number }[]
  categoryBudgets?: { category: string; amount: number }[]
  recentExpenses?: { date: string; title: string; amount: number; category: string }[]
  goals?: { name: string; target: number; saved: number; targetDate: string }[]
}

export async function askGix(
  messages: GixChatMessage[],
  context: GixChatContext,
): Promise<{ ok: boolean; reply?: string; error?: string }> {
  return new Promise((resolve) => {
    window
      .fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, context }),
      })
      .then((resp) =>
        resp
          .json()
          .catch(() => null)
          .then((data) => {
            if (!resp.ok || !data?.ok) {
              resolve({ ok: false, error: data?.error || 'Gix is unavailable right now.' })
              return
            }
            resolve({ ok: true, reply: data.reply })
          }),
      )
      .catch(() => {
        resolve({ ok: false, error: 'Could not reach the server. Is the backend running?' })
      })
  })
}

/** Send Google ID token to backend for verification. Returns the signed-in user. */
export async function loginWithGoogle(credential: string): Promise<{ ok: boolean; user?: AuthUser; error?: string }> {
  return new Promise((resolve) => {
    window.fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: credential }),
      credentials: 'include',
    })
      .then((resp) => resp.json())
      .then((data) => {
        if (data.ok && data.user) {
          resolve({ ok: true, user: data.user as AuthUser })
        } else {
          resolve({ ok: false, error: data.error || 'Authentication failed.' })
        }
      })
      .catch(() => {
        resolve({ ok: false, error: 'Backend unavailable.' })
      })
  })
}

/** Clears the server session cookie and returns to the unsigned data slice. */
export async function logout(): Promise<void> {
  setCurrentAccount(null)
  window.fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => { /* best effort */ })
}
