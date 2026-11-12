<script setup>
import { ref } from 'vue'
import { money } from './constants'

defineProps({
  donutSegments: { type: Array, default: () => [] },
  expenseTotal: { type: Number, default: 0 },
  expenseCount: { type: Number, default: 0 },
  barRows: { type: Array, default: () => [] },
  palette: { type: Array, default: () => [] }
})

const donutSvg = ref(null)
const barSvg = ref(null)

// 供父页面导出 PNG 时读取真实 SVG 节点
defineExpose({ donutSvg, barSvg })
</script>

<template>
  <section class="chart-card app-card">
    <div class="chart-head">
      <h2>支出构成与收支对比</h2>
      <span class="chart-hint">{{ expenseCount ? '停用的条目不计入' : '登记支出后自动生成' }}</span>
    </div>
    <div class="chart-grid">
      <div class="chart-block">
        <svg ref="donutSvg" class="chart-svg" viewBox="0 0 320 240" width="320" height="240" role="img" aria-label="支出构成饼图" font-family="Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif">
          <g v-if="donutSegments.length">
            <path
              v-for="(seg, index) in donutSegments"
              :key="seg.name"
              :d="seg.path"
              :fill="palette[index % palette.length]"
              stroke="#fff"
              stroke-width="2"
            />
          </g>
          <g v-else>
            <circle cx="120" cy="120" r="88" fill="none" stroke="#ececec" stroke-width="34" />
          </g>
          <text x="120" y="114" text-anchor="middle" font-size="12" fill="#8a8a8a">每月支出</text>
          <text x="120" y="138" text-anchor="middle" font-size="20" font-weight="700" fill="#333">
            {{ expenseTotal ? money(expenseTotal) : '—' }}
          </text>
          <g v-if="donutSegments.length" class="donut-legend">
            <g v-for="(seg, index) in donutSegments" :key="seg.name">
              <rect x="228" :y="34 + index * 22" width="12" height="12" rx="3" :fill="palette[index % palette.length]" />
              <text x="246" :y="44 + index * 22" font-size="12" fill="#555">{{ seg.name }} {{ money(seg.value) }}</text>
            </g>
          </g>
        </svg>
      </div>

      <div class="chart-block">
        <svg ref="barSvg" class="chart-svg" viewBox="0 0 320 240" width="320" height="240" role="img" aria-label="收支对比条形图" font-family="Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif">
          <line x1="104" y1="16" x2="104" y2="224" stroke="#e5e5e5" />
          <g v-for="(row, index) in barRows" :key="row.label">
            <text x="94" :y="44 + index * 68" text-anchor="end" font-size="12" fill="#555">{{ row.label }}</text>
            <rect
              x="110"
              :y="28 + index * 68"
              :width="row.width"
              height="24"
              rx="5"
              :fill="row.color"
            />
            <text :x="110 + row.width + 8" :y="45 + index * 68" font-size="12" font-weight="600" :fill="row.color">
              {{ money(row.value) }}
            </text>
          </g>
        </svg>
      </div>
    </div>
  </section>
</template>
