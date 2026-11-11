<!-- 成绩表上传、批量换算结果表与导出 -->
<template>
  <section class="card">
    <h2>批量换算</h2>
    <p class="card-desc">支持 xlsx / xls / csv，表头需包含「姓名」和「总分」，可选「班级 / 选科 / 校排」。成绩只在当前浏览器处理。</p>

    <label class="upload">
      <input type="file" accept=".xlsx,.xls,.csv" multiple @change="ctx.handleUpload" />
      <span class="upload-icon">📄</span>
      <strong>{{ ctx.state.uploading ? '正在解析…' : '选择成绩表' }}</strong>
      <small>可一次选多个文件</small>
    </label>

    <div v-if="ctx.state.unresolvedCount" class="warn">
      {{ ctx.state.unresolvedCount }} 位考生没识别出科类（选科列、班级、文件名里都没有「物理 / 历史」），当前按
      <select v-model="ctx.state.fallbackSubject" class="inline-select">
        <option value="physics">物理类</option>
        <option value="history">历史类</option>
      </select>
      计算；也可以在成绩表里加一列「选科」填物理/历史。
    </div>

    <p v-if="ctx.hasRankTable && ctx.state.lowCoverage.count" class="warn">
      有 {{ ctx.state.lowCoverage.count }} 位考生的换算分低于当前一分一段表的最低分，排位显示为「—」。导入完整的一分一段表后会自动重算。
    </p>

    <p v-if="ctx.state.errorMessage" class="warn">{{ ctx.state.errorMessage }}</p>

    <template v-if="ctx.state.students.length">
      <div class="table-tools">
        <input v-model="ctx.state.keyword" type="search" placeholder="搜索姓名或班级" aria-label="搜索结果" />
        <span>共 {{ ctx.state.students.length }} 人，显示 {{ ctx.filteredStudents.length }} 人</span>
        <label class="toggle"><input v-model="ctx.state.showExplain" type="checkbox" /> 显示计算过程</label>
        <button type="button" class="export-btn" @click="ctx.exportExcel">导出 Excel</button>
      </div>
      <div class="table-wrap">
        <table class="students">
          <thead>
            <tr>
              <th>校排</th>
              <th>姓名</th>
              <th>班级</th>
              <th>科类</th>
              <th>原始分</th>
              <th>换算分（取整）</th>
              <th>换算精确值</th>
              <th>线差</th>
              <th>进度</th>
              <th>所在区间</th>
              <th>层次</th>
              <th>全省排位参考</th>
              <th v-if="ctx.state.showExplain">计算过程</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in ctx.filteredStudents.slice(0, 200)" :key="`${item.name}-${index}`">
              <td>{{ item.schoolRank || '—' }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.className || '—' }}</td>
              <td>{{ ctx.SUBJECT_LABELS[item.resolvedSubject] }}</td>
              <td>{{ item.originalScore }}</td>
              <td class="highlight">{{ item.convertedScore }}</td>
              <td class="exact">{{ item.convertedExact }}</td>
              <td>{{ item.diffText }}</td>
              <td>{{ item.progressText }}</td>
              <td>{{ item.segmentLabel }}</td>
              <td :class="['tier', item.tierLabel === '985线' ? 'tier-985' : item.tierLabel === '211线' ? 'tier-211' : '']">{{ item.tierLabel }}</td>
              <td>{{ item.rank }}</td>
              <td v-if="ctx.state.showExplain" class="explain-cell">{{ item.explain }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="ctx.filteredStudents.length > 200" class="empty-hint">表格只显示前 200 条，完整数据请导出 Excel。</p>
    </template>
  </section>
</template>

<script setup>
import { inject } from 'vue'
import { SCORE_CONVERTER_KEY } from './constants.js'

const ctx = inject(SCORE_CONVERTER_KEY)
</script>
