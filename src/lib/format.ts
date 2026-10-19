/**
 * Currency formatting with Indian digit grouping — ₹1,250 and ₹3,000.
 * Every rupee amount shown in the UI flows through this module.
 */
export function formatINR(amount: number, opts?: { compact?: boolean }): string {
  const abs = Math.abs(amount)
  if (opts?.compact && abs >= 100000) {
    return `₹${(new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(abs / 1000))}k`
  }
  const formatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  })
  return `${amount < 0 ? '-' : ''}₹${formatter.format(abs)}`
}

/** Short date label used across charts and lists — e.g. "12 Oct". */
export function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** Full date label for detail views — e.g. "12 Oct 2026". */
export function formatDateFull(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Friendly relative labels for recent items. */
export function dayLabel(iso: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(iso + 'T00:00:00')
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return formatDateShort(iso)
}

/** yyyy-mm-dd key used for grouping and month filtering. */
export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Month key like "2026-10" from an ISO date or Date object. */
export function monthKey(value: string | Date): string {
  return typeof value === 'string' ? value.slice(0, 7) : isoDate(value).slice(0, 7)
}

/** Human month label — e.g. "October 2026" and its short form "Oct". */
export function monthLabel(key: string, short = false): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('en-IN', { month: short ? 'short' : 'long', year: 'numeric' })
}

/** Days in a given month key. */
export function daysInMonth(key: string): number {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}
