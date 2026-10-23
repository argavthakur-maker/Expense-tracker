import type { Category } from '../types/index'
import { CATEGORY_COLORS } from '../types/index'

export const SELECTABLE_MONTHS = ['2026-10', '2026-09', '2026-08']

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