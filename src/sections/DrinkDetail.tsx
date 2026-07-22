import { useState } from 'react'
import {
  ChevronLeft, Trash2, Sparkles, Plus, X, Loader2, Flame, Wrench, CircleSlash,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AppData, Drink, DrinkStatus, Feedback } from '@/types'
import { STATUS_META, FEEDBACK_META } from '@/types'
import { formatDate, daysAgo } from '@/lib/store'
import { polishStory } from '@/lib/ai'
import PhotoField from '@/components/PhotoField'
import { Chip, Field, SectionTitle, inputCls } from '@/components/bits'
import { cn } from '@/lib/utils'

const STATUS_FLOW: DrinkStatus[] = ['idea', 'unnamed', 'draft', 'final']

interface Props {
  drink: Drink
  data: AppData
  onBack: () => void
  onUpdate: (d: Drink) => void
  onDelete: (id: string) => void
  onGoNaming: (id: string) => void
  onAddSeries: (name: string) => string
}

export default function DrinkDetail({ drink, data, onBack, onUpdate, onDelete, onGoNaming, onAddSeries }: Props) {
  const [d, setD] = useState<Drink>(drink)
  const [newTag, setNewTag] = useState('')
  const [newAlt, setNewAlt] = useState('')
  const [newSeries, setNewSeries] = useState('')
  const [addingSeries, setAddingSeries] = useState(false)
  const [polishing, setPolishing] = useState(false)

  const patch = (p: Partial<Drink>) => {
    const nd = { ...d, ...p, updatedAt: Date.now() }
    setD(nd)
    onUpdate(nd)
  }

  const addTag = () => {
    const t = newTag.trim()
    if (t && !d.flavorTags.includes(t)) patch({ flavorTags: [...d.flavorTags, t] })
    setNewTag('')
  }

  const addAlt = () => {
    const t = newAlt.trim()
    if (t && !d.altNames.includes(t)) patch({ altNames: [...d.altNames, t] })
    setNewAlt('')
  }

  const handlePolish = async () => {
    if (!d.story.trim()) return
    if (!data.ai.apiKey) {
      toast.error('先在「我的」里配置 API Key')
      return
    }
    setPolishing(true)
    try {
      const polished = await polishStory(data.ai, data.prefs, d.story)
      patch({ story: polished })
      toast.success('已润色，核心表达未动')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '润色失败')
    } finally {
      setPolishing(false)
    }
  }

  const feedbackIcon = { none: CircleSlash, hot: Flame, adjust: Wrench } as const

  return (
    <div className="px-4 pb-24 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> 档案库
        </button>
        <button
          onClick={() => {
            if (window.confirm('确定删掉这款酒的全部档案？')) onDelete(d.id)
          }}
          className="p-1 text-muted-foreground/60"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <input
        value={d.name}
        onChange={(e) => patch({ name: e.target.value })}
        placeholder="未命名"
        className="font-display w-full bg-transparent text-2xl font-bold placeholder:text-muted-foreground/40 focus:outline-none"
      />
      <p className="mt-1 text-[11px] text-muted-foreground/60">
        建档 {formatDate(d.createdAt)} · {daysAgo(d.createdAt)} 天前
      </p>

      {/* 形态照片 */}
      <div className="mt-4">
        <PhotoField photo={d.photo} onChange={(photo) => patch({ photo })} />
      </div>

      {/* 状态流 */}
      <SectionTitle>创作进度</SectionTitle>
      <div className="flex gap-1.5">
        {STATUS_FLOW.map((s) => {
          const meta = STATUS_META[s]
          const active = d.status === s
          return (
            <button
              key={s}
              onClick={() => patch({ status: s })}
              className={cn(
                'flex-1 rounded-lg border py-1.5 text-xs transition-colors',
                active ? meta.color : 'border-border bg-card text-muted-foreground/60',
              )}
            >
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* 反馈 */}
      <SectionTitle>客人 / 同行反馈</SectionTitle>
      <div className="flex gap-1.5">
        {(Object.keys(FEEDBACK_META) as Feedback[]).map((f) => {
          const meta = FEEDBACK_META[f]
          const Icon = feedbackIcon[f]
          const active = d.feedback === f
          return (
            <button
              key={f}
              onClick={() => patch({ feedback: f })}
              className={cn(
                'flex flex-1 items-center justify-center gap-1 rounded-lg border py-1.5 text-xs transition-colors',
                active ? meta.color : 'border-border bg-card text-muted-foreground/60',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* 配方 */}
      <SectionTitle
        extra={
          <button
            onClick={() => onGoNaming(d.id)}
            className="flex items-center gap-1 text-xs text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" /> 去起名
          </button>
        }
      >
        配方与风味
      </SectionTitle>
      <div className="space-y-3">
        <Field label="基酒">
          <input value={d.baseSpirit} onChange={(e) => patch({ baseSpirit: e.target.value })} className={inputCls} />
        </Field>
        <Field label="比例">
          <input value={d.ratio} onChange={(e) => patch({ ratio: e.target.value })} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="技法">
            <input value={d.technique} onChange={(e) => patch({ technique: e.target.value })} placeholder="摇和 / 搅拌" className={inputCls} />
          </Field>
          <Field label="装饰">
            <input value={d.garnish} onChange={(e) => patch({ garnish: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <Field label="风味关键词">
          <div className="flex flex-wrap items-center gap-1.5">
            {d.flavorTags.map((t) => (
              <span key={t} className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
                {t}
                <X
                  className="h-3 w-3 cursor-pointer text-muted-foreground"
                  onClick={() => patch({ flavorTags: d.flavorTags.filter((x) => x !== t) })}
                />
              </span>
            ))}
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              placeholder="+ 加风味"
              className="w-20 bg-transparent text-xs focus:outline-none"
            />
          </div>
        </Field>
      </div>

      {/* 灵感 */}
      <SectionTitle>灵感与感觉</SectionTitle>
      <div className="space-y-3">
        <Field label="灵感来源">
          <textarea value={d.inspiration} onChange={(e) => patch({ inspiration: e.target.value })} rows={2} className={inputCls} />
        </Field>
        <Field label="想呈现的感觉">
          <textarea value={d.feeling} onChange={(e) => patch({ feeling: e.target.value })} rows={2} className={inputCls} />
        </Field>
      </div>

      {/* 命名档案 */}
      <SectionTitle>命名档案</SectionTitle>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {d.altNames.map((n) => (
            <span key={n} className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-xs text-muted-foreground">
              {n}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => patch({ altNames: d.altNames.filter((x) => x !== n) })}
              />
            </span>
          ))}
          {d.altNames.length === 0 && <p className="text-xs text-muted-foreground/50">还没有备选名</p>}
        </div>
        <div className="flex gap-2">
          <input
            value={newAlt}
            onChange={(e) => setNewAlt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAlt()}
            placeholder="手动加一个备选名"
            className={inputCls}
          />
          <button onClick={addAlt} className="shrink-0 rounded-lg bg-secondary px-3">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 故事文案 */}
      <SectionTitle
        extra={
          d.story.trim() ? (
            <button
              onClick={handlePolish}
              disabled={polishing}
              className="flex items-center gap-1 text-xs text-primary disabled:opacity-50"
            >
              {polishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              助手润色
            </button>
          ) : undefined
        }
      >
        故事 / 酒单文案
      </SectionTitle>
      <textarea
        value={d.story}
        onChange={(e) => patch({ story: e.target.value })}
        rows={4}
        placeholder="这杯酒的故事，你自己写。助手只做语法和节奏。"
        className={inputCls}
      />

      {/* 系列 */}
      <SectionTitle>所属系列</SectionTitle>
      <div className="flex flex-wrap gap-1.5">
        <Chip active={!d.seriesId} onClick={() => patch({ seriesId: null })}>未入系列</Chip>
        {data.series.map((s) => (
          <Chip key={s.id} active={d.seriesId === s.id} onClick={() => patch({ seriesId: s.id })}>
            {s.name}
          </Chip>
        ))}
        <Chip onClick={() => setAddingSeries((v) => !v)}>
          <Plus className="mr-0.5 inline h-3 w-3" />新系列
        </Chip>
      </div>
      {addingSeries && (
        <div className="mt-2 flex gap-2">
          <input
            value={newSeries}
            onChange={(e) => setNewSeries(e.target.value)}
            placeholder="系列名，如「东方海岛」"
            className={inputCls}
          />
          <button
            onClick={() => {
              const name = newSeries.trim()
              if (!name) return
              const id = onAddSeries(name)
              patch({ seriesId: id })
              setNewSeries('')
              setAddingSeries(false)
            }}
            className="shrink-0 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            建
          </button>
        </div>
      )}
    </div>
  )
}
