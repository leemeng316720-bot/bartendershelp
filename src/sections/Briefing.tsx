import { useMemo, useState } from 'react'
import { BarChart3, BellRing, Sparkles, Loader2, Clock3 } from 'lucide-react'
import { toast } from 'sonner'
import type { AppData } from '@/types'
import { STATUS_META } from '@/types'
import { daysAgo, formatDate } from '@/lib/store'
import { generateBriefingNarrative } from '@/lib/ai'
import { Chip, SectionTitle, Tag } from '@/components/bits'
import { cn } from '@/lib/utils'

const DAY = 86400000

export default function Briefing({
  data,
  onGoSettings,
}: {
  data: AppData
  onGoSettings: () => void
}) {
  const [range, setRange] = useState<7 | 30>(7)
  const [narrative, setNarrative] = useState('')
  const [loading, setLoading] = useState(false)

  const stats = useMemo(() => {
    const now = Date.now()
    const inRange = data.drinks.filter((d) => now - d.createdAt <= range * DAY)
    const byStatus = (['idea', 'unnamed', 'draft', 'final'] as const).map((s) => ({
      status: s,
      count: data.drinks.filter((d) => d.status === s).length,
    }))
    const tagCount = new Map<string, number>()
    data.drinks.forEach((d) => d.flavorTags.forEach((t) => tagCount.set(t, (tagCount.get(t) ?? 0) + 1)))
    const topTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
    const bySeries = data.series
      .map((s) => ({ name: s.name, count: data.drinks.filter((d) => d.seriesId === s.id).length }))
      .filter((x) => x.count > 0)
    const pending = data.drinks.filter(
      (d) => (d.status === 'unnamed' || d.status === 'draft') && now - d.updatedAt > 7 * DAY,
    )
    const hot = data.drinks.filter((d) => d.feedback === 'hot').length
    const adjust = data.drinks.filter((d) => d.feedback === 'adjust').length
    const lastUpdate = data.drinks.reduce((m, d) => Math.max(m, d.updatedAt), 0)
    const stuckDays = lastUpdate ? daysAgo(lastUpdate) : 0
    return { inRange, byStatus, topTags, bySeries, pending, hot, adjust, stuckDays }
  }, [data, range])

  const summaryText = () => {
    const lines = [
      `统计范围：近 ${range} 天`,
      `期间新创作：${stats.inRange.length} 款`,
      `全部酒款：${data.drinks.length} 款（${stats.byStatus.map((b) => `${STATUS_META[b.status].label}${b.count}`).join('，')}）`,
      `高反响 ${stats.hot} 款，待调整 ${stats.adjust} 款`,
      `常见风味：${stats.topTags.slice(0, 5).map(([t, c]) => `${t}(${c})`).join('、') || '暂无'}`,
      `系列分布：${stats.bySeries.map((s) => `${s.name}${s.count}款`).join('、') || '暂无系列'}`,
      stats.pending.length ? `超过7天未推进：${stats.pending.map((d) => d.name || '未命名').join('、')}` : '',
      stats.stuckDays >= 3 ? `距上次创作已 ${stats.stuckDays} 天` : '',
      `酒吧定位：${data.prefs.barPositioning || '未填写'}；当前探索：${data.prefs.currentFocus || '未填写'}`,
    ]
    return lines.filter(Boolean).join('\n')
  }

  const handleNarrative = async () => {
    if (!data.ai.apiKey) {
      toast.error('先配置 API Key', { description: '去「我的」里填一下。' })
      onGoSettings()
      return
    }
    setLoading(true)
    try {
      const text = await generateBriefingNarrative(data.ai, data.prefs, summaryText())
      setNarrative(text)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  const maxStatus = Math.max(1, ...stats.byStatus.map((b) => b.count))

  return (
    <div className="px-4 pb-24 pt-4">
      <header className="mb-1 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">创作简报</h1>
          <p className="mt-1 text-xs text-muted-foreground">约定：{data.prefs.briefingNote || '每周一次'}</p>
        </div>
        <div className="flex gap-1.5">
          <Chip active={range === 7} onClick={() => setRange(7)}>近7天</Chip>
          <Chip active={range === 30} onClick={() => setRange(30)}>近30天</Chip>
        </div>
      </header>

      {stats.stuckDays >= 3 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
          距上次动笔已经 {stats.stuckDays} 天了。上次想做的那杯，进展如何？
        </div>
      )}

      <SectionTitle>这{range === 7 ? '周' : '个月'}做了几款</SectionTitle>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="font-display text-4xl font-bold text-primary">{stats.inRange.length}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {stats.inRange.length > 0
            ? `最近一杯：${stats.inRange.sort((a, b) => b.createdAt - a.createdAt)[0].name || '未命名'}（${formatDate(
                stats.inRange[0].createdAt,
              )}）`
            : '这段时间没有新酒，没关系，灵感有淡季'}
        </p>
      </div>

      <SectionTitle>创作管线</SectionTitle>
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        {stats.byStatus.map(({ status, count }) => (
          <div key={status} className="flex items-center gap-2">
            <span className="w-12 text-xs text-muted-foreground">{STATUS_META[status].label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn('h-full rounded-full', STATUS_META[status].color.split(' ')[0])}
                style={{ width: `${(count / maxStatus) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right text-xs">{count}</span>
          </div>
        ))}
      </div>

      {stats.pending.length > 0 && (
        <>
          <SectionTitle>拖了一周以上的</SectionTitle>
          <div className="space-y-2">
            {stats.pending.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                <div>
                  <p className="font-display text-sm font-semibold">{d.name || '未命名'} · {d.baseSpirit}</p>
                  <p className="text-[11px] text-muted-foreground">{STATUS_META[d.status].label} · {daysAgo(d.updatedAt)} 天没动了</p>
                </div>
                <BellRing className="h-4 w-4 text-yellow-400" />
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle>风味足迹</SectionTitle>
      <div className="flex flex-wrap gap-1.5">
        {stats.topTags.length ? stats.topTags.map(([t, c]) => <Tag key={t}>{t} ×{c}</Tag>) : <p className="text-xs text-muted-foreground/60">还没有风味记录</p>}
      </div>

      <SectionTitle>系列图谱</SectionTitle>
      <div className="space-y-2">
        {stats.bySeries.length ? (
          stats.bySeries.map((s) => (
            <div key={s.name} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <span className="font-display text-sm">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.count} 款</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground/60">还没有系列，可以在酒款详情里建一个</p>
        )}
      </div>

      <SectionTitle>客人反馈</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center">
          <p className="font-display text-2xl font-bold text-red-300">{stats.hot}</p>
          <p className="text-xs text-red-200/80">高反响</p>
        </div>
        <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-3 text-center">
          <p className="font-display text-2xl font-bold text-yellow-300">{stats.adjust}</p>
          <p className="text-xs text-yellow-200/80">待调整</p>
        </div>
      </div>

      <button
        onClick={handleNarrative}
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/10 py-3 font-display text-sm font-semibold text-primary disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        让助手写一段复盘
      </button>

      {narrative && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs text-primary">
            <BarChart3 className="h-3.5 w-3.5" /> 助手的复盘
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{narrative}</p>
        </div>
      )}
    </div>
  )
}
