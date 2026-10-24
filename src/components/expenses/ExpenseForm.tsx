import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, type Category, type Expense } from '../../types'
import { isoDate } from '../../lib/format'
import { Modal } from '../shared/Modal'
import { Button } from '../shared/Button'
import { Field, Input, Select, Textarea } from '../shared/Input'
import { formatINR } from '../../lib/format'

export interface ExpenseFormValues {
  title: string
  amount: string
  category: Category
  date: string
  notes: string
}

function validate(values: ExpenseFormValues): Partial<Record<keyof ExpenseFormValues, string>> {
  const errors: Partial<Record<keyof ExpenseFormValues, string>> = {}
  if (!values.title.trim()) errors.title = 'Give this expense a short name.'
  if (!values.amount.trim() || Number.isNaN(Number(values.amount))) {
    errors.amount = 'Enter the amount in rupees, for example 120.'
  } else if (Number(values.amount) <= 0) {
    errors.amount = 'The amount needs to be more than zero.'
  } else if (Number(values.amount) > 50000) {
    errors.amount = 'Amount cannot exceed ₹50,000 for a single transaction.'
  }
  if (!values.date) errors.date = 'Pick the day you spent this.'
  return errors
}

const emptyValues = (): ExpenseFormValues => ({
  title: '',
  amount: '',
  category: 'Food',
  date: isoDate(new Date()),
  notes: '',
})

export function ExpenseFormModal({
  open,
  onClose,
  onSave,
  editing,
}: {
  open: boolean
  onClose: () => void
  onSave: (values: ExpenseFormValues) => void
  editing: Expense | null
}) {
  const [values, setValues] = useState<ExpenseFormValues>(emptyValues)
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormValues, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(
        editing
          ? {
              title: editing.title,
              amount: String(editing.amount),
              category: editing.category,
              date: editing.date,
              notes: editing.notes ?? '',
            }
          : emptyValues(),
      )
      setErrors({})
    }
  }, [open, editing])

  const preview = useMemo(() => {
    const n = Number(values.amount)
    return Number.isFinite(n) && n > 0 ? formatINR(n) : '—'
  }, [values.amount])

  const submit = () => {
    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitting(true)
    // Simulated latency mirrors the future API round-trip.
    window.setTimeout(() => {
      setSubmitting(false)
      onSave(values)
      onClose()
    }, 250)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit expense' : 'Add expense'}
      description={editing ? 'Update the details of this entry.' : 'Log what you spent, in a few taps.'}
      wide
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="hidden text-[13px] text-ink-muted sm:block">
            Amount: <span className="font-semibold tnum text-ink">{preview}</span>
          </p>
          <div className="ml-auto flex gap-2.5">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? 'Saving…' : editing ? 'Save changes' : 'Save expense'}
            </Button>
          </div>
        </div>
      }
    >
      <form
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="sm:col-span-2">
          <Field label="Expense title" required error={errors.title}>
            <Input
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              placeholder="e.g. Canteen lunch"
              error={!!errors.title}
              autoFocus
            />
          </Field>
        </div>
        <Field label="Amount" required error={errors.amount}>
          <Input
            value={values.amount}
            onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value }))}
            placeholder="0"
            inputMode="decimal"
            prefix="₹"
            error={!!errors.amount}
            className="tnum"
          />
        </Field>
        <Field label="Category" required>
          <Select
            value={values.category}
            onChange={(e) => setValues((v) => ({ ...v, category: e.target.value as Category }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" required error={errors.date}>
          <Input
            type="date"
            value={values.date}
            max={isoDate(new Date(Date.now() + 86400000 * 365))}
            onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
            error={!!errors.date}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes" hint="Optional — a word about what this was for.">
            <Textarea
              rows={2}
              value={values.notes}
              onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
              placeholder="Anything worth remembering later"
            />
          </Field>
        </div>
        {/* Submit is triggered by footer buttons; enter also works. */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  )
}
