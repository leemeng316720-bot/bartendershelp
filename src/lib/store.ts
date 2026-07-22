import type { AppData, Drink, Prefs, AISettings } from '@/types'

const KEY = 'bartender-apprentice-v1'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export const DEFAULT_AI: AISettings = {
  apiKey: '',
  baseUrl: 'https://api.moonshot.cn/v1',
  model: 'moonshot-v1-8k',
}

export const DEFAULT_PREFS: Prefs = {
  persona: 'A',
  namingStyle: '',
  copyTaboos: '',
  barPositioning: '',
  currentFocus: '',
  briefingNote: '每周日晚上',
}

function seed(): AppData {
  const now = Date.now()
  const day = 86400000
  const sIsland = uid()
  const sCinema = uid()
  const drinks: Drink[] = [
    {
      id: uid(),
      name: '午夜巴黎',
      baseSpirit: '黑麦威士忌',
      ratio: '黑麦威士忌 45 / 干味美思 20 / 黄查特 10 / 苦精 2 dash',
      technique: '搅拌',
      garnish: '柠檬皮卷',
      flavorTags: ['木质', '草本', '微甜'],
      inspiration: '伍迪·艾伦《午夜巴黎》里那场雨夜的散步',
      feeling: '旧金山的金色灯光，潮湿的石板路',
      story: '有些夜晚你会误入另一个时代。这杯酒献给所有想在雨里走失的人。',
      altNames: ['雨夜漫步', '黄金时代'],
      status: 'final',
      feedback: 'hot',
      photo: '/seed/midnight-paris.jpg',
      seriesId: sCinema,
      createdAt: now - 40 * day,
      updatedAt: now - 30 * day,
    },
    {
      id: uid(),
      name: '雾岛',
      baseSpirit: '泥煤威士忌',
      ratio: '泥煤威士忌 40 / 桂花蜜 15 / 柠檬汁 20 / 苏打水补满',
      technique: '直调',
      garnish: '干桂花',
      flavorTags: ['烟熏', '桂花', '清爽'],
      inspiration: '东方海岛的清晨，雾还没散',
      feeling: '湿润的海风，远处有钟声',
      story: '',
      altNames: [],
      status: 'draft',
      feedback: 'none',
      photo: '/seed/mist-island.jpg',
      seriesId: sIsland,
      createdAt: now - 9 * day,
      updatedAt: now - 9 * day,
    },
    {
      id: uid(),
      name: '',
      baseSpirit: '梅兹卡尔',
      ratio: '梅兹卡尔 45 / 菠萝汁 30 / 青柠 15 / 龙舌兰糖浆 10',
      technique: '摇和',
      garnish: '盐边 + 菠萝叶',
      flavorTags: ['烟熏', '热带', '酸'],
      inspiration: '一部关于沙漠公路的纪录片',
      feeling: '公路尽头的小镇酒吧',
      story: '',
      altNames: [],
      status: 'unnamed',
      feedback: 'none',
      photo: '/seed/mezcal-road.jpg',
      seriesId: null,
      createdAt: now - 8 * day,
      updatedAt: now - 8 * day,
    },
    {
      id: uid(),
      name: '灯塔看守人',
      baseSpirit: '金酒',
      ratio: '金酒 50 / 接骨木花利口酒 15 / 汤力水补满',
      technique: '直调',
      garnish: '迷迭香',
      flavorTags: ['花香', '草本', '清苦'],
      inspiration: '《到灯塔去》',
      feeling: '孤独但安稳',
      story: '灯塔看守人不问船从哪里来。他只是每晚把灯点亮。',
      altNames: ['守夜人'],
      status: 'final',
      feedback: 'none',
      photo: '/seed/lighthouse.jpg',
      seriesId: sIsland,
      createdAt: now - 3 * day,
      updatedAt: now - 1 * day,
    },
    {
      id: uid(),
      name: '',
      baseSpirit: '陈年朗姆',
      ratio: '陈年朗姆 45 / 咖啡利口酒 20 / 椰子水 30',
      technique: '摇和',
      garnish: '肉豆蔻粉',
      flavorTags: ['咖啡', '椰子', '醇厚'],
      inspiration: '凌晨打烊后自己喝的那一杯',
      feeling: '打烊后的安静',
      story: '',
      altNames: [],
      status: 'idea',
      feedback: 'adjust',
      photo: '/seed/after-hours-rum.jpg',
      seriesId: null,
      createdAt: now - 1 * day,
      updatedAt: now - 1 * day,
    },
  ]
  return {
    drinks,
    series: [
      { id: sIsland, name: '东方海岛', createdAt: now - 40 * day },
      { id: sCinema, name: '复古影院', createdAt: now - 40 * day },
    ],
    prefs: {
      ...DEFAULT_PREFS,
      namingStyle: '复古、电影感、历史叙事',
      copyTaboos: '越喝越年轻、一杯解千愁、治愈系',
      barPositioning: '社区小酒馆，熟客为主',
      currentFocus: '烟熏风味与东方香料的结合',
    },
    ai: { ...DEFAULT_AI },
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const d = JSON.parse(raw) as AppData
      const merged = { ...d, ai: { ...DEFAULT_AI, ...d.ai }, prefs: { ...DEFAULT_PREFS, ...d.prefs } }
      // 迁移：为早期版本的示例酒补照片
      const seedPhotos: Record<string, string> = {
        午夜巴黎: '/seed/midnight-paris.jpg',
        雾岛: '/seed/mist-island.jpg',
        灯塔看守人: '/seed/lighthouse.jpg',
      }
      let touched = false
      merged.drinks = merged.drinks.map((dr) => {
        if (!dr.photo && seedPhotos[dr.name]) {
          touched = true
          return { ...dr, photo: seedPhotos[dr.name] }
        }
        return dr
      })
      if (touched) saveData(merged)
      return merged
    }
  } catch {
    /* 数据损坏时重置 */
  }
  const d = seed()
  saveData(d)
  return d
}

export function saveData(d: AppData) {
  localStorage.setItem(KEY, JSON.stringify(d))
}

export function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function daysAgo(ts: number) {
  return Math.floor((Date.now() - ts) / 86400000)
}
