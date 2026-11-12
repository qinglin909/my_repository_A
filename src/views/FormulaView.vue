<!-- 公式助手：Excel / WPS / Google Sheets 公式生成、解释、修错 -->
<template>
  <section class="formula-page">
    <header class="page-head">
      <div>
        <h1>公式助手</h1>
        <p>说清你要做的事，或者把看不懂、报错的公式粘进来。</p>
      </div>
      <a class="ext-link" href="https://formulaease.com/" target="_blank" rel="noopener noreferrer">
        打开 FormulaEase ↗
      </a>
    </header>

    <div class="mode-tabs" role="tablist">
      <button
        v-for="mode in modes"
        :key="mode.key"
        type="button"
        class="mode-tab"
        :class="{ active: activeMode === mode.key }"
        role="tab"
        :aria-selected="activeMode === mode.key"
        @click="switchMode(mode.key)"
      >
        <span class="mode-icon">{{ mode.icon }}</span>
        <span class="mode-text">
          <strong>{{ mode.label }}</strong>
          <small>{{ mode.hint }}</small>
        </span>
      </button>
    </div>

    <div class="editor-card">
      <div class="editor-top">
        <label class="field">
          <span>目标软件</span>
          <select v-model="target">
            <option>Excel</option>
            <option>WPS</option>
            <option>Google Sheets</option>
          </select>
        </label>
        <span class="char-count">{{ input.length }} / 2000</span>
      </div>

      <textarea
        v-model="input"
        class="editor-input"
        :placeholder="currentMode.placeholder"
        maxlength="2000"
        rows="5"
        @keydown.ctrl.enter="submit"
        @keydown.meta.enter="submit"
      ></textarea>

      <div class="editor-foot">
        <span class="tip-hint">Ctrl / ⌘ + Enter 快速提交</span>
        <button type="button" class="submit-btn" :disabled="loading || !input.trim()" @click="submit">
          {{ loading ? '思考中…' : currentMode.action }}
        </button>
      </div>
    </div>

    <p v-if="error" class="error-bar">{{ error }}</p>

    <article v-if="result" class="result-card">
      <div class="formula-box">
        <code class="formula-text">{{ result.formula }}</code>
        <button type="button" class="copy-btn" @click="copyFormula">
          {{ copied ? '已复制' : '复制' }}
        </button>
      </div>

      <div v-if="result.explanation" class="result-block">
        <h3>怎么理解</h3>
        <p>{{ result.explanation }}</p>
      </div>

      <div v-if="result.example" class="result-block">
        <h3>举个例子</h3>
        <p>{{ result.example }}</p>
      </div>

      <div v-if="result.tips?.length" class="result-block">
        <h3>注意</h3>
        <ul>
          <li v-for="(tip, index) in result.tips" :key="index">{{ tip }}</li>
        </ul>
      </div>
    </article>

    <section v-if="history.length" class="history">
      <div class="history-head">
        <h2>最近查过</h2>
        <button type="button" class="clear-btn" @click="clearHistory">清空</button>
      </div>
      <ul>
        <li v-for="item in history" :key="item.id">
          <button type="button" class="history-item" @click="restore(item)">
            <span class="history-mode">{{ modeLabel(item.mode) }}</span>
            <span class="history-input">{{ item.input }}</span>
            <span class="history-formula">{{ item.result.formula }}</span>
          </button>
        </li>
      </ul>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiFetch } from '@/utils/apiClient'

const HISTORY_KEY = 'formula_helper_history'
const MAX_HISTORY = 6

const modes = [
  {
    key: 'generate',
    icon: '✨',
    label: '生成公式',
    hint: '知道要什么，不知道怎么写',
    action: '生成公式',
    placeholder: '例：A 列是订单日期，B 列是金额，我想统计本月华东区的订单总金额，且只算已完成状态（C 列）。'
  },
  {
    key: 'explain',
    icon: '🔍',
    label: '看懂公式',
    hint: '别人写的公式，看不懂',
    action: '解释公式',
    placeholder: '把公式粘进来，例如：=IFERROR(INDEX(B:B,MATCH(1,(A:A=D2)*(C:C="完成"),0)),"")'
  },
  {
    key: 'fix',
    icon: '🛠️',
    label: '修复报错',
    hint: '公式不对，或结果不对',
    action: '修复公式',
    placeholder: '例：=VLOOKUP(A2,Sheet2!A:B,3,0) 返回 #REF!，我期望按编号查出第三列的名称。'
  }
]

const activeMode = ref('generate')
const input = ref('')
const target = ref('Excel')
const loading = ref(false)
const error = ref('')
const result = ref(null)
const copied = ref(false)
const history = ref([])

const currentMode = computed(() => modes.find((mode) => mode.key === activeMode.value) || modes[0])

function switchMode(key) {
  if (loading.value) return
  activeMode.value = key
  error.value = ''
}

async function submit() {
  const text = input.value.trim()
  if (!text || loading.value) return

  loading.value = true
  error.value = ''
  result.value = null

  try {
    const response = await apiFetch('/api/formula', {
      method: 'POST',
      body: { task: activeMode.value, input: text, target: target.value }
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.message || '生成失败，请稍后重试')

    result.value = payload.data
    pushHistory(text)
  } catch (err) {
    error.value = err.message || '生成失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function copyFormula() {
  if (!result.value) return
  try {
    await navigator.clipboard.writeText(result.value.formula)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    error.value = '复制失败，请手动选中复制'
  }
}

function pushHistory(text) {
  history.value = [
    {
      id: `${Date.now()}`,
      mode: activeMode.value,
      target: target.value,
      input: text,
      result: result.value
    },
    ...history.value.filter((item) => !(item.mode === activeMode.value && item.input === text))
  ].slice(0, MAX_HISTORY)
  persist()
}

function restore(item) {
  activeMode.value = item.mode
  target.value = item.target
  input.value = item.input
  result.value = item.result
  error.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function clearHistory() {
  history.value = []
  persist()
}

function persist() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
  } catch {
    /* 存储不可用时静默降级，不影响主流程 */
  }
}

function modeLabel(key) {
  return modes.find((mode) => mode.key === key)?.label || '查询'
}

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    if (Array.isArray(saved)) history.value = saved.slice(0, MAX_HISTORY)
  } catch {
    history.value = []
  }
})
</script>

<style scoped>
.formula-page {
  max-width: 960px;
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

.ext-link {
  flex-shrink: 0;
  font-size: 13px;
  padding: 8px 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  background: #fff;
  color: var(--primary-color);
  text-decoration: none;
  transition: transform 0.25s var(--smooth-ease), box-shadow 0.25s var(--smooth-ease);
}

.ext-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(25, 137, 250, 0.14);
}

.mode-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.mode-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.25s var(--smooth-ease), box-shadow 0.25s var(--smooth-ease),
    transform 0.25s var(--spring-ease);
}

.mode-tab:hover {
  transform: translateY(-1px);
}

.mode-tab.active {
  border-color: var(--primary-color);
  box-shadow: 0 6px 18px rgba(25, 137, 250, 0.16);
}

.mode-icon {
  font-size: 18px;
}

.mode-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mode-text strong {
  font-size: 14px;
}

.mode-text small {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 14px 16px 12px;
}

.editor-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.field {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.field select {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 5px 8px;
  font-size: 13px;
  background: var(--bg-color);
  color: var(--text-main);
  outline: none;
}

.char-count {
  font-size: 12px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.editor-input {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.7;
  resize: vertical;
  min-height: 120px;
  outline: none;
  background: var(--bg-color);
  color: var(--text-main);
  transition: border-color 0.2s var(--smooth-ease), background 0.2s var(--smooth-ease);
}

.editor-input:focus {
  border-color: var(--primary-color);
  background: #fff;
}

.editor-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.tip-hint {
  font-size: 12px;
  color: var(--text-muted);
}

.submit-btn {
  border: none;
  border-radius: var(--radius-lg);
  background: var(--primary-color);
  color: #fff;
  font-size: 14px;
  padding: 9px 22px;
  cursor: pointer;
  transition: transform 0.25s var(--spring-ease), opacity 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.error-bar {
  margin-top: 14px;
  padding: 10px 14px;
  font-size: 13px;
  color: #c0392b;
  background: #fdecea;
  border-radius: 10px;
}

.result-card {
  margin-top: 16px;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  animation: rise 0.35s var(--smooth-ease);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.formula-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f4f8ff;
  border: 1px solid rgba(25, 137, 250, 0.18);
}

.formula-text {
  flex: 1;
  font-family: 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;
  font-size: 13.5px;
  line-height: 1.7;
  word-break: break-all;
  color: #1a4d8f;
}

.copy-btn {
  flex-shrink: 0;
  border: 1px solid rgba(25, 137, 250, 0.35);
  background: #fff;
  color: var(--primary-color);
  font-size: 12px;
  padding: 5px 12px;
  border-radius: var(--radius-lg);
  cursor: pointer;
}

.result-block {
  margin-top: 16px;
}

.result-block h3 {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.result-block p,
.result-block li {
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-secondary);
}

.result-block ul {
  padding-left: 18px;
}

.history {
  margin-top: 32px;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.history-head h2 {
  font-size: 15px;
  color: var(--text-secondary);
}

.clear-btn {
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
}

.history ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
}

.history-item {
  width: 100%;
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 4px 12px;
  text-align: left;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s var(--smooth-ease);
}

.history-item:hover {
  border-color: rgba(25, 137, 250, 0.45);
}

.history-mode {
  font-size: 12px;
  color: var(--primary-color);
}

.history-input {
  font-size: 13px;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-formula {
  grid-column: 2;
  font-family: Consolas, monospace;
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .mode-tabs {
    grid-template-columns: 1fr;
  }
  .mode-text small {
    display: none;
  }
  .page-head {
    flex-direction: column;
  }
}
</style>
