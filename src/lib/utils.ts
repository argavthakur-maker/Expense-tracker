import type { Category } from '../types/index'
import { CATEGORY_COLORS } from '../types/index'

export function getSelectableMonths(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    months.push(`${yyyy}-${mm}`)
  }
  return months
}

export const SELECTABLE_MONTHS = getSelectableMonths()

export const DARKENED: Record<Category, string> = {
  Food: '#5F3FD6',
  Snacks: '#C17D16',
  Transport: '#167A56',
  Study: '#286BC0',
  Shopping: '#C44678',
  Entertainment: '#7655E8',
  Other: '#626B7A',
}

export function categoryBadgeStyle(category: Category) {
  const color = CATEGORY_COLORS[category]

  return {
    bg: `${color}14`,
    text: DARKENED[category] ?? color,
  }
}