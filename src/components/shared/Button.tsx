import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

export function cn(...classes: (string | undefined | false)[]): string {
  return twMerge(classes.filter(Boolean).join(' '))
}

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-[var(--c-primary-dark)] shadow-[0_1px_2px_rgb(118_85_232/0.3)] hover:shadow-pop disabled:bg-primary/60',
  secondary: 'bg-primary-soft text-primary-dark hover:bg-primary/15',
  outline: 'border border-line bg-card text-ink hover:border-primary/40 hover:text-primary-dark',
  ghost: 'text-ink-secondary hover:bg-ink/5 hover:text-ink',
  danger: 'bg-danger text-white hover:brightness-95',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-lg font-medium transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {icon && <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
      {children}
    </button>
  )
})
