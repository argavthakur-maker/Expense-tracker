import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
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
import { Skeleton } from './components/shared/ui'

function ThemeSync({ theme }: { theme: string }) {
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  return null
}

/** Bridge that syncs the preferences theme value to the document root. */
function ThemeBridge() {
  const { data } = useAppData()
  return <ThemeSync theme={data?.preferences.theme ?? 'light'} />
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppDataProvider>
          <ThemeBridge />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="budget" element={<Budget />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="savings" element={<Savings />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppDataProvider>
      </BrowserRouter>
    </ToastProvider>
  )
}

/** Loading placeholder shown while the (mock) data service hydrates. */
export function AppFallback() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-6 py-10">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-48" />
    </div>
  )
}
