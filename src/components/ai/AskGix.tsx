import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Bot, Loader2, RotateCcw, Sparkles, X } from 'lucide-react'
import { useAppData } from '../../hooks/useAppData'
import { askGix, type GixChatMessage } from '../../services/api'
import {
  categoryTotals,
  thisWeeksExpenses,
  totalSpent,
  spendingPlan,
} from '../../lib/finance'
import { cn } from '../shared/Button'

/**
 * Ask Gix — a floating popup chat where the user can ask a Gemini-powered
 * money coach about their spending, budgets and savings doubts. Gix answers
 * from the user's real data, which is attached to every request as context.
 */

interface ChatEntry extends GixChatMessage {
  id: string
  failed?: boolean
}

const SUGGESTIONS = [
  'How much can I spend today?',
  'Analyze my spending',
  'Where can I cut costs?',
  'Am I on track with my budget?',
]

let chatSeq = 0
function nextId(): string {
  chatSeq += 1
  return `chat_${Date.now().toString(36)}_${chatSeq}`
}

export function AskGix() {
  const { data, month, monthExpenses, today } = useAppData()

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<ChatEntry[]>([])

  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Snapshot of the user's finances, generated fresh per request.
  const context = useMemo(() => {
    if (!data) return null
    const plan = spendingPlan(monthExpenses, data.budget.monthly, today)
    return {
      profile: {
        name: data.profile.nickname || data.profile.name || 'Student',
        college: data.profile.college,
      },
      month,
      monthlyBudget: data.budget.monthly,
      spentThisMonth: plan.spent,
      daysRemaining: plan.daysRemaining,
      weeklyTotal: totalSpent(thisWeeksExpenses(data.expenses, today)),
      categoryTotals: categoryTotals(monthExpenses).map(({ category, amount }) => ({
        category,
        amount,
      })),
      categoryBudgets: Object.entries(data.budget.categoryBudgets)
        .filter(([, amount]) => amount > 0)
        .map(([category, amount]) => ({ category, amount })),
      recentExpenses: monthExpenses
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10)
        .map((e) => ({ date: e.date, title: e.title, amount: e.amount, category: e.category })),
      goals: data.goals.map((g) => ({
        name: g.name,
        target: g.target,
        saved: g.saved,
        targetDate: g.targetDate,
      })),
    }
  }, [data, month, monthExpenses, today])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, sending, open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
    return undefined
  }, [open])

  async function send(text: string) {
    const question = text.trim()
    if (!question || sending || !context) return

    const userEntry: ChatEntry = { id: nextId(), role: 'user', text: question }
    const next = [...messages, userEntry]
    setMessages(next)
    setInput('')
    setSending(true)

    const result = await askGix(
      // Error bubbles are UI-only feedback — don't feed them back to the model
      // as conversation history, or Gix starts answering to nonsense.
      next.filter((m) => !m.failed).map((m) => ({ role: m.role, text: m.text })),
      context,
    )

    setSending(false)
    if (result.ok && result.reply) {
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', text: result.reply! }])
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          failed: true,
          text: result.error || 'Sorry, something went wrong. Please try again.',
        },
      ])
    }
  }

  const isEmpty = messages.length === 0

  return (
    <>
      {/* Floating launcher */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close Ask Gix' : 'Ask Gix — chat with your AI money coach'}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-24 right-5 z-40 flex h-[52px] items-center gap-2.5 rounded-full bg-gradient-to-br from-[#7655E8] to-[#9F8DFF] pl-4 pr-5 text-sm font-semibold text-white shadow-[0_6px_24px_rgb(118_85_232/0.45)] transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        {open ? 'Close' : 'Ask Gix'}
      </motion.button>

      {/* Popup chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="Ask Gix chat"
            className="fixed bottom-[164px] right-5 z-40 flex h-[min(560px,calc(100dvh-11.5rem))] w-[min(400px,calc(100vw-2.5rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-lift"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-line bg-gradient-to-r from-[#7655E8] to-[#9F8DFF] px-4 py-3.5 text-white">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Bot className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold leading-tight">Ask Gix</p>
                <p className="text-xs text-white/75">Your AI money coach</p>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  aria-label="Clear conversation"
                  title="Clear conversation"
                  className="rounded-lg p-1.5 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-lg p-1.5 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto scroll-slim px-4 py-4">
              {isEmpty ? (
                <div className="flex h-full flex-col justify-center">
                  <div className="text-center">
                    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                      <Sparkles className="h-6 w-6" />
                    </span>
                    <p className="text-[15px] font-semibold text-ink">
                      Hi{data?.profile?.name ? `, ${data.profile.nickname || data.profile.name}` : ''}! I'm Gix 🤖
                    </p>
                    <p className="mx-auto mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-ink-muted">
                      Ask me anything about your spending, budgets or savings — I know your data.
                    </p>
                  </div>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border border-line bg-card-soft px-3.5 py-1.5 text-[13px] font-medium text-ink-secondary transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary-dark"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {m.role === 'assistant' && (
                      <span className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Bot className="h-4 w-4" />
                      </span>
                    )}
                    <div
                      className={cn(
                        'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed',
                        m.role === 'user'
                          ? 'rounded-br-md bg-primary text-white'
                          : m.failed
                            ? 'rounded-bl-md border border-danger/30 bg-danger/5 text-danger'
                            : 'rounded-bl-md bg-card-soft text-ink',
                      )}
                    >
                      <GixMessage text={m.text} />
                    </div>
                  </div>
                ))
              )}

              {sending && (
                <div className="flex justify-start">
                  <span className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-card-soft px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-[13px] text-ink-muted">Gix is thinking…</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-line bg-card p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send(input)
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send(input)
                    }
                  }}
                  rows={1}
                  placeholder="Ask about your money…"
                  aria-label="Message for Gix"
                  className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-primary/50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-all hover:bg-[var(--c-primary-dark)] disabled:pointer-events-none disabled:opacity-40"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4.5 w-4.5" />}
                </button>
              </form>
              <p className="mt-1.5 text-center text-2xs text-ink-muted">
                Gix can make mistakes — double-check important numbers.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * Minimal inline renderer for Gix replies: **bold** segments and simple
 * bullet/numbered lines, without pulling in a markdown dependency.
 */
function GixMessage({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim().length > 0)

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        const bullet = /^([-*•]|\d+[.)])\s+/.exec(trimmed)
        if (bullet) {
          return (
            <p key={i} className="flex gap-1.5 pl-1">
              <span className="text-primary">•</span>
              <span>{inlineBold(trimmed.slice(bullet[0].length))}</span>
            </p>
          )
        }
        if (trimmed.startsWith('#')) {
          return (
            <p key={i} className="font-semibold">
              {inlineBold(trimmed.replace(/^#+\s*/, ''))}
            </p>
          )
        }
        return <p key={i}>{inlineBold(trimmed)}</p>
      })}
    </div>
  )
}

/** Renders **bold** spans inside a line of plain text. */
function inlineBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    ),
  )
}
