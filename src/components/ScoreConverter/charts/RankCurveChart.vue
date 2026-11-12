<!-- 位次曲线：当前科类一分一段表的「分数 → 累计位次」关系，并标注当前换算分 -->
<template>
  <div class="chart-block">
    <svg v-if="points.length" class="chart-svg" viewBox="0 0 720 340" role="img" :aria-label="`${subjectLabel}一分一段位次曲线`">
      <line v-for="tick in xTicks" :key="`gx-${tick}`" :x1="sx(tick)" :x2="sx(tick)" :y1="box.top" :y2="box.bottom" stroke="#eef1f6" stroke-width="1" />
      <line v-for="tick in yTicks" :key="`gy-${tick}`" :x1="box.left" :x2="box.right" :y1="sy(tick)" :y2="sy(tick)" stroke="#eef1f6" stroke-width="1" />
      <line :x1="box.left" :x2="box.right" :y1="box.bottom" :y2="box.bottom" stroke="#cbd5e1" stroke-width="1.5" />
      <line :x1="box.left" :x2="box.left" :y1="box.top" :y2="box.bottom" stroke="#cbd5e1" stroke-width="1.5" />
      <text v-for="tick in xTicks" :key="`tx-${tick}`" :x="sx(tick)" :y="box.bottom + 18" text-anchor="middle" font-size="11" fill="#98a2b3">{{ tick }}</text>
      <text v-for="tick in yTicks" :key="`ty-${tick}`" :x="box.left - 8" :y="sy(tick) + 4" text-anchor="end" font-size="11" fill="#98a2b3">{{ compact(tick) }}</text>
      <text :x="box.right" :y="box.bottom + 34" text-anchor="end" font-size="11" fill="#667085">换算分</text>
      <text :x="box.left" :y="box.top - 7" font-size="11" fill="#667085">累计位次（越靠上越靠前）</text>

      <path :d="areaPath" fill="#2563eb" opacity="0.08" />
      <path :d="curvePath" fill="none" stroke="#2563eb" stroke-width="2.4" stroke-linejoin="round" />

      <g v-if="current">
        <line :x1="sx(current.score)" :x2="sx(current.score)" :y1="sy(current.rank)" :y2="box.bottom" stroke="#e5484d" stroke-width="1.2" stroke-dasharray="4 4" />
        <line :x1="box.left" :x2="sx(current.score)" :y1="sy(current.rank)" :y2="sy(current.rank)" stroke="#e5484d" stroke-width="1.2" stroke-dasharray="4 4" />
        <circle :cx="sx(current.score)" :cy="sy(current.rank)" r="6" fill="#e5484d" stroke="#fff" stroke-width="2" />
        <text :x="clamp(sx(current.score) + 8, box.left, box.right - 150)" :y="sy(current.rank) - 10" font-size="11" font-weight="700" fill="#e5484d">{{ current.score }} 分 · 位次 {{ current.rank }}</text>
      </g>
    </svg>

    <div v-else class="chart-empty">还没有导入{{ subjectLabel }}的一分一段表。<br />到上面「一分一段表」导入后，这里会画出分数与位次的对应曲线。</div>

    <div class="chart-readout">
      <template v-if="points.length && current">
        <strong>当前换算分 {{ current.score }}</strong> → 全省累计位次约 <b>{{ current.rank }}</b>
        <span>位次按{{ subjectLabel }}一分一段表查询</span>
      </template>
      <template v-else-if="points.length">
        共 {{ points.length }} 个分数点，位次范围 {{ fmtNum(minRank) }} – {{ fmtNum(maxRank) }}
        <span>在「单个分数换算」输入分数即可在曲线上定位</span>
      </template>
      <template v-else>曲线依赖一分一段表数据，不影响分数换算本身。</template>
    </div>

    <div v-if="points.length" class="chart-legend">
      <span><i style="background:#2563eb"></i>分数—位次曲线</span>
      <span v-if="current"><i style="background:#e5484d"></i>当前换算分</span>
      <span class="legend-note">{{ subjectLabel }} · 位次为累计人数，越小越靠前</span>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { lookupRank, SUBJECT_LABELS } from '@/utils/scoreConvert.js'
import { SCORE_CONVERTER_KEY } from '../constants.js'
import { CHART_BOX, clamp, scaleLinear, niceTicks, linePath, fmtNum } from './chartUtils.js'

const ctx = inject(SCORE_CONVERTER_KEY)
const box = CHART_BOX

const table = computed(() => ctx.state.rankTables[ctx.state.subject] || [])
const subjectLabel = computed(() => SUBJECT_LABELS[ctx.state.subject])

const points = computed(() => table.value
  .filter((row) => Number.isFinite(Number(row.score)) && Number.isFinite(Number(row.rank)))
  .map((row) => ({ score: Number(row.score), rank: Number(row.rank) }))
  .sort((a, b) => a.score - b.score))

const xDomain = computed(() => {
  if (!points.value.length) return [0, 750]
  const scores = points.value.map((point) => point.score)
  return [Math.min(...scores), Math.max(...scores)]
})

const minRank = computed(() => points.value.length ? Math.min(...points.value.map((point) => point.rank)) : 0)
const maxRank = computed(() => points.value.length ? Math.max(...points.value.map((point) => point.rank)) : 1)
const yDomain = computed(() => [0, Math.max(1, maxRank.value)])

const sx = computed(() => scaleLinear(xDomain.value, [box.left, box.right]))
// 位次 1 在最上、位次最大在最下
const sy = computed(() => scaleLinear(yDomain.value, [box.top, box.bottom]))
const xTicks = computed(() => niceTicks(xDomain.value[0], xDomain.value[1], 6))
const yTicks = computed(() => niceTicks(0, yDomain.value[1], 5))

const curvePoints = computed(() => points.value.map((point) => ({ x: sx.value(point.score), y: sy.value(point.rank) })))
const curvePath = computed(() => linePath(curvePoints.value))
const areaPath = computed(() => {
  const list = curvePoints.value
  if (!list.length) return ''
  const last = list[list.length - 1]
  return `${curvePath.value} L${last.x.toFixed(2)},${box.bottom} L${list[0].x.toFixed(2)},${box.bottom} Z`
})

const current = computed(() => {
  const result = ctx.manualResult
  if (!result || !table.value.length) return null
  const rank = Number(lookupRank(result.rounded, table.value))
  if (!Number.isFinite(rank)) return null
  const score = Number(result.rounded)
  if (score < xDomain.value[0] || score > xDomain.value[1]) return null
  return { score, rank }
})

const compact = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return number >= 10000 ? `${fmtNum(number / 10000, 1)}万` : fmtNum(number)
}
</script>
