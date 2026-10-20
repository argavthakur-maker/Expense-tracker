import { useEffect } from 'react'

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            context?: string
            use_fedcm_for_prompt?: boolean
          }) => void
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: string
              size?: string
              text?: string
              shape?: string
              width?: number
            }
          ) => void
        }
      }
    }
  }
}

export function useGoogleSignIn(
  clientId: string,
  onSuccess: (credential: string) => void,
  onError?: (error: string) => void
) {
  useEffect(() => {
    if (!clientId || clientId === 'test' || clientId.startsWith('your_')) {
      console.error(
        'Google Sign-In: Valid VITE_GOOGLE_CLIENT_ID is required.'
      )
      return
    }

    let cancelled = false
    let script = document.querySelector<HTMLScriptElement>(
      'script[data-google-identity="true"]'
    )

    const initializeGoogle = () => {
      if (cancelled) return

      const googleId = window.google?.accounts?.id
      const container = document.getElementById('google-button')

      if (!googleId) {
        onError?.('Google Identity Services did not initialize.')
        return
      }

      if (!container) {
        console.error('Google Sign-In: #google-button container not found.')
        return
      }

      container.replaceChildren()

      googleId.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential)
          } else {
            onError?.('Google did not return a credential.')
          }
        },
        auto_select: false,
        context: 'signin',
        use_fedcm_for_prompt: true,
      })

      googleId.renderButton(container, {
        theme: 'filled',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: Math.min(container.clientWidth || 360, 360),
      })
    }

    if (!script) {
      script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.dataset.googleIdentity = 'true'
      document.head.appendChild(script)
    }

    if (window.google?.accounts?.id) {
      initializeGoogle()
    } else {
      script.addEventListener('load', initializeGoogle)
      script.addEventListener(
        'error',
        () => {
          if (!cancelled) {
            onError?.('Failed to load Google Identity Services.')
          }
        },
        { once: true }
      )
    }

    return () => {
      cancelled = true
      script?.removeEventListener('load', initializeGoogle)
    }
  }, [clientId, onSuccess, onError])
}