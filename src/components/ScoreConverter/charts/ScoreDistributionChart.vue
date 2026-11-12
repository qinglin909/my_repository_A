<!-- 成绩分布：批量换算结果按 10 分一档堆叠，颜色区分 985 / 211 / 其他层次 -->
<template>
  <div class="chart-block">
    <svg
      v-if="bars.length"
      class="chart-svg"
      viewBox="0 0 720 340"
      role="img"
      aria-label="换算分成绩分布柱状图"
      @mouseleave="hoverIndex = null"
    >
      <line v-for="tick in yTicks" :key="`gy-${tick}`" :x1="box.left" :x2="box.right" :y1="sy(tick)" :y2="sy(tick)" stroke="#eef1f6" stroke-width="1" />
      <line :x1="box.left" :x2="box.right" :y1="box.bottom" :y2="box.bottom" stroke="#cbd5e1" stroke-width="1.5" />
      <line :x1="box.left" :x2="box.left" :y1="box.top" :y2="box.bottom" stroke="#cbd5e1" stroke-width="1.5" />
      <text v-for="tick in yTicks" :key="`ty-${tick}`" :x="box.left - 8" :y="sy(tick) + 4" text-anchor="end" font-size="11" fill="#98a2b3">{{ tick }}</text>
      <text :x="box.left" :y="box.top - 7" font-size="11" fill="#667085">人数</text>
      <text :x="box.right" :y="box.bottom + 34" text-anchor="end" font-size="11" fill="#667085">换算分</text>

      <g v-for="bar in bars" :key="`bar-${bar.start}`">
        <rect v-if="bar.other.h > 0" :x="bar.x" :y="bar.other.y" :width="bar.w" :height="bar.other.h" fill="#2563eb" :opacity="hoverIndex === null || hoverIndex === bar.i ? 0.9 : 0.45" />
        <rect v-if="bar.s211.h > 0" :x="bar.x" :y="bar.s211.y" :width="bar.w" :height="bar.s211.h" fill="#f59e0b" :opacity="hoverIndex === null || hoverIndex === bar.i ? 0.95 : 0.45" />
        <rect v-if="bar.s985.h > 0" :x="bar.x" :y="bar.s985.y" :width="bar.w" :height="bar.s985.h" fill="#e5484d" :opacity="hoverIndex === null || hoverIndex === bar.i ? 0.95 : 0.45" />
        <rect v-if="hoverIndex === bar.i" :x="bar.x - 2" :y="box.top" :width="bar.w + 4" :height="plotH" fill="#2563eb" opacity="0.06" />
        <text v-if="showLabel(bar.i)" :x="bar.x + bar.w / 2" :y="box.bottom + 18" text-anchor="middle" font-size="10" fill="#98a2b3">{{ bar.start }}</text>
      </g>

      <g v-for="bar in bars" :key="`hit-${bar.start}`">
        <rect :x="bar.x - 2" :y="box.top" :width="bar.w + 4" :height="plotH" fill="transparent" @mouseenter="hoverIndex = bar.i" />
      </g>
    </svg>

    <div v-else class="chart-empty">还没有成绩数据。<br />到下面「批量换算」上传成绩表后，这里会自动生成换算分分布图。</div>

    <div v-if="bars.length" class="chart-readout">
      <template v-if="hoverBin">
        <strong>{{ hoverBin.start }}–{{ hoverBin.end - 1 }} 分</strong> 共 {{ hoverBin.count }} 人
        <span>985 线 {{ hoverBin.s985 }} · 211 线 {{ hoverBin.s211 }} · 其他 {{ hoverBin.other }}</span>
      </template>
      <template v-else>把鼠标移到柱子上，查看该分数段人数与层次构成</template>
    </div>

    <div v-if="bars.length" class="chart-legend">
      <span><i style="background:#2563eb"></i>其他</span>
      <span><i style="background:#f59e0b"></i>211 线</span>
      <span><i style="background:#e5484d"></i>985 线</span>
      <span class="legend-note">共 {{ total }} 人 · 每档 10 分 · 按当前筛选结果统计</span>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { SCORE_CONVERTER_KEY } from '../constants.js'
import { CHART_BOX, PLOT_W, PLOT_H, scaleLinear, niceTicks } from './chartUtils.js'

const ctx = inject(SCORE_CONVERTER_KEY)
const box = CHART_BOX
const plotW = PLOT_W
const plotH = PLOT_H
const hoverIndex = ref(null)

const valid = computed(() => ctx.filteredStudents
  .map((row) => ({ score: Number(row.convertedScore), tier: row.tierLabel }))
  .filter((row) => Number.isFinite(row.score)))

const bins = computed(() => {
  const rows = valid.value
  if (!rows.length) return []
  const scores = rows.map((row) => row.score)
  const from = Math.floor(Math.min(...scores) / 10) * 10
  const to = Math.ceil((Math.max(...scores) + 1) / 10) * 10
  const map = new Map()
  for (let start = from; start < to; start += 10) {
    map.set(start, { start, end: start + 10, count: 0, s985: 0, s211: 0, other: 0 })
  }
  for (const row of rows) {
    const bin = map.get(Math.floor(row.score / 10) * 10)
    if (!bin) continue
    bin.count += 1
    if (row.tier === '985线') bin.s985 += 1
    else if (row.tier === '211线') bin.s211 += 1
    else bin.other += 1
  }
  return [...map.values()]
})

const total = computed(() => valid.value.length)
const yMax = computed(() => Math.max(1, ...bins.value.map((bin) => bin.count)))
const sy = computed(() => scaleLinear([0, yMax.value], [box.bottom, box.top]))
const yTicks = computed(() => niceTicks(0, yMax.value, 5).filter((tick) => Number.isInteger(tick)))
const bandWidth = computed(() => plotW / Math.max(1, bins.value.length))

const bars = computed(() => bins.value.map((bin, index) => {
  const width = Math.max(2, bandWidth.value - 4)
  const height = (value) => (value / yMax.value) * plotH
  return {
    ...bin,
    i: index,
    x: box.left + index * bandWidth.value + 2,
    w: width,
    other: { y: box.bottom - height(bin.other), h: height(bin.other) },
    s211: { y: box.bottom - height(bin.other + bin.s211), h: height(bin.s211) },
    s985: { y: box.bottom - height(bin.other + bin.s211 + bin.s985), h: height(bin.s985) }
  }
}))

const hoverBin = computed(() => hoverIndex.value === null ? null : bins.value[hoverIndex.value] || null)
const labelStep = computed(() => Math.max(1, Math.ceil(bins.value.length / 12)))
const showLabel = (index) => index % labelStep.value === 0
</script>
