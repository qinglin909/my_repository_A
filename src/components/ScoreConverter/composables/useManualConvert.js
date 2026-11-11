// 单个分数换算：结果、计算过程、排位与层次
import { computed } from 'vue'
import { SUBJECT_LABELS, convertScore, describeConversion, lookupRank } from '@/utils/scoreConvert.js'
import { state } from '../store.js'

export function useManualConvert({ topAnchorOptions, tierOf }) {
  const manualResult = computed(() => {
    if (state.manualScore === '' || state.manualScore === null) return null
    return convertScore(state.manualScore, state.rules[state.subject], topAnchorOptions(state.subject))
  })

  const manualExplain = computed(() =>
    manualResult.value
      ? describeConversion(manualResult.value, state.rules[state.subject], topAnchorOptions(state.subject))
      : ''
  )

  const rankTable = computed(() => state.rankTables[state.subject])
  const manualRank = computed(() =>
    manualResult.value ? lookupRank(manualResult.value.rounded, rankTable.value) : '—'
  )
  const manualProgress = computed(() =>
    manualResult.value && manualResult.value.progress !== null && manualResult.value.progress !== undefined
      ? Number(manualResult.value.progress).toFixed(4)
      : '—'
  )
  const manualTier = computed(() =>
    manualResult.value ? tierOf(manualResult.value, state.subject) : ''
  )

  const manualRankCovered = computed(() => {
    if (!manualResult.value) return true
    const table = rankTable.value
    if (!table.length) return false
    return manualResult.value.rounded >= Number(table[table.length - 1].score)
  })

  const manualRankReason = computed(() => {
    if (!manualResult.value) return ''
    if (!rankTable.value.length) return `还没有导入${SUBJECT_LABELS[state.subject]}的一分一段表，排位无法给出（换算分不受影响）。`
    if (!manualRankCovered.value) return '换算分低于当前一分一段表的最低分，排位无法给出；请导入覆盖更低分的表。'
    return ''
  })

  return { manualResult, manualExplain, manualRank, manualProgress, manualTier, manualRankReason }
}
