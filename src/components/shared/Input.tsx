import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from './Button'

export interface FieldProps {
  label?: string
  error?: string | undefined
  hint?: string
  children: ReactNode
  required?: boolean
}

/** Label + control + validation message, used by all forms. */
export function Field({ label, error, hint, children, required }: FieldProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-[13px] font-medium text-ink">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  )
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  error?: boolean
  prefix?: ReactNode
}

export function Input({ className, error, prefix, ...rest }: InputProps) {
  if (prefix) {
    return (
      <div
        className={cn(
          'flex h-10 items-center overflow-hidden rounded-lg border border-line bg-card-soft transition-colors focus-within:border-primary/60',
          error && 'border-danger/70',
        )}
      >
        <span className="pl-3 text-sm text-ink-muted">{prefix}</span>
        <input
          className="h-full w-full bg-transparent px-2.5 text-sm text-ink outline-none placeholder:text-ink-muted"
          {...rest}
        />
      </div>
    )
  }
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-line bg-card-soft px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-primary/60',
        error && 'border-danger/70',
        className,
      )}
      {...rest}
    />
  )
}

export function PasswordInput(props: InputProps) {
  const [visible, setVisible] = useState(false)
  const { className, error, prefix, ...rest } = props
  return (
    <div
      className={cn(
        'flex h-10 items-center rounded-lg border border-line bg-card-soft transition-colors focus-within:border-primary/60',
        error && 'border-danger/70',
        className,
      )}
    >
      <input
        type={visible ? 'text' : 'password'}
        className="h-full w-full bg-transparent px-3 text-sm text-ink outline-none placeholder:text-ink-muted"
        {...rest}
      />
      <button
        type="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible((v) => !v)}
        className="mr-1.5 rounded-md p-1.5 text-ink-muted transition-colors hover:text-ink"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export function Select({ className, error, ...rest }: SelectProps) {
  return (
    <select
      className={cn(
        'select-arrow h-10 w-full rounded-lg border border-line bg-card-soft px-3 pr-9 text-sm text-ink outline-none transition-colors focus:border-primary/60',
        error && 'border-danger/70',
        className,
      )}
      {...rest}
    />
  )
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ className, error, ...rest }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-line bg-card-soft px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-primary/60',
        error && 'border-danger/70',
        className,
      )}
      {...rest}
    />
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-ink/15',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}
