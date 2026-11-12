<!-- 分数换算工作台：只负责布局与组合，状态由 composables 提供并经 provide 下发 -->
<template>
  <div class="page score-converter">
    <header class="page-head">
      <p class="eyebrow">成绩换算</p>
      <h1>分数换算工作台</h1>
      <p class="sub">用「学校预估线 vs 省控线」的线差做分段线性换算：特控线、本科线两个锚点精确命中，中间按每分分差平滑过渡。</p>
    </header>

    <nav class="tabs" aria-label="功能分区">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        :class="{ active: activeTab === tab.key }"
        :aria-current="activeTab === tab.key ? 'page' : undefined"
        @click="go(tab.key)"
      >
        <strong>{{ tab.label }}</strong>
        <small>{{ tab.desc }}</small>
      </button>
    </nav>

    <template v-if="activeTab === 'convert'">
      <ManualConvertCard />
      <BatchConvertCard />
    </template>
    <template v-else-if="activeTab === 'settings'">
      <RuleSettingsCard />
      <RankTableCard />
    </template>
    <template v-else-if="activeTab === 'charts'">
      <ScoreChartCard />
    </template>
    <template v-else>
      <BasisCard />
      <MethodNoteCard />
    </template>
  </div>
</template>

<script setup>
import { computed, provide, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
import ScoreChartCard from './ScoreChartCard.vue'
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

// 分区导航：7 张卡片太长不想滚，改为一次只看一个分区，tab 写进 URL query（刷新 / 分享 / 前进后退都保留）
const route = useRoute()
const router = useRouter()
const TABS = [
  { key: 'convert', label: '成绩换算', desc: '单个分数 · 批量成绩表' },
  { key: 'settings', label: '参数设置', desc: '分数线 · 一分一段表' },
  { key: 'charts', label: '图表分析', desc: '曲线 · 分布 · 位次' },
  { key: 'docs', label: '换算说明', desc: '换算依据 · 方法' }
]
const activeTab = computed(() => {
  const tab = route.query.tab
  return TABS.some((item) => item.key === tab) ? tab : 'convert'
})
const go = (key) => {
  if (key === activeTab.value) return
  router.push({ query: { ...route.query, tab: key } })
}
watch(activeTab, () => window.scrollTo(0, 0))
</script>

<style src="./scoreConverter.css"></style>
