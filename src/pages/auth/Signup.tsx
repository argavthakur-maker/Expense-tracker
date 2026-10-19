import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as api from '../../services/api'
import { AuthShell } from './AuthShell'
import { Button } from '../../components/shared/Button'
import { Field, Input, PasswordInput } from '../../components/shared/Input'
import { useToast } from '../../components/shared/Toast'

interface Errors {
  name?: string
  email?: string
  password?: string
  confirm?: string
}

export function Signup() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }))

  const submit = async () => {
    const errs: Errors = {}
    if (!values.name.trim() || values.name.trim().length < 2) errs.name = 'Tell us your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errs.email = 'Enter a valid email address.'
    if (values.password.length < 6) errs.password = 'Use six characters or more.'
    if (values.confirm !== values.password) errs.confirm = 'Passwords do not match.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    // Mock signup — the future Node.js backend will own real accounts.
    await api.signup(values)
    setLoading(false)
    toast('Account ready! (demo signup)', 'success')
    navigate('/app')
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Two minutes now, a calmer month of money later."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-[var(--c-primary-dark)]">
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field label="Full name" required error={errors.name}>
          <Input
            value={values.name}
            autoComplete="name"
            placeholder="Aarav Sharma"
            error={!!errors.name}
            onChange={set('name')}
          />
        </Field>
        <Field label="Email" required error={errors.email}>
          <Input
            type="email"
            value={values.email}
            autoComplete="email"
            placeholder="you@college.edu"
            error={!!errors.email}
            onChange={set('email')}
          />
        </Field>
        <Field label="Password" required error={errors.password} hint="At least six characters.">
          <PasswordInput
            value={values.password}
            autoComplete="new-password"
            error={!!errors.password}
            onChange={set('password')}
          />
        </Field>
        <Field label="Confirm password" required error={errors.confirm}>
          <PasswordInput
            value={values.confirm}
            autoComplete="new-password"
            error={!!errors.confirm}
            onChange={set('confirm')}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
        <p className="text-center text-xs text-ink-muted">
          The demo keeps your details local — nothing is saved to a server yet.
        </p>
      </form>
    </AuthShell>
  )
}
