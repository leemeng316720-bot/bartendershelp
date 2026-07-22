import type { AISettings, Drink, Prefs, Persona } from '@/types'

export interface NamingOption {
  name: string
  storyline: string
}

const PERSONA_HINT: Record<Persona, string> = {
  A: '你是沉默助手：简洁、直接、不带判断，只给选项不做评价。',
  B: '你是挑剔评论家：直接、有点尖锐但从不恶意，可以指出风味与叙事是否接得上。',
  C: '你是档案员兼灵感推送员：在选项中融入冷门典故与跨文化灵感，打破信息茧房。',
}

function buildSystemPrompt(prefs: Prefs) {
  const lines = [
    '你是一位调酒师的数字助手，负责为原创鸡尾酒提供命名选项和故事线。',
    PERSONA_HINT[prefs.persona],
    '硬性规则：只给选项，不给唯一答案；所有叙事必须基于用户提供的信息，不瞎编；遇到不熟悉的小众基酒要承认不熟。',
  ]
  if (prefs.namingStyle) lines.push(`用户偏好的命名风格：${prefs.namingStyle}`)
  if (prefs.copyTaboos) lines.push(`用户的文案禁忌（绝对不要出现这类表达）：${prefs.copyTaboos}`)
  if (prefs.barPositioning) lines.push(`酒吧定位：${prefs.barPositioning}`)
  if (prefs.currentFocus) lines.push(`用户当前探索方向：${prefs.currentFocus}`)
  lines.push('严格以 JSON 数组返回，不要输出任何其他文字。')
  return lines.join('\n')
}

async function chat(ai: AISettings, system: string, user: string): Promise<string> {
  const res = await fetch(`${ai.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ai.apiKey}`,
    },
    body: JSON.stringify({
      model: ai.model,
      temperature: 0.9,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`接口返回 ${res.status}：${text.slice(0, 120) || res.statusText}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

/** 命名助手：给 3-5 个选项，每个选项带故事线 */
export async function generateNamings(
  ai: AISettings,
  prefs: Prefs,
  drink: Partial<Drink>,
  extraNote: string,
): Promise<NamingOption[]> {
  const desc = [
    drink.baseSpirit && `基酒：${drink.baseSpirit}`,
    drink.ratio && `比例：${drink.ratio}`,
    drink.flavorTags?.length && `风味关键词：${drink.flavorTags.join('、')}`,
    drink.inspiration && `灵感来源：${drink.inspiration}`,
    drink.feeling && `想走的感觉：${drink.feeling}`,
    extraNote && `补充说明：${extraNote}`,
  ]
    .filter(Boolean)
    .join('\n')

  const raw = await chat(
    ai,
    buildSystemPrompt(prefs),
    `为这款酒给出 4 个命名选项，每个选项附一条 60 字以内的故事线。返回 JSON 数组，格式：[{"name":"...","storyline":"..."}]。\n\n${desc}`,
  )
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('助手没按格式回答，再试一次')
  const parsed = JSON.parse(match[0]) as NamingOption[]
  return parsed.filter((o) => o.name && o.storyline).slice(0, 5)
}

/** 文案润色：只改语法和节奏，不动核心表达 */
export async function polishStory(ai: AISettings, prefs: Prefs, story: string): Promise<string> {
  const raw = await chat(
    ai,
    buildSystemPrompt(prefs) + '\n你的任务：润色酒单文案，只做语法和节奏调整，不改动用户的核心表达与意象。',
    `请润色这段文案，直接返回润色后的文字：\n\n${story}`,
  )
  return raw.trim()
}

/** 简报叙述：把统计数据变成一段助手口吻的复盘 */
export async function generateBriefingNarrative(
  ai: AISettings,
  prefs: Prefs,
  statsSummary: string,
): Promise<string> {
  const raw = await chat(
    ai,
    buildSystemPrompt(prefs) + '\n你正在给调酒师写一份阶段创作简报，口吻克制、诚实，不美化数据，结尾可以问一个推进创作的问题。',
    `以下是近期的创作数据，请写一段 150 字以内的简报：\n\n${statsSummary}`,
  )
  return raw.trim()
}
