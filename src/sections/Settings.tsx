import { useState } from 'react'
import { User, KeyRound, Eye, EyeOff, Trash2, Database } from 'lucide-react'
import { toast } from 'sonner'
import type { AppData, Persona } from '@/types'
import { Field, SectionTitle, inputCls } from '@/components/bits'
import { cn } from '@/lib/utils'

const PERSONAS: { key: Persona; name: string; desc: string }[] = [
  { key: 'A', name: '沉默助手', desc: '你说话时它听着，你问话时它回答。简洁直接，不带判断。' },
  { key: 'B', name: '挑剔评论家', desc: '会挑战你：「这个名字和酒的风味有什么关系？」' },
  { key: 'C', name: '档案员 + 灵感推送员', desc: '平时沉默，定期塞给你一段诗、一个典故、一种冷门香料。' },
]

interface Props {
  data: AppData
  onUpdatePrefs: (p: AppData['prefs']) => void
  onUpdateAI: (a: AppData['ai']) => void
  onReset: () => void
}

export default function Settings({ data, onUpdatePrefs, onUpdateAI, onReset }: Props) {
  const [showKey, setShowKey] = useState(false)
  const { prefs, ai } = data

  return (
    <div className="px-4 pb-24 pt-4">
      <header className="mb-4">
        <h1 className="font-display text-2xl font-bold">我的档案</h1>
        <p className="mt-1 text-xs text-muted-foreground">约法三章，都在这里定。</p>
      </header>

      <SectionTitle extra={<User className="h-4 w-4 text-muted-foreground/50" />}>助手人格</SectionTitle>
      <div className="space-y-2">
        {PERSONAS.map((p) => (
          <button
            key={p.key}
            onClick={() => onUpdatePrefs({ ...prefs, persona: p.key })}
            className={cn(
              'w-full rounded-xl border p-3 text-left transition-colors',
              prefs.persona === p.key
                ? 'border-primary/60 bg-primary/10'
                : 'border-border bg-card',
            )}
          >
            <p className={cn('font-display text-sm font-semibold', prefs.persona === p.key && 'text-primary')}>
              {p.key} · {p.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{p.desc}</p>
          </button>
        ))}
      </div>

      <SectionTitle>偏好与禁忌（助手会长期记住）</SectionTitle>
      <div className="space-y-3">
        <Field label="命名风格偏好" hint="如：复古、电影感、历史叙事">
          <input
            value={prefs.namingStyle}
            onChange={(e) => onUpdatePrefs({ ...prefs, namingStyle: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="文案禁忌" hint="助手永远不会用这些表达，如：越喝越年轻">
          <input
            value={prefs.copyTaboos}
            onChange={(e) => onUpdatePrefs({ ...prefs, copyTaboos: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="酒吧定位">
          <input
            value={prefs.barPositioning}
            onChange={(e) => onUpdatePrefs({ ...prefs, barPositioning: e.target.value })}
            className={inputCls}
            placeholder="如：社区小酒馆，熟客为主"
          />
        </Field>
        <Field label="当前探索方向">
          <input
            value={prefs.currentFocus}
            onChange={(e) => onUpdatePrefs({ ...prefs, currentFocus: e.target.value })}
            className={inputCls}
            placeholder="如：烟熏风味与东方香料"
          />
        </Field>
        <Field label="简报约定">
          <input
            value={prefs.briefingNote}
            onChange={(e) => onUpdatePrefs({ ...prefs, briefingNote: e.target.value })}
            className={inputCls}
            placeholder="如：每周日晚上"
          />
        </Field>
      </div>

      <SectionTitle extra={<KeyRound className="h-4 w-4 text-muted-foreground/50" />}>AI 接口（命名助手的嘴）</SectionTitle>
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <Field label="API Key" hint="只存在这台设备的浏览器里，不会上传">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={ai.apiKey}
              onChange={(e) => onUpdateAI({ ...ai, apiKey: e.target.value.trim() })}
              className={cn(inputCls, 'pr-10')}
              placeholder="sk-..."
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="接口地址" hint="默认 Kimi（Moonshot），兼容任何 OpenAI 格式的服务">
          <input
            value={ai.baseUrl}
            onChange={(e) => onUpdateAI({ ...ai, baseUrl: e.target.value.trim() })}
            className={inputCls}
          />
        </Field>
        <Field label="模型">
          <input
            value={ai.model}
            onChange={(e) => onUpdateAI({ ...ai, model: e.target.value.trim() })}
            className={inputCls}
          />
        </Field>
        <p className="text-[11px] leading-relaxed text-muted-foreground/70">
          没有 Key？去 platform.moonshot.cn 申请一个，免费额度就够助手用很久。
        </p>
      </div>

      <SectionTitle extra={<Database className="h-4 w-4 text-muted-foreground/50" />}>数据</SectionTitle>
      <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p>全部档案都存在本机浏览器（localStorage），共 {data.drinks.length} 款酒、{data.series.length} 个系列。</p>
        <p className="mt-1">换手机或清浏览器数据前，记得心里有数。</p>
        <button
          onClick={() => {
            if (window.confirm('清空全部档案并重置为示例数据？此操作不可恢复。')) {
              onReset()
              toast.success('已重置')
            }
          }}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-2 text-xs text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" /> 清空并重置
        </button>
      </div>

      <p className="font-display mt-8 text-center text-xs text-muted-foreground/50">
        酒是你的。名字是你的。故事是你的。
      </p>
    </div>
  )
}
