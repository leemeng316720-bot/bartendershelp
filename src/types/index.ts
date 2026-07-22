// 数据模型：对应《调酒师 Claw 搭建指南》中的长期档案结构

/** 酒款状态：灵感速记 → 待命名 → 待文案 → 已定稿 */
export type DrinkStatus = 'idea' | 'unnamed' | 'draft' | 'final'

/** 客人/同行反馈 */
export type Feedback = 'none' | 'hot' | 'adjust'

export interface Drink {
  id: string
  /** 酒名（未定名时为空） */
  name: string
  baseSpirit: string
  /** 配方比例，如「威士忌45 / 桂花蜜15 / 柠檬20」 */
  ratio: string
  /** 技法：摇和 / 搅拌 / 直调… */
  technique: string
  /** 装饰 */
  garnish: string
  /** 风味关键词 */
  flavorTags: string[]
  /** 灵感来源：那首歌、那部电影、那个晚上的月光 */
  inspiration: string
  /** 想呈现的感觉 */
  feeling: string
  /** 最终文案 / 故事 */
  story: string
  /** 备选命名（没选中的也存） */
  altNames: string[]
  status: DrinkStatus
  feedback: Feedback
  seriesId: string | null
  /** 成品照片：压缩后的 dataURL 或内置路径。形态也是创作结果 */
  photo?: string
  createdAt: number
  updatedAt: number
}

export interface Series {
  id: string
  name: string
  createdAt: number
}

/** 助手人格：A 沉默助手 / B 挑剔评论家 / C 档案员+灵感推送员 */
export type Persona = 'A' | 'B' | 'C'

export interface Prefs {
  persona: Persona
  /** 命名风格偏好，如「复古、电影感、历史叙事」 */
  namingStyle: string
  /** 文案禁忌，如「越喝越年轻、一杯解千愁」 */
  copyTaboos: string
  /** 酒吧定位 */
  barPositioning: string
  /** 当前探索方向 */
  currentFocus: string
  /** 简报约定，如「每周日晚上」 */
  briefingNote: string
}

export interface AISettings {
  apiKey: string
  baseUrl: string
  model: string
}

export interface AppData {
  drinks: Drink[]
  series: Series[]
  prefs: Prefs
  ai: AISettings
}

export const STATUS_META: Record<DrinkStatus, { label: string; color: string }> = {
  idea: { label: '灵感', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  unnamed: { label: '待命名', color: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30' },
  draft: { label: '待文案', color: 'bg-zinc-400/15 text-zinc-300 border-zinc-400/30' },
  final: { label: '已定稿', color: 'bg-red-500/15 text-red-300 border-red-500/30' },
}

export const FEEDBACK_META: Record<Feedback, { label: string; color: string }> = {
  none: { label: '暂无反馈', color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
  hot: { label: '高反响', color: 'bg-red-500/15 text-red-300 border-red-500/30' },
  adjust: { label: '待调整', color: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30' },
}
