import { mockData } from '../data/mockData'
import type { AppData } from '../types'

/**
 * Mock service layer.
 * Each function mirrors the endpoint signature of the future
 * Node.js + Express backend. UI components call this module — never
 * the raw mock data — so the swap is a matter of replacing bodies
 * with fetch() calls.
 */

type Listener = (data: AppData) => void

const listeners = new Set<Listener>()
let state: AppData = JSON.parse(JSON.stringify(mockData)) as AppData

function emit() {
  for (const fn of listeners) fn(state)
}

/** Notifies components when the (mock) data changes. */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getState(): AppData {
  return state
}

/** Simulated latency so loading states behave like the real thing. */
export function loadAppData(delay = 350): Promise<AppData> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(JSON.parse(JSON.stringify(state)) as AppData), delay)
  })
}

export function saveAppData(next: AppData): AppData {
  state = next
  emit()
  return state
}

/** Placeholder for the future POST /api/auth/login. */
export async function login(_email: string, _password: string): Promise<{ ok: boolean }> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve({ ok: true }), 700)
  })
}

/** Placeholder for the future POST /api/auth/signup. */
export async function signup(_payload: unknown): Promise<{ ok: boolean }> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve({ ok: true }), 700)
  })
}

/** Placeholder for the future POST /api/auth/reset. */
export async function requestPasswordReset(_email: string): Promise<{ ok: boolean }> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve({ ok: true }), 700)
  })
}
