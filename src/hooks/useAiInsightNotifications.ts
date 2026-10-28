import { useEffect, useRef } from 'react'
import { useAppData } from './useAppData'
import { bestAiInsight, insightToNotification } from '../lib/aiInsights'
import { useToast } from '../components/shared/Toast'

/**
 * Keeps the notification bell fed with a live AI suggestion about the
 * individual's budget. Runs locally whenever app data changes — the moment
 * an expense or budget edit produces a new insight, it lands in the bell
 * (with a toast) at most once per insight signature, per month.
 */
export function useAiInsightNotifications(): void {
  const { data, today, addNotification } = useAppData()
  const { toast } = useToast()
  const handled = useRef<string | null>(null)

  useEffect(() => {
    if (!data) return
    const insight = bestAiInsight(data, today)
    if (!insight) return
    if (data.notifications.some((n) => n.id === insight.id)) {
      handled.current = insight.id
      return
    }
    // Skip work already done inside this session (React StrictMode remounts).
    if (handled.current === insight.id) return
    handled.current = insight.id

    addNotification(insightToNotification(insight, today))
    toast(`Gix suggestion: ${insight.title}`, 'info')
  }, [data, today, addNotification, toast])
}
