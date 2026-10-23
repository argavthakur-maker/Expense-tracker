import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import * as api from '../../services/api'
import { AuthShell } from './AuthShell'
import { Button } from '../../components/shared/Button'
import { Field, Input } from '../../components/shared/Input'
import { useToast } from '../../components/shared/Toast'

export function ForgotPassword() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    setError(undefined)
    setLoading(true)
    // Mock flow — no email is actually sent in this frontend phase.
    await api.requestPasswordReset(email)
    setLoading(false)
    setSent(true)
    toast('Password reset link dispatched.', 'info')
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle={
        sent
          ? 'Check your inbox for the reset link.'
          : 'Enter your email and we will send a reset link.'
      }
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-[var(--c-primary-dark)]">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-line bg-card p-5 text-center">
          <p className="text-sm leading-relaxed text-ink-secondary">
            If an account is registered with <span className="font-medium text-ink">{email}</span>, we have sent instructions to reset your password.
          </p>
          <div className="mt-4 flex justify-center gap-2.5">
            <Button variant="outline" onClick={() => navigate('/login')}>
              Back to sign in
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Field label="Email" required error={error}>
            <Input
              type="email"
              value={email}
              autoComplete="email"
              placeholder="you@college.edu"
              error={!!error}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mx-auto flex items-center gap-1.5 text-[13px] text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </button>
        </form>
      )}
    </AuthShell>
  )
}
