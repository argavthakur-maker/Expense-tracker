import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as api from '../../services/api'
import { AuthShell } from './AuthShell'
import { Button } from '../../components/shared/Button'
import { Field, Input, PasswordInput } from '../../components/shared/Input'
import { useToast } from '../../components/shared/Toast'
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton'

interface Errors {
  name?: string
  email?: string
  password?: string
  confirm?: string
}

export function Signup() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  const set =
    (key: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }))
    }

  const submit = async () => {
    const errs: Errors = {}

    if (!values.name.trim() || values.name.trim().length < 2) {
      errs.name = 'Tell us your name.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errs.email = 'Enter a valid email address.'
    }

    if (values.password.length < 6) {
      errs.password = 'Use six characters or more.'
    }

    if (values.confirm !== values.password) {
      errs.confirm = 'Passwords do not match.'
    }

    setErrors(errs)

    if (Object.keys(errs).length > 0) return

    setLoading(true)

    try {
      await api.signup(values)
      toast('Account ready! (demo signup)', 'success')
      navigate('/app')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create your account.'

      toast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Two minutes now, a calmer month of money later."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-primary hover:text-[var(--c-primary-dark)]"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
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

        <Field
          label="Password"
          required
          error={errors.password}
          hint="At least six characters."
        >
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

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </Button>

        {/* OR divider */}
        <div className="mt-6 text-center">
          <span className="text-ink-muted bg-bg px-2 rounded">OR</span>
        </div>

        {/* Google Sign-In button container */}
        <div className="mt-4 flex justify-center">
          <div id="google-button" className="w-full flex justify-center" />
        </div>

       <GoogleSignInButton
  clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
  onSuccess={() => {
    navigate('/app');
  }}
  onError={(error) => {
    console.error('Google signup failed:', error);
  }}
/>

        <p className="text-center text-xs text-ink-muted mt-4">
          The demo keeps your details local — nothing is saved to a server yet.
        </p>
      </form>
    </AuthShell>
  )
}