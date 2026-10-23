import { mockData } from '../data/mockData'
import type { AppData } from '../types'

const STORAGE_KEY = 'hostelers_app_data'

function getInitialState(): AppData {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored) as AppData
      }
    } catch (e) {
      console.warn('Failed to load data from localStorage', e)
    }
  }
  return JSON.parse(JSON.stringify(mockData)) as AppData
}

type Listener = (data: AppData) => void

const listeners = new Set<Listener>()
let state: AppData = getInitialState()

function persistState() {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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

/** Send Google ID token to backend for verification. */
export async function loginWithGoogle(credential: string): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    window.fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: credential }),
      credentials: 'include',
    })
      .then((resp) => resp.json())
      .then((data) => {
        if (data.ok) {
          resolve({ ok: true })
        } else {
          resolve({ ok: false, error: data.error || 'Authentication failed.' })
        }
      })
      .catch(() => {
        resolve({ ok: false, error: 'Backend unavailable.' })
      })
  })
}
