import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, PiggyBank, Sparkles, X } from 'lucide-react'
import { useAppData } from '../../hooks/useAppData'
import { aiInsights } from '../../lib/aiInsights'
import { monthProgress, spendingPlan } from '../../lib/finance'
import { formatINR } from '../../lib/format'

/**
 * Suggestion Popup — a bright card pinned to the top right where Gix tells
 * the user how to spend today, how much to save, and warns when the budget
 * is drifting off track. Tips come from the local insight engine so every
 * number traces back to real expenses, exactly like the dashboard.
 */

interface Tip {
  title: string
  body: string
}

/** Remembers dismissal for this browser session so it stays closed. */
const DISMISS_KEY = 'gix_suggestion_popup_dismissed'

function safeSavingsTip(remaining: number, budget: number, isoToday: string): Tip {
  // Save ~10% of the monthly budget whenever there is headroom left.
  const save = Math.max(0, Math.round((budget * 0.1) / 10) * 10)
  return {
    title: 'Your spend & save plan',
    body: `You still have ${formatINR(remaining)} to work with this month. Keep daily spending to about ${formatINR(dailyCap(remaining, isoToday))} and tuck away ${formatINR(save)} — small, steady savings add up fast.`,
  }
}

function dailyCap(remaining: number, isoToday: string): number {
  const { daysRemaining } = monthProgress(isoToday)
  if (daysRemaining <= 0) return Math.round(remaining)
  return Math.round(remaining / daysRemaining)
}

export function GixSuggestionPopup() {
  const { data, today, monthExpenses } = useAppData()
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)

  const tips = useMemo<Tip[]>(() => {
    if (!data) return []
    const fromInsights = aiInsights(data, today).map((i) => ({ title: i.title, body: i.body }))
    const plan = spendingPlan(monthExpenses, data.budget.monthly, today)

    const planTip =
      plan.remaining > 0
        ? safeSavingsTip(plan.remaining, data.budget.monthly, today)
        : null

    return planTip ? [...fromInsights, planTip] : fromInsights
  }, [data, today, monthExpenses])

  // Slide in shortly after load so the dashboard settles first.
  useEffect(() => {
    if (tips.length === 0) {
      setOpen(false)
      return
    }
    if (sessionStorage.getItem(DISMISS_KEY)) return

    const timer = window.setTimeout(() => setOpen(true), 1500)
    return () => window.clearTimeout(timer)
  }, [tips.length])

  // Don't animate stale content in after the tips array shrinks.
  useEffect(() => {
    setIndex((i) => (tips.length === 0 ? 0 : i % tips.length))
  }, [tips.length])

  if (!data || tips.length === 0) return null

  const tip = tips[index % tips.length]

  function dismiss() {
    setOpen(false)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Private mode — closing anyway is fine.
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-label="Gix suggestion"
          className="fixed right-4 top-[74px] z-40 w-[min(340px,calc(100vw-2rem))] origin-top-right sm:right-6 sm:top-[86px]"
        >
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#7655E8] to-[#9F8DFF] text-white shadow-[0_10px_36px_rgb(118_85_232/0.45)]">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 pt-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold leading-tight">Gix Suggestion</p>
                <p className="text-[11px] text-white/75">Personalised money tip</p>
              </div>
              <button
                onClick={dismiss}
                aria-label="Close suggestion"
                className="rounded-lg p-1.5 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 pb-4 pt-3">
              <div className="flex items-start gap-2.5 rounded-xl bg-white/15 px-3.5 py-3">
                <PiggyBank className="mt-0.5 h-5 w-5 shrink-0 text-white/90" />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold leading-tight">{tip.title}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-white/90">{tip.body}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-2xs text-white/70">
                  Tip {index + 1} of {tips.length}
                </p>
                {tips.length > 1 && (
                  <button
                    onClick={() => setIndex((i) => i + 1)}
                    className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-white/30"
                  >
                    Next tip
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
