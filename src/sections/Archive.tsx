import { useMemo, useState } from 'react'
import { Search, Wine, ChevronRight, Flame, Wrench } from 'lucide-react'
import type { AppData, DrinkStatus } from '@/types'
import { STATUS_META } from '@/types'
import { Chip, EmptyState, inputCls } from '@/components/bits'
import { formatDate } from '@/lib/store'
import { cn } from '@/lib/utils'

const STATUS_FILTERS: { key: DrinkStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'idea', label: '灵感' },
  { key: 'unnamed', label: '待命名' },
  { key: 'draft', label: '待文案' },
  { key: 'final', label: '已定稿' },
]

export default function Archive({
  data,
  onOpen,
}: {
  data: AppData
  onOpen: (id: string) => void
}) {
  const [status, setStatus] = useState<DrinkStatus | 'all'>('all')
  const [seriesId, setSeriesId] = useState<string>('all')
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    return data.drinks
      .filter((d) => (status === 'all' ? true : d.status === status))
      .filter((d) => (seriesId === 'all' ? true : seriesId === 'none' ? !d.seriesId : d.seriesId === seriesId))
      .filter((d) => {
        if (!q.trim()) return true
        const hay = [d.name, d.baseSpirit, d.inspiration, d.feeling, ...d.flavorTags, ...d.altNames]
          .join(' ')
          .toLowerCase()
        return hay.includes(q.trim().toLowerCase())
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [data.drinks, status, seriesId, q])

  const seriesName = (id: string | null) => data.series.find((s) => s.id === id)?.name

  return (
    <div className="px-4 pb-24 pt-4">
      <header className="mb-4">
        <h1 className="font-display text-2xl font-bold">酒款档案库</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          共 {data.drinks.length} 款 · {data.series.length} 个系列
        </p>
      </header>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜酒名、基酒、灵感…"
          className={cn(inputCls, 'pl-9')}
        />
      </div>

      <div className="no-scrollbar -mx-4 mb-2 flex gap-2 overflow-x-auto px-4">
        {STATUS_FILTERS.map((f) => (
          <Chip key={f.key} active={status === f.key} onClick={() => setStatus(f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>

      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        <Chip active={seriesId === 'all'} onClick={() => setSeriesId('all')}>
          所有系列
        </Chip>
        {data.series.map((s) => (
          <Chip key={s.id} active={seriesId === s.id} onClick={() => setSeriesId(s.id)}>
            {s.name}
          </Chip>
        ))}
        <Chip active={seriesId === 'none'} onClick={() => setSeriesId('none')}>
          未入系列
        </Chip>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Wine className="h-10 w-10" />}
          text="这里还空着"
          sub="去「速记」录下你的第一杯"
        />
      ) : (
        <div className="space-y-3">
          {list.map((d) => {
            const sm = STATUS_META[d.status]
            return (
              <button
                key={d.id}
                onClick={() => onOpen(d.id)}
                className="w-full overflow-hidden rounded-xl border border-border bg-card text-left transition-transform active:scale-[0.98]"
              >
                {d.photo && (
                  <div className="relative">
                    <img src={d.photo} alt={d.name || '未命名'} className="aspect-[16/9] w-full object-cover" />
                    <span
                      className={cn(
                        'absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[11px] backdrop-blur-sm',
                        sm.color,
                      )}
                    >
                      {sm.label}
                    </span>
                  </div>
                )}
                <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display truncate text-lg font-semibold">
                      {d.name || <span className="text-muted-foreground">未命名</span>}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.baseSpirit}
                      {seriesName(d.seriesId) && ` · ${seriesName(d.seriesId)}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {d.feedback === 'hot' && <Flame className="h-3.5 w-3.5 text-red-400" />}
                    {d.feedback === 'adjust' && <Wrench className="h-3.5 w-3.5 text-yellow-400" />}
                    {!d.photo && (
                      <span className={cn('rounded-full border px-2 py-0.5 text-[11px]', sm.color)}>
                        {sm.label}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {d.flavorTags.map((t) => (
                    <span key={t} className="rounded bg-secondary/70 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
                {(d.inspiration || d.feeling) && (
                  <p className="mt-2 line-clamp-1 text-xs text-muted-foreground/80">
                    {d.inspiration || d.feeling}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-muted-foreground/50">
                  更新于 {formatDate(d.updatedAt)}
                </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
