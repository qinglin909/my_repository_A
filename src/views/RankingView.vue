<template>
  <div class="page-wrapper">
    <div class="main-card">
      <header class="header">
        <span class="eyebrow">成绩分析工具</span>
        <h1 class="title">成绩定位工作台</h1>
        <p class="subtitle">导入联考成绩，按当前分数线和位次表进行参考换算</p>
      </header>

      <div class="tab-content">
        <div class="active-config-banner">
          <div class="config-heading"><span class="config-icon">📊</span><div><strong>当前换算依据</strong><small>{{ activeDb?.region }} · {{ activeDb?.year }} 年</small></div></div>
          <div class="banner-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <h3>分数线与排位表</h3>
              <span class="badge-red">估算参考</span>
            </div>
          </div>
          
          <div class="banner-info-row">
            <div class="info-block">
              <span class="info-label">一分一段表：</span>
              <span class="info-value" :class="{ 'is-custom': customRankTable.physics.length > 0 || customRankTable.history.length > 0 }">
                {{ (customRankTable.physics.length > 0 || customRankTable.history.length > 0) ? '已导入自定义表' : '广东2026内置默认表' }}
              </span>
              <span v-if="customRankTable.physics.length || customRankTable.history.length" class="rank-count">物理 {{ customRankTable.physics.length }} 条 · 历史 {{ customRankTable.history.length }} 条</span>
              <button v-if="customRankTable.physics.length || customRankTable.history.length" class="clear-rank-btn" type="button" @click="clearCustomRank">恢复默认表</button>
            </div>
            
            <div class="lines-display">
              <div class="line-group">
                <span class="subject-tag">物理 (赋分)</span>
                <span class="line-item">特控: <b>{{ activeDb?.config.physics.currTk }}</b></span>
                <span class="line-item">本科: <b>{{ activeDb?.config.physics.currBk }}</b></span>
                <span class="line-item">专科: <b>{{ activeDb?.config.physics.currZk }}</b></span>
              </div>
              <div class="line-group">
                <span class="subject-tag history">历史 (赋分)</span>
                <span class="line-item">特控: <b>{{ activeDb?.config.history.currTk }}</b></span>
                <span class="line-item">本科: <b>{{ activeDb?.config.history.currBk }}</b></span>
                <span class="line-item">专科: <b>{{ activeDb?.config.history.currZk }}</b></span>
              </div>
            </div>
          </div>
        </div>

        <details class="anchor-panel">
          <summary>可选：按学校比例设定本次联考控制线</summary>
          <p class="anchor-intro">如果学校只公布全校合并比例，选“全校合并”，不要伪拆成物理/历史率。比例线按合并成绩原始分及上传范围计算；合并模式的最高分只作总榜参考，不套用到单科成绩校准。</p>
          <div class="scope-mode">
            <label><input v-model="rateMode" type="radio" value="combined" /> 全校合并比例（不分科类）</label>
            <label><input v-model="rateMode" type="radio" value="separate" /> 分物理 / 历史分别设置</label>
          </div>
          <div v-if="rateMode === 'combined'" class="anchor-grid">
            <fieldset>
              <legend>全校合并</legend>
              <label>混合总榜目标最高分<input v-model.number="rateSettings.combined.targetMaxScore" type="number" min="1" max="750" step="1" placeholder="例如：650" /></label>
              <label>特控率（%）<input v-model.number="rateSettings.combined.specialRate" type="number" min="0" max="100" step="0.01" placeholder="15.18" /></label>
              <label>本科率（%）<input v-model.number="rateSettings.combined.bachelorRate" type="number" min="0" max="100" step="0.01" placeholder="72.20" /></label>
              <small>参考数据：特控 15.18%、本科 72.20%；学校统计 1133 人，约 172 / 818 人。需确认本次联考上传范围相同。</small>
              <small v-if="combinedStats.count">本次上传合并人数 {{ combinedStats.count }}；最高原始分 {{ combinedStats.highest }}</small>
            </fieldset>
          </div>
          <div v-else class="anchor-grid">
            <fieldset>
              <legend>物理类</legend>
              <label>目标换算最高分<input v-model.number="rateSettings.physics.targetMaxScore" type="number" min="1" max="750" step="1" placeholder="例如：650" /></label>
              <label>特控率（%）<input v-model.number="rateSettings.physics.specialRate" type="number" min="0" max="100" step="0.1" placeholder="例如：20" /></label>
              <label>本科率（%）<input v-model.number="rateSettings.physics.bachelorRate" type="number" min="0" max="100" step="0.1" placeholder="例如：65" /></label>
              <small v-if="currentMaxBySubject.physics">本次物理类人数 {{ subjectCounts.physics }}；最高原始分 {{ currentMaxBySubject.physics }}</small>
              <small v-else>上传成绩后自动统计物理类人数和最高分</small>
            </fieldset>
            <fieldset>
              <legend>历史类</legend>
              <label>目标换算最高分<input v-model.number="rateSettings.history.targetMaxScore" type="number" min="1" max="750" step="1" placeholder="例如：650" /></label>
              <label>特控率（%）<input v-model.number="rateSettings.history.specialRate" type="number" min="0" max="100" step="0.1" placeholder="例如：20" /></label>
              <label>本科率（%）<input v-model.number="rateSettings.history.bachelorRate" type="number" min="0" max="100" step="0.1" placeholder="例如：65" /></label>
              <small v-if="currentMaxBySubject.history">本次历史类人数 {{ subjectCounts.history }}；最高原始分 {{ currentMaxBySubject.history }}</small>
              <small v-else>上传成绩后自动统计历史类人数和最高分</small>
            </fieldset>
          </div>
          <div v-if="activeRateLines.combined" class="anchor-preview">
            全校合并：特控 {{ activeRateLines.combined.specialRate }}% / 第 {{ activeRateLines.combined.specialRank }} 名 / {{ activeRateLines.combined.specialScore }} 分；本科 {{ activeRateLines.combined.bachelorRate }}% / 第 {{ activeRateLines.combined.bachelorRank }} 名 / {{ activeRateLines.combined.bachelorScore }} 分。
          </div>
          <div v-if="rateMode === 'separate' && (rateLinePreview.physics || rateLinePreview.history)" class="anchor-preview">
            <span v-if="rateLinePreview.physics">物理：特控第 {{ rateLinePreview.physics.specialRank }} 名 / {{ rateLinePreview.physics.specialScore }} 分；本科第 {{ rateLinePreview.physics.bachelorRank }} 名 / {{ rateLinePreview.physics.bachelorScore }} 分。</span>
            <span v-if="rateLinePreview.history">历史：特控第 {{ rateLinePreview.history.specialRank }} 名 / {{ rateLinePreview.history.specialScore }} 分；本科第 {{ rateLinePreview.history.bachelorRank }} 名 / {{ rateLinePreview.history.bachelorScore }} 分。</span>
          </div>
          <p class="anchor-caution">目标人数按比例四舍五入到整数；同分会使实际达线比例略高。全校合并线表示混合科类总榜位置，不等价于物理线或历史线。确认本次参测范围与学校比例的统计范围一致。</p>
        </details>

        <div class="step-box">
          <div class="section-heading"><span class="step-number">01</span><div><h4>导入考试成绩</h4><p>支持 Excel、CSV，可一次选择多个文件</p></div></div>
          <label class="field-label" for="task-name">考试名称</label>
          <div class="form-group">
            <input id="task-name" type="text" v-model.trim="taskName" maxlength="80" placeholder="例如：2026 届高三一模" class="text-input" />
          </div>
          <div class="upload-row">
            <label class="upload-box score-upload">
              <span class="upload-icon">📄</span><strong>选择成绩表</strong>
              <small>支持 xlsx / xls / csv，可多选</small>
              <input type="file" @change="handleScoreUpload" accept=".xlsx,.xls,.csv" multiple />
            </label>
            <label class="upload-box rank-upload">
              <span class="upload-icon">📈</span><strong>导入自定义一分一段表</strong>
              <small>可选；文件名需包含“物理”或“历史”</small>
              <input type="file" @change="handleRankUpload" accept=".xlsx,.xls,.csv" multiple />
            </label>
          </div>
          <div v-if="scoreFiles.length" class="file-list">
            <div v-for="file in scoreFiles" :key="file.fileName" class="file-row">
              <span>✓ {{ file.fileName }}</span><span>{{ file.students.length }} 位考生</span>
            </div>
            <div class="file-total">共 {{ studentCount }} 位考生</div>
          </div>
          <div v-if="unknownSubjectCount" class="subject-warning">
            {{ unknownSubjectCount }} 位考生无法从选科或班级字段识别科类；当前暂按“{{ fallbackSubjectLabel }}”计算。
            <label>按<select v-model="fallbackSubject"><option value="physics">物理</option><option value="history">历史</option></select>类处理</label>
          </div>

          <button class="primary-btn" @click="calculateAndSaveTask" :disabled="!scoreFiles.length || !taskName || calculating">
            {{ calculating ? '正在换算…' : '开始换算' }} <span aria-hidden="true">→</span>
          </button>
          <p class="privacy-note">成绩仅在当前浏览器处理；计算历史保存在本机。请勿在公用设备保留学生信息。</p>
        </div>

        <div v-if="historyRecords.length > 0" class="step-box history-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="margin: 0;">📜 历史计算记录 (保存在本地)</h4>
            <button class="outline-btn" style="color: #ef4444; border-color: #fecaca;" @click="clearHistory">🗑️ 清空所有历史</button>
          </div>
          <div class="history-list">
            <div v-for="(rec, idx) in historyRecords" :key="idx" class="history-item" @click="loadHistory(rec)">
              <span>{{ rec.name }}</span>
              <span style="font-size: 12px; color: #94a3b8;">{{ rec.date }}</span>
            </div>
          </div>
        </div>

        <div v-if="currentViewResult" class="batch-result">
          <div class="result-header">
            <div><span class="eyebrow">换算完成</span><h3>结果预览：{{ currentViewResult.name }}</h3><p>{{ currentViewResult.data.length }} 位考生 · 展示前 50 条</p></div>
            <div class="result-actions"><button class="outline-btn" @click="currentViewResult = null">关闭</button><button class="outline-btn export-btn" @click="exportExcel">导出 Excel ↓</button></div>
          </div>
          <div class="result-stats"><div><span>考生人数</span><strong>{{ currentViewResult.data.length }}</strong></div><div><span>物理类</span><strong>{{ currentViewResult.data.filter(item => item.resolvedSubject === 'physics').length }}</strong></div><div><span>历史类</span><strong>{{ currentViewResult.data.filter(item => item.resolvedSubject === 'history').length }}</strong></div><div><span>分数异常</span><strong>{{ currentViewResult.data.filter(item => item.lineType === '分数异常').length }}</strong></div></div>
          <div v-if="currentViewResult.rateLines?.combined || currentViewResult.rateLines?.physics || currentViewResult.rateLines?.history" class="rate-result-summary">
            <strong>{{ currentViewResult.rateMode === 'combined' ? '全校合并比例线（混合科类原始分总榜，仅作参考）' : '分科比例控制线（科类内原始分排名）' }}</strong>
            <span v-if="currentViewResult.rateLines.combined">本次共 {{ currentViewResult.rateLines.combined.count }} 人；特控 {{ currentViewResult.rateLines.combined.specialRate }}% / 第 {{ currentViewResult.rateLines.combined.specialRank }} 名 / {{ currentViewResult.rateLines.combined.specialScore }} 分；本科 {{ currentViewResult.rateLines.combined.bachelorRate }}% / 第 {{ currentViewResult.rateLines.combined.bachelorRank }} 名 / {{ currentViewResult.rateLines.combined.bachelorScore }} 分</span>
            <span v-if="currentViewResult.rateLines.physics">物理：特控 {{ currentViewResult.rateLines.physics.specialRate }}% / 第 {{ currentViewResult.rateLines.physics.specialRank }} 名 / {{ currentViewResult.rateLines.physics.specialScore }} 分；本科 {{ currentViewResult.rateLines.physics.bachelorRate }}% / 第 {{ currentViewResult.rateLines.physics.bachelorRank }} 名 / {{ currentViewResult.rateLines.physics.bachelorScore }} 分</span>
            <span v-if="currentViewResult.rateLines.history">历史：特控 {{ currentViewResult.rateLines.history.specialRate }}% / 第 {{ currentViewResult.rateLines.history.specialRank }} 名 / {{ currentViewResult.rateLines.history.specialScore }} 分；本科 {{ currentViewResult.rateLines.history.bachelorRate }}% / 第 {{ currentViewResult.rateLines.history.bachelorRank }} 名 / {{ currentViewResult.rateLines.history.bachelorScore }} 分</span>
          </div>
          <div class="table-tools"><input v-model="resultKeyword" type="search" placeholder="搜索姓名或班级" aria-label="搜索结果" /><select v-model="resultSubject" aria-label="筛选科类"><option value="all">全部科类</option><option value="physics">物理类</option><option value="history">历史类</option></select><span>显示 {{ filteredResults.length }} / {{ currentViewResult.data.length }} 人</span></div>
          <div class="table-scroll"><table>
            <thead>
              <tr>
                <th>校排</th><th>姓名</th><th>班级</th><th>原表选科</th><th>判定科类</th><th>原始分</th><th>换算分</th><th>比例线</th><th>高分段额外校准（分）</th><th>全省排位</th><th>所在线类</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in filteredResults.slice(0, 100)" :key="`${item.name}-${idx}`">
                <td>{{ Number.isFinite(Number(item.schoolRank)) && Number(item.schoolRank) > 0 ? item.schoolRank : '—' }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.className || '—' }}</td>
                <td>{{ item.subject || '—' }}</td>
                <td><span class="subject-tag" :class="item.resolvedSubject">{{ item.resolvedSubject === 'physics' ? '物理' : '历史' }}</span></td>
                <td>{{ item.originalScore }}</td>
                <td class="highlight">{{ item.convertedScore }}</td>
                <td>{{ item.rateLineType || '—' }}</td>
                <td>{{ Number(item.anchorAdjustment || 0).toFixed(1) }}</td>
                <td>{{ item.rank }}</td>
                <td><span class="line-pill" :class="item.lineType === '未上线' ? 'muted' : ''">{{ item.lineType }}</span></td>
              </tr>
            </tbody>
          </table></div>
          <p v-if="filteredResults.length > 100" class="table-note">结果表仅显示前 100 条，请导出 Excel 查看完整数据。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import * as XLSX from 'xlsx'
// 🚨 这里的引入没有变
import { DEFAULT_DATABASES, BUILT_IN_GD_2026 } from '@/utils/calcConfig.js'
import { parseScoreExcel, parseRankExcel, findRank } from '@/utils/calcLogic.js'

const databases = ref([])
const scoreFiles = ref([]) 
const taskName = ref('')
const customRankTable = ref({ physics: [], history: [] })
const currentViewResult = ref(null)
const historyRecords = ref([])
const calculating = ref(false)
const fallbackSubject = ref('physics')
const rateMode = ref('combined')
const rateSettings = ref({
  combined: { targetMaxScore: 650, specialRate: 15.18, bachelorRate: 72.20 },
  physics: { targetMaxScore: '', specialRate: '', bachelorRate: '' },
  history: { targetMaxScore: '', specialRate: '', bachelorRate: '' }
})
const subjectStats = computed(() => {
  const values = { physics: [], history: [] }
  for (const student of scoreFiles.value.flatMap(file => file.students)) {
    const subject = resolveSubject(student) || fallbackSubject.value
    const score = Number(student.originalScore)
    if (Number.isFinite(score) && score > 0) values[subject].push(score)
  }
  const stats = {}
  for (const subject of ['physics', 'history']) {
    const ordered = values[subject].sort((a, b) => b - a)
    stats[subject] = {
      count: ordered.length,
      highest: ordered.length ? ordered[0] : null,
      ordered
    }
  }
  return stats
})
const subjectCounts = computed(() => ({ physics: subjectStats.value.physics.count, history: subjectStats.value.history.count }))
const currentMaxBySubject = computed(() => ({ physics: subjectStats.value.physics.highest, history: subjectStats.value.history.highest }))
const combinedStats = computed(() => {
  const scores = [...subjectStats.value.physics.ordered, ...subjectStats.value.history.ordered].sort((a, b) => b - a)
  return { count: scores.length, highest: scores.length ? scores[0] : null, ordered: scores }
})
const combinedRateLines = computed(() => {
  const setting = rateSettings.value.combined
  const count = combinedStats.value.count
  const specialRate = Number(setting.specialRate)
  const bachelorRate = Number(setting.bachelorRate)
  const maxScore = Number(setting.targetMaxScore)
  if (!count || !Number.isFinite(specialRate) || !Number.isFinite(bachelorRate) || specialRate <= 0 || specialRate > bachelorRate || bachelorRate > 100 || !Number.isFinite(maxScore) || maxScore <= 0 || maxScore > 750) return null
  const specialRank = Math.max(1, Math.round(count * specialRate / 100))
  const bachelorRank = Math.max(specialRank, Math.round(count * bachelorRate / 100))
  const minimumTk = Math.min(activeDb.value?.config?.physics?.currTk ?? Infinity, activeDb.value?.config?.history?.currTk ?? Infinity)
  if (combinedStats.value.highest <= minimumTk || maxScore <= minimumTk) return null
  return {
    count, specialRate, bachelorRate, targetMaxScore: maxScore,
    specialRank, specialScore: combinedStats.value.ordered[specialRank - 1],
    bachelorRank, bachelorScore: combinedStats.value.ordered[bachelorRank - 1]
  }
})
const activeRateLines = computed(() => rateMode.value === 'combined'
  ? { combined: combinedRateLines.value }
  : rateLinePreview.value
)
const subjectRateScores = computed(() => {
  const rates = {}
  for (const subject of ['physics', 'history']) {
    const setting = rateSettings.value[subject]
    const count = subjectStats.value[subject].count
    const specialRate = Number(setting.specialRate)
    const bachelorRate = Number(setting.bachelorRate)
    if (!count || !Number.isFinite(specialRate) || !Number.isFinite(bachelorRate) || specialRate <= 0 || bachelorRate < specialRate || bachelorRate > 100) continue
    const specialRank = Math.max(1, Math.round(count * specialRate / 100))
    const bachelorRank = Math.max(specialRank, Math.round(count * bachelorRate / 100))
    rates[subject] = {
      count,
      specialRate,
      specialRank,
      specialScore: subjectStats.value[subject].ordered[specialRank - 1],
      bachelorRate,
      bachelorRank,
      bachelorScore: subjectStats.value[subject].ordered[bachelorRank - 1]
    }
  }
  return rates
})
const rateLinePreview = computed(() => {
  const preview = {}
  for (const subject of ['physics', 'history']) {
    const config = rateSettings.value[subject]
    const stats = subjectStats.value[subject]
    const rateLines = subjectRateScores.value[subject]
    const maxScore = Number(config.targetMaxScore)
    if (!rateLines || !stats.count || !Number.isFinite(maxScore) || maxScore <= 0 || maxScore > 750) continue
    preview[subject] = { ...rateLines, targetMaxScore: maxScore }
  }
  return preview
})
const resultKeyword = ref('')
const resultSubject = ref('all')
const studentCount = computed(() => scoreFiles.value.reduce((sum, file) => sum + file.students.length, 0))
const unknownSubjectCount = computed(() => scoreFiles.value.flatMap(file => file.students).filter(student => !resolveSubject(student)).length)
const fallbackSubjectLabel = computed(() => fallbackSubject.value === 'physics' ? '物理' : '历史')
const filteredResults = computed(() => {
  if (!currentViewResult.value) return []
  const query = resultKeyword.value.trim().toLocaleLowerCase()
  return currentViewResult.value.data.filter(item => {
    const subjectMatch = resultSubject.value === 'all' || item.resolvedSubject === resultSubject.value
    const queryMatch = !query || `${item.name || ''} ${item.className || ''}`.toLocaleLowerCase().includes(query)
    return subjectMatch && queryMatch
  })
})

const rateSettingConfigured = (subjectKey) => {
  const setting = rateSettings.value[subjectKey]
  return [setting.targetMaxScore, setting.specialRate, setting.bachelorRate].some(value => value !== '')
}
const combinedRateSettingConfigured = computed(() => ['targetMaxScore', 'specialRate', 'bachelorRate']
  .some(key => rateSettings.value.combined[key] !== '' && rateSettings.value.combined[key] !== null))
const validCombinedRateSetting = computed(() => Boolean(combinedRateLines.value))

const validRateSetting = (subjectKey) => {
  const setting = rateSettings.value[subjectKey]
  const maxScore = Number(setting.targetMaxScore)
  const specialRate = Number(setting.specialRate)
  const bachelorRate = Number(setting.bachelorRate)
  const stats = subjectStats.value[subjectKey]
  const currentMax = stats.highest
  const currentTk = (subjectKey === 'physics' ? activeDb.value?.config?.physics : activeDb.value?.config?.history)?.currTk
  return Boolean(stats.count) &&
    Number.isFinite(maxScore) && maxScore > 0 && maxScore <= 750 &&
    Number.isFinite(specialRate) && Number.isFinite(bachelorRate) &&
    specialRate > 0 && specialRate <= bachelorRate && bachelorRate <= 100 &&
    Number.isFinite(currentMax) && Number.isFinite(currentTk) && currentMax > currentTk && maxScore > currentTk &&
    Boolean(rateLinePreview.value[subjectKey])
}

const resolveSubject = (student) => {
  const subject = String(student.subject || '')
  if (/物理|物/.test(subject)) return 'physics'
  if (/历史|历/.test(subject)) return 'history'
  const className = String(student.className || '')
  if (/物理/.test(className) || /21/.test(className)) return 'physics'
  if (/历史/.test(className) || /22/.test(className)) return 'history'
  return null
}

const activeDb = computed(() => databases.value[0])

onMounted(() => {
  try {
    const savedRateSettings = localStorage.getItem('score_locator_rate_settings_v1')
    if (savedRateSettings) {
      const parsedSettings = JSON.parse(savedRateSettings)
      if (parsedSettings?.combined) rateSettings.value.combined = { ...rateSettings.value.combined, ...parsedSettings.combined }
      if (['combined', 'separate'].includes(parsedSettings?.mode)) rateMode.value = parsedSettings.mode
      for (const subject of ['physics', 'history']) {
        if (parsedSettings?.[subject]) rateSettings.value[subject] = { ...rateSettings.value[subject], ...parsedSettings[subject] }
      }
    }
  } catch {
    localStorage.removeItem('score_locator_rate_settings_v1')
  }

  try {
    const savedDbs = localStorage.getItem('score_locator_databases_v3')
    if (savedDbs) {
      databases.value = JSON.parse(savedDbs)
    } else {
      databases.value = JSON.parse(JSON.stringify(DEFAULT_DATABASES))
    }
  } catch (e) {
    databases.value = JSON.parse(JSON.stringify(DEFAULT_DATABASES))
    localStorage.removeItem('score_locator_databases_v3')
  }

  try {
    const savedHistory = localStorage.getItem('score_locator_history_v3')
    if (savedHistory) {
      historyRecords.value = JSON.parse(savedHistory)
    }
  } catch (e) {
    historyRecords.value = []
    localStorage.removeItem('score_locator_history_v3')
  }
})

watch([rateSettings, rateMode], ([value, mode]) => {
  try {
    localStorage.setItem('score_locator_rate_settings_v1', JSON.stringify({ ...value, mode }))
  } catch {
    // Settings remain usable for the current session if browser storage is unavailable.
  }
}, { deep: true })

const saveHistory = () => {
  try {
    if (historyRecords.value.length > 5) {
      historyRecords.value = historyRecords.value.slice(0, 5)
    }
    localStorage.setItem('score_locator_history_v3', JSON.stringify(historyRecords.value))
  } catch (e) {
    alert('⚠️ 本地存储空间已满，无法保存最新历史记录，请清理历史或导出数据。')
  }
}

const clearCustomRank = () => {
  customRankTable.value = { physics: [], history: [] }
}

const clearHistory = () => {
  if (!confirm('确定要清空所有本地历史记录吗？此操作不可逆。')) return
  historyRecords.value = []
  localStorage.removeItem('score_locator_history_v3')
  alert('历史记录已清空')
}

const handleScoreUpload = async (e) => {
  const files = e.target.files
  if (!files || files.length === 0) return
  try {
    const parsed = await parseScoreExcel(files)
    if (!parsed.length || parsed.every(file => file.students.length === 0)) {
      throw new Error('没有解析到考生记录，请检查表头是否包含姓名和总分。')
    }
    scoreFiles.value = parsed
    currentViewResult.value = null
  } catch (err) {
    alert(`读取失败：${err.message}`)
  } finally {
    e.target.value = ''
  }
}

const handleRankUpload = async (e) => {
  const files = e.target.files
  if (!files || files.length === 0) return
  try {
    const parsed = await parseRankExcel(files)
    if (parsed.physics.length === 0 && parsed.history.length === 0) {
      throw new Error('未识别到排位数据。文件名或前五行请注明物理/历史，且 A 列为分数、F 列为排位。')
    }
    customRankTable.value = parsed
    currentViewResult.value = null
  } catch (err) { 
    alert(`读取失败：${err.message}`) 
  } finally { 
    e.target.value = '' 
  }
}

const calculateAndSaveTask = () => {
  if (calculating.value) return
  if (!taskName.value) return alert('请输入考试名称')
  const db = activeDb.value
  if (!db?.config) return alert('没有可用的换算配置')
  const rules = db.config
  const allStudents = scoreFiles.value.flatMap(f => f.students)
  if (allStudents.length === 0) return alert('成绩单中没有有效考生数据')
  if (rateMode.value === 'combined' && combinedRateSettingConfigured.value && !validCombinedRateSetting.value) {
    return alert('全校合并比例设置无效：请检查合并人数、最高换算分及特控率/本科率。')
  }
  if (rateMode.value === 'separate') {
    for (const [key, label] of [['physics', '物理类'], ['history', '历史类']]) {
      if (rateSettingConfigured(key) && !validRateSetting(key)) {
        return alert(`${label}设置无效：请确认已上传该科类成绩，目标最高分在 1–750 之间，特控率大于 0 且不高于本科率，本科率不超过 100%。`)
      }
    }
  }

  calculating.value = true
  try {
  let processed = allStudents.map(student => {
    const resolvedSubject = resolveSubject(student) || fallbackSubject.value
    const isPhysics = resolvedSubject === 'physics'
    const rule = isPhysics ? rules.physics : rules.history
    if (!rule) throw new Error(`缺少${isPhysics ? '物理' : '历史'}类分数线配置`)
    
    let table = isPhysics ? customRankTable.value.physics : customRankTable.value.history
    if (table.length === 0) table = isPhysics ? BUILT_IN_GD_2026.physics : BUILT_IN_GD_2026.history
    if (!table.length) throw new Error(`没有可用于${isPhysics ? '物理' : '历史'}类的排位表`)
    if (!Number.isFinite(Number(student.originalScore)) || Number(student.originalScore) <= 0) {
      return { ...student, resolvedSubject, convertedScore: '-', rank: '-', lineType: '分数异常', diff: '-' }
    }

    const diffTK = rule.lastTk - rule.currTk 
    const diffBK = rule.lastBk - rule.currBk 
    const gapCurr_TK_BK = rule.currTk - rule.currBk 
    const slope = gapCurr_TK_BK === 0 ? 0 : (Math.abs(diffTK) - Math.abs(diffBK)) / gapCurr_TK_BK

    const s = Number(student.originalScore)
    let convertS = s, lineType = '未上线', currentDiff = 0, anchorAdjustment = 0

    const configuredByRate = rateMode.value === 'combined'
      ? combinedRateSettingConfigured.value
      : rateSettingConfigured(resolvedSubject)
    const rateLine = rateMode.value === 'combined' ? combinedRateLines.value : rateLinePreview.value[resolvedSubject]
    const targetMaxScore = rateMode.value === 'combined'
      ? rateSettings.value.combined.targetMaxScore
      : rateSettings.value[resolvedSubject].targetMaxScore

    if (configuredByRate && !(rateMode.value === 'combined' ? validCombinedRateSetting.value : validRateSetting(resolvedSubject))) {
      throw new Error(`${rateMode.value === 'combined' ? '全校合并' : (isPhysics ? '物理' : '历史')}比例设置无效，请检查人数、分数和比例。`)
    }

    if (s >= rule.currTk) {
      currentDiff = diffTK
      const currentMaximum = rateMode.value === 'combined' ? combinedStats.value.highest : currentMaxBySubject.value[resolvedSubject]

      if (configuredByRate && rateMode.value === 'separate') {
        const topCorrection = Number(targetMaxScore) - currentMaximum
        const progress = currentMaximum > rule.currTk
          ? Math.min(1, Math.max(0, (s - rule.currTk) / (currentMaximum - rule.currTk)))
          : 0
        currentDiff = diffTK + (topCorrection - diffTK) * progress
        anchorAdjustment = currentDiff - diffTK
        convertS = s + currentDiff
        if (rateLine && s >= rateLine.specialScore) lineType = '特控线'
        else lineType = '特控线以下'
      } else {
        convertS = s + currentDiff
        lineType = '特控线'
      }
    } else if (s >= rule.currBk) {
      const distFromTK = rule.currTk - s 
      convertS = s + diffTK + (distFromTK * slope)
      lineType = '本科线'
    } else if (s >= rule.currZk) {
      currentDiff = rule.lastZk - rule.currZk
      convertS = s + currentDiff
      lineType = '专科线'
    } else {
      convertS = s
      lineType = '未上线'
    }

    if (configuredByRate && rateLine && rateMode.value === 'separate') {
      if (convertS >= rateLine.specialScore) lineType = '特控线'
      else if (convertS >= rateLine.bachelorScore) lineType = '本科线'
      else lineType = '本科线以下'
    }

    convertS = Math.round(convertS)
    let matchRank = findRank(convertS, table)
    const rateLineType = rateMode.value === 'combined' && combinedRateLines.value
      ? (s >= combinedRateLines.value.specialScore ? '全校特控比例线' : s >= combinedRateLines.value.bachelorScore ? '全校本科比例线' : '未达全校本科比例线')
      : configuredByRate ? lineType : ''

    return { ...student, resolvedSubject, convertedScore: convertS, rank: matchRank, lineType, diff: currentDiff, anchorAdjustment, rateLineType }
  })

  processed.sort((a, b) => {
    const rankA = Number(a.schoolRank)
    const rankB = Number(b.schoolRank)
    const hasRankA = Number.isFinite(rankA) && rankA > 0
    const hasRankB = Number.isFinite(rankB) && rankB > 0
    if (!hasRankA && !hasRankB) return 0
    if (!hasRankA) return 1
    if (!hasRankB) return -1
    return rankA - rankB
  })

  const rateSettingsSnapshot = JSON.parse(JSON.stringify(rateSettings.value))
  const rateModeSnapshot = rateMode.value
  const rateLinesSnapshot = rateModeSnapshot === 'combined'
    ? { combined: JSON.parse(JSON.stringify(combinedRateLines.value)) }
    : JSON.parse(JSON.stringify(rateLinePreview.value))
  const subjectCountsSnapshot = {
    physics: subjectStats.value.physics.count,
    history: subjectStats.value.history.count,
    combined: combinedStats.value.count
  }
  currentViewResult.value = { name: taskName.value, data: processed, rateMode: rateModeSnapshot, rateSettings: rateSettingsSnapshot, rateLines: rateLinesSnapshot, subjectCounts: subjectCountsSnapshot }
  
  historyRecords.value.unshift({
    name: taskName.value,
    date: new Date().toLocaleString(),
    data: processed,
    rateMode: rateModeSnapshot,
    rateSettings: rateSettingsSnapshot,
    rateLines: rateLinesSnapshot,
    subjectCounts: subjectCountsSnapshot
  })
  saveHistory()

  alert(`换算完成，共处理 ${processed.length} 位考生；历史记录已保存到本地。`)
  } catch (error) {
    alert(`换算失败：${error.message}`)
  } finally {
    calculating.value = false
  }
}

const loadHistory = (rec) => {
  currentViewResult.value = rec
  taskName.value = rec.name
  resultKeyword.value = ''
  resultSubject.value = 'all'
}

const exportExcel = () => {
  if (!currentViewResult.value) return
  try {
    const workbook = XLSX.utils.book_new()
    const formatRow = (r) => ({
      '校排': Number.isFinite(Number(r.schoolRank)) && Number(r.schoolRank) > 0 ? r.schoolRank : '—', '姓名': r.name, '班级': r.className || '—', '原表选科': r.subject || '—', '判定科类': r.resolvedSubject === 'physics' ? '物理' : r.resolvedSubject === 'history' ? '历史' : '未知', '原始总分': r.originalScore, 
      '换算高考分': r.convertedScore, '目标比例线': r.rateLineType || '', '高分段额外校准(分)': Number(r.anchorAdjustment || 0).toFixed(1), '全省排位': r.rank, '所在层次': r.lineType
    })
    const rateRows = currentViewResult.value.rateMode === 'combined'
      ? [{
          '模式': '全校合并（不分物理/历史）',
          '统计口径': '仅为混合科类总榜参考，不代表物理/历史单科线；同分会影响实际比例',
          '本次合并人数': currentViewResult.value.rateLines?.combined?.count ?? currentViewResult.value.subjectCounts?.combined ?? '',
          '学校参考总人数': 1133,
          '特控率(%)': currentViewResult.value.rateSettings?.combined?.specialRate ?? '',
          '特控目标名次': currentViewResult.value.rateLines?.combined?.specialRank ?? '',
          '特控线原始分': currentViewResult.value.rateLines?.combined?.specialScore ?? '',
          '学校公布特控人数(参考)': 172,
          '本科率(%)': currentViewResult.value.rateSettings?.combined?.bachelorRate ?? '',
          '本科目标名次': currentViewResult.value.rateLines?.combined?.bachelorRank ?? '',
          '本科线原始分': currentViewResult.value.rateLines?.combined?.bachelorScore ?? '',
          '学校公布本科人数(参考)': 818,
          '混合总榜目标最高分（不用于单科校准）': currentViewResult.value.rateSettings?.combined?.targetMaxScore ?? ''
        }]
      : ['physics', 'history'].map((key) => {
      const line = currentViewResult.value.rateLines?.[key]
      const settings = currentViewResult.value.rateSettings?.[key]
      return {
        '科类': key === 'physics' ? '物理类' : '历史类',
        '统计口径': '按本次上传成绩原始分排名；同分可能使实际比例略高',
        '导入人数': currentViewResult.value.subjectCounts?.[key] ?? currentViewResult.value.data.filter(row => row.resolvedSubject === key).length,
        '设定最高换算分': settings?.targetMaxScore ?? '',
        '特控率(%)': settings?.specialRate ?? '',
        '特控目标名次': line?.specialRank ?? '',
        '特控实际达线人数': line ? currentViewResult.value.data.filter(row => row.resolvedSubject === key && Number(row.originalScore) >= line.specialScore).length : '',
        '特控线原始分': line?.specialScore ?? '',
        '本科率(%)': settings?.bachelorRate ?? '',
        '本科目标名次': line?.bachelorRank ?? '',
        '本科实际达线人数': line ? currentViewResult.value.data.filter(row => row.resolvedSubject === key && Number(row.originalScore) >= line.bachelorScore).length : '',
        '本科线原始分': line?.bachelorScore ?? ''
      }
    })
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(currentViewResult.value.data.map(formatRow)), "换算结果")
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rateRows), "比例控制线")
    XLSX.writeFile(workbook, `${currentViewResult.value.name.replace(/[\\\\/:*?\"<>|]/g, '_')}_成绩换算表.xlsx`)
  } catch (err) {
    alert('导出失败，可能是浏览器限制或数据过大：' + err.message)
  }
}
</script>

<style scoped>
.page-wrapper { min-height: calc(100vh - 60px); padding: 34px 16px 56px; background: radial-gradient(circle at 12% 0%, #e7f0ff 0, transparent 30%), #f5f7fb; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; }
.main-card { width: min(1040px, 100%); box-sizing: border-box; margin: 0 auto; padding: clamp(20px, 4vw, 42px); border: 1px solid #eef0f4; border-radius: 24px; background: #fff; box-shadow: 0 18px 50px #1f29370d; }
.header { margin-bottom: 28px; }
.eyebrow { color: #2563eb; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.title { margin: 8px 0; color: #172033; font-size: clamp(26px, 4vw, 36px); font-weight: 800; }
.subtitle { margin: 0; color: #667085; font-size: 15px; line-height: 1.7; }
.active-config-banner { margin-bottom: 22px; padding: 20px; border: 1px solid #dbeafe; border-radius: 16px; background: linear-gradient(135deg, #f0f6ff, #f9fbff); }
.config-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.config-icon { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 12px; background: white; font-size: 21px; }
.config-heading strong, .config-heading small { display: block; }
.config-heading strong { color: #172033; font-size: 15px; }
.config-heading small { margin-top: 3px; color: #667085; font-size: 12px; }
.banner-header { margin-bottom: 12px; }
.banner-header h3 { margin: 0; color: #344054; font-size: 13px; }
.badge-red { padding: 4px 9px; border-radius: 20px; background: #fff7ed; color: #c2410c; font-size: 11px; }
.banner-info-row { display: flex; flex-direction: column; gap: 12px; }
.info-block { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 13px; }
.info-label { color: #667085; }
.info-value { padding: 4px 9px; border-radius: 6px; background: #dbeafe; color: #1d4ed8; font-weight: 700; }
.info-value.is-custom { background: #d1fae5; color: #047857; }
.rank-count { color: #667085; font-size: 12px; }
.clear-rank-btn { padding: 0; border: 0; background: transparent; color: #b42318; font-size: 12px; cursor: pointer; }
.lines-display { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.line-group { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px; border: 1px solid #e4e7ec; border-radius: 10px; background: white; font-size: 12px; }
.subject-tag { padding: 4px 8px; border-radius: 6px; background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700; }
.subject-tag.history { background: #ecfdf3; color: #027a48; }
.subject-tag.physics { background: #eff6ff; color: #1d4ed8; }
.line-item { color: #667085; }
.line-item b { color: #172033; font-size: 13px; }
.step-box { margin-bottom: 18px; padding: clamp(16px, 3vw, 24px); border: 1px solid #eaecf0; border-radius: 16px; background: #fff; }
.anchor-panel { margin-bottom: 18px; padding: 18px 20px; border: 1px solid #fedf89; border-radius: 14px; background: #fffcf5; }
.anchor-panel summary { color: #93370d; font-size: 14px; font-weight: 800; cursor: pointer; }
.anchor-intro, .anchor-caution { color: #7a2e0e; font-size: 12px; line-height: 1.7; }
.anchor-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.anchor-grid fieldset { display: grid; gap: 10px; min-width: 0; padding: 14px; border: 1px solid #f3d08a; border-radius: 10px; background: white; }
.anchor-grid legend { padding: 0 6px; color: #344054; font-size: 13px; font-weight: 800; }
.anchor-grid label { display: grid; gap: 5px; color: #667085; font-size: 11px; }
.anchor-grid input { min-width: 0; padding: 8px 9px; border: 1px solid #d0d5dd; border-radius: 7px; font-size: 13px; }
.anchor-grid small { color: #667085; font-size: 11px; }
.anchor-caution { margin-bottom: 0; }
.anchor-preview { margin-top: 8px; padding: 9px 11px; border-radius: 8px; background: #ecfdf3; color: #027a48; font-size: 12px; }
.section-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.section-heading h4 { margin: 0; color: #172033; font-size: 17px; }
.section-heading p { margin: 4px 0 0; color: #667085; font-size: 12px; }
.step-number { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 12px; background: #eff6ff; color: #2563eb; font-size: 13px; font-weight: 800; }
.field-label { display: block; margin-bottom: 7px; color: #344054; font-size: 13px; font-weight: 700; }
.text-input { width: 100%; box-sizing: border-box; margin-bottom: 18px; padding: 12px 14px; border: 1px solid #d0d5dd; border-radius: 10px; outline: none; font-size: 14px; }
.text-input:focus { border-color: #528bff; box-shadow: 0 0 0 3px #dbeafe; }
.upload-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.upload-box { display: flex; min-height: 128px; box-sizing: border-box; flex-direction: column; align-items: center; justify-content: center; gap: 7px; border: 1px dashed #cbd5e1; border-radius: 12px; background: #fbfcfe; text-align: center; cursor: pointer; transition: .2s; }
.upload-box:hover { border-color: #528bff; background: #f5f8ff; }
.upload-icon { font-size: 22px; }
.upload-box strong { color: #344054; font-size: 13px; }
.upload-box small { color: #667085; font-size: 11px; }
.upload-box input { width: min(220px, 90%); font-size: 11px; }
.file-list { display: grid; gap: 7px; margin: 14px 0; padding: 12px; border-radius: 10px; background: #f8fafc; }
.file-row, .file-total { display: flex; justify-content: space-between; gap: 10px; color: #475467; font-size: 12px; }
.file-total { padding-top: 8px; border-top: 1px solid #e4e7ec; color: #172033; font-weight: 700; }
.subject-warning { margin: 14px 0; padding: 12px; border: 1px solid #fedf89; border-radius: 10px; background: #fffcf5; color: #93370d; font-size: 12px; line-height: 1.6; }
.subject-warning label { display: inline-flex; align-items: center; gap: 6px; margin-left: 6px; }
.subject-warning select { padding: 4px; border: 1px solid #fdb022; border-radius: 5px; background: #fff; }
.primary-btn { display: flex; width: 100%; min-height: 48px; align-items: center; justify-content: center; gap: 8px; margin-top: 14px; border: 0; border-radius: 10px; background: linear-gradient(100deg, #2563eb, #4f46e5); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 6px 14px #2563eb30; }
.primary-btn:disabled { background: #98a2b3; box-shadow: none; cursor: not-allowed; }
.privacy-note { margin: 10px 0 0; color: #98a2b3; font-size: 11px; text-align: center; }
.outline-btn { padding: 9px 12px; border: 1px solid #d0d5dd; border-radius: 8px; background: #fff; color: #344054; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
.export-btn { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.history-box > div:first-child { gap: 12px; flex-wrap: wrap; }
.history-box h4 { color: #172033; font-size: 15px; }
.history-list { display: flex; max-height: 230px; flex-direction: column; gap: 8px; overflow-y: auto; }
.history-item { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid #eaecf0; border-radius: 9px; background: #fff; color: #344054; cursor: pointer; transition: .18s; font-size: 13px; }
.history-item:hover { border-color: #bfdbfe; background: #f5f8ff; }
.batch-result { margin-top: 24px; padding: clamp(16px, 3vw, 24px); border: 1px solid #dbeafe; border-radius: 16px; background: #fff; }
.result-header { display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 16px; }
.result-header h3 { margin: 4px 0; color: #172033; font-size: 18px; }
.result-header p { margin: 0; color: #667085; font-size: 12px; }
.result-actions { display: flex; gap: 8px; }
.result-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; }
.result-stats div { padding: 12px; border-radius: 10px; background: #f8fafc; }
.result-stats span, .result-stats strong { display: block; }
.result-stats span { color: #667085; font-size: 11px; }
.result-stats strong { margin-top: 6px; color: #172033; font-size: 20px; }
.table-tools { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
.table-tools input, .table-tools select { min-height: 36px; padding: 7px 10px; border: 1px solid #d0d5dd; border-radius: 8px; background: white; color: #344054; font-size: 12px; }
.table-tools input { flex: 1; min-width: 120px; }
.table-tools span { color: #667085; font-size: 11px; white-space: nowrap; }
.table-scroll { overflow-x: auto; border: 1px solid #eaecf0; border-radius: 10px; }
table { width: 100%; min-width: 720px; border-collapse: collapse; text-align: center; }
th, td { padding: 11px 10px; border-bottom: 1px solid #eaecf0; font-size: 12px; white-space: nowrap; }
th { position: sticky; top: 0; background: #f8fafc; color: #667085; font-weight: 700; }
td { color: #344054; }
tbody tr:hover { background: #f8fafc; }
.highlight { color: #1d4ed8; font-weight: 800; }
.line-pill { padding: 4px 8px; border-radius: 20px; background: #ecfdf3; color: #027a48; font-size: 11px; }
.line-pill.muted { background: #f2f4f7; color: #667085; }
.table-note { color: #667085; font-size: 12px; text-align: center; }
@media (max-width: 680px) { .page-wrapper { padding: 18px 10px 32px; } .main-card { padding: 18px 14px; border-radius: 16px; } .lines-display, .upload-row, .anchor-grid { grid-template-columns: 1fr; } .result-stats { grid-template-columns: repeat(2, 1fr); } .result-header { align-items: flex-start; flex-direction: column; } .table-tools { flex-wrap: wrap; } .history-item { align-items: flex-start; flex-direction: column; gap: 4px; } }
</style>