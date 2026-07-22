import { useMemo, useState } from 'react'
import { Sparkles, Loader2, KeyRound, Check, BookmarkPlus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { AppData, Drink } from '@/types'
import { generateNamings, type NamingOption } from '@/lib/ai'
import { Chip, EmptyState, Field, inputCls } from '@/components/bits'
import { cn } from '@/lib/utils'

interface Props {
  data: AppData
  selectedDrinkId: string | null
  onSelectDrink: (id: string | null) => void
  onUpdateDrink: (d: Drink) => void
  onGoSettings: () => void
}

export default function NamingLab({ data, selectedDrinkId, onSelectDrink, onUpdateDrink, onGoSettings }: Props) {
  const [freeMode, setFreeMode] = useState(false)
  const [free, setFree] = useState({ baseSpirit: '', flavor: '', inspiration: '', feeling: '' })
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<NamingOption[]>([])
  const [adopted, setAdopted] = useState<string | null>(null)

  const drink = useMemo(
    () => data.drinks.find((d) => d.id === selectedDrinkId) ?? null,
    [data.drinks, selectedDrinkId],
  )

  const candidates = useMemo(
    () =>
      [...data.drinks]
        .sort((a, b) => {
          const score = (d: Drink) => (d.status === 'unnamed' ? 0 : d.status === 'draft' ? 1 : 2)
          return score(a) - score(b) || b.updatedAt - a.updatedAt
        })
        .slice(0, 12),
    [data.drinks],
  )

  const handleGenerate = async () => {
    if (!data.ai.apiKey) {
      toast.error('还没配置 API Key', { description: '去「我的」里填一下，助手才能开口。' })
      return
    }
    if (!freeMode && !drink) {
      toast.error('先选一款酒，或者切到自由描述')
      return
    }
    setLoading(true)
    setAdopted(null)
    try {
      const source: Partial<Drink> = freeMode
        ? {
            baseSpirit: free.baseSpirit,
            flavorTags: free.flavor.split(/[,，、\s]+/).filter(Boolean),
            inspiration: free.inspiration,
            feeling: free.feeling,
          }
        : drink!
      const opts = await generateNamings(data.ai, data.prefs, source, note)
      setOptions(opts)
    } catch (e) {
      toast.error('助手没接上话', { description: e instanceof Error ? e.message : undefined })
    } finally {
      setLoading(false)
    }
  }

  const adopt = (opt: NamingOption) => {
    if (freeMode || !drink) return
    const altNames = Array.from(
      new Set([...drink.altNames, ...options.map((o) => o.name).filter((n) => n !== opt.name)]),
    )
    onUpdateDrink({
      ...drink,
      name: opt.name,
      altNames,
      story: drink.story || opt.storyline,
      status: drink.status === 'unnamed' || drink.status === 'idea' ? 'draft' : drink.status,
      updatedAt: Date.now(),
    })
    setAdopted(opt.name)
    toast.success(`「${opt.name}」已定名`, { description: '其余选项已存入备选命名。' })
  }

  const saveAlt = (opt: NamingOption) => {
    if (freeMode || !drink) return
    if (drink.altNames.includes(opt.name) || drink.name === opt.name) {
      toast('这个名字已经在档案里了')
      return
    }
    onUpdateDrink({ ...drink, altNames: [...drink.altNames, opt.name], updatedAt: Date.now() })
    toast.success(`「${opt.name}」已存入备选`)
  }

  return (
    <div className="px-4 pb-24 pt-4">
      <header className="mb-4">
        <h1 className="font-display text-2xl font-bold">命名与叙事</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          助手只给选项，不给决定。拍板的永远是你。
        </p>
      </header>

      {!data.ai.apiKey && (
        <button
          onClick={onGoSettings}
          className="mb-4 flex w-full items-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 p-3 text-left text-xs text-yellow-200"
        >
          <KeyRound className="h-4 w-4 shrink-0" />
          还没有 API Key，助手开不了口。点这里去配置（默认 Kimi 接口，Key 只存在本机）。
        </button>
      )}

      <div className="mb-3 flex gap-2">
        <Chip active={!freeMode} onClick={() => setFreeMode(false)}>从档案里选酒</Chip>
        <Chip active={freeMode} onClick={() => setFreeMode(true)}>自由描述</Chip>
      </div>

      {!freeMode ? (
        <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
          {candidates.map((d) => (
            <button
              key={d.id}
              onClick={() => onSelectDrink(d.id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors',
                selectedDrinkId === d.id
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-border bg-card text-muted-foreground',
              )}
            >
              {d.name || '未命名'} · {d.baseSpirit}
            </button>
          ))}
          {candidates.length === 0 && (
            <p className="text-xs text-muted-foreground/60">档案库还空着，先去速记一杯</p>
          )}
        </div>
      ) : (
        <div className="mb-3 space-y-3">
          <Field label="基酒">
            <input value={free.baseSpirit} onChange={(e) => setFree((f) => ({ ...f, baseSpirit: e.target.value }))} className={inputCls} placeholder="如：皮斯科" />
          </Field>
          <Field label="风味关键词">
            <input value={free.flavor} onChange={(e) => setFree((f) => ({ ...f, flavor: e.target.value }))} className={inputCls} placeholder="烟熏, 桂花, 海盐" />
          </Field>
          <Field label="灵感来源">
            <input value={free.inspiration} onChange={(e) => setFree((f) => ({ ...f, inspiration: e.target.value }))} className={inputCls} placeholder="那首歌、那部电影…" />
          </Field>
          <Field label="想呈现的感觉">
            <input value={free.feeling} onChange={(e) => setFree((f) => ({ ...f, feeling: e.target.value }))} className={inputCls} placeholder="东方海岛的清晨" />
          </Field>
        </div>
      )}

      {drink && !freeMode && (
        <div className="mb-3 rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
          <p className="font-display text-sm text-foreground">{drink.name || '未命名'} · {drink.baseSpirit}</p>
          {drink.flavorTags.length > 0 && <p className="mt-1">风味：{drink.flavorTags.join('、')}</p>}
          {drink.inspiration && <p className="mt-1">灵感：{drink.inspiration}</p>}
        </div>
      )}

      <Field label="补充一句（可选）" hint="比如「想避开太文艺的方向」「系列第三款，要和前两杯呼应」">
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
      </Field>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
        {loading ? '助手在想…' : options.length ? '再换一批' : '给我几个名字'}
      </button>

      {options.length > 0 && !loading && (
        <div className="mt-5 space-y-3">
          {options.map((opt) => (
            <div key={opt.name} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">{opt.name}</h3>
                {adopted === opt.name && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> 已定名
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{opt.storyline}</p>
              {!freeMode && drink && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => adopt(opt)}
                    disabled={adopted === opt.name}
                    className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    就叫这个
                  </button>
                  <button
                    onClick={() => saveAlt(opt)}
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" /> 存备选
                  </button>
                </div>
              )}
            </div>
          ))}
          <p className="flex items-center justify-center gap-1 pt-1 text-center text-[11px] text-muted-foreground/60">
            <RefreshCw className="h-3 w-3" /> 不满意就再换一批，助手不会不耐烦
          </p>
        </div>
      )}

      {options.length === 0 && !loading && (
        <EmptyState
          icon={<Sparkles className="h-10 w-10" />}
          text="选好酒，点上面的按钮"
          sub="助手会给 4 个名字，每个带一条故事线"
        />
      )}
    </div>
  )
}
