import { useEffect, useState } from 'react'
import { Check, Info } from 'lucide-react'
import { useToast } from '../components/shared/Toast'
import type { ThemePreference, UserProfile } from '../types'
import { useAppData } from '../hooks/useAppData'
import { formatINR } from '../lib/format'
import { Card, CardHeader, Skeleton } from '../components/shared/ui'
import { Button } from '../components/shared/Button'
import { Field, Input, Select, Toggle } from '../components/shared/Input'
import { cn } from '../components/shared/Button'

function SettingsSkeleton() {
  return (
    <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Skeleton className="h-80" />
      <div className="space-y-5">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  )
}

export function Settings() {
  const { data, updateProfile, updatePreferences, setMonthlyBudget } = useAppData()
  const { toast } = useToast()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [budgetDraft, setBudgetDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) {
      setProfile({ ...data.profile })
      setBudgetDraft(String(data.budget.monthly))
    }
  }, [data])

  if (!data || !profile) return <SettingsSkeleton />

  const saveProfile = () => {
    setSaving(true)
    window.setTimeout(() => {
      updateProfile(profile)
      setSaving(false)
      toast('Profile updated', 'success')
    }, 250)
  }

  const saveBudget = () => {
    const n = Number(budgetDraft)
    if (!Number.isFinite(n) || n <= 0) {
      toast('Enter a valid monthly amount', 'error')
      return
    }
    setMonthlyBudget(n)
    toast(`Default monthly budget set to ${formatINR(n)}`, 'success')
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Profile */}
      <Card className="p-6">
        <CardHeader title="Profile" description="How Hostelers greets you." />
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveProfile()
          }}
        >
          <Field label="Full name" required>
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Display name" hint="Shown in the header greeting.">
              <Input
                value={profile.nickname}
                onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
              />
            </Field>
            <Field label="College" hint="Your college or campus name.">
              <Input
                value={profile.college}
                onChange={(e) => setProfile({ ...profile, college: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Email" required hint="Used for account notifications and security.">
            <Input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-5">
        {/* Currency */}
        <Card className="p-6">
          <CardHeader title="Currency" description="Amounts follow the selected currency." />
          <div className="mt-4">
            <Field label="Display currency">
              <Select
                value={data.preferences.currency}
                onChange={(e) =>
                  updatePreferences({ currency: e.target.value as 'INR' })
                }
              >
                <option value="INR">Indian rupee (₹)</option>
              </Select>
            </Field>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Pocket money and targets are tracked in Indian Rupees (₹).
            </p>
          </div>
        </Card>

        {/* Theme */}
        <Card className="p-6">
          <CardHeader title="Appearance" description="Pick the look that suits your room." />
          <div className="mt-4 flex gap-2.5">
            {(
              [
                { value: 'light', label: 'Light', swatch: '#F8F9FC' },
                { value: 'dark', label: 'Dark', swatch: '#171B26' },
              ] as { value: ThemePreference; label: string; swatch: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => updatePreferences({ theme: opt.value })}
                className={cn(
                  'flex-1 rounded-xl border p-3 text-left transition-colors',
                  data.preferences.theme === opt.value
                    ? 'border-primary bg-primary-soft'
                    : 'border-line hover:border-primary/40',
                )}
                aria-pressed={data.preferences.theme === opt.value}
              >
                <span
                  className="mb-2 flex h-10 w-full items-end rounded-lg border border-line p-1.5"
                  style={{ backgroundColor: opt.swatch }}
                >
                  <span
                    className="h-2.5 w-8 rounded-sm"
                    style={{ backgroundColor: opt.value === 'light' ? '#7655E8' : '#8F74FF' }}
                  />
                </span>
                <span className="text-[13px] font-medium text-ink">{opt.label}</span>
                {data.preferences.theme === opt.value && (
                  <Check className="float-right -mt-4 h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Monthly budget preference */}
        <Card className="p-6">
          <CardHeader title="Monthly budget" description="Used to initialise each new month." />
          <div className="mt-4 flex items-end gap-2.5">
            <Field label="Pocket money amount">
              <Input
                inputMode="decimal"
                value={budgetDraft}
                prefix="₹"
                className="w-40 tnum"
                onChange={(e) => setBudgetDraft(e.target.value)}
              />
            </Field>
            <Button onClick={saveBudget}>Save</Button>
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Changing this does not reallocate your category limits — edit those in the Budget Planner.
          </p>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <CardHeader title="Notifications" description="Choose which nudges reach you." />
          <div className="mt-2 divide-y divide-line">
            <Toggle
              checked={data.preferences.monthlyBudgetReminder}
              onChange={(v) => updatePreferences({ monthlyBudgetReminder: v })}
              label="Monthly budget reminder"
              description="One gentle nudge after mid-month."
            />
            <Toggle
              checked={data.preferences.categoryLimitAlerts}
              onChange={(v) => updatePreferences({ categoryLimitAlerts: v })}
              label="Category limit alerts"
              description="Heads-up when a category nears its limit."
            />
            <Toggle
              checked={data.preferences.weeklySummary}
              onChange={(v) => updatePreferences({ weeklySummary: v })}
              label="Weekly summary"
              description="A short recap of the week's spending."
            />
            <Toggle
              checked={data.preferences.savingsGoalUpdates}
              onChange={(v) => updatePreferences({ savingsGoalUpdates: v })}
              label="Savings goal updates"
              description="Money added or goal milestones."
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
