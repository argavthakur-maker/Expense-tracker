import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatINR, formatDateShort } from '../../lib/format'
import { CATEGORY_COLORS, type Category } from '../../types'

interface DayPoint {
  date: string
  amount: number
}

/** Recharts tooltip entries wrap our own data item inside a `payload` field. */
type TooltipEntry<T> = { payload?: T }

/* ---------- Spending trend (area) ---------- */

const gradientId = 'spendFill'

function TrendTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry<DayPoint>[] }) {
  if (!active || !payload?.length) return null
  const p = (payload[0].payload ?? payload[0]) as DayPoint
  return (
    <div className="rounded-lg border border-line bg-card px-3 py-2 shadow-lift">
      <p className="text-xs font-semibold text-ink">{formatDateShort(p.date)}</p>
      <p className="mt-0.5 text-xs tnum text-ink-secondary">{formatINR(p.amount)} spent</p>
    </div>
  )
}

export function SpendingTrend({ data, height = 260 }: { data: DayPoint[]; height?: number }) {
  return (
    <div style={{ height }} data-testid="spending-trend">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7655E8" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#7655E8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => formatDateShort(v).split(' ')[0]}
            tick={{ fontSize: 11, fill: 'var(--c-text-muted)' }}
            axisLine={{ stroke: 'var(--c-border)' }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--c-text-muted)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `₹${v}`}
            width={44}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--c-border)' }} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#7655E8"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: '#7655E8', stroke: 'var(--c-card)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ---------- Category breakdown (donut) ---------- */

export interface CategoryDatum {
  category: Category
  amount: number
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipEntry<CategoryDatum & { pct: number }>[]
}) {
  if (!active || !payload?.length) return null
  const p = (payload[0].payload ?? payload[0]) as CategoryDatum & { pct: number }
  return (
    <div className="rounded-lg border border-line bg-card px-3 py-2 shadow-lift">
      <p className="text-xs font-semibold text-ink">{p.category}</p>
      <p className="mt-0.5 text-xs tnum text-ink-secondary">
        {formatINR(p.amount)} · {p.pct}%
      </p>
    </div>
  )
}

/** Donut of the selected month's expenses with a readable center share. */
export function CategoryDonut({ data }: { data: (CategoryDatum & { pct: number })[] }) {
  const spent = data.reduce((s, d) => s + d.amount, 0)
  return (
    <div className="relative" data-testid="category-donut">
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Tooltip content={<DonutTooltip />} />
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            innerRadius={64}
            outerRadius={94}
            paddingAngle={2}
            strokeWidth={2}
            stroke="var(--c-card)"
          >
            {data.map((entry) => (
              <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xs font-medium text-ink-muted">Spent</p>
        <p className="font-display text-lg font-bold tnum text-ink">{formatINR(spent)}</p>
      </div>
    </div>
  )
}

/** Legend list pairing category, amount and percentage share. */
export function CategoryLegend({ data }: { data: (CategoryDatum & { pct: number })[] }) {
  return (
    <ul className="space-y-2.5" aria-label="Category breakdown">
      {data.map((d) => (
        <li key={d.category} className="flex items-center gap-2.5 text-[13px]">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: CATEGORY_COLORS[d.category] }}
            aria-hidden="true"
          />
          <span className="flex-1 font-medium text-ink">{d.category}</span>
          <span className="tnum text-ink-secondary">{formatINR(d.amount)}</span>
          <span className="w-10 text-right tnum text-ink-muted">{d.pct}%</span>
        </li>
      ))}
    </ul>
  )
}
