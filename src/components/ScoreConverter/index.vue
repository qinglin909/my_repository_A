<!-- 分数换算工作台：只负责布局与组合，状态由 composables 提供并经 provide 下发 -->
<template>
  <div class="page score-converter">
    <header class="page-head">
      <p class="eyebrow">成绩换算</p>
      <h1>分数换算工作台</h1>
      <p class="sub">用「学校预估线 vs 省控线」的线差做分段线性换算：特控线、本科线两个锚点精确命中，中间按每分分差平滑过渡。</p>
    </header>

    <RuleSettingsCard />
    <RankTableCard />
    <BasisCard />
    <ManualConvertCard />
    <BatchConvertCard />
    <MethodNoteCard />
  </div>
</template>

<script setup>
import { provide, reactive } from 'vue'
import { LINE_LABELS, SEGMENT_LABELS, SUBJECTS, SUBJECT_LABELS } from '@/utils/scoreConvert.js'
import { state } from './store.js'
import { lineFields, SCORE_CONVERTER_KEY } from './constants.js'
import { fmt, diffClass } from './helpers.js'
import { useScoreRules } from './composables/useScoreRules.js'
import { useTopAnchors } from './composables/useTopAnchors.js'
import { useManualConvert } from './composables/useManualConvert.js'
import { useRankTable } from './composables/useRankTable.js'
import { useStudents } from './composables/useStudents.js'
import { useExport } from './composables/useExport.js'
import RuleSettingsCard from './RuleSettingsCard.vue'
import RankTableCard from './RankTableCard.vue'
import BasisCard from './BasisCard.vue'
import ManualConvertCard from './ManualConvertCard.vue'
import BatchConvertCard from './BatchConvertCard.vue'
import MethodNoteCard from './MethodNoteCard.vue'

const rules = useScoreRules()
const anchors = useTopAnchors()
const manual = useManualConvert({ topAnchorOptions: anchors.topAnchorOptions, tierOf: anchors.tierOf })
const students = useStudents({ topAnchorOptions: anchors.topAnchorOptions, tierOf: anchors.tierOf })
const rank = useRankTable({ onRankChange: students.rebuild })
const exporter = useExport()

// reactive 会自动解包内部的 computed / ref，子组件模板可直接使用 ctx.xxx
const ctx = reactive({
  state,
  ...rules,
  ...anchors,
  ...manual,
  ...students,
  ...rank,
  ...exporter,
  SUBJECTS,
  SUBJECT_LABELS,
  LINE_LABELS,
  SEGMENT_LABELS,
  lineFields,
  fmt,
  diffClass
})
provide(SCORE_CONVERTER_KEY, ctx)
</script>

<style src="./scoreConverter.css"></style>
