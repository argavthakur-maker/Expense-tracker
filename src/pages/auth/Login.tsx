import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as api from '../../services/api'
import { AuthShell } from './AuthShell'
import { Button } from '../../components/shared/Button'
import { Field, Input, PasswordInput } from '../../components/shared/Input'
import { useToast } from '../../components/shared/Toast'

interface Errors {
  email?: string
  password?: string
}

export function Login() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [email, setEmail] = useState('aarav.sharma@university.edu')
  const [password, setPassword] = useState('hostellife')
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const errs: Errors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.'
    if (password.length < 6) errs.password = 'Passwords are six characters or more.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    // Mock auth — no account is created or verified in this phase.
    await api.login(email, password)
    setLoading(false)
    toast('Welcome back! (demo sign-in)', 'success')
    navigate('/app')
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see how your month is going."
      footer={
        <>
          New to Hostelers?{' '}
          <Link to="/signup" className="font-medium text-primary hover:text-[var(--c-primary-dark)]">
            Create an account
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
        <Field label="Email" required error={errors.email}>
          <Input
            type="email"
            value={email}
            autoComplete="email"
            error={!!errors.email}
            placeholder="you@college.edu"
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" required error={errors.password}>
          <PasswordInput
            value={password}
            autoComplete="current-password"
            error={!!errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-[13px] font-medium text-primary hover:text-[var(--c-primary-dark)]"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="text-center text-xs text-ink-muted">
          This demo runs entirely in your browser — nothing is stored or sent anywhere.
        </p>
      </form>
    </AuthShell>
  )
}
