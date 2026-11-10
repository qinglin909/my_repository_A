<template>
  <div class="page">
    <header class="page-head">
      <p class="eyebrow">成绩换算</p>
      <h1>分数换算工作台</h1>
      <p class="sub">用「学校预估线 vs 省控线」的线差做分段线性换算：特控线、本科线两个锚点精确命中，中间按每分分差平滑过渡。</p>
    </header>

    <section class="card">
      <div class="card-head">
        <div>
          <h2>分数线设置</h2>
          <p>学校预估线填学校公布的批次线，省控线填对应年份的省批次线。</p>
        </div>
        <div class="seg" role="tablist" aria-label="科类">
          <button
            v-for="key in SUBJECTS"
            :key="key"
            type="button"
            role="tab"
            :aria-selected="subject === key"
            :class="{ active: subject === key }"
            @click="subject = key"
          >{{ SUBJECT_LABELS[key] }}</button>
        </div>
      </div>

      <p v-if="!validRule" class="warn">分数线顺序不正确：需要满足「学校特控线 &gt; 本科线 &gt; 专科线」，且都在 0–750 之间。</p>

      <div class="line-grid">
        <fieldset v-for="line in lineFields" :key="line.key">
          <legend>{{ LINE_LABELS[line.key] }}</legend>
          <label>
            <span>学校预估线</span>
            <input v-model.number="currentRule[line.curr]" type="number" min="0" max="750" step="0.5" />
          </label>
          <label>
            <span>省控线</span>
            <input v-model.number="currentRule[line.last]" type="number" min="0" max="750" step="0.5" />
          </label>
          <p class="diff" :class="diffClass(diffs[line.key])">线差 {{ fmt(diffs[line.key]) }}</p>
        </fieldset>
      </div>

      <div class="actions">
        <button type="button" class="ghost" @click="resetRule">恢复默认（广东 2026）</button>
        <span class="saved-hint">改动会自动保存在本机</span>
      </div>

      <div class="anchor-box">
        <div class="anchor-head">
          <strong>高分段校准（可选）</strong>
          <span>不填则特控线以上统一使用特控线线差</span>
        </div>
        <p class="anchor-desc">按交接文档：如果特控线以上的换算整体偏高或偏低，可用「本次最高分 → 往年同一位次分数」再校准一次。</p>
        <div class="anchor-inputs">
          <label>本次考试最高分
            <input v-model.number="topAnchors[subject].maxScore" type="number" min="0" max="750" step="0.5" placeholder="例如 640" />
          </label>
          <label>往年同一位次对应分数
            <input v-model.number="topAnchors[subject].targetMaxScore" type="number" min="0" max="750" step="0.5" placeholder="例如 650" />
          </label>
        </div>
        <p v-if="topAnchorActive" class="anchor-note">
          最高分线差 {{ fmt(topAnchorDiff) }}，特控线（{{ fmt(currentRule.currTk) }} 分）到最高分（{{ fmt(topAnchors[subject].maxScore) }} 分）之间按这个线差线性过渡。
        </p>
      </div>
    </section>

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
            <tr v-for="row in basisRows" :key="row.key">
              <td>{{ row.label }}</td>
              <td>{{ fmt(row.curr) }}</td>
              <td>{{ fmt(row.last) }}</td>
              <td :class="diffClass(row.diff)">{{ fmt(row.diff) }}</td>
              <td>{{ row.pair?.label || '—' }}</td>
              <td>{{ row.pair ? fmt(row.pair.scoreGap) : '—' }}</td>
              <td>{{ row.pair ? fmt(row.pair.diffGap) : '—' }}</td>
              <td>{{ row.pair && row.pair.perPoint !== null ? row.pair.perPoint.toFixed(6) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h2>单个分数换算</h2>
      <div class="manual-row">
        <label>
          <span>原始分</span>
          <input v-model.number="manualScore" type="number" min="0" max="750" step="0.5" placeholder="例如 500" />
        </label>
        <span class="subject-pill">{{ SUBJECT_LABELS[subject] }}</span>
      </div>

      <div v-if="manualResult" class="result-grid">
        <div class="result-main">
          <span>换算分</span>
          <strong>{{ fmt(manualResult.converted) }}</strong>
        </div>
        <div>
          <span>取整参考</span>
          <strong>{{ manualResult.rounded }}</strong>
        </div>
        <div>
          <span>线差</span>
          <strong>{{ fmt(manualResult.diff) }}</strong>
        </div>
        <div>
          <span>所在区间</span>
          <strong class="small">{{ SEGMENT_LABELS[manualResult.segment] }}</strong>
        </div>
        <div>
          <span>全省排位参考</span>
          <strong>{{ manualRank }}</strong>
        </div>
      </div>
      <p v-else class="empty-hint">输入 0–750 之间的分数后自动计算。</p>
    </section>

    <section class="card">
      <h2>批量换算</h2>
      <p class="card-desc">支持 xlsx / xls / csv，表头需包含「姓名」和「总分」，可选「班级 / 选科 / 校排」。成绩只在当前浏览器处理。</p>

      <label class="upload">
        <input type="file" accept=".xlsx,.xls,.csv" multiple @change="handleUpload" />
        <span class="upload-icon">📄</span>
        <strong>{{ uploading ? '正在解析…' : '选择成绩表' }}</strong>
        <small>可一次选多个文件</small>
      </label>

      <div v-if="unresolvedCount" class="warn">
        {{ unresolvedCount }} 位考生没识别出科类（选科列、班级、文件名里都没有「物理 / 历史」），当前按
        <select v-model="fallbackSubject" class="inline-select">
          <option value="physics">物理类</option>
          <option value="history">历史类</option>
        </select>
        计算；也可以在成绩表里加一列「选科」填物理/历史。
      </div>

      <p v-if="errorMessage" class="warn">{{ errorMessage }}</p>

      <template v-if="students.length">
        <div class="table-tools">
          <input v-model="keyword" type="search" placeholder="搜索姓名或班级" aria-label="搜索结果" />
          <span>共 {{ students.length }} 人，显示 {{ filteredStudents.length }} 人</span>
          <button type="button" class="export-btn" @click="exportExcel">导出 Excel</button>
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
                <th>换算分</th>
                <th>线差</th>
                <th>所在区间</th>
                <th>全省排位参考</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in filteredStudents.slice(0, 200)" :key="`${item.name}-${index}`">
                <td>{{ item.schoolRank || '—' }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.className || '—' }}</td>
                <td>{{ SUBJECT_LABELS[item.resolvedSubject] }}</td>
                <td>{{ item.originalScore }}</td>
                <td class="highlight">{{ item.convertedScore }}</td>
                <td>{{ item.diffText }}</td>
                <td>{{ item.segmentLabel }}</td>
                <td>{{ item.rank }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="filteredStudents.length > 200" class="empty-hint">表格只显示前 200 条，完整数据请导出 Excel。</p>
      </template>
    </section>

    <section class="card note-card">
      <h2>换算方法</h2>
      <ol>
        <li>计算三条线的线差：<code>省控线 − 学校预估线</code>。</li>
        <li>原始分先向下取整（ROUNDDOWN），再取该分数的分差。</li>
        <li>特控线以上沿用特控线线差；设置了「高分段校准」时，在特控线与本次最高分之间线性过渡。</li>
        <li>特控线与本科线之间、本科线与专科线之间，线差按分数位置线性过渡，每分分差 = 线差之差 ÷ 分差。</li>
        <li>专科线以下不做换算，保持原始分。</li>
        <li>换算分 = 原始分 + 该位置的线差，四舍五入取整后，再用一分一段表查全省排位参考。</li>
      </ol>
      <p class="empty-hint">锚点校验：学校本科线换算后等于省控本科线，学校特控线换算后等于省控特控线。</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import * as XLSX from 'xlsx'
import { DEFAULT_DATABASES, BUILT_IN_GD_2026 } from '@/utils/calcConfig.js'
import { parseScoreExcel } from '@/utils/calcLogic.js'
import {
  LINE_LABELS,
  SEGMENT_LABELS,
  SUBJECTS,
  SUBJECT_LABELS,
  conversionPairs,
  convertScore,
  lookupRank,
  normalizeRule,
  ruleDiffs,
  ruleLooksValid
} from '@/utils/scoreConvert.js'

const STORAGE_KEY = 'score_converter_v2'
const defaults = DEFAULT_DATABASES[0].config

const subject = ref('physics')
const rules = reactive({
  physics: normalizeRule(defaults.physics),
  history: normalizeRule(defaults.history)
})
const topAnchors = reactive({
  physics: { maxScore: '', targetMaxScore: '' },
  history: { maxScore: '', targetMaxScore: '' }
})

const manualScore = ref('')
const students = ref([])
const sourceStudents = ref([])
const keyword = ref('')
const uploading = ref(false)
const errorMessage = ref('')
const fallbackSubject = ref('physics')
const unresolvedCount = ref(0)

const lineFields = [
  { key: 'tk', curr: 'currTk', last: 'lastTk' },
  { key: 'bk', curr: 'currBk', last: 'lastBk' },
  { key: 'zk', curr: 'currZk', last: 'lastZk' }
]

const currentRule = computed(() => rules[subject.value])
const validRule = computed(() => ruleLooksValid(currentRule.value))
const diffs = computed(() => ruleDiffs(currentRule.value))
const pairs = computed(() => conversionPairs(currentRule.value))

const topAnchorOptions = (subjectKey) => ({
  maxScore: topAnchors[subjectKey].maxScore,
  targetMaxScore: topAnchors[subjectKey].targetMaxScore
})

const topAnchorActive = computed(() => {
  const anchor = topAnchors[subject.value]
  const maxScore = Number(anchor.maxScore)
  const target = Number(anchor.targetMaxScore)
  return Number.isFinite(maxScore) && Number.isFinite(target) &&
    maxScore > currentRule.value.currTk && target > 0 && target <= 750
})

const topAnchorDiff = computed(() =>
  Number(topAnchors[subject.value].targetMaxScore) - Number(topAnchors[subject.value].maxScore)
)

const basisRows = computed(() => {
  const diff = diffs.value
  return lineFields.map((line) => ({
    key: line.key,
    label: LINE_LABELS[line.key],
    curr: Number(currentRule.value[line.curr]),
    last: Number(currentRule.value[line.last]),
    diff: diff[line.key],
    pair: line.key === 'bk' ? pairs.value[0] : line.key === 'zk' ? pairs.value[1] : null
  }))
})

const manualResult = computed(() => {
  if (manualScore.value === '' || manualScore.value === null) return null
  return convertScore(manualScore.value, currentRule.value, topAnchorOptions(subject.value))
})

const rankTable = computed(() => (subject.value === 'physics' ? BUILT_IN_GD_2026.physics : BUILT_IN_GD_2026.history))
const manualRank = computed(() => (manualResult.value ? lookupRank(manualResult.value.rounded, rankTable.value) : '—'))

const filteredStudents = computed(() => {
  const query = keyword.value.trim().toLocaleLowerCase()
  if (!query) return students.value
  return students.value.filter((item) =>
    `${item.name || ''} ${item.className || ''}`.toLocaleLowerCase().includes(query)
  )
})

const fmt = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return Number.isInteger(number) ? String(number) : number.toFixed(1)
}

const diffClass = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number) || number === 0) return 'neutral'
  return number > 0 ? 'positive' : 'negative'
}

const resetRule = () => {
  rules.physics = normalizeRule(defaults.physics)
  rules.history = normalizeRule(defaults.history)
}

const inferSubjectFromText = (text) => {
  const value = String(text || '')
  if (/物理|理科|理工/.test(value)) return 'physics'
  if (/历史|文科/.test(value)) return 'history'
  return null
}

// 识别顺序：选科列 → 班级名 → 文件名（含“物理/历史”）→ 页面上选的兜底科类
const resolveSubject = (student) =>
  inferSubjectFromText(student.subject) ||
  inferSubjectFromText(student.className) ||
  student.fileSubject ||
  fallbackSubject.value

const buildRows = (source) => {
  let unresolved = 0
  const rows = source.map((student) => {
    const detected = inferSubjectFromText(student.subject) ||
      inferSubjectFromText(student.className) ||
      student.fileSubject
    if (!detected) unresolved += 1
    const resolved = detected || fallbackSubject.value
    const rule = rules[resolved]
    const result = convertScore(student.originalScore, rule, topAnchorOptions(resolved))
    const table = resolved === 'physics' ? BUILT_IN_GD_2026.physics : BUILT_IN_GD_2026.history
    return {
      ...student,
      resolvedSubject: resolved,
      convertedScore: result ? fmt(result.converted) : '—',
      diffText: result ? fmt(result.diff) : '—',
      segmentLabel: result ? SEGMENT_LABELS[result.segment] : '分数异常',
      rank: result ? lookupRank(result.rounded, table) : '—'
    }
  })
  unresolvedCount.value = unresolved
  students.value = rows
}

watch(fallbackSubject, () => {
  if (sourceStudents.value.length) buildRows(sourceStudents.value)
})

const handleUpload = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return
  uploading.value = true
  errorMessage.value = ''
  try {
    const parsed = await parseScoreExcel(files)
    const all = parsed.flatMap((file) => file.students.map((student) => ({
      ...student,
      fileSubject: inferSubjectFromText(file.fileName)
    })))
    if (all.length === 0) throw new Error('没有解析到考生记录，请检查表头是否包含「姓名」和「总分」。')

    sourceStudents.value = all
    buildRows(all)
  } catch (error) {
    errorMessage.value = error.message || '成绩表解析失败'
    students.value = []
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

const exportExcel = () => {
  if (!students.value.length) return
  try {
    const workbook = XLSX.utils.book_new()
    const toRow = (item) => ({
      校排: item.schoolRank || '',
      姓名: item.name,
      班级: item.className || '',
      科类: SUBJECT_LABELS[item.resolvedSubject],
      原始分: item.originalScore,
      换算分: item.convertedScore,
      线差: item.diffText,
      所在区间: item.segmentLabel,
      全省排位参考: item.rank
    })
    const schoolName = '换算结果'
    const safeSheetName = (name, fallback) => {
      const cleaned = String(name || fallback).replace(/[\\/:*?"<>\[\]]/g, '').trim().slice(0, 28)
      return cleaned || fallback
    }

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(students.value.map(toRow)), safeSheetName(schoolName, '汇总'))

    // 按班级分 sheet 导出分数条
    const byClass = new Map()
    for (const item of students.value) {
      const key = item.className || '未分班'
      if (!byClass.has(key)) byClass.set(key, [])
      byClass.get(key).push(item)
    }
    if (byClass.size > 1) {
      let index = 1
      for (const [className, items] of byClass) {
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(items.map(toRow)), safeSheetName(className, `班级${index}`))
        index += 1
      }
    }

    XLSX.writeFile(workbook, `成绩换算_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch (error) {
    errorMessage.value = `导出失败：${error.message}`
  }
}

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    const savedRules = saved?.rules || saved
    if (savedRules?.physics) rules.physics = normalizeRule(savedRules.physics)
    if (savedRules?.history) rules.history = normalizeRule(savedRules.history)
    if (saved?.topAnchors) {
      for (const key of SUBJECTS) {
        if (saved.topAnchors[key]) topAnchors[key] = { ...topAnchors[key], ...saved.topAnchors[key] }
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
})

watch([rules, topAnchors], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rules, topAnchors }))
  } catch {
    // 本地存储不可用时保持当前会话可用
  }
}, { deep: true })
</script>

<style scoped>
.page { min-height: calc(100vh - 60px); padding: 34px 16px 64px; background: radial-gradient(circle at 12% 0%, #e7f0ff 0, transparent 30%), #f5f7fb; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; }
.page-head, .card { max-width: 1080px; margin: 0 auto; }
.page-head { margin-bottom: 22px; }
.eyebrow { margin: 0 0 8px; color: #2563eb; font-size: 13px; font-weight: 700; letter-spacing: .08em; }
.page-head h1 { margin: 0; color: #172033; font-size: clamp(26px, 4vw, 34px); }
.sub { max-width: 760px; margin: 10px 0 0; color: #667085; font-size: 15px; line-height: 1.7; }
.card { margin-bottom: 18px; padding: 24px clamp(16px, 3vw, 28px); border: 1px solid #e8ecf3; border-radius: 18px; background: #fff; box-shadow: 0 10px 26px #1018280a; }
.card h2 { margin: 0 0 6px; color: #172033; font-size: 19px; }
.card-desc { margin: 0 0 16px; color: #667085; font-size: 13px; line-height: 1.7; }
.card-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 16px; }
.card-head h2 { margin-bottom: 4px; }
.card-head p { margin: 0; color: #667085; font-size: 13px; }
.seg { display: inline-flex; padding: 4px; border-radius: 12px; background: #f2f5fa; }
.seg button { min-width: 88px; padding: 8px 14px; border: 0; border-radius: 9px; background: transparent; color: #667085; font-size: 14px; font-weight: 700; cursor: pointer; }
.seg button.active { background: #fff; color: #2563eb; box-shadow: 0 2px 8px #10182814; }
.inline-select { margin: 0 4px; padding: 4px 8px; border: 1px solid #f5c2c2; border-radius: 8px; background: #fff; color: #b42318; font-size: 13px; }
.warn { margin: 0 0 14px; padding: 12px 14px; border: 1px solid #fed7d7; border-radius: 12px; background: #fff5f5; color: #b42318; font-size: 13px; line-height: 1.6; }
.line-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; }
fieldset { margin: 0; padding: 14px; border: 1px solid #e8ecf3; border-radius: 14px; }
legend { padding: 0 6px; color: #344054; font-size: 14px; font-weight: 700; }
fieldset label { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; color: #667085; font-size: 13px; }
fieldset input { width: 110px; padding: 8px 10px; border: 1px solid #dfe4ee; border-radius: 9px; color: #172033; font-size: 14px; text-align: right; }
fieldset input:focus { border-color: #2563eb; outline: 2px solid #2563eb22; }
.diff { margin: 12px 0 0; font-size: 13px; font-weight: 700; }
.diff.positive, .positive { color: #0f9d58; }
.diff.negative, .negative { color: #e5484d; }
.diff.neutral, .neutral { color: #667085; }
.actions { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
.ghost { padding: 9px 16px; border: 1px solid #dfe4ee; border-radius: 10px; background: #fff; color: #344054; font-size: 13px; font-weight: 600; cursor: pointer; }
.ghost:hover { border-color: #2563eb; color: #2563eb; }
.saved-hint { color: #98a2b3; font-size: 12px; }
.anchor-box { margin-top: 16px; padding: 16px; border: 1px dashed #dfe4ee; border-radius: 14px; background: #fbfcfe; }
.anchor-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; }
.anchor-head strong { color: #344054; font-size: 14px; }
.anchor-head span { color: #98a2b3; font-size: 12px; }
.anchor-desc { margin: 6px 0 12px; color: #667085; font-size: 12px; line-height: 1.7; }
.anchor-inputs { display: flex; flex-wrap: wrap; gap: 12px; }
.anchor-inputs label { display: flex; flex-direction: column; gap: 6px; color: #667085; font-size: 12px; }
.anchor-inputs input { width: 170px; padding: 8px 10px; border: 1px solid #dfe4ee; border-radius: 9px; color: #172033; font-size: 14px; }
.anchor-inputs input:focus { border-color: #2563eb; outline: 2px solid #2563eb22; }
.anchor-note { margin: 12px 0 0; color: #2563eb; font-size: 12px; line-height: 1.6; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 10px 12px; border-bottom: 1px solid #eef1f6; text-align: left; white-space: nowrap; }
th { background: #f8fafc; color: #667085; font-weight: 600; }
td { color: #344054; }
.basis td:first-child { font-weight: 700; color: #172033; }
.manual-row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 14px; }
.manual-row label { display: flex; flex-direction: column; gap: 6px; color: #667085; font-size: 13px; }
.manual-row input { width: 180px; padding: 11px 14px; border: 1px solid #dfe4ee; border-radius: 11px; font-size: 16px; color: #172033; }
.manual-row input:focus { border-color: #2563eb; outline: 2px solid #2563eb22; }
.subject-pill { padding: 9px 14px; border-radius: 999px; background: #eff6ff; color: #2563eb; font-size: 13px; font-weight: 700; }
.result-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 18px; }
.result-grid > div { padding: 14px; border: 1px solid #eef1f6; border-radius: 12px; background: #fbfcfe; }
.result-grid span { display: block; color: #667085; font-size: 12px; }
.result-grid strong { display: block; margin-top: 6px; color: #172033; font-size: 24px; font-weight: 800; }
.result-grid strong.small { font-size: 14px; line-height: 1.5; white-space: normal; }
.result-main { background: #eff6ff !important; border-color: #bfdbfe !important; }
.result-main strong { color: #2563eb; font-size: 32px; }
.empty-hint { margin: 12px 0 0; color: #98a2b3; font-size: 13px; }
.upload { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 26px 16px; border: 1.5px dashed #cbd5e1; border-radius: 16px; background: #fbfcfe; cursor: pointer; text-align: center; }
.upload:hover { border-color: #2563eb; background: #f5f9ff; }
.upload input { display: none; }
.upload-icon { font-size: 26px; }
.upload strong { color: #172033; font-size: 15px; }
.upload small { color: #98a2b3; font-size: 12px; }
.table-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 18px 0 10px; }
.table-tools input { flex: 1; min-width: 180px; padding: 10px 12px; border: 1px solid #dfe4ee; border-radius: 10px; font-size: 14px; }
.table-tools span { color: #667085; font-size: 13px; }
.export-btn { padding: 10px 16px; border: 0; border-radius: 10px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; }
.export-btn:hover { background: #1d4ed8; }
.highlight { color: #2563eb; font-weight: 800; }
.note-card ol { margin: 12px 0 0; padding-left: 20px; color: #475467; font-size: 14px; line-height: 1.9; }
.note-card code { padding: 2px 6px; border-radius: 6px; background: #f2f4f7; font-size: 13px; }
@media (max-width: 640px) {
  .page { padding: 22px 12px 48px; }
  .card { padding: 18px 14px; border-radius: 16px; }
  .seg { width: 100%; }
  .seg button { flex: 1; }
  .manual-row input { width: 100%; }
  .manual-row label { flex: 1; }
}
</style>
