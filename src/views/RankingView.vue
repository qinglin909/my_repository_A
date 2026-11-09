<template>
  <div class="page-wrapper">
    <div class="main-card">
      <div class="header">
        <h1 class="title">
          <span class="icon">🎯</span> 成绩定位工作台
        </h1>
        <p class="subtitle">多地区 / 多年份 / 多批次批量处理系统</p>
      </div>

      <div class="tab-content">
        
        <!-- 🌟 顶部醒目显示：当前使用的分数线和一分一段表 -->
        <div class="active-config-banner">
          <div class="banner-header">
            <div style="display: flex; align-items: center; gap: 12px;">
              <h3>📌 当前生效的换算依据</h3>
              <span class="badge-red">均使用赋分线</span>
            </div>
            <div class="banner-controls">
              <select v-model="selectedDbId" class="year-select-mini">
                <option v-for="db in databases" :key="db.id" :value="db.id">
                  {{ db.region }} - {{ db.year }} 年
                </option>
              </select>
              <button class="text-btn" @click="openEditConfigModal(selectedDbId)">✏️ 修改分数线</button>
              <button class="text-btn" @click="openAddConfigModal">+ 新增</button>
              <button class="text-btn danger-text" @click="deleteDb(selectedDbId)" v-if="databases.length > 1">删除</button>
            </div>
          </div>
          
          <div class="banner-info-row">
            <!-- 显示排位表来源 -->
            <div class="info-block">
              <span class="info-label">一分一段表：</span>
              <span class="info-value" :class="{ 'is-custom': customRankTable.physics.length > 0 || customRankTable.history.length > 0 }">
                {{ (customRankTable.physics.length > 0 || customRankTable.history.length > 0) ? '已导入自定义表' : BUILT_IN_TABLE_NAME }}
              </span>
              <span v-if="customRankTable.physics.length > 0 || customRankTable.history.length > 0" class="info-sub">
                (理: {{ customRankTable.physics.length }} / 史: {{ customRankTable.history.length }})
              </span>
              <button v-if="customRankTable.physics.length > 0 || customRankTable.history.length > 0" @click="clearCustomRank" class="text-btn mini-btn">清除</button>
            </div>
            
            <!-- 显示分数线 -->
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

        <!-- 第二部分：任务执行 -->
        <div class="step-box">
          <h4>1. 上传数据并执行</h4>
          <div class="form-group">
            <input type="text" v-model="taskName" placeholder="请输入本次考试名称（如：25届高三一模）" class="text-input" />
          </div>
          
          <div class="upload-row">
            <div class="upload-box">
              <p class="tip">上传成绩单 (支持多选)</p>
              <input type="file" @change="handleScoreUpload" accept=".xlsx,.xls,.csv" multiple />
            </div>
            <div class="upload-box">
              <p class="tip">自定义一分一段表 (可选)</p>
              <input type="file" @change="handleRankUpload" accept=".xlsx,.xls,.csv" multiple />
            </div>
          </div>

          <!-- 多选文件展示列表 -->
          <div v-if="scoreFiles.length > 0" class="file-list">
            <div v-for="(file, idx) in scoreFiles" :key="idx" class="file-item">
              <span class="file-name">📄 {{ file.fileName }}</span>
              <span class="file-count">{{ file.students.length }} 人</span>
            </div>
          </div>

          <button class="primary-btn" style="margin-top: 20px;" @click="calculateAndSaveTask" :disabled="!scoreFiles.length || !taskName">
            开始换算并保存记录
          </button>
        </div>

        <!-- 第三部分：历史任务记录 -->
        <div class="step-box" v-if="historyTasks.length > 0">
          <h4>2. 历史计算记录</h4>
          <div class="history-list">
            <div v-for="(task, idx) in historyTasks" :key="idx" class="history-item" @click="viewTaskResult(task)">
              <div class="task-info">
                <span class="task-title">{{ task.name }}</span>
                <span class="task-meta">{{ task.dbRegion }} {{ task.dbYear }} | {{ task.date }}</span>
              </div>
              <div class="task-actions">
                <span class="view-btn">查看详情 ➔</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 结果预览与导出 -->
        <div v-if="currentViewResult" class="batch-result" style="margin-top: 30px;">
          <div class="result-header">
            <h3>结果预览：{{ currentViewResult.name }}</h3>
            <div>
              <button class="outline-btn" @click="currentViewResult = null">关闭</button>
              <button class="outline-btn export-btn" @click="exportExcel">⬇️ 导出 Excel</button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>校排</th><th>姓名</th><th>班级</th><th>选科</th><th>总分(赋分)</th><th>线差</th><th>换算分</th><th>排位</th><th>层次</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in currentViewResult.data.slice(0, 15)" :key="idx">
                <td>{{ item.schoolRank }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.className }}</td>
                <td>{{ item.subject }}</td>
                <td>{{ item.originalScore }}</td>
                <td>{{ item.diff }}</td>
                <td class="highlight">{{ item.convertedScore }}</td>
                <td>{{ item.rank }}</td>
                <td>{{ item.lineType }}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>

    <!-- 弹窗：新增/编辑配置 -->
    <div v-if="showConfigModal" class="modal-overlay">
      <div class="modal-content" style="width: 600px;">
        <h3>{{ isEditing ? '修改分数线配置' : '新增地区/年份配置' }}</h3>
        
        <div class="form-grid">
          <div class="form-item">
            <label>地区</label>
            <input v-model="newConfigForm.region" type="text" placeholder="如：广东省" />
          </div>
          <div class="form-item">
            <label>年份</label>
            <input v-model="newConfigForm.year" type="text" placeholder="如：2026" />
          </div>
        </div>

        <div class="line-input-group">
          <h4>物理类 (请填入赋分预估线与省控线)</h4>
          <div class="form-grid">
            <div class="form-item"><label>特控-预估</label><input v-model.number="newConfigForm.config.physics.currTk" type="number" /></div>
            <div class="form-item"><label>特控-省控</label><input v-model.number="newConfigForm.config.physics.lastTk" type="number" /></div>
            <div class="form-item"><label>本科-预估</label><input v-model.number="newConfigForm.config.physics.currBk" type="number" /></div>
            <div class="form-item"><label>本科-省控</label><input v-model.number="newConfigForm.config.physics.lastBk" type="number" /></div>
            <div class="form-item"><label>专科-预估</label><input v-model.number="newConfigForm.config.physics.currZk" type="number" /></div>
            <div class="form-item"><label>专科-省控</label><input v-model.number="newConfigForm.config.physics.lastZk" type="number" /></div>
          </div>
        </div>

        <div class="line-input-group">
          <h4>历史类 (请填入赋分预估线与省控线)</h4>
          <div class="form-grid">
            <div class="form-item"><label>特控-预估</label><input v-model.number="newConfigForm.config.history.currTk" type="number" /></div>
            <div class="form-item"><label>特控-省控</label><input v-model.number="newConfigForm.config.history.lastTk" type="number" /></div>
            <div class="form-item"><label>本科-预估</label><input v-model.number="newConfigForm.config.history.currBk" type="number" /></div>
            <div class="form-item"><label>本科-省控</label><input v-model.number="newConfigForm.config.history.lastBk" type="number" /></div>
            <div class="form-item"><label>专科-预估</label><input v-model.number="newConfigForm.config.history.currZk" type="number" /></div>
            <div class="form-item"><label>专科-省控</label><input v-model.number="newConfigForm.config.history.lastZk" type="number" /></div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="outline-btn" @click="showConfigModal = false">取消</button>
          <button class="primary-btn" @click="saveNewConfig">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import { DEFAULT_DATABASES, BUILT_IN_GD_2026, BUILT_IN_TABLE_NAME } from '@/utils/calcConfig.js'
import { parseScoreExcel, parseRankExcel, findRank } from '@/utils/calcLogic.js'

// ===== 状态 =====
const databases = ref([])
const selectedDbId = ref('')
const scoreFiles = ref([]) 
const taskName = ref('')
const customRankTable = ref({ physics: [], history: [] })
const historyTasks = ref([])
const currentViewResult = ref(null)
const showConfigModal = ref(false)
const isEditing = ref(false)

// 用于新增/编辑的表单数据
const newConfigForm = ref({ 
  id: '',
  region: '', 
  year: '', 
  config: {
    physics: { currTk: 0, lastTk: 0, currBk: 0, lastBk: 0, currZk: 0, lastZk: 0 },
    history: { currTk: 0, lastTk: 0, currBk: 0, lastBk: 0, currZk: 0, lastZk: 0 }
  }
})

// ===== 计算属性 =====
const activeDb = computed(() => databases.value.find(d => d.id === selectedDbId.value))

// ===== 初始化 =====
onMounted(() => {
  const savedDbs = localStorage.getItem('score_locator_databases')
  if (savedDbs) {
    databases.value = JSON.parse(savedDbs)
  } else {
    databases.value = JSON.parse(JSON.stringify(DEFAULT_DATABASES))
  }
  selectedDbId.value = databases.value[0]?.id || ''

  const savedTasks = localStorage.getItem('score_locator_tasks')
  if (savedTasks) {
    historyTasks.value = JSON.parse(savedTasks)
  }
})

const saveDatabases = () => localStorage.setItem('score_locator_databases', JSON.stringify(databases.value))
const saveTasks = () => localStorage.setItem('score_locator_tasks', JSON.stringify(historyTasks.value))

// ===== 业务逻辑 =====
const openAddConfigModal = () => {
  isEditing.value = false
  newConfigForm.value = { 
    id: '', region: '', year: '', 
    config: {
      physics: { currTk: 528.5, lastTk: 539, currBk: 449, lastBk: 425, currZk: 200, lastZk: 200 },
      history: { currTk: 517.5, lastTk: 546, currBk: 440.5, lastBk: 440, currZk: 200, lastZk: 200 }
    }
  }
  showConfigModal.value = true
}

const openEditConfigModal = (id) => {
  const db = databases.value.find(d => d.id === id)
  if (!db) return
  isEditing.value = true
  // 深拷贝防止直接修改到列表里的数据
  newConfigForm.value = JSON.parse(JSON.stringify(db))
  showConfigModal.value = true
}

const saveNewConfig = () => {
  if (!newConfigForm.value.region || !newConfigForm.value.year) return alert('请填写地区和年份')
  
  if (isEditing.value) {
    const index = databases.value.findIndex(d => d.id === newConfigForm.value.id)
    if (index !== -1) {
      databases.value[index] = JSON.parse(JSON.stringify(newConfigForm.value))
    }
  } else {
    newConfigForm.value.id = `db_${new Date().getTime()}`
    databases.value.push(JSON.parse(JSON.stringify(newConfigForm.value)))
  }
  
  saveDatabases()
  selectedDbId.value = newConfigForm.value.id
  showConfigModal.value = false
}

const deleteDb = (id) => {
  if (databases.value.length <= 1) return
  if (!confirm('确定删除此配置吗？')) return
  databases.value = databases.value.filter(d => d.id !== id)
  saveDatabases()
  selectedDbId.value = databases.value[0].id
}

const handleScoreUpload = async (e) => {
  const files = e.target.files
  if (!files || files.length === 0) return
  try {
    const parsedFiles = await parseScoreExcel(files)
    if (parsedFiles.length === 0) {
      alert('未能从上传的文件中解析出成绩数据，请检查表头是否包含“姓名”、“总分”等关键字。')
    } else {
      scoreFiles.value = parsedFiles
    }
  } catch (err) {
    console.error(err)
    alert('读取成绩单失败，请检查文件格式。')
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
      alert('解析失败！请确保文件名包含“物理”或“历史”，或者表格的第1列是分数、第6列是排位。')
    } else {
      customRankTable.value = {
        physics: [...parsed.physics],
        history: [...parsed.history]
      }
      alert(`解析成功：物理类 ${parsed.physics.length} 条，历史类 ${parsed.history.length} 条数据。`)
    }
  } catch (err) {
    console.error(err)
    alert('读取一分一段表失败，请检查文件格式是否为标准 Excel。')
  } finally {
    e.target.value = ''
  }
}

const clearCustomRank = () => {
  customRankTable.value = { physics: [], history: [] }
}

const calculateAndSaveTask = () => {
  if (!taskName.value) return alert('请输入考试名称')
  
  const db = activeDb.value
  if (!db) return alert('未选择配置数据')
  
  const rules = db.config
  const allStudents = scoreFiles.value.flatMap(f => f.students)

  let processed = allStudents.map(student => {
    const isPhysics = student.subject.includes('物') || student.className.includes('21')
    const rule = isPhysics ? rules.physics : rules.history
    
    let table = isPhysics ? customRankTable.value.physics : customRankTable.value.history
    if (table.length === 0 && db.id === 'db_gd_2026') {
       table = isPhysics ? BUILT_IN_GD_2026.physics : BUILT_IN_GD_2026.history
    }

    const s = student.originalScore
    let convertS = s
    let lineType = '未上线'
    let currentDiff = 0
    let formulaDesc = ''

    if (isNaN(s) || s <= 0) {
      return { ...student, convertedScore: '-', rank: '-', lineType: '分数异常', diff: '-', formulaDesc: '原始分缺失' }
    }

    if (s >= rule.currTk) {
      currentDiff = rule.lastTk - rule.currTk
      convertS = s + currentDiff
      lineType = '特控线'
      formulaDesc = `+特控线差(${currentDiff})`
    } else if (s >= rule.currBk) {
      currentDiff = rule.lastBk - rule.currBk
      convertS = s + currentDiff
      lineType = '本科线'
      formulaDesc = `+本科线差(${currentDiff})`
    } else if (s >= rule.currZk) {
      currentDiff = rule.lastZk - rule.currZk
      convertS = s + currentDiff
      lineType = '专科线'
      formulaDesc = `+专科线差(${currentDiff})`
    }

    convertS = Math.round(convertS)
    let matchRank = findRank(convertS, table)

    return { ...student, convertedScore: convertS, rank: matchRank, lineType, diff: currentDiff, formulaDesc }
  })

  processed.sort((a, b) => {
    const rankA = Number(a.schoolRank) || 9999
    const rankB = Number(b.schoolRank) || 9999
    return rankA - rankB
  })

  const newTask = {
    id: `task_${new Date().getTime()}`,
    name: taskName.value,
    date: new Date().toLocaleString(),
    dbRegion: db.region,
    dbYear: db.year,
    data: processed
  }

  historyTasks.value.unshift(newTask)
  saveTasks()
  
  taskName.value = ''
  scoreFiles.value = []
  customRankTable.value = { physics: [], history: [] }
  currentViewResult.value = newTask
}

const viewTaskResult = (task) => {
  currentViewResult.value = task
}

const exportExcel = () => {
  if (!currentViewResult.value) return
  const workbook = XLSX.utils.book_new()
  
  const physicsData = currentViewResult.value.data.filter(row => row.subject.includes('物') || row.className.includes('21'))
  const historyData = currentViewResult.value.data.filter(row => !row.subject.includes('物') && !row.className.includes('21'))

  if (physicsData.length > 0) {
    const wsPhysics = XLSX.utils.json_to_sheet(physicsData.map((row) => ({
      '校排': row.schoolRank, '姓名': row.name, '班级': row.className, '选科': row.subject,
      '总分(赋分)': row.originalScore, '适用线差': row.diff, '换算高考分': row.convertedScore,
      '往年等效排位': row.rank, '预估上线层次': row.lineType
    })))
    XLSX.utils.book_append_sheet(workbook, wsPhysics, "物理类")
  }

  if (historyData.length > 0) {
    const wsHistory = XLSX.utils.json_to_sheet(historyData.map((row) => ({
      '校排': row.schoolRank, '姓名': row.name, '班级': row.className, '选科': row.subject,
      '总分(赋分)': row.originalScore, '适用线差': row.diff, '换算高考分': row.convertedScore,
      '往年等效排位': row.rank, '预估上线层次': row.lineType
    })))
    XLSX.utils.book_append_sheet(workbook, wsHistory, "历史类")
  }

  const sheetFormulaData = currentViewResult.value.data.map((row) => ({
    '校排': row.schoolRank, '姓名': row.name, '科类': row.subject, '原始总分': row.originalScore, 
    '换算分': row.convertedScore, '计算公式': row.formulaDesc, '排位查询': `查得 ${row.rank} 名`
  }))
  const wsFormula = XLSX.utils.json_to_sheet(sheetFormulaData)
  XLSX.utils.book_append_sheet(workbook, wsFormula, "计算公式说明")

  XLSX.writeFile(workbook, `${currentViewResult.value.name}_换算结果.xlsx`)
}
</script>

<style scoped>
/* 基础框架 */
.page-wrapper {
  min-height: calc(100vh - 60px); background-color: #f5f6f8; display: flex;
  justify-content: center; align-items: flex-start; padding-top: 5vh;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}
.main-card {
  background: #ffffff; border-radius: 24px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  width: 100%; max-width: 1000px; padding: 40px 50px; display: flex; flex-direction: column;
}
.header { text-align: center; margin-bottom: 30px; }
.title { font-size: 28px; font-weight: 800; color: #1f2937; display: flex; align-items: center; justify-content: center; gap: 12px; margin: 0 0 12px 0; }
.subtitle { font-size: 15px; color: #6b7280; margin: 0; }

/* 🌟 顶部横幅样式 */
.active-config-banner {
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px;
  padding: 16px 20px; margin-bottom: 24px;
}
.banner-header {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px dashed #bfdbfe; padding-bottom: 12px; margin-bottom: 12px;
}
.banner-header h3 { margin: 0; font-size: 15px; color: #1e40af; }
.badge-red { background: #ef4444; color: #fff; font-size: 12px; padding: 2px 6px; border-radius: 4px; font-weight: normal; }
.banner-controls { display: flex; align-items: center; gap: 12px; }
.year-select-mini { padding: 4px 8px; font-size: 13px; border: 1px solid #93c5fd; border-radius: 4px; background: #fff; }
.danger-text { color: #ef4444; }

.banner-info-row { display: flex; flex-direction: column; gap: 12px; }
.info-block { font-size: 14px; }
.info-label { color: #64748b; }
.info-value { font-weight: 800; color: #1d4ed8; background: #dbeafe; padding: 2px 8px; border-radius: 4px; }
.info-value.is-custom { color: #047857; background: #d1fae5; }
.info-sub { font-size: 12px; color: #10b981; margin-left: 8px; }
.mini-btn { font-size: 12px; color: #ef4444; margin-left: 12px; }

.lines-display {
  display: flex; gap: 24px; background: #fff; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;
}
.line-group { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.subject-tag { background: #3b82f6; color: #fff; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; }
.subject-tag.history { background: #10b981; }
.line-item { color: #475569; }
.line-item b { color: #1e293b; font-size: 15px; }

/* 步骤框 */
.step-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
.step-box h4 { margin: 0 0 16px 0; font-size: 16px; color: #1e293b; }

/* 按钮 */
.primary-btn { height: 44px; padding: 0 24px; font-size: 15px; font-weight: 600; color: #fff; background-color: #1e88e5; border: none; border-radius: 8px; cursor: pointer; }
.primary-btn:hover { background-color: #1976d2; }
.primary-btn:disabled { background-color: #9ca3af; cursor: not-allowed; }
.outline-btn { padding: 8px 16px; font-size: 14px; height: auto; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; cursor: pointer; font-weight: 600; color: #1e88e5; }
.outline-btn:hover { background: #dbeafe; }
.text-btn { background: none; border: none; color: #1e88e5; font-size: 13px; cursor: pointer; font-weight: 600; }

/* 表单输入 */
.text-input { width: 100%; padding: 10px 14px; font-size: 14px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; transition: border-color 0.2s; margin-bottom: 16px; }
.text-input:focus { border-color: #1e88e5; }

/* 表格 */
table { width: 100%; border-collapse: collapse; text-align: center; }
th, td { border: 1px solid #f1f5f9; padding: 12px; font-size: 14px; position: relative; }
th { background: #f8fafc; color: #64748b; font-weight: 600; }
td { color: #334155; }
.highlight { color: #1e88e5; font-weight: 600; }

/* 上传框 */
.upload-row { display: flex; gap: 20px; margin-bottom: 16px; }
.upload-box { flex: 1; background: #fff; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; }
.upload-box .tip { font-size: 13px; color: #64748b; margin-bottom: 12px; }

/* 文件列表展示 */
.file-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.file-item { display: flex; justify-content: space-between; background: #f1f5f9; padding: 10px 16px; border-radius: 6px; font-size: 14px; }
.file-name { color: #334155; font-weight: 500; }
.file-count { color: #10b981; font-weight: 600; }

/* 历史记录列表 */
.history-list { display: flex; flex-direction: column; gap: 12px; }
.history-item { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s; }
.history-item:hover { border-color: #bfdbfe; box-shadow: 0 4px 12px rgba(30, 136, 229, 0.1); }
.task-title { font-weight: 600; color: #1e293b; margin-right: 12px; }
.task-meta { font-size: 13px; color: #94a3b8; }
.view-btn { color: #1e88e5; font-size: 14px; font-weight: 600; }

/* 弹窗 */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; z-index: 100; }
.modal-content { background: #fff; padding: 30px; border-radius: 16px; width: 400px; }
.modal-content h3 { margin-top: 0; margin-bottom: 20px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.form-item { display: flex; flex-direction: column; gap: 4px; }
.form-item label { font-size: 12px; color: #475569; font-weight: 600; }
.form-item input { padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; }
.line-input-group { background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 12px; }
.line-input-group h4 { margin: 0 0 8px 0; font-size: 13px; color: #1e293b; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.tip { font-size: 12px; color: #94a3b8; margin-top: 8px; }

/* 结果预览区 */
.result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.result-header h3 { margin: 0; font-size: 18px; color: #1e293b; }
</style>