// 高分段校准与 985/211 参考线，及其自身的持久化
import { computed, onMounted, watch } from 'vue'
import { SEGMENT_LABELS, SUBJECTS } from '@/utils/scoreConvert.js'
import { state, readSavedRules, mergeSavedRules } from '../store.js'

export function useTopAnchors() {
  const topAnchorOptions = (subjectKey) => ({
    maxScore: state.topAnchors[subjectKey].maxScore,
    targetMaxScore: state.topAnchors[subjectKey].targetMaxScore
  })

  const topAnchorActive = computed(() => {
    const anchor = state.topAnchors[state.subject]
    const maxScore = Number(anchor.maxScore)
    const target = Number(anchor.targetMaxScore)
    return Number.isFinite(maxScore) && Number.isFinite(target) &&
      maxScore > state.rules[state.subject].currTk && target > 0 && target <= 750
  })

  const topAnchorDiff = computed(() =>
    Number(state.topAnchors[state.subject].targetMaxScore) - Number(state.topAnchors[state.subject].maxScore)
  )

  const classifyTier = (rounded, subjectKey) => {
    const lines = state.tierLines[subjectKey] || {}
    const s985 = Number(lines.s985)
    const s211 = Number(lines.s211)
    const score = Number(rounded)
    if (!Number.isFinite(score)) return '—'
    if (Number.isFinite(s985) && lines.s985 !== '' && score >= s985) return '985线'
    if (Number.isFinite(s211) && lines.s211 !== '' && score >= s211) return '211线'
    return null
  }

  const tierOf = (result, subjectKey) => classifyTier(result.rounded, subjectKey) || SEGMENT_LABELS[result.segment]

  onMounted(() => {
    const saved = readSavedRules()
    if (!saved) return
    if (saved.topAnchors) {
      for (const key of SUBJECTS) {
        if (saved.topAnchors[key]) state.topAnchors[key] = { ...state.topAnchors[key], ...saved.topAnchors[key] }
      }
    }
    if (saved.tierLines) {
      for (const key of SUBJECTS) {
        if (saved.tierLines[key]) state.tierLines[key] = { ...state.tierLines[key], ...saved.tierLines[key] }
      }
    }
  })

  watch(
    () => [state.topAnchors, state.tierLines],
    () => mergeSavedRules({ topAnchors: state.topAnchors, tierLines: state.tierLines }),
    { deep: true }
  )

  return { topAnchorOptions, topAnchorActive, topAnchorDiff, classifyTier, tierOf }
}
