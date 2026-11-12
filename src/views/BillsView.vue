<!-- 月度收支登记：固定支出/收入登记、增删改、汇总与图表导出 -->
<template>
  <section class="bills-page">
    <header class="page-head">
      <div>
        <h1>月度收支登记</h1>
        <p>登记每月固定支出与收入（宽带、话费、订阅……），自动汇总、出图、可导出。</p>
      </div>
      <div class="head-actions">
        <button type="button" class="ghost-btn" :disabled="!records.length" @click="exportCsv">导出 CSV</button>
        <button type="button" class="ghost-btn" :disabled="!expenseTotal && !incomeTotal" @click="exportChartPng">下载图表 PNG</button>
      </div>
    </header>

    <!-- 未登录提示 -->
    <div v-if="!userStore.isLoggedIn" class="login-prompt app-card">
      <span class="prompt-icon">💰</span>
      <div>
        <h2>登录后使用</h2>
        <p>收支数据是私人账本，按账号隔离保存。请先登录，再来登记你的宽带、话费和订阅。</p>
        <router-link class="solid-btn" to="/login">去登录</router-link>
      </div>
    </div>

    <template v-else>
      <p v-if="error" class="error-bar">{{ error }}</p>

      <!-- 汇总卡 -->
      <div class="summary-grid">
        <div class="summary-card app-card tone-income">
          <span class="summary-label">每月收入</span>
          <strong class="summary-value">{{ money(incomeTotal) }}</strong>
          <small>{{ incomeCount }} 项 · 年化 {{ money(incomeTotal * 12) }}</small>
        </div>
        <div class="summary-card app-card tone-expense">
          <span class="summary-label">每月支出</span>
          <strong class="summary-value">{{ money(expenseTotal) }}</strong>
          <small>{{ expenseCount }} 项 · 年化 {{ money(expenseTotal * 12) }}</small>
        </div>
        <div class="summary-card app-card" :class="balance >= 0 ? 'tone-balance' : 'tone-expense'">
          <span class="summary-label">每月结余</span>
          <strong class="summary-value">{{ money(balance) }}</strong>
          <small>{{ balance >= 0 ? '收大于支，攒起来了' : '支大于收，留意一下' }}</small>
        </div>
        <div class="summary-card app-card tone-daily">
          <span class="summary-label">日均支出</span>
          <strong class="summary-value">{{ money(expenseTotal / 30) }}</strong>
          <small>按每月 30 天折算</small>
        </div>
      </div>

      <!-- 表单 + 列表 -->
      <div class="work-grid">
        <!-- 登记表单 -->
        <form class="bill-form app-card" @submit.prevent="submitBill">
          <div class="form-head">
            <h2>{{ editingId ? '编辑条目' : '登记新条目' }}</h2>
            <button v-if="editingId" type="button" class="text-btn" @click="resetForm">取消编辑</button>
          </div>

          <div class="type-toggle" role="tablist">
            <button
              v-for="t in typeOptions"
              :key="t.value"
              type="button"
              class="type-btn"
              :class="{ active: form.type === t.value, [t.value]: true }"
              role="tab"
              :aria-selected="form.type === t.value"
              @click="switchType(t.value)"
            >
              {{ t.label }}
            </button>
          </div>

          <label class="field">
            <span>名称</span>
            <input v-model="form.name" :placeholder="form.type === 'expense' ? '例：宽带 / 电话卡 / 视频会员' : '例：工资 / 房租收入'" maxlength="40" required />
          </label>

          <div class="field-row">
            <label class="field">
              <span>金额（元 / 月）</span>
              <input v-model.number="form.amount" type="number" min="0.01" step="0.01" placeholder="79" required />
            </label>
            <label class="field day-field">
              <span>扣费日</span>
              <input v-model.number="form.dayOfMonth" type="number" min="1" max="31" step="1" required />
            </label>
          </div>

          <label class="field">
            <span>类别</span>
            <select v-model="form.category">
              <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>

          <label class="field">
            <span>备注（选填）</span>
            <input v-model="form.note" placeholder="例：合约到 2027-03，届时可重新比价" maxlength="60" />
          </label>

          <div v-if="form.type === 'expense' && !editingId" class="quick-chips">
            <span class="chips-label">快速填：</span>
            <button v-for="p in presets" :key="p.name" type="button" class="chip" @click="applyPreset(p)">
              {{ p.name }} ¥{{ p.amount }}
            </button>
          </div>

          <div class="form-foot">
            <span class="tip-hint">{{ editingId ? '改完保存即可生效' : '金额按每月固定值登记' }}</span>
            <button type="submit" class="solid-btn" :disabled="saving || loading">
              {{ saving ? '保存中…' : editingId ? '保存修改' : '登记' }}
            </button>
          </div>
        </form>

        <!-- 条目列表 -->
        <div class="bill-list app-card">
          <div class="list-head">
            <div class="list-tabs" role="tablist">
              <button
                v-for="t in typeOptions"
                :key="t.value"
                type="button"
                class="list-tab"
                :class="{ active: activeTab === t.value }"
                role="tab"
                :aria-selected="activeTab === t.value"
                @click="activeTab = t.value"
              >
                {{ t.label }}
                <em>{{ t.value === 'expense' ? expenseCount : incomeCount }}</em>
              </button>
            </div>
          </div>

          <p v-if="loading" class="list-empty">加载中…</p>
          <p v-else-if="!currentList.length" class="list-empty">
            还没有{{ activeTab === 'expense' ? '支出' : '收入' }}条目，从左边登记一条吧。
          </p>

          <transition-group v-else name="bill" tag="ul" class="list-body">
            <li v-for="bill in currentList" :key="bill.id" class="bill-item" :class="{ muted: bill.active === false }">
              <div class="item-main">
                <strong class="item-name">
                  {{ bill.name }}
                  <span v-if="bill.active === false" class="paused-tag">已停用</span>
                </strong>
                <span class="item-meta">{{ bill.category }} · {{ bill.dayOfMonth }} 日扣费</span>
                <span v-if="bill.note" class="item-note">{{ bill.note }}</span>
              </div>
              <strong class="item-amount" :class="bill.type">{{ money(bill.amount) }}</strong>
              <div class="item-ops">
                <button type="button" class="op-btn" :title="bill.active === false ? '恢复计入' : '暂时停用（不计入汇总）'" @click="toggleActive(bill)">
                  {{ bill.active === false ? '▶' : '⏸' }}
                </button>
                <button type="button" class="op-btn" title="编辑" @click="editBill(bill)">✏️</button>
                <button type="button" class="op-btn danger" title="删除" @click="removeBill(bill)">🗑️</button>
              </div>
            </li>
          </transition-group>

          <div v-if="currentList.length" class="list-foot">
            <span>当页合计</span>
            <strong :class="activeTab">{{ money(currentList.reduce((sum, b) => sum + (b.active === false ? 0 : b.amount), 0)) }}</strong>
          </div>
        </div>
      </div>

      <!-- 图表 -->
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
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { apiFetch } from '@/utils/apiClient'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

/* ---------- 常量 ---------- */
const EXPENSE_CATEGORIES = ['通讯网络', '生活缴费', '订阅会员', '居住房租', '交通出行', '保险', '学习教育', '债务还款', '娱乐', '其他支出']
const INCOME_CATEGORIES = ['主职收入', '副业兼职', '投资理财', '租金收入', '其他收入']
const PRESETS = [
  { name: '宽带', amount: 79, category: '通讯网络', dayOfMonth: 1 },
  { name: '电话卡', amount: 29, category: '通讯网络', dayOfMonth: 5 },
  { name: '视频会员', amount: 25, category: '订阅会员', dayOfMonth: 12 }
]
const PALETTE = ['#9b2028', '#c9535a', '#e8948f', '#f2c1bb', '#b4762a', '#d8a24e', '#3d6b52', '#6c9a82', '#3a5a8c', '#7c93c4', '#6b4f8c', '#9a7cc4']

const typeOptions = [
  { value: 'expense', label: '支出' },
  { value: 'income', label: '收入' }
]

/* ---------- 状态 ---------- */
const records = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const activeTab = ref('expense')
const editingId = ref('')
const donutSvg = ref(null)
const barSvg = ref(null)

const form = reactive({ type: 'expense', name: '', amount: null, category: EXPENSE_CATEGORIES[0], dayOfMonth: 1, note: '' })

/* ---------- 计算汇总 ---------- */
const activeRecords = computed(() => records.value.filter((r) => r.active !== false))
const incomeTotal = computed(() => sumOf('income'))
const expenseTotal = computed(() => sumOf('expense'))
const incomeCount = computed(() => countOf('income'))
const expenseCount = computed(() => countOf('expense'))
const balance = computed(() => incomeTotal.value - expenseTotal.value)
const currentList = computed(() => records.value.filter((r) => r.type === activeTab.value).sort((a, b) => b.amount - a.amount))

function sumOf(type) {
  return activeRecords.value.filter((r) => r.type === type).reduce((sum, r) => sum + Number(r.amount || 0), 0)
}
function countOf(type) {
  return activeRecords.value.filter((r) => r.type === type).length
}
function money(value) {
  const num = Number(value) || 0
  const text = Math.abs(num) % 1 === 0 ? Math.abs(num).toFixed(0) : Math.abs(num).toFixed(2)
  return (num < 0 ? '-' : '') + '¥' + text
}

/* ---------- 类别选项 ---------- */
const categoryOptions = computed(() => (form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES))
function switchType(type) {
  form.type = type
  form.category = (type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0]
}
function applyPreset(preset) {
  form.name = preset.name
  form.amount = preset.amount
  form.category = preset.category
  form.dayOfMonth = preset.dayOfMonth
}

/* ---------- CRUD ---------- */
async function load() {
  if (!userStore.isLoggedIn) return
  loading.value = true
  error.value = ''
  try {
    const res = await apiFetch('/api/bills', { token: userStore.token })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(payload.message || '加载失败，请稍后重试')
    records.value = Array.isArray(payload.data) ? payload.data : []
  } catch (err) {
    error.value = err.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function submitBill() {
  if (!form.name.trim() || !form.amount || saving.value) return
  if (form.dayOfMonth < 1 || form.dayOfMonth > 31) {
    error.value = '扣费日需为 1-31'
    return
  }

  saving.value = true
  error.value = ''
  const body = {
    name: form.name.trim(),
    amount: Number(form.amount),
    category: form.category,
    type: form.type,
    dayOfMonth: Number(form.dayOfMonth),
    note: form.note.trim()
  }

  try {
    const editing = editingId.value
    const res = await apiFetch(editing ? `/api/bills/${editing}` : '/api/bills', {
      method: editing ? 'PUT' : 'POST',
      token: userStore.token,
      body
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(payload.message || '保存失败，请稍后重试')

    const saved = payload.data
    if (editing) {
      const index = records.value.findIndex((r) => String(r.id) === String(editing))
      if (index > -1) records.value.splice(index, 1, { ...records.value[index], ...saved })
    } else {
      records.value.push(saved)
    }
    resetForm()
  } catch (err) {
    error.value = err.message || '保存失败，请稍后重试'
  } finally {
    saving.value = false
  }
}

function editBill(bill) {
  editingId.value = String(bill.id)
  form.type = bill.type
  form.name = bill.name
  form.amount = bill.amount
  form.category = bill.category
  form.dayOfMonth = bill.dayOfMonth
  form.note = bill.note || ''
  error.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetForm() {
  editingId.value = ''
  form.name = ''
  form.amount = null
  form.dayOfMonth = 1
  form.note = ''
  form.category = (form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0]
}

async function removeBill(bill) {
  if (!window.confirm(`确定删除「${bill.name}」吗？`)) return
  try {
    const res = await apiFetch(`/api/bills/${bill.id}`, { method: 'DELETE', token: userStore.token })
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      throw new Error(payload.message || '删除失败')
    }
    records.value = records.value.filter((r) => String(r.id) !== String(bill.id))
    if (String(editingId.value) === String(bill.id)) resetForm()
  } catch (err) {
    error.value = err.message || '删除失败'
  }
}

async function toggleActive(bill) {
  const next = bill.active === false
  try {
    const res = await apiFetch(`/api/bills/${bill.id}`, {
      method: 'PUT',
      token: userStore.token,
      body: { active: next }
    })
    if (!res.ok) throw new Error('操作失败')
    bill.active = next
  } catch (err) {
    error.value = err.message || '操作失败'
  }
}

/* ---------- 图表 ---------- */
const expenseByCategory = computed(() => {
  const map = new Map()
  for (const r of activeRecords.value) {
    if (r.type !== 'expense') continue
    map.set(r.category, (map.get(r.category) || 0) + Number(r.amount || 0))
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
})

const donutSegments = computed(() => {
  const total = expenseByCategory.value.reduce((sum, seg) => sum + seg.value, 0)
  if (!total) return []

  const cx = 120
  const cy = 120
  const rOuter = 88
  const rInner = 55
  const point = (radius, angle) => `${cx + radius * Math.cos(angle)} ${cy + radius * Math.sin(angle)}`
  let angle = -Math.PI / 2

  return expenseByCategory.value.map((seg) => {
    const share = seg.value / total
    // 整圆会退化成一条线，独占时拆成上下两个半环
    const spans = share >= 0.9999 ? [[angle, angle + Math.PI], [angle + Math.PI, angle + Math.PI * 2]] : [[angle, angle + share * Math.PI * 2]]
    const path = spans
      .map(([a0, a1]) => {
        const large = a1 - a0 > Math.PI ? 1 : 0
        return `M ${point(rOuter, a0)} A ${rOuter} ${rOuter} 0 ${large} 1 ${point(rOuter, a1)} L ${point(rInner, a1)} A ${rInner} ${rInner} 0 ${large} 0 ${point(rInner, a0)} Z`
      })
      .join(' ')
    angle += share * Math.PI * 2
    return { name: seg.name, value: seg.value, share, path }
  })
})

const barRows = computed(() => {
  const rows = [
    { label: '月收入', value: incomeTotal.value, color: '#2fb380' },
    { label: '月支出', value: expenseTotal.value, color: '#c2454d' },
    { label: '月结余', value: balance.value, color: balance.value >= 0 ? '#3a5a8c' : '#c2454d' }
  ]
  const max = Math.max(...rows.map((row) => Math.abs(row.value)), 1)
  return rows.map((row) => ({ ...row, width: Math.max(Math.abs(row.value) / max * 196, row.value ? 4 : 0) }))
})

/* ---------- 导出 ---------- */
function exportCsv() {
  const header = ['类型', '名称', '类别', '金额(元/月)', '扣费日', '状态', '备注']
  const lines = records.value.map((r) => [
    r.type === 'income' ? '收入' : '支出',
    r.name,
    r.category,
    r.amount,
    r.dayOfMonth,
    r.active === false ? '已停用' : '生效中',
    (r.note || '').replace(/"/g, '""')
  ])
  const csv = [header, ...lines]
    .map((cols) => cols.map((cell) => (typeof cell === 'string' && /[",\n]/.test(cell) ? `"${cell}"` : cell)).join(','))
    .join('\n')
  downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), `月度收支登记_${dateStamp()}.csv`)
}

async function exportChartPng() {
  const svgs = [donutSvg.value, barSvg.value].filter(Boolean)
  if (!svgs.length) return
  error.value = ''

  try {
    const images = await Promise.all(svgs.map(svgToImage))
    const scale = 2
    const width = Math.max(...images.map((img) => img.width)) * scale
    const titleHeight = 44 * scale
    const height = titleHeight + images.reduce((sum, img) => sum + img.height * scale + 14 * scale, 6 * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#333333'
    ctx.font = `bold ${15 * scale}px Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif`
    ctx.fillText(`月度收支一览 · 生成于 ${new Date().toLocaleDateString('zh-CN')}`, 12 * scale, 28 * scale)

    let y = titleHeight
    for (const img of images) {
      ctx.drawImage(img, 12 * scale, y, img.width * scale, img.height * scale)
      y += img.height * scale + 14 * scale
    }

    await new Promise((resolve) => canvas.toBlob(resolve, 'image/png')).then((blob) => {
      if (blob) downloadBlob(blob, `月度收支图_${dateStamp()}.png`)
    })
  } catch (err) {
    error.value = '图表导出失败，请重试'
  }
}

function svgToImage(svg) {
  return new Promise((resolve, reject) => {
    const clone = svg.cloneNode(true)
    const viewBox = svg.getAttribute('viewBox') || '0 0 320 240'
    const [, , w, h] = viewBox.split(/\s+/).map(Number)
    clone.setAttribute('width', w)
    clone.setAttribute('height', h)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    const xml = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('svg render failed'))
    }
    img.src = url
  })
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

function dateStamp() {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
}

onMounted(load)
</script>

<style scoped>
.bills-page {
  max-width: 1060px;
  margin: 0 auto;
  padding: 28px 20px 72px;
  color: var(--text-main);
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.page-head h1 {
  font-size: 24px;
  letter-spacing: -0.02em;
  margin-bottom: 6px;
}

.page-head p {
  font-size: 14px;
  color: var(--text-secondary);
}

.head-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.ghost-btn,
.solid-btn {
  font-size: 13px;
  padding: 8px 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  background: #fff;
  color: var(--text-main);
  cursor: pointer;
  transition: transform 0.2s var(--smooth-ease), box-shadow 0.2s var(--smooth-ease), opacity 0.2s;
  text-decoration: none;
  display: inline-block;
}

.ghost-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.ghost-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.solid-btn {
  background: var(--primary-color, #9b2028);
  border-color: transparent;
  color: #fff;
}

.solid-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(155, 32, 40, 0.25);
}

.solid-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.error-bar {
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
  font-size: 13px;
}

.login-prompt {
  display: flex;
  gap: 18px;
  align-items: center;
  padding: 26px;
}

.prompt-icon {
  font-size: 40px;
}

.login-prompt h2 {
  font-size: 18px;
  margin-bottom: 6px;
}

.login-prompt p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

/* ---------- 汇总卡 ---------- */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}

.summary-card {
  padding: 16px 18px;
  border-top: 3px solid transparent;
}

.summary-card.tone-income { border-top-color: #2fb380; }
.summary-card.tone-expense { border-top-color: #c2454d; }
.summary-card.tone-balance { border-top-color: #3a5a8c; }
.summary-card.tone-daily { border-top-color: #d8a24e; }

.summary-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.summary-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.summary-card small {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

/* ---------- 表单 + 列表 ---------- */
.work-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 14px;
  margin-bottom: 18px;
}

.bill-form {
  padding: 20px;
  align-self: start;
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.form-head h2 {
  font-size: 16px;
}

.text-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}

.type-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 14px;
}

.type-btn {
  padding: 9px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  background: #fff;
  font-size: 14px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s var(--smooth-ease);
}

.type-btn.expense.active {
  background: rgba(194, 69, 77, 0.1);
  border-color: #c2454d;
  color: #9b2028;
  font-weight: 700;
}

.type-btn.income.active {
  background: rgba(47, 179, 128, 0.1);
  border-color: #2fb380;
  color: #1d8f63;
  font-weight: 700;
}

.field {
  display: block;
  margin-bottom: 12px;
}

.field > span {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 5px;
}

.field input,
.field select {
  width: 100%;
  padding: 9px 12px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  font-size: 14px;
  background: #fff;
  color: var(--text-main);
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 96px;
  gap: 10px;
}

.quick-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.chips-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.chip {
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px dashed #c2454d;
  color: #9b2028;
  background: rgba(194, 69, 77, 0.05);
  cursor: pointer;
}

.chip:hover {
  background: rgba(194, 69, 77, 0.12);
}

.form-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 4px;
}

.tip-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

/* ---------- 列表 ---------- */
.bill-list {
  padding: 20px;
  min-height: 240px;
  display: flex;
  flex-direction: column;
}

.list-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 14px;
}

.list-tab {
  padding: 8px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  background: #fff;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}

.list-tab em {
  font-style: normal;
  margin-left: 4px;
  font-size: 11px;
  opacity: 0.8;
}

.list-tab.active {
  border-color: var(--primary-color, #9b2028);
  color: var(--primary-color, #9b2028);
  font-weight: 700;
  background: rgba(155, 32, 40, 0.05);
}

.list-body {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.list-empty {
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
  padding: 32px 0;
}

.bill-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  margin-bottom: 8px;
  transition: opacity 0.25s var(--smooth-ease);
}

.bill-item.muted {
  opacity: 0.5;
}

.bill-item.muted .item-amount {
  text-decoration: line-through;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-name {
  display: block;
  font-size: 15px;
}

.paused-tag {
  font-size: 11px;
  font-weight: 400;
  color: #b4762a;
  background: rgba(180, 118, 42, 0.1);
  border-radius: 4px;
  padding: 1px 6px;
  margin-left: 6px;
}

.item-meta {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 3px;
}

.item-note {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-amount {
  font-size: 17px;
  white-space: nowrap;
}

.item-amount.expense { color: #9b2028; }
.item-amount.income { color: #1d8f63; }

.item-ops {
  display: flex;
  gap: 4px;
}

.op-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
}

.op-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.op-btn.danger:hover {
  background: rgba(239, 68, 68, 0.12);
}

.list-foot {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  font-size: 13px;
  color: var(--text-secondary);
}

.list-foot strong.expense { color: #9b2028; }
.list-foot strong.income { color: #1d8f63; }

/* ---------- 图表 ---------- */
.chart-card {
  padding: 20px;
}

.chart-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.chart-head h2 {
  font-size: 16px;
}

.chart-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.chart-block {
  display: flex;
  justify-content: center;
}

.chart-svg {
  max-width: 100%;
  height: auto;
}

/* ---------- 过渡动画 ---------- */
.bill-enter-active,
.bill-leave-active {
  transition: all 0.25s var(--smooth-ease);
}

.bill-enter-from,
.bill-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* ---------- 响应式 ---------- */
@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .work-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .page-head {
    flex-direction: column;
  }

  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
