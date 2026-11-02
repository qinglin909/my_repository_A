<template>
  <div class="ranking-container">
    <div class="header-area">
      <h2>🎯 普宁红领巾实验学校 - 成绩定位器</h2>
      <p>基于往年上线比例与 2026 年一分一段表，估算省排名</p>
    </div>

    <div class="calculator-card">
      <!-- 输入区 -->
      <div class="input-group">
        <label>今年物理类校排名：</label>
        <input 
          type="number" 
          v-model="currentRank" 
          placeholder="如: 50" 
          min="1" 
          max="604"
          @keyup.enter="calculate"
        >
        <button @click="calculate">开始推算</button>
      </div>

      <!-- 结果区 -->
      <div class="result-card" v-if="showResult">
        <div class="result-row">
          <span>去年同位次排名：</span>
          <span>第 {{ result.lastYearRank }} 名</span>
        </div>
        <div class="result-row">
          <span>是否达到特控线（高优线）：</span>
          <span :class="result.isTouKong ? 'text-green' : 'text-red'">
            {{ result.isTouKong ? '是 ✅' : '否 ❌' }}
          </span>
        </div>
        <div class="result-row">
          <span>预估等效高考分数 (2026)：</span>
          <span>{{ result.equivScore }} 分</span>
        </div>
        <div class="result-row highlight-row">
          <span>预估全省排名 (物理类)：</span>
          <span>约 {{ result.provinceRank.toLocaleString() }} 名</span>
        </div>
        
        <div class="result-actions">
          <button class="copy-btn" @click="copyResult">📋 复制结果报告</button>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="action-bar">
        <button class="view-table-btn" @click="showTableModal = true">
          📊 查看 2026 一分一段表
        </button>
        <button class="view-logic-btn" @click="showLogicModal = true">
          💡 查看业务换算逻辑
        </button>
      </div>
    </div>

    <!-- ================= 弹窗 1：一分一段表 ================= -->
    <div class="modal-overlay" v-if="showTableModal" @click.self="showTableModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>广东省 2026 年高考一分一段表</h3>
          <button class="close-btn" @click="showTableModal = false">✕</button>
        </div>

        <div class="tab-switch">
          <button :class="{ active: tableType === 'physics' }" @click="tableType = 'physics'">物理类</button>
          <button :class="{ active: tableType === 'history' }" @click="tableType = 'history'">历史类</button>
          <div class="spacer"></div>
          <button class="export-btn" @click="exportToExcel">📥 导出预测 Excel</button>
        </div>

        <div class="table-wrapper">
          <table class="score-table">
            <thead>
              <tr>
                <th>分数</th>
                <th>去年本段人数</th>
                <th>累计人数(省排名)</th>
                <th>今年预估同分人数</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="row in currentTableData" 
                :key="row.score"
                :class="{ 'highlight-row': row.score === 539 }"
              >
                <td>{{ row.score }}</td>
                <td>{{ row.count }}</td>
                <td>{{ row.cumulative.toLocaleString() }}</td>
                <td class="text-blue">
                  {{ (row.count * ratio).toFixed(1) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          注：今年预估同分人数 = 去年本段人数 × (604 / 1024)，保留一位小数。
        </div>
      </div>
    </div>

    <!-- ================= 弹窗 2：逻辑说明 ================= -->
    <div class="modal-overlay" v-if="showLogicModal" @click.self="showLogicModal = false">
      <div class="modal-content logic-modal">
        <div class="modal-header">
          <h3>💡 业务换算逻辑说明</h3>
          <button class="close-btn" @click="showLogicModal = false">✕</button>
        </div>
        <div class="logic-body">
          <div class="logic-step">
            <h4>第一步：计算“特控线”人数（横向对比）</h4>
            <p>去年物理类总人数 1024 人，考上特控线的有 81 人（上线率 7.91%）。今年总人数 604 人，预估今年有 <b>48 人</b> 能上特控线（604 × 7.91%）。</p>
          </div>
          <div class="logic-step">
            <h4>第二步：同位次比例折算（纵向定位）</h4>
            <p>假设你今年校排第 60 名。系统会算出去年排在第 101 名（<code>60 ÷ 604 × 1024</code>）的同学，他当年高考排多少名，以此作为你的参考基准。</p>
          </div>
          <div class="logic-step">
            <h4>第三步：等效分数推算</h4>
            <p>因为今年第 48 名约等于特控线（539分）。如果你排名在 48 名以内，每前进 1 名加 3.5 分；如果在 48 名之后，每退 1 名减 1.2 分，算出你的“预估高考等效分”。</p>
          </div>
          <div class="logic-step">
            <h4>第四步：查表得省排位 & 同分缩放</h4>
            <p>拿着算出的等效分，去查 2026 年“一分一段表”。今年预估同分人数 = 去年本段人数 × (604/1024)，方便业务员在 Excel 中决定筛选保留的行数。</p>
          </div>
        </div>
        <div class="modal-footer">
          该算法由学校根据往年高考数据反推得出，非官方绝对排位，仅供参考。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const currentRank = ref('')
const showResult = ref(false)
const showTableModal = ref(false)
const showLogicModal = ref(false)
const tableType = ref('physics')

const result = ref({
  lastYearRank: 0,
  isTouKong: false,
  equivScore: 0,
  provinceRank: 0
})

// 核心配置数据 (2026年基准)
const totalLastYear = 1024
const totalThisYear = 604
const TOU_KONG_SCORE = 539 
const TOU_KONG_RANK = 111604 // 2026年特控线省排位约11.1万

// 缩放比例 (604 / 1024)
const ratio = totalThisYear / totalLastYear 

// 表格数据 (为了演示，保留为基准数据结构)
const physicsTable = [
  { score: 699, count: 20, cumulative: 20 },
  { score: 690, count: 14, cumulative: 115 },
  { score: 680, count: 34, cumulative: 390 },
  { score: 670, count: 66, cumulative: 976 },
  { score: 660, count: 113, cumulative: 2227 },
  { score: 650, count: 148, cumulative: 4041 },
  { score: 640, count: 215, cumulative: 8567 },
  { score: 630, count: 282, cumulative: 15065 },
  { score: 620, count: 354, cumulative: 23415 },
  { score: 610, count: 412, cumulative: 33921 },
  { score: 600, count: 445, cumulative: 30891 },
  { score: 590, count: 467, cumulative: 40518 },
  { score: 580, count: 489, cumulative: 51234 },
  { score: 570, count: 512, cumulative: 63100 },
  { score: 560, count: 534, cumulative: 76100 },
  { score: 550, count: 1622, cumulative: 93426 },
  { score: 549, count: 1584, cumulative: 95010 },
  { score: 548, count: 1566, cumulative: 96576 },
  { score: 547, count: 1622, cumulative: 98198 },
  { score: 546, count: 1629, cumulative: 99827 },
  { score: 545, count: 1546, cumulative: 101373 },
  { score: 544, count: 1721, cumulative: 103094 },
  { score: 543, count: 1748, cumulative: 104842 },
  { score: 542, count: 1640, cumulative: 106482 },
  { score: 541, count: 1705, cumulative: 108187 },
  { score: 540, count: 1679, cumulative: 109866 },
  { score: 539, count: 1738, cumulative: 111604 },
  { score: 538, count: 1737, cumulative: 113341 },
  { score: 537, count: 1745, cumulative: 115086 },
  { score: 530, count: 1723, cumulative: 127337 },
  { score: 520, count: 1780, cumulative: 146000 },
  { score: 510, count: 1850, cumulative: 167000 },
  { score: 500, count: 1900, cumulative: 181455 },
  { score: 450, count: 2500, cumulative: 267122 },
]

const historyTable = [
  { score: 669, count: 16, cumulative: 16 },
  { score: 650, count: 13, cumulative: 101 },
  { score: 630, count: 37, cumulative: 538 },
  { score: 600, count: 280, cumulative: 3367 },
  { score: 580, count: 450, cumulative: 7887 },
  { score: 560, count: 600, cumulative: 14500 },
  { score: 540, count: 750, cumulative: 22391 },
  { score: 520, count: 900, cumulative: 33000 },
  { score: 500, count: 1050, cumulative: 46000 },
  { score: 480, count: 1150, cumulative: 62000 },
  { score: 460, count: 1200, cumulative: 80000 },
  { score: 440, count: 1250, cumulative: 114692 },
]

const currentTableData = computed(() => {
  return tableType.value === 'physics' ? physicsTable : historyTable
})

const getProvinceRankFromScore = (score) => {
  if (score >= 680) return 500
  if (score <= 450) return 260000
  let diff = TOU_KONG_SCORE - score
  if (diff > 0) {
    return Math.round(TOU_KONG_RANK + diff * 2500 + (diff * diff) * 10)
  } else {
    return Math.round(TOU_KONG_RANK - Math.abs(diff) * 2500 - (diff * diff) * 8)
  }
}

const calculate = () => {
  const rank = parseInt(currentRank.value)
  if (isNaN(rank) || rank < 1 || rank > totalThisYear) {
    alert('请输入 1 到 604 之间的有效排名！')
    return
  }

  const ratioRank = rank / totalThisYear
  const lastYearRank = Math.round(ratioRank * totalLastYear)

  let isTouKong = false
  let equivScore = 0

  if (rank <= 48) {
    isTouKong = true
    const rankDiff = 48 - rank
    equivScore = TOU_KONG_SCORE + Math.round(rankDiff * 3.5)
  } else {
    isTouKong = false
    const rankDiff = rank - 48
    equivScore = TOU_KONG_SCORE - Math.round(rankDiff * 1.2)
  }

  const provinceRank = getProvinceRankFromScore(equivScore)

  result.value = { lastYearRank, isTouKong, equivScore, provinceRank }
  showResult.value = true
}

// 复制功能
const copyResult = () => {
  const text = `【成绩定位报告】\n今年校排名：第 ${currentRank.value} 名\n折合去年位次：第 ${result.value.lastYearRank} 名\n是否过特控线：${result.value.isTouKong ? '是' : '否'}\n预估等效高考分：${result.value.equivScore} 分\n预估全省排位：约 ${result.value.provinceRank} 名`
  navigator.clipboard.writeText(text).then(() => {
    alert('✅ 报告已复制，可以去微信粘贴啦！')
  }).catch(() => {
    alert('❌ 复制失败，请手动选择文本。')
  })
}

// 导出 Excel 功能 (包含比例缩放的今年预估同分人数)
const exportToExcel = () => {
  let csvContent = "\uFEFF分数,去年本段人数,累计人数(省排名),今年预估同分人数\n"
  
  currentTableData.value.forEach(row => {
    const estimatedCount = (row.count * ratio).toFixed(1)
    csvContent += `${row.score},${row.count},${row.cumulative},${estimatedCount}\n`
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${tableType.value === 'physics' ? '物理类' : '历史类'}_2026一分一段及同分预测.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.ranking-container {
  padding: 30px;
  max-width: 800px;
  margin: 0 auto;
  min-height: calc(100vh - 60px);
}
.header-area { text-align: center; margin-bottom: 40px; }
.header-area h2 { margin: 0 0 10px; color: #1f2937; font-size: 26px; }
.header-area p { margin: 0; color: #6b7280; font-size: 15px; }

.calculator-card {
  background: #fff;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  border: 1px solid #f3f4f6;
}

.input-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}
.input-group label { font-weight: bold; font-size: 16px; color: #374151; }
.input-group input {
  width: 120px;
  padding: 12px;
  font-size: 18px;
  text-align: center;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s;
}
.input-group input:focus { border-color: #1989fa; box-shadow: 0 0 0 3px rgba(25,137,250,0.1); }
.input-group button {
  padding: 12px 30px;
  font-size: 16px;
  background: #1989fa;
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}
.input-group button:hover { background: #0f6fd6; transform: translateY(-1px); }

.result-card {
  background: #f8faff;
  border: 2px solid #bfdbfe;
  border-radius: 12px;
  padding: 20px;
  animation: fadeIn 0.4s ease-out;
  margin-bottom: 20px;
}
.result-row {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px dashed #e5e7eb;
  font-size: 16px;
}
.result-row:last-child { border-bottom: none; }
.result-row span:first-child { color: #4b5563; }
.result-row span:last-child { font-weight: bold; color: #1f2937; }

.highlight-row span:last-child { color: #1989fa; font-size: 22px; }
.text-green { color: #07c160 !important; }
.text-red { color: #e74c3c !important; }

.result-actions { display: flex; justify-content: flex-end; margin-top: 10px; }
.copy-btn {
  padding: 8px 16px;
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: 0.2s;
}
.copy-btn:hover { background: #bae6fd; }

.action-bar {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}
.view-table-btn, .view-logic-btn {
  padding: 10px 20px;
  font-size: 14px;
  background: #f9fafb;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
}
.view-table-btn:hover, .view-logic-btn:hover { background: #f3f4f6; border-color: #9ca3af; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-content {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 650px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeIn 0.3s ease-out;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h3 { margin: 0; font-size: 18px; color: #1f2937; }
.close-btn { background: none; border: none; font-size: 20px; color: #9ca3af; cursor: pointer; }
.close-btn:hover { color: #374151; }
.modal-footer {
  padding: 16px 24px;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
}

.tab-switch {
  display: flex;
  padding: 12px 24px;
  gap: 10px;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
}
.spacer { flex: 1; }
.tab-switch button {
  padding: 8px 20px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.tab-switch button.active {
  background: #1989fa;
  color: #fff;
  border-color: #1989fa;
}
.export-btn {
  border-color: #07c160 !important;
  color: #07c160 !important;
  background: #f0fdf4 !important;
}
.export-btn:hover { background: #dcfce7 !important; }

.table-wrapper { flex: 1; overflow-y: auto; padding: 0 24px; }
.score-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.score-table th {
  position: sticky;
  top: 0;
  background: #f8f9fb;
  padding: 12px;
  text-align: center;
  font-weight: 600;
  color: #4b5563;
  border-bottom: 2px solid #e5e7eb;
}
.score-table td {
  padding: 10px 12px;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
}
.score-table tr.highlight-row td {
  background: #fef3c7;
  font-weight: bold;
  color: #92400e;
}
.text-blue { color: #1989fa; font-weight: bold; }

.logic-body { padding: 24px; overflow-y: auto; }
.logic-step {
  margin-bottom: 20px;
  background: #f8faff;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #1989fa;
}
.logic-step h4 { margin: 0 0 8px 0; color: #1e3a8a; font-size: 15px; }
.logic-step p { margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6; }
.logic-step code {
  background: #e5e7eb;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>