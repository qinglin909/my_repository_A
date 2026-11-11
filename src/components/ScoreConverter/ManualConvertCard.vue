<!-- 单个分数换算与结果展示 -->
<template>
  <section class="card">
    <h2>单个分数换算</h2>
    <div class="manual-row">
      <label>
        <span>原始分</span>
        <input v-model.number="ctx.state.manualScore" type="number" min="0" max="750" step="0.5" placeholder="例如 500" />
      </label>
      <span class="subject-pill">{{ ctx.SUBJECT_LABELS[ctx.state.subject] }}</span>
    </div>

    <div v-if="ctx.manualResult" class="result-grid">
      <StatItem label="换算分（取整）" :value="ctx.manualResult.rounded" primary />
      <StatItem label="换算精确值" :value="ctx.fmt(ctx.manualResult.converted)" />
      <StatItem label="线差" :value="ctx.fmt(ctx.manualResult.diff)" />
      <StatItem label="所在区间" :value="ctx.SEGMENT_LABELS[ctx.manualResult.segment]" small />
      <StatItem label="区间进度" :value="ctx.manualProgress" />
      <StatItem label="层次" :value="ctx.manualTier" small />
      <StatItem label="全省排位参考" :value="ctx.manualRank" />
    </div>

    <p v-if="ctx.manualExplain" class="explain"><strong>计算过程：</strong>{{ ctx.manualExplain }}</p>
    <p v-if="ctx.manualRankReason" class="empty-hint">{{ ctx.manualRankReason }}</p>
    <p v-else class="empty-hint">输入 0–750 之间的分数后自动计算。</p>
  </section>
</template>

<script setup>
import { inject } from 'vue'
import { SCORE_CONVERTER_KEY } from './constants.js'
import StatItem from './StatItem.vue'

const ctx = inject(SCORE_CONVERTER_KEY)
</script>
