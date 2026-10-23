import { useCallback } from 'react'
import { useGoogleSignIn } from './useGoogleSignIn'
import * as api from '../../services/api'
import { useToast } from '../../components/shared/Toast'

export interface GoogleSignInButtonProps {
  clientId: string
  onSuccess?: (credential: string) => void
  onError?: (error: string) => void
}

export function GoogleSignInButton({
  clientId,
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const { toast } = useToast()

  const handleCredentialResponse = useCallback(
    async (credential: string) => {
      try {
        const res = await api.loginWithGoogle(credential)

        if (!res.ok) {
          const message = res.error || 'Google authentication failed.'
          toast(message, 'error')
          onError?.(message)
          return
        }

        toast('Google sign-in successful!', 'success')
        onSuccess?.(credential)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Google authentication failed.'

        toast(message, 'error')
        onError?.(message)
      }
    },
    [onSuccess, onError, toast],
  )

  useGoogleSignIn(clientId, handleCredentialResponse, onError)

  if (!clientId || clientId.startsWith('your_')) {
    return (
      <div className="mt-4 text-center text-sm text-ink-muted">
        <strong>Google Sign-In not configured.</strong>
        <br />
        Please set VITE_GOOGLE_CLIENT_ID in your .env file.
      </div>
    )
  }

  return null
}