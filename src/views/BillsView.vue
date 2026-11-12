<!-- 月度收支登记：页面壳（状态 / 接口 / 导出），视图细节见 components/Bills -->
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

      <BillsSummary
        :income-total="incomeTotal"
        :expense-total="expenseTotal"
        :income-count="incomeCount"
        :expense-count="expenseCount"
        :balance="balance"
      />

      <div class="work-grid">
        <BillForm
          ref="formRef"
          :saving="saving"
          :loading="loading"
          @submit="submitBill"
          @cancel="error = ''"
        />
        <BillList
          v-model:active-tab="activeTab"
          :list="currentList"
          :loading="loading"
          :expense-count="expenseCount"
          :income-count="incomeCount"
          @edit="editBill"
          @remove="removeBill"
          @toggle="toggleActive"
        />
      </div>

      <BillCharts
        ref="chartsRef"
        :donut-segments="donutSegments"
        :expense-total="expenseTotal"
        :expense-count="expenseCount"
        :bar-rows="barRows"
        :palette="PALETTE"
      />
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiFetch } from '@/utils/apiClient'
import { useUserStore } from '@/stores/user'
import { PALETTE } from '@/components/Bills/constants'
import BillsSummary from '@/components/Bills/BillsSummary.vue'
import BillForm from '@/components/Bills/BillForm.vue'
import BillList from '@/components/Bills/BillList.vue'
import BillCharts from '@/components/Bills/BillCharts.vue'
import '@/components/Bills/bills.css'

const userStore = useUserStore()

const records = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const activeTab = ref('expense')
const formRef = ref(null)
const chartsRef = ref(null)

/* ---------- 汇总 ---------- */
const activeRecords = computed(() => records.value.filter((r) => r.active !== false))
const sumOf = (type) => activeRecords.value
  .filter((r) => r.type === type)
  .reduce((sum, r) => sum + Number(r.amount || 0), 0)
const countOf = (type) => activeRecords.value.filter((r) => r.type === type).length

const incomeTotal = computed(() => sumOf('income'))
const expenseTotal = computed(() => sumOf('expense'))
const incomeCount = computed(() => countOf('income'))
const expenseCount = computed(() => countOf('expense'))
const balance = computed(() => incomeTotal.value - expenseTotal.value)
const currentList = computed(() =>
  records.value.filter((r) => r.type === activeTab.value).sort((a, b) => b.amount - a.amount)
)

/* ---------- 图表数据 ---------- */
const expenseByCategory = computed(() => {
  const map = new Map()
  for (const r of activeRecords.value) {
    if (r.type !== 'expense') continue
    map.set(r.category, (map.get(r.category) || 0) + Number(r.amount || 0))
  }
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
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
    // 单一类别独占整圆时拆成两段半环，避免 A 指令 360° 退化不渲染
    const spans = share >= 0.9999
      ? [[angle, angle + Math.PI], [angle + Math.PI, angle + Math.PI * 2]]
      : [[angle, angle + share * Math.PI * 2]]
    const path = spans.map(([a0, a1]) => {
      const large = a1 - a0 > Math.PI ? 1 : 0
      return `M ${point(rOuter, a0)} A ${rOuter} ${rOuter} 0 ${large} 1 ${point(rOuter, a1)} `
        + `L ${point(rInner, a1)} A ${rInner} ${rInner} 0 ${large} 0 ${point(rInner, a0)} Z`
    }).join(' ')
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
  return rows.map((row) => ({
    ...row,
    width: Math.max(Math.abs(row.value) / max * 196, row.value ? 4 : 0)
  }))
})

/* ---------- 接口 ---------- */
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
    records.value = []
  } finally {
    loading.value = false
  }
}

async function submitBill({ id, payload }) {
  if (payload.dayOfMonth < 1 || payload.dayOfMonth > 31) {
    error.value = '扣费日需为 1-31'
    return
  }

  saving.value = true
  error.value = ''
  try {
    const res = await apiFetch(id ? `/api/bills/${id}` : '/api/bills', {
      method: id ? 'PUT' : 'POST',
      token: userStore.token,
      body: payload
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || '保存失败，请稍后重试')

    if (id) {
      const index = records.value.findIndex((r) => String(r.id) === String(id))
      if (index > -1) records.value.splice(index, 1, { ...records.value[index], ...data.data })
    } else {
      records.value.push(data.data)
    }
    formRef.value?.reset()
  } catch (err) {
    error.value = err.message || '保存失败，请稍后重试'
  } finally {
    saving.value = false
  }
}

function editBill(bill) {
  formRef.value?.fillFrom(bill)
  error.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
  const svgs = [chartsRef.value?.donutSvg, chartsRef.value?.barSvg].filter(Boolean)
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

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (blob) downloadBlob(blob, `月度收支图_${dateStamp()}.png`)
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

    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }))
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('svg render failed')) }
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
