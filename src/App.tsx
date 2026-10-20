import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { AppDataProvider, useAppData } from './hooks/useAppData'
import { AppLayout } from './components/layout/AppLayout'
import { Landing } from './components/layout/Landing'
import { Login } from './pages/auth/Login'
import { Signup } from './pages/auth/Signup'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { Dashboard } from './pages/Dashboard'
import { Expenses } from './pages/Expenses'
import { Budget } from './pages/Budget'
import { Analytics } from './pages/Analytics'
import { Savings } from './pages/Savings'
import { Settings } from './pages/Settings'
import { ToastProvider } from './components/shared/Toast'

function ThemeSync({ theme }: { theme: string }) {
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return null
}

function ThemeBridge() {
  const { data } = useAppData()

  return <ThemeSync theme={data?.preferences?.theme ?? 'light'} />
}

function AuthSessionCheck() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (!response.ok) return

        const result = await response.json()

        if (cancelled) return

        if (
          !result.ok &&
          location.pathname.startsWith('/app')
        ) {
          navigate('/login', { replace: true })
        }
      } catch (error) {
        console.warn('Auth check failed:', error)
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [navigate, location.pathname])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppDataProvider>
          <AuthSessionCheck />
          <ThemeBridge />

          <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/login" element={<Login />} />

            <Route path="/signup" element={<Signup />} />

            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />

            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="budget" element={<Budget />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="savings" element={<Savings />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </AppDataProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}