// 一分一段表：导入、预览、清除与本机持久化；表变化后通过回调通知重算成绩
import { computed, onMounted } from 'vue'
import { parseRankTableExcel } from '@/utils/calcLogic.js'
import { SUBJECTS, SUBJECT_LABELS } from '@/utils/scoreConvert.js'
import { state } from '../store.js'
import { RANK_STORAGE_KEY } from '../constants.js'

export function useRankTable({ onRankChange } = {}) {
  const rankSourceLabel = computed(() => (state.customRank ? '已导入并保存在本机' : '未导入'))
  const hasRankTable = computed(() =>
    state.rankTables.physics.length > 0 || state.rankTables.history.length > 0
  )

  // 每个科类取前 3 行，导入后直接核对「分数」「排位」两列取得对不对
  const rankPreview = computed(() => {
    const rows = []
    for (const key of SUBJECTS) {
      const table = state.rankTables[key] || []
      for (const item of table.slice(0, 3)) {
        rows.push({ key: `${key}-${item.score}`, subject: SUBJECT_LABELS[key], score: item.score, rank: item.rank })
      }
    }
    return rows
  })

  const handleRankUpload = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    state.rankLoading = true
    state.rankError = ''
    try {
      const parsed = await parseRankTableExcel(files)
      if (!parsed.physics.length && !parsed.history.length) {
        throw new Error('没有识别到排位数据：工作表里需要「分数」和「累计人数/位次」两列，文件名或工作表名要带「物理」或「历史」。')
      }
      state.rankTables = {
        physics: parsed.physics.length ? parsed.physics : state.rankTables.physics,
        history: parsed.history.length ? parsed.history : state.rankTables.history
      }
      state.rankColumns = {
        physics: parsed.columns?.physics || state.rankColumns.physics,
        history: parsed.columns?.history || state.rankColumns.history
      }
      state.customRank = true
      localStorage.setItem(RANK_STORAGE_KEY, JSON.stringify({ ...state.rankTables, columns: state.rankColumns }))
      onRankChange?.()
    } catch (error) {
      state.rankError = error.message || '一分一段表解析失败'
    } finally {
      state.rankLoading = false
      event.target.value = ''
    }
  }

  const clearRank = () => {
    state.rankTables = { physics: [], history: [] }
    state.rankColumns = { physics: null, history: null }
    state.customRank = false
    state.rankError = ''
    localStorage.removeItem(RANK_STORAGE_KEY)
    onRankChange?.()
  }

  onMounted(() => {
    try {
      const savedRank = JSON.parse(localStorage.getItem(RANK_STORAGE_KEY) || 'null')
      if (savedRank?.physics?.length || savedRank?.history?.length) {
        state.rankTables = {
          physics: savedRank.physics || [],
          history: savedRank.history || []
        }
        if (savedRank.columns) state.rankColumns = savedRank.columns
        state.customRank = true
      }
    } catch {
      localStorage.removeItem(RANK_STORAGE_KEY)
    }
  })

  return { rankSourceLabel, hasRankTable, rankPreview, handleRankUpload, clearRank }
}
