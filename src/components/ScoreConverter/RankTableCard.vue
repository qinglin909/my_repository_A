<!-- 一分一段表导入与预览 -->
<template>
  <section class="card">
    <div class="card-head">
      <div>
        <h2>一分一段表</h2>
        <p>换算分要靠它换成全省排位。程序不再内置任何排位数据，导入后保存在本机，下次打开自动加载。</p>
      </div>
      <span class="source-badge" :class="{ custom: ctx.state.customRank }">{{ ctx.rankSourceLabel }}</span>
    </div>
    <div class="rank-row">
      <label class="upload rank-upload">
        <input type="file" accept=".xlsx,.xls,.csv" multiple @change="ctx.handleRankUpload" />
        <strong>{{ ctx.state.rankLoading ? '正在解析…' : '导入一分一段表' }}</strong>
        <small>需要「分数」+「最低排位/累计人数」两列；文件名或工作表名带物理/历史</small>
      </label>
      <button v-if="ctx.state.customRank" type="button" class="ghost" @click="ctx.clearRank">清除已导入表</button>
    </div>
    <p v-if="ctx.state.rankError" class="warn">{{ ctx.state.rankError }}</p>
    <p v-if="!ctx.hasRankTable" class="empty-hint">还没有导入一分一段表：换算分照常计算，只是「全省排位参考」会显示「—」。</p>
    <p v-if="ctx.state.customRank" class="rank-meta">
      物理 {{ ctx.state.rankTables.physics.length }} 条（{{ ctx.state.rankTables.physics.at(-1)?.score }}–{{ ctx.state.rankTables.physics[0]?.score }} 分）·
      历史 {{ ctx.state.rankTables.history.length }} 条（{{ ctx.state.rankTables.history.at(-1)?.score }}–{{ ctx.state.rankTables.history[0]?.score }} 分）
    </p>
    <div v-if="ctx.state.customRank" class="rank-preview">
      <table>
        <thead>
          <tr><th>科类</th><th>分数</th><th>排位</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in ctx.rankPreview" :key="row.key">
            <td>{{ row.subject }}</td>
            <td>{{ row.score }}</td>
            <td>{{ row.rank }}</td>
          </tr>
        </tbody>
      </table>
      <p class="rank-meta">每个科类只显示前 3 行，用来核对「分数」「排位」列是否取对；不是完整数据。</p>
    </div>

    <p v-if="ctx.state.customRank && (ctx.state.rankColumns.physics || ctx.state.rankColumns.history)" class="rank-meta">
      识别列：<template v-if="ctx.state.rankColumns.physics">物理「{{ ctx.state.rankColumns.physics.score }}」+「{{ ctx.state.rankColumns.physics.rank }}」{{ ctx.state.rankColumns.physics.cumulative ? '（累计值）' : '（按人数累加）' }}</template>
      <template v-if="ctx.state.rankColumns.physics && ctx.state.rankColumns.history"> · </template>
      <template v-if="ctx.state.rankColumns.history">历史「{{ ctx.state.rankColumns.history.score }}」+「{{ ctx.state.rankColumns.history.rank }}」{{ ctx.state.rankColumns.history.cumulative ? '（累计值）' : '（按人数累加）' }}</template>
    </p>
  </section>
</template>

<script setup>
import { inject } from 'vue'
import { SCORE_CONVERTER_KEY } from './constants.js'

const ctx = inject(SCORE_CONVERTER_KEY)
</script>
