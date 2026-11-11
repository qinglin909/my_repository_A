// 分数线规则：当前科类规则、线差、分段与换算依据表，以及规则自身的持久化
import { computed, onMounted, watch } from 'vue'
import { DEFAULT_DATABASES } from '@/utils/calcConfig.js'
import {
  LINE_LABELS,
  conversionPairs,
  normalizeRule,
  ruleDiffs,
  ruleLooksValid
} from '@/utils/scoreConvert.js'
import { state, readSavedRules, mergeSavedRules } from '../store.js'
import { lineFields } from '../constants.js'

const defaults = DEFAULT_DATABASES[0].config

export function useScoreRules() {
  const currentRule = computed(() => state.rules[state.subject])
  const validRule = computed(() => ruleLooksValid(currentRule.value))
  const diffs = computed(() => ruleDiffs(currentRule.value))
  const pairs = computed(() => conversionPairs(currentRule.value))

  const basisRows = computed(() => {
    const diff = diffs.value
    return lineFields.map((line) => ({
      key: line.key,
      label: LINE_LABELS[line.key],
      curr: Number(currentRule.value[line.curr]),
      last: Number(currentRule.value[line.last]),
      diff: diff[line.key],
      pair: line.key === 'bk' ? pairs.value[0] : line.key === 'zk' ? pairs.value[1] : null
    }))
  })

  const resetRule = () => {
    state.rules.physics = normalizeRule(defaults.physics)
    state.rules.history = normalizeRule(defaults.history)
  }

  onMounted(() => {
    const saved = readSavedRules()
    if (!saved) return
    const savedRules = saved.rules || saved
    if (savedRules?.physics) state.rules.physics = normalizeRule(savedRules.physics)
    if (savedRules?.history) state.rules.history = normalizeRule(savedRules.history)
  })

  watch(() => state.rules, () => mergeSavedRules({ rules: state.rules }), { deep: true })

  return { currentRule, validRule, diffs, pairs, basisRows, resetRule }
}
