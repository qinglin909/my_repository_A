<!-- 可视化图表卡片：三个视图共用同一份 ctx，切换只换图表组件 -->
<template>
  <section class="card chart-card">
    <div class="card-head">
      <div>
        <h2>可视化图表</h2>
        <p>换算规则、成绩分布与位次关系一眼看清；参数变化会自动重绘。</p>
      </div>
      <div class="seg" role="tablist" aria-label="图表类型">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="active === tab.key"
          :class="{ active: active === tab.key }"
          @click="active = tab.key"
        >{{ tab.label }}</button>
      </div>
    </div>

    <p v-if="active === 'curve' && !ctx.validRule" class="warn">
      当前分数线设置不合法（需为正数，且特控线 &gt; 本科线 &gt; 专科线），换算曲线暂不显示。
    </p>

    <ConversionCurveChart v-if="active === 'curve' && ctx.validRule" />
    <ScoreDistributionChart v-else-if="active === 'distribution'" />
    <RankCurveChart v-else-if="active === 'rank'" />
  </section>
</template>

<script setup>
import { inject, ref } from 'vue'
import { SCORE_CONVERTER_KEY } from './constants.js'
import ConversionCurveChart from './charts/ConversionCurveChart.vue'
import ScoreDistributionChart from './charts/ScoreDistributionChart.vue'
import RankCurveChart from './charts/RankCurveChart.vue'

const ctx = inject(SCORE_CONVERTER_KEY)
const active = ref('curve')
const tabs = [
  { key: 'curve', label: '换算曲线' },
  { key: 'distribution', label: '成绩分布' },
  { key: 'rank', label: '位次曲线' }
]
</script>
