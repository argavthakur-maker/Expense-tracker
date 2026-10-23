
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send, X, Bot, User } from 'lucide-react'

type Message = {
  id: number
  text: string
  fromUser: boolean
}

type GixChatPanelProps = {
  onClose: () => void
}

type GixChatButtonProps = {
  onClick: () => void
}

function getGixResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase()

  if (
    lower.includes('budget') ||
    lower.includes('limit')
  ) {
    return 'You can manage your budget by setting a monthly spending limit, tracking daily expenses, and reviewing your spending regularly.'
  }

  if (
    lower.includes('expense') ||
    lower.includes('spend') ||
    lower.includes('spent')
  ) {
    return 'To understand your spending, review your recorded expenses and group them into categories such as food, travel, shopping, and bills.'
  }

  if (
    lower.includes('save') ||
    lower.includes('saving') ||
    lower.includes('goal')
  ) {
    return 'A good starting point is to set a realistic savings goal, track your progress, and save a fixed amount whenever you receive money.'
  }

  if (
    lower.includes('hello') ||
    lower.includes('hi') ||
    lower.includes('hey')
  ) {
    return "Hey! 👋 I'm Gix, your financial assistant. Ask me about budgeting, expenses, savings, or managing your money!"
  }

  if (
    lower.includes('food') ||
    lower.includes('eat')
  ) {
    return 'Food expenses can add up quickly. Try setting a weekly food budget, planning your meals, and tracking every purchase.'
  }

  if (
    lower.includes('rent') ||
    lower.includes('hostel')
  ) {
    return 'For hostel budgeting, separate fixed expenses like rent and fees from variable expenses like food, travel, and entertainment.'
  }

  if (
    lower.includes('help') ||
    lower.includes('what can you do')
  ) {
    return 'I can help with budgeting tips, expense management, savings goals, and general money-management advice. What would you like to explore?'
  }

  return "That's a great question! I'm Gix, your financial assistant. I can share general tips about budgeting, expense tracking, and savings. What would you like to know?"
}

export function GixChatButton({
  onClick,
}: GixChatButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Open Gix chat"
      title="Chat with Gix"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full bg-primary px-5 py-3.5 text-white shadow-xl transition-shadow hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <MessageCircle className="h-5 w-5" />

      <span className="text-sm font-semibold">
        Ask Gix
      </span>
    </motion.button>
  )
}

export function GixChatPanel({
  onClose,
}: GixChatPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, isTyping])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = () => {
    const trimmed = input.trim()

    if (!trimmed || isTyping) {
      return
    }

    const userMessage: Message = {
      id: Date.now(),
      text: trimmed,
      fromUser: true,
    }

    setMessages((previous) => [
      ...previous,
      userMessage,
    ])

    setInput('')
    setIsTyping(true)

    // Simulated response, not a live AI API.
    window.setTimeout(() => {
      const response = getGixResponse(trimmed)

      const botMessage: Message = {
        id: Date.now() + 1,
        text: response,
        fromUser: false,
      }

      setMessages((previous) => [
        ...previous,
        botMessage,
      ])

      setIsTyping(false)
    }, 900)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      role="dialog"
      aria-label="Gix financial assistant"
      className="fixed bottom-5 right-4 z-50 flex h-[min(560px,calc(100dvh-40px))] w-[calc(100vw-32px)] max-w-[390px] flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl sm:right-5"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <Bot className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-semibold text-ink">
              Gix Assistant
            </h3>

            <p className="text-xs text-ink-muted">
              Your financial companion
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Gix chat"
          className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 space-y-4 overflow-y-auto p-4"
        aria-live="polite"
      >
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </div>

            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
              <p className="text-sm leading-relaxed text-ink">
                Hey there! 👋 I'm Gix.
              </p>

              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                I can help you with budgeting, expenses, and savings. What would you like to know?
              </p>
            </div>
          </div>
        )}

        {/* Conversation */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 ${
              message.fromUser
                ? 'justify-end'
                : 'justify-start'
            }`}
          >
            {!message.fromUser && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.fromUser
                  ? 'rounded-tr-sm bg-primary text-white'
                  : 'rounded-tl-sm bg-secondary text-ink-secondary'
              }`}
            >
              {message.text}
            </div>

            {message.fromUser && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </div>

            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-secondary px-4 py-4">
              <span className="h-2 w-2 animate-bounce rounded-full bg-ink-muted [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-ink-muted [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-ink-muted" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          sendMessage()
        }}
        className="shrink-0 border-t border-line bg-card p-3"
      >
        <div className="flex items-center gap-2 rounded-xl border border-line bg-card p-1.5 transition-colors focus-within:border-primary">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask Gix anything..."
            aria-label="Message Gix"
            disabled={isTyping}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-center text-[10px] text-ink-muted">
          Gix uses simulated responses and is not connected to a live AI service.
        </p>
      </form>
    </motion.div>
  )
}

/**
 * Complete chat widget.
 * Use <GixChat /> when you want the button and panel
 * to work together without managing their state in Landing.tsx.
 */
export function GixChat() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {!isOpen && (
        <GixChatButton
          onClick={() => setIsOpen(true)}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <GixChatPanel
            key="gix-chat-panel"
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
