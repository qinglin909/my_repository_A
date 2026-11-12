<!-- 换算曲线：原始分 → 换算分，叠加 y=x 基准、批次锚点、985/211 参考线与当前分数标记 -->
<template>
  <div class="chart-block">
    <svg
      ref="svgEl"
      class="chart-svg"
      viewBox="0 0 720 340"
      role="img"
      aria-label="原始分与换算分的对应关系曲线"
      @mousemove="onMove"
      @mouseleave="hoverX = null"
    >
      <defs>
        <clipPath id="score-curve-clip">
          <rect :x="box.left" :y="box.top" :width="plotW" :height="plotH" />
        </clipPath>
      </defs>

      <g clip-path="url(#score-curve-clip)">
        <rect
          v-for="band in bands"
          :key="band.key"
          :x="band.x"
          :y="box.top"
          :width="band.width"
          :height="plotH"
          :fill="band.fill"
        />
      </g>

      <line v-for="tick in xTicks" :key="`gx-${tick}`" :x1="sx(tick)" :x2="sx(tick)" :y1="box.top" :y2="box.bottom" stroke="#eef1f6" stroke-width="1" />
      <line v-for="tick in yTicks" :key="`gy-${tick}`" :x1="box.left" :x2="box.right" :y1="sy(tick)" :y2="sy(tick)" stroke="#eef1f6" stroke-width="1" />
      <line :x1="box.left" :x2="box.right" :y1="box.bottom" :y2="box.bottom" stroke="#cbd5e1" stroke-width="1.5" />
      <line :x1="box.left" :x2="box.left" :y1="box.top" :y2="box.bottom" stroke="#cbd5e1" stroke-width="1.5" />
      <text v-for="tick in xTicks" :key="`tx-${tick}`" :x="sx(tick)" :y="box.bottom + 18" text-anchor="middle" font-size="11" fill="#98a2b3">{{ tick }}</text>
      <text v-for="tick in yTicks" :key="`ty-${tick}`" :x="box.left - 8" :y="sy(tick) + 4" text-anchor="end" font-size="11" fill="#98a2b3">{{ tick }}</text>
      <text :x="box.right" :y="box.bottom + 34" text-anchor="end" font-size="11" fill="#667085">原始分</text>
      <text :x="box.left" :y="box.top - 7" font-size="11" fill="#667085">换算分</text>

      <g clip-path="url(#score-curve-clip)">
        <line :x1="sx(xDomain[0])" :y1="sy(xDomain[0])" :x2="sx(xDomain[1])" :y2="sy(xDomain[1])" stroke="#98a2b3" stroke-width="1.5" stroke-dasharray="6 5" />
        <line v-for="line in tierLines" :key="`tl-${line.key}`" :x1="box.left" :x2="box.right" :y1="sy(line.value)" :y2="sy(line.value)" :stroke="line.color" stroke-width="1.4" stroke-dasharray="4 4" />
        <line v-for="anchor in anchors" :key="`av-${anchor.key}`" :x1="sx(anchor.x)" :x2="sx(anchor.x)" :y1="box.top" :y2="box.bottom" :stroke="anchor.color" stroke-width="1.2" stroke-dasharray="3 4" opacity="0.7" />
        <path :d="curvePath" fill="none" stroke="#2563eb" stroke-width="2.6" stroke-linejoin="round" />
      </g>

      <text v-for="line in tierLines" :key="`tlabel-${line.key}`" :x="box.right - 6" :y="sy(line.value) - 5" text-anchor="end" font-size="10" :fill="line.color">{{ line.label }} {{ line.value }}</text>

      <g v-for="anchor in anchors" :key="`ap-${anchor.key}`">
        <circle :cx="sx(anchor.x)" :cy="sy(anchor.y)" r="5" :fill="anchor.color" stroke="#fff" stroke-width="2" />
        <text :x="sx(anchor.x)" :y="box.top + 13" text-anchor="middle" font-size="10" font-weight="700" :fill="anchor.color">{{ anchor.short }}</text>
      </g>

      <g v-if="manualPoint">
        <line :x1="manualPoint.px" :x2="manualPoint.px" :y1="box.top" :y2="box.bottom" stroke="#e5484d" stroke-width="1.2" stroke-dasharray="4 4" />
        <circle :cx="manualPoint.px" :cy="manualPoint.py" r="6" fill="#e5484d" stroke="#fff" stroke-width="2" />
        <text :x="clamp(manualPoint.px + 8, box.left, box.right - 92)" :y="manualPoint.py - 10" font-size="11" font-weight="700" fill="#e5484d">{{ manualPoint.label }}</text>
      </g>

      <template v-if="hoverSample">
        <line v-if="!manualPoint" :x1="sx(hoverSample.x)" :x2="sx(hoverSample.x)" :y1="box.top" :y2="box.bottom" stroke="#2563eb" stroke-width="1" stroke-dasharray="3 3" opacity="0.6" />
        <circle :cx="sx(hoverSample.x)" :cy="sy(hoverSample.y)" r="4.5" fill="#2563eb" stroke="#fff" stroke-width="2" />
      </template>
    </svg>

    <div class="chart-readout">
      <template v-if="hoverSample">
        <strong>{{ hoverSample.x }} 分</strong> → 换算分 <b>{{ fmtNum(hoverSample.y, 1) }}</b>
        <span>线差 {{ signed(hoverSample.diff) }} · {{ segmentLabel(hoverSample.segment) }}</span>
      </template>
      <template v-else-if="manualPoint">
        <strong>当前分数 {{ manualPoint.score }} 分</strong> → 换算分 <b>{{ fmtNum(manualPoint.y, 1) }}</b>
        <span>把鼠标移到图上可查看任意分数</span>
      </template>
      <template v-else>把鼠标移到图上，查看任意原始分对应的换算结果</template>
    </div>

    <div class="chart-legend">
      <span><i style="background:#2563eb"></i>换算曲线</span>
      <span><i class="dashed" style="background:#98a2b3"></i>不换算基准 y = x</span>
      <span v-for="anchor in anchors" :key="`lg-${anchor.key}`"><i :style="{ background: anchor.color }"></i>{{ anchor.label }} {{ anchor.x }} → {{ anchor.y }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { convertScore, SEGMENT_LABELS } from '@/utils/scoreConvert.js'
import { SCORE_CONVERTER_KEY } from '../constants.js'
import {
  CHART_BOX, PLOT_W, PLOT_H, clamp, scaleLinear, invertLinear,
  niceTicks, linePath, fmtNum, signed, svgX
} from './chartUtils.js'

const ctx = inject(SCORE_CONVERTER_KEY)
const box = CHART_BOX
const plotW = PLOT_W
const plotH = PLOT_H
const svgEl = ref(null)
const hoverX = ref(null)

const rule = computed(() => ctx.currentRule)
const anchorOptions = computed(() => ctx.topAnchorOptions(ctx.state.subject))

const xDomain = computed(() => {
  const current = rule.value
  const top = Number(ctx.state.topAnchors[ctx.state.subject].maxScore)
  const high = Number.isFinite(top) && top > current.currTk
    ? Math.min(750, top + 10)
    : Math.min(750, current.currTk + 110)
  return [
    Math.max(0, Math.floor(current.currZk - 20)),
    Math.ceil(Math.max(high, current.currTk + 40))
  ]
})

// 逐分采样：换算本身按整数分取整，步长 1 才能还原真实的阶梯形状
const samples = computed(() => {
  const [from, to] = xDomain.value
  const list = []
  for (let score = from; score <= to; score += 1) {
    const result = convertScore(score, rule.value, anchorOptions.value)
    if (result) list.push({ x: score, y: result.converted, diff: result.diff, segment: result.segment })
  }
  return list
})

const yDomain = computed(() => {
  const values = samples.value.map((item) => item.y)
  if (!values.length) return [0, 750]
  return [
    Math.floor((Math.min(...values) - 12) / 20) * 20,
    Math.ceil((Math.max(...values) + 12) / 20) * 20
  ]
})

const sx = computed(() => scaleLinear(xDomain.value, [box.left, box.right]))
const sy = computed(() => scaleLinear(yDomain.value, [box.bottom, box.top]))
const xTicks = computed(() => niceTicks(xDomain.value[0], xDomain.value[1], 6))
const yTicks = computed(() => niceTicks(yDomain.value[0], yDomain.value[1], 5))
const curvePath = computed(() => linePath(samples.value.map((item) => ({ x: sx.value(item.x), y: sy.value(item.y) }))))

const bands = computed(() => {
  const current = rule.value
  const stops = [
    { key: 'below', from: xDomain.value[0], to: current.currZk, fill: '#f8fafc' },
    { key: 'bk-zk', from: current.currZk, to: current.currBk, fill: '#f0fdf4' },
    { key: 'tk-bk', from: current.currBk, to: current.currTk, fill: '#eff6ff' },
    { key: 'above', from: current.currTk, to: xDomain.value[1], fill: '#fffbeb' }
  ]
  return stops
    .map((band) => ({
      ...band,
      x: sx.value(clamp(band.from, xDomain.value[0], xDomain.value[1])),
      width: Math.max(0, sx.value(clamp(band.to, xDomain.value[0], xDomain.value[1])) - sx.value(clamp(band.from, xDomain.value[0], xDomain.value[1])))
    }))
    .filter((band) => band.width > 0)
})

const anchors = computed(() => {
  const current = rule.value
  return [
    { key: 'tk', short: '特控', label: '特控线', x: current.currTk, y: current.lastTk, color: '#b42318' },
    { key: 'bk', short: '本科', label: '本科线', x: current.currBk, y: current.lastBk, color: '#b45309' },
    { key: 'zk', short: '专科', label: '专科线', x: current.currZk, y: current.lastZk, color: '#0f9d58' }
  ].filter((anchor) => Number.isFinite(anchor.x) && Number.isFinite(anchor.y))
})

const tierLines = computed(() => {
  const lines = ctx.state.tierLines[ctx.state.subject] || {}
  const [low, high] = yDomain.value
  return [
    { key: 's985', label: '985 线', value: Number(lines.s985), color: '#b42318' },
    { key: 's211', label: '211 线', value: Number(lines.s211), color: '#b45309' }
  ].filter((line) => lines[line.key] !== '' && lines[line.key] !== undefined &&
    Number.isFinite(line.value) && line.value >= low && line.value <= high)
})

const manualPoint = computed(() => {
  const result = ctx.manualResult
  if (!result) return null
  const score = Number(result.score)
  if (score < xDomain.value[0] || score > xDomain.value[1]) return null
  return {
    score,
    y: result.converted,
    px: sx.value(score),
    py: sy.value(result.converted),
    label: `${score} → ${result.rounded}`
  }
})

const hoverSample = computed(() => {
  if (hoverX.value === null || !samples.value.length) return null
  const dataX = invertLinear(xDomain.value, [box.left, box.right], hoverX.value)
  const score = Math.round(clamp(dataX, xDomain.value[0], xDomain.value[1]))
  return samples.value[clamp(score - xDomain.value[0], 0, samples.value.length - 1)] || null
})

const onMove = (event) => {
  const pixel = svgX(event, svgEl.value)
  if (pixel === null) return
  hoverX.value = pixel < box.left || pixel > box.right ? null : pixel
}

const segmentLabel = (key) => SEGMENT_LABELS[key] || '—'
</script>
