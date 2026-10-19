import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, CheckCircle2, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import type { SavingsGoal } from '../types'
import { useAppData } from '../hooks/useAppData'
import { goalProgress } from '../lib/finance'
import { formatINR, isoDate } from '../lib/format'
import { Card, EmptyState, ProgressBar } from '../components/shared/ui'
import { Button } from '../components/shared/Button'
import { Field, Input } from '../components/shared/Input'
import { Modal, ConfirmDialog } from '../components/shared/Modal'
import { useToast } from '../components/shared/Toast'

interface GoalDraft {
  name: string
  target: string
  saved: string
  targetDate: string
}

const emptyDraft = (defaultSaved = ''): GoalDraft => ({
  name: '',
  target: '',
  saved: defaultSaved,
  targetDate: isoDate(new Date(Date.now() + 86400000 * 60)),
})

export function Savings() {
  const { data, today, addGoal, updateGoal, deleteGoal, updateSavedAmount } = useAppData()
  const { toast } = useToast()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SavingsGoal | null>(null)
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null)
  const [addingTo, setAddingTo] = useState<SavingsGoal | null>(null)
  const [addToAmount, setAddToAmount] = useState('')

  const [draft, setDraft] = useState<GoalDraft>(emptyDraft)
  const [errors, setErrors] = useState<Partial<Record<keyof GoalDraft, string>>>({})

  if (!data) return null

  const validate = (d: GoalDraft) => {
    const errs: typeof errors = {}
    if (!d.name.trim()) errs.name = 'Name the goal, for example "Emergency fund".'
    const t = Number(d.target)
    if (!d.target.trim() || Number.isNaN(t) || t <= 0) errs.target = 'Enter a target amount above zero.'
    const s = Number(d.saved || '0')
    if (Number.isNaN(s) || s < 0) errs.saved = 'Saved amount cannot be negative.'
    if (!d.targetDate) errs.targetDate = 'Pick a realistic target date.'
    return errs
  }

  const openCreate = () => {
    setEditing(null)
    setDraft(emptyDraft())
    setErrors({})
    setFormOpen(true)
  }

  const openEdit = (g: SavingsGoal) => {
    setEditing(g)
    setDraft({
      name: g.name,
      target: String(g.target),
      saved: String(g.saved),
      targetDate: g.targetDate,
    })
    setErrors({})
    setFormOpen(true)
  }

  const save = () => {
    const errs = validate(draft)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const payload = {
      name: draft.name.trim(),
      target: Number(draft.target),
      saved: Number(draft.saved || '0'),
      targetDate: draft.targetDate,
    }
    if (editing) {
      updateGoal(editing.id, payload)
      toast(`Goal "${payload.name}" updated`, 'success')
    } else {
      addGoal(payload)
      toast(`Goal "${payload.name}" created`, 'success')
    }
    setFormOpen(false)
  }

  const confirmAddTo = () => {
    if (!addingTo) return
    const amount = Number(addToAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast('Enter an amount to add', 'error')
      return
    }
    const next = Math.min(addingTo.target, addingTo.saved + amount)
    updateSavedAmount(addingTo.id, next)
    toast(`${formatINR(next - addingTo.saved)} added to "${addingTo.name}"`, 'success')
    setAddingTo(null)
    setAddToAmount('')
  }

  const goals = data.goals.map((g) => goalProgress(g, today))
  const totalSaved = goals.reduce((s, g) => s + g.goal.saved, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-ink-muted">
          <span className="font-semibold tnum text-ink">{formatINR(totalSaved)}</span> saved across{' '}
          {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
        </p>
        <Button icon={<Plus />} onClick={openCreate}>
          Create a goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Target />}
            title="No savings goals yet"
            message="Whether it's an emergency cushion or new headphones — set a target and save towards it a little at a time."
            action={<Button variant="secondary" icon={<Plus />} onClick={openCreate}>Create your first goal</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {goals.map((g, i) => (
            <motion.div
              key={g.goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="group flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[15px] font-semibold text-ink">{g.goal.name}</h3>
                      {g.complete && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f8f0] px-2 py-0.5 text-2xs font-semibold text-[#178a63]">
                          <CheckCircle2 className="h-3 w-3" />
                          Complete
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                      <CalendarClock className="h-3 w-3" />
                      {g.complete
                        ? `Reached · target was ${formatINR(g.goal.target)}`
                        : `${g.daysLeft} days left · by ${new Date(g.goal.targetDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-sm:opacity-100">
                    <button
                      aria-label={`Edit ${g.goal.name}`}
                      onClick={() => openEdit(g.goal)}
                      className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label={`Delete ${g.goal.name}`}
                      onClick={() => setDeleting(g.goal)}
                      className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-ink/5 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <p className="font-display text-2xl font-bold tnum text-ink">
                      {formatINR(g.goal.saved)}
                    </p>
                    <p className="text-[13px] tnum text-ink-muted">of {formatINR(g.goal.target)}</p>
                  </div>
                  <ProgressBar
                    pct={g.pct}
                    className="mt-2.5"
                    color={g.complete ? 'var(--c-green)' : 'var(--c-primary)'}
                  />
                  <div className="mt-2 flex justify-between text-xs text-ink-muted">
                    <span className="tnum font-medium text-ink-secondary">{Math.round(g.pct)}% saved</span>
                    <span className="tnum">
                      {g.complete ? 'Goal reached 🎉' : formatINR(g.remaining) + ' to go'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2.5 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setAddingTo(g.goal)
                      setAddToAmount('')
                    }}
                  >
                    Add money
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(g.goal)}
                  >
                    Edit goal
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit goal' : 'Create a savings goal'}
        description={editing ? 'Adjust the target or your saved amount.' : 'Decide what you are saving for.'}
        footer={
          <div className="flex justify-end gap-2.5">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>{editing ? 'Save changes' : 'Create goal'}</Button>
          </div>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <Field label="Goal name" required error={errors.name}>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="e.g. Emergency fund"
              error={!!errors.name}
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Target amount" required error={errors.target}>
              <Input
                inputMode="decimal"
                value={draft.target}
                prefix="₹"
                className="tnum"
                error={!!errors.target}
                onChange={(e) => setDraft((d) => ({ ...d, target: e.target.value }))}
              />
            </Field>
            <Field label="Already saved" error={errors.saved}>
              <Input
                inputMode="decimal"
                value={draft.saved}
                prefix="₹"
                className="tnum"
                error={!!errors.saved}
                onChange={(e) => setDraft((d) => ({ ...d, saved: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Target date" required error={errors.targetDate}>
            <Input
              type="date"
              value={draft.targetDate}
              min={today}
              error={!!errors.targetDate}
              onChange={(e) => setDraft((d) => ({ ...d, targetDate: e.target.value }))}
            />
          </Field>
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </Modal>

      {/* Add money modal */}
      <Modal
        open={addingTo !== null}
        onClose={() => setAddingTo(null)}
        title={addingTo ? `Add money to "${addingTo.name}"` : ''}
        description={
          addingTo
            ? `${formatINR(Math.max(0, addingTo.target - addingTo.saved))} remaining of ${formatINR(addingTo.target)}`
            : ''
        }
        footer={
          <div className="flex justify-end gap-2.5">
            <Button variant="ghost" onClick={() => setAddingTo(null)}>
              Cancel
            </Button>
            <Button onClick={confirmAddTo}>Add money</Button>
          </div>
        }
      >
        <Field
          label="Amount"
          required
          hint={`Saved so far: ${formatINR(addingTo?.saved ?? 0)}`}
        >
          <Input
            inputMode="decimal"
            value={addToAmount}
            prefix="₹"
            className="tnum"
            autoFocus
            onChange={(e) => setAddToAmount(e.target.value)}
          />
        </Field>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        destructive
        title="Delete this goal?"
        message={
          deleting
            ? `"${deleting.name}" and its progress record will be removed. Any money conceptually saved stays in your pocket-money picture, but this goal disappears.`
            : ''
        }
        confirmLabel="Delete goal"
        onConfirm={() => {
          if (deleting) {
            deleteGoal(deleting.id)
            toast(`Goal "${deleting.name}" deleted`, 'info')
          }
        }}
      />
    </div>
  )
}