import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-react'
import type { Category, Expense } from '../types'
import { CATEGORIES, CATEGORY_COLORS } from '../types'
import { useAppData } from '../hooks/useAppData'
import { formatDateFull, formatINR, dayLabel } from '../lib/format'
import { Card, EmptyState, Skeleton } from '../components/shared/ui'
import { Button } from '../components/shared/Button'
import { Select } from '../components/shared/Input'
import { ConfirmDialog } from '../components/shared/Modal'
import { ExpenseFormModal, type ExpenseFormValues } from '../components/expenses/ExpenseForm'
import { CategoryIcon } from '../components/shared/CategoryIcon'
import { useToast } from '../components/shared/Toast'

type SortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

export function Expenses() {
  const { data, monthExpenses, addExpense, updateExpense, deleteExpense, today } = useAppData()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all')
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d'>('all')
  const [sort, setSort] = useState<SortKey>('date-desc')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState<Expense | null>(null)

  // Dashboard deep-link opens the add form directly: /app/expenses?new=1
  useEffect(() => {
    if (params.get('new') === '1') {
      setFormOpen(true)
      setEditing(null)
      params.delete('new')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const cutoff = dateFilter === 'all' ? '' : isoShift(today, dateFilter === '7d' ? -7 : -30)
    return monthExpenses
      .filter((e) => (categoryFilter === 'all' ? true : e.category === categoryFilter))
      .filter((e) => (cutoff ? e.date >= cutoff : true))
      .filter((e) => (q ? e.title.toLowerCase().includes(q) || (e.notes ?? '').toLowerCase().includes(q) : true))
      .sort((a, b) => {
        switch (sort) {
          case 'date-asc':
            return a.date.localeCompare(b.date)
          case 'amount-desc':
            return b.amount - a.amount
          case 'amount-asc':
            return a.amount - b.amount
          default:
            return b.date.localeCompare(a.date)
        }
      })
  }, [monthExpenses, search, categoryFilter, dateFilter, sort, today])

  const save = (values: ExpenseFormValues) => {
    const payload = {
      title: values.title.trim(),
      amount: Number(values.amount),
      category: values.category,
      date: values.date,
      notes: values.notes.trim() || undefined,
    }
    if (editing) {
      updateExpense(editing.id, payload)
      toast(`Updated "${payload.title}"`, 'success')
    } else {
      addExpense(payload)
      toast(`Added "${payload.title}" — ${formatINR(payload.amount)}`, 'success')
    }
  }

  if (!data) return <ExpensesSkeleton />

  const total = filtered.reduce((s, e) => s + e.amount, 0)
  const hasFilters = search !== '' || categoryFilter !== 'all' || dateFilter !== 'all'

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses…"
            aria-label="Search expenses"
            className="h-10 w-full rounded-lg border border-line bg-card pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-primary/60"
          />
        </div>
        <div className="w-36">
          <Select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'all' | Category)}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-32">
          <Select
            aria-label="Filter by date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | '7d' | '30d')}
          >
            <option value="all">All dates</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </Select>
        </div>
        <div className="w-40">
          <Select aria-label="Sort expenses" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Highest amount</option>
            <option value="amount-asc">Lowest amount</option>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-[13px] text-ink-muted sm:block">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} ·{' '}
            <span className="tnum font-semibold text-ink">{formatINR(total)}</span>
          </span>
          <Button
            icon={<Plus />}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Add expense
          </Button>
        </div>
      </div>

      {/* List */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={<Search />}
              title="No matching expenses"
              message="Try a different keyword, category or date range."
            />
          ) : (
            <EmptyState
              icon={<Receipt />}
              title="No expenses this month"
              message="Start tracking by logging your first purchase of the month."
              action={<Button icon={<Plus />} onClick={() => setFormOpen(true)}>Add expense</Button>}
            />
          )
        ) : (
          <ul className="divide-y divide-line" aria-label="Expense list">
            {filtered.map((e) => (
              <li
                key={e.id}
                className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-card-soft sm:gap-4 sm:px-5"
              >
                <CategoryIcon category={e.category} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{e.title}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {dayLabel(e.date)} · {formatDateFull(e.date)}
                    {e.notes && <span className="hidden sm:inline"> · {e.notes}</span>}
                  </p>
                </div>
                <span
                  className="hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline-block"
                  style={{
                    color: CATEGORY_COLORS[e.category],
                    backgroundColor: `${CATEGORY_COLORS[e.category]}14`,
                  }}
                >
                  {e.category}
                </span>
                <span className="w-16 shrink-0 text-right text-sm font-semibold tnum text-ink">
                  {formatINR(e.amount)}
                </span>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-sm:opacity-100">
                  <IconAction label={`Edit ${e.title}`} onClick={() => { setEditing(e); setFormOpen(true) }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </IconAction>
                  <IconAction label={`Delete ${e.title}`} danger onClick={() => setDeleting(e)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ExpenseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={save}
        editing={editing}
      />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        destructive
        title="Delete this expense?"
        message={
          deleting
            ? `"${deleting.title}" (${formatINR(deleting.amount)}) will be removed from your list. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete expense"
        onConfirm={() => {
          if (deleting) {
            deleteExpense(deleting.id)
            toast('Expense deleted', 'info')
          }
        }}
      />
    </div>
  )
}

function IconAction({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`rounded-lg p-2 text-ink-muted transition-colors hover:bg-ink/5 ${danger ? 'hover:text-danger' : 'hover:text-ink'
        }`}
    >
      {children}
    </button>
  )
}

function ExpensesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10" />
      <Skeleton className="h-14" />
      <Skeleton className="h-64" />
    </div>
  )
}

/** ISO date shifted by a number of days, keeping the same timeline math everywhere. */
export function isoShift(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}


