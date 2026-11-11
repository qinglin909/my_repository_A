<!-- 换算依据表：三条线差与相邻区间的每分分差 -->
<template>
  <section class="card">
    <h2>换算依据</h2>
    <p class="card-desc">线差 = 省控线 − 学校预估线；每分分差 = 相邻两条线的线差之差 ÷ 分差，表示这一段里每提高 1 分，换算分相对原始分多走的幅度。</p>
    <div class="table-wrap">
      <table class="basis">
        <thead>
          <tr>
            <th>线类</th>
            <th>学校预估线</th>
            <th>省控线</th>
            <th>线差</th>
            <th>相邻区间</th>
            <th>分差</th>
            <th>线差之差</th>
            <th>每分分差</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in ctx.basisRows" :key="row.key">
            <td>{{ row.label }}</td>
            <td>{{ ctx.fmt(row.curr) }}</td>
            <td>{{ ctx.fmt(row.last) }}</td>
            <td :class="ctx.diffClass(row.diff)">{{ ctx.fmt(row.diff) }}</td>
            <td>{{ row.pair?.label || '—' }}</td>
            <td>{{ row.pair ? ctx.fmt(row.pair.scoreGap) : '—' }}</td>
            <td>{{ row.pair ? ctx.fmt(row.pair.diffGap) : '—' }}</td>
            <td>{{ row.pair && row.pair.perPoint !== null ? row.pair.perPoint.toFixed(6) : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { inject } from 'vue'
import { SCORE_CONVERTER_KEY } from './constants.js'

const ctx = inject(SCORE_CONVERTER_KEY)
</script>
