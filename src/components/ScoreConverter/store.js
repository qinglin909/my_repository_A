// 模块级单例状态：工作台各卡片通过 inject 共享同一份响应式数据
import { reactive } from 'vue'
import { DEFAULT_DATABASES } from '@/utils/calcConfig.js'
import { normalizeRule } from '@/utils/scoreConvert.js'
import { STORAGE_KEY } from './constants.js'

const defaults = DEFAULT_DATABASES[0].config

export const state = reactive({
  subject: 'physics',
  rules: {
    physics: normalizeRule(defaults.physics),
    history: normalizeRule(defaults.history)
  },
  topAnchors: {
    physics: { maxScore: '', targetMaxScore: '' },
    history: { maxScore: '', targetMaxScore: '' }
  },
  tierLines: {
    physics: { s985: '', s211: '' },
    history: { s985: '', s211: '' }
  },
  manualScore: '',
  students: [],
  sourceStudents: [],
  keyword: '',
  uploading: false,
  errorMessage: '',
  fallbackSubject: 'physics',
  unresolvedCount: 0,
  showExplain: false,
  rankTables: { physics: [], history: [] },
  customRank: false,
  rankColumns: { physics: null, history: null },
  rankError: '',
  rankLoading: false,
  lowCoverage: { count: 0, min: null }
})

// 兼容旧版「直接把 rules 存在根对象」的格式；解析失败时清掉坏数据
export function readSavedRules() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

// 两处 watch 各自写自己那部分，写前先读回合并，避免互相覆盖
export function mergeSavedRules(partial) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, ...partial }))
  } catch {
    // 本地存储不可用时保持当前会话可用
  }
}
