import {
  Bus,
  Coffee,
  Gamepad2,
  GraduationCap,
  ShoppingBag,
  MoreHorizontal,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import type { Category } from '../../types'
import { CATEGORY_COLORS } from '../../types'
import { cn } from './Button'

const icons: Record<Category, LucideIcon> = {
  Food: Utensils,
  Snacks: Coffee,
  Transport: Bus,
  Study: GraduationCap,
  Shopping: ShoppingBag,
  Entertainment: Gamepad2,
  Other: MoreHorizontal,
}

/** Tinted tile showing the category icon, consistently colored everywhere. */
export function CategoryIcon({
  category,
  size = 'md',
  className,
}: {
  category: Category
  size?: 'sm' | 'md'
  className?: string
}) {
  const Icon = icons[category]
  const color = CATEGORY_COLORS[category]
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-[10px]',
        size === 'md' ? 'h-10 w-10' : 'h-8 w-8',
        className,
      )}
      style={{ backgroundColor: `${color}16`, color: `${color}` }}
      aria-hidden="true"
    >
      <Icon className={size === 'md' ? 'h-[18px] w-[18px]' : 'h-3.5 w-3.5'} />
    </span>
  )
}
