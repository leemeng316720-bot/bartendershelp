import { useState } from 'react'
import { NotebookPen, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { Drink, AppData } from '@/types'
import { uid } from '@/lib/store'
import PhotoField from '@/components/PhotoField'
import { Field, inputCls } from '@/components/bits'

interface Props {
  onSave: (drink: Drink) => void
  data: AppData
}

export default function QuickCapture({ onSave }: Props) {
  const [form, setForm] = useState({
    name: '',
    baseSpirit: '',
    ratio: '',
    flavor: '',
    inspiration: '',
    feeling: '',
    justIdea: false,
  })
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const [saved, setSaved] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const canSave = form.baseSpirit.trim() || form.inspiration.trim() || form.flavor.trim()

  const handleSave = () => {
    if (!canSave) {
      toast.error('至少填一项：基酒、风味或灵感')
      return
    }
    const now = Date.now()
    const drink: Drink = {
      id: uid(),
      name: form.name.trim(),
      baseSpirit: form.baseSpirit.trim(),
      ratio: form.ratio.trim(),
      technique: '',
      garnish: '',
      flavorTags: form.flavor
        .split(/[,，、\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      inspiration: form.inspiration.trim(),
      feeling: form.feeling.trim(),
      story: '',
      altNames: [],
      status: form.justIdea ? 'idea' : form.name.trim() ? 'draft' : 'unnamed',
      feedback: 'none',
      seriesId: null,
      photo,
      createdAt: now,
      updatedAt: now,
    }
    onSave(drink)
    setSaved(true)
    toast.success('已记入档案', { description: '助手不会忘记这杯酒。' })
    setTimeout(() => {
      setForm({ name: '', baseSpirit: '', ratio: '', flavor: '', inspiration: '', feeling: '', justIdea: false })
      setPhoto(undefined)
      setSaved(false)
    }, 600)
  }

  return (
    <div className="px-4 pb-24 pt-4">
      <header className="mb-1">
        <h1 className="font-display text-2xl font-bold">灵感速记</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          两分钟，趁味道还在嘴上。细节可以回头再补。
        </p>
      </header>

      <div className="mt-4 space-y-4">
        <Field label="酒名（还没想好就空着）">
          <input value={form.name} onChange={set('name')} placeholder="留给命名助手" className={inputCls} />
        </Field>
        <Field label="基酒">
          <input value={form.baseSpirit} onChange={set('baseSpirit')} placeholder="如：泥煤威士忌" className={inputCls} />
        </Field>
        <Field label="比例" hint="随手记，如「威士忌45 / 桂花蜜15 / 柠檬20」">
          <input value={form.ratio} onChange={set('ratio')} placeholder="基酒 45 / …" className={inputCls} />
        </Field>
        <Field label="风味关键词" hint="用逗号或空格分隔">
          <input value={form.flavor} onChange={set('flavor')} placeholder="烟熏, 桂花, 清爽" className={inputCls} />
        </Field>
        <Field label="灵感来源" hint="那首歌、那部电影、那个晚上的月光">
          <textarea
            value={form.inspiration}
            onChange={set('inspiration')}
            rows={2}
            placeholder="是什么让你做了这杯？"
            className={inputCls}
          />
        </Field>
        <Field label="想走的感觉">
          <textarea
            value={form.feeling}
            onChange={set('feeling')}
            rows={2}
            placeholder="客人喝到第一口时，你想让他想到什么？"
            className={inputCls}
          />
        </Field>

        <PhotoField compact photo={photo} onChange={setPhoto} />

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={form.justIdea}
            onChange={(e) => setForm((f) => ({ ...f, justIdea: e.target.checked }))}
            className="h-4 w-4 accent-red-600"
          />
          这还只是个灵感，酒还没做出来
        </label>

        <button
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          {saved ? <Check className="h-5 w-5" /> : <NotebookPen className="h-5 w-5" />}
          {saved ? '已记' : '帮我记一下'}
        </button>
        <p className="text-center text-[11px] text-muted-foreground/60">
          助手只归档，不啰嗦。
        </p>
      </div>
    </div>
  )
}
