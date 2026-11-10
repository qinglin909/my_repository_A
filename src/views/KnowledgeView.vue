<template>
  <section class="knowledge-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">PERSONAL KNOWLEDGE BASE</span>
        <h1>知识向量库</h1>
        <p>使用 qwen3.7-text-embedding 检索资料，再由 Qwen 根据原文回答并列出来源。</p>
      </div>
      <div class="header-count"><strong>{{ documents.length }}</strong><span>篇资料</span></div>
    </header>

    <div class="workspace-grid">
      <section class="panel add-panel">
        <div class="panel-heading"><span class="panel-icon">＋</span><div><h2>添加知识</h2><p>粘贴文字，保存后立即建立索引</p></div></div>
        <form @submit.prevent="addDocument">
          <label for="doc-title">资料标题</label>
          <input id="doc-title" v-model.trim="form.title" maxlength="160" placeholder="例如：项目规范、学习笔记" required />
          <label for="doc-content">资料内容</label>
          <textarea id="doc-content" v-model="form.content" rows="12" maxlength="500000" placeholder="粘贴需要检索的正文内容……" required></textarea>
          <div class="form-foot"><span>{{ form.content.length.toLocaleString() }} 字符</span><span>自动分块 · 检索增强回答</span></div>
          <p v-if="addError" class="error" role="alert">{{ addError }}</p>
          <button class="primary-btn" type="submit" :disabled="adding || !form.title || !form.content.trim()">{{ adding ? '正在建立索引…' : '保存并建立索引' }}</button>
        </form>
      </section>

      <section class="panel search-panel">
        <div class="panel-heading"><span class="panel-icon search-icon">⌕</span><div><h2>语义检索</h2><p>输入问题或关键词，查看最相关的原文片段</p></div></div>
        <form class="search-form" @submit.prevent="searchKnowledge">
          <input v-model.trim="query" maxlength="1000" placeholder="例如：特控线以上怎么校准？" aria-label="知识库搜索内容" />
          <button class="primary-btn" type="submit" :disabled="searching || !query">{{ searching ? '检索并生成回答…' : '搜索并回答' }}</button>
        </form>
        <p v-if="searchError" class="error" role="alert">{{ searchError }}</p>
        <div v-if="answer" class="answer-card">
          <div class="answer-heading"><strong>Qwen 知识回答</strong><span>{{ answerModel }}</span></div>
          <p>{{ answer }}</p>
        </div>
        <div v-if="searched && !results.length && !searching" class="empty-results">没有找到匹配片段。试试换个问法，或先添加相关资料。</div>
        <div v-if="results.length" class="results-list">
          <article v-for="(result, index) in results" :key="`${result.documentId}-${result.chunkIndex}`" class="result-card">
            <div class="result-meta"><span class="result-number">{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ result.title }}</strong><span class="similarity">匹配度 {{ Math.round(result.score * 100) }}%</span></div>
            <p>{{ result.text }}</p>
            <small>原文片段 {{ result.chunkIndex + 1 }}</small>
          </article>
        </div>
        <div v-else-if="!searched" class="search-hint">检索只返回资料片段，不会编造答案。</div>
      </section>
    </div>

    <section class="panel documents-panel">
      <div class="panel-heading"><span class="panel-icon">卷</span><div class="catalog-title"><h2>资料目录</h2><p>已索引的知识文档 · {{ embeddingModel }}</p></div><button class="reindex-btn" type="button" :disabled="reindexing || !documents.length" @click="reindexDocuments">{{ reindexing ? '重建中…' : '重建旧索引' }}</button></div>
      <p v-if="listError" class="error" role="alert">{{ listError }}</p>
      <div v-if="loadingDocs" class="empty-results">正在读取资料目录…</div>
      <div v-else-if="!documents.length" class="empty-results">还没有知识资料。添加第一篇资料后即可搜索。</div>
      <div v-else class="documents-list">
        <article v-for="doc in documents" :key="doc.id" class="document-row">
          <div class="doc-mark">知</div>
          <div class="doc-info"><strong>{{ doc.title }}</strong><small>{{ doc.chunkCount }} 个文本块 · {{ formatDate(doc.updatedAt) }}</small></div>
          <button class="delete-btn" type="button" :disabled="deletingId === doc.id" @click="deleteDocument(doc)">{{ deletingId === doc.id ? '删除中…' : '删除' }}</button>
        </article>
      </div>
      <p class="storage-note">资料和向量保存在服务器 LowDB（db.json）。当前显示的索引方式以服务器状态为准；DashScope 密钥仅配置在后端环境变量。</p>
    </section>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'

const documents = ref([])
const results = ref([])
const answer = ref('')
const answerModel = ref('qwen/qwen3.8-flash-next')
const query = ref('')
const searched = ref(false)
const loadingDocs = ref(false)
const adding = ref(false)
const searching = ref(false)
const deletingId = ref('')
const reindexing = ref(false)
const embeddingModel = ref('qwen3.7-text-embedding（等待 DashScope 配置）')
const addError = ref('')
const searchError = ref('')
const listError = ref('')
const form = reactive({ title: '', content: '' })

const authorizedFetch = (url, options = {}) => {
  const token = localStorage.getItem('userToken')
  if (!token) throw new Error('登录状态缺少凭证，请退出后重新登录')
  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(url, { ...options, headers })
}

const readError = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/html')) {
    return 'API 返回了网页而不是 JSON：线上后端尚未部署知识库接口，请先更新 API 服务器。'
  }
  try {
    const body = await response.json()
    return body.message || `请求失败 (${response.status})`
  } catch {
    return `服务器返回格式异常 (${response.status})，请检查 API 后端部署。`
  }
}

const loadDocuments = async () => {
  loadingDocs.value = true
  listError.value = ''
  try {
    const response = await authorizedFetch('/api/knowledge/docs')
    if (!response.ok) throw new Error(await readError(response))
    if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('API 返回了网页而不是 JSON：线上后端尚未部署知识库接口，请先更新 API 服务器。')
    const data = await response.json()
    documents.value = data.docs || []
    embeddingModel.value = data.embeddingModel || 'qwen3.7-text-embedding'
  } catch (error) {
    listError.value = error.message
    if (/凭证|登录/.test(error.message)) {
      localStorage.removeItem('userToken')
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
  } finally {
    loadingDocs.value = false
  }
}

const addDocument = async () => {
  addError.value = ''
  adding.value = true
  try {
    const response = await authorizedFetch('/api/knowledge/docs', {
      method: 'POST',
      body: JSON.stringify({ title: form.title, content: form.content })
    })
    if (!response.ok) throw new Error(await readError(response))
    if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('API 返回了网页而不是 JSON：线上后端尚未部署知识库接口，请先更新 API 服务器。')
    form.title = ''
    form.content = ''
    await loadDocuments()
  } catch (error) {
    addError.value = error.message
  } finally {
    adding.value = false
  }
}

const searchKnowledge = async () => {
  if (!query.value) return
  searching.value = true
  searched.value = true
  searchError.value = ''
  results.value = []
  answer.value = ''
  try {
    const response = await authorizedFetch('/api/knowledge/search', {
      method: 'POST',
      body: JSON.stringify({ query: query.value, limit: 6 })
    })
    if (!response.ok) throw new Error(await readError(response))
    if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('API 返回了网页而不是 JSON：线上后端尚未部署知识库接口，请先更新 API 服务器。')
    const data = await response.json()
    results.value = data.results || []
    answer.value = data.answer || ''
    answerModel.value = data.answerModel || answerModel.value
    embeddingModel.value = data.model || embeddingModel.value
  } catch (error) {
    searchError.value = error.message
    if (/凭证|登录/.test(error.message)) {
      localStorage.removeItem('userToken')
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
  } finally {
    searching.value = false
  }
}

const reindexDocuments = async () => {
  if (!confirm('重建会重新调用 Embedding 模型并产生相应 API 用量，继续吗？')) return
  reindexing.value = true
  listError.value = ''
  try {
    const response = await authorizedFetch('/api/knowledge/reindex', { method: 'POST', body: JSON.stringify({}) })
    if (!response.ok) throw new Error(await readError(response))
    if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('API 返回了网页而不是 JSON：线上后端尚未部署知识库接口，请先更新 API 服务器。')
    const data = await response.json()
    embeddingModel.value = data.remoteEmbeddings ? (data.model || 'DashScope Embedding') : '本地词项向量（DashScope 未配置）'
    await loadDocuments()
    alert(`已用 ${embeddingModel.value} 重建 ${data.reindexed} 个文本块索引。`)
  } catch (error) {
    listError.value = error.message
  } finally {
    reindexing.value = false
  }
}

const deleteDocument = async (doc) => {
  if (!confirm(`确定删除“${doc.title}”及其索引吗？`)) return
  deletingId.value = doc.id
  listError.value = ''
  try {
    const response = await authorizedFetch(`/api/knowledge/docs/${encodeURIComponent(doc.id)}`, { method: 'DELETE' })
    if (!response.ok) throw new Error(await readError(response))
    if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('API 返回了网页而不是 JSON：线上后端尚未部署知识库接口，请先更新 API 服务器。')
    documents.value = documents.value.filter(item => item.id !== doc.id)
    results.value = results.value.filter(item => item.documentId !== doc.id)
  } catch (error) {
    listError.value = error.message
  } finally {
    deletingId.value = ''
  }
}

const formatDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(loadDocuments)
</script>

<style scoped>
.knowledge-page { max-width: 1120px; margin: 0 auto; padding: 34px 22px 56px; color: #252a33; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-bottom: 26px; }
.eyebrow { color: #9a7425; font-size: 11px; font-weight: 800; letter-spacing: .16em; }
h1 { margin: 8px 0; color: #24201b; font-size: clamp(27px, 4vw, 36px); }
.page-header p { margin: 0; color: #777064; font-size: 14px; line-height: 1.7; }
.header-count { display: flex; align-items: baseline; gap: 7px; color: #777064; white-space: nowrap; }
.header-count strong { color: #a93632; font-size: 28px; }
.workspace-grid { display: grid; grid-template-columns: minmax(280px, .86fr) minmax(0, 1.4fr); gap: 18px; align-items: start; }
.panel { padding: 22px; border: 1px solid #e8e0d2; border-radius: 16px; background: rgba(255, 253, 248, .94); box-shadow: 0 12px 34px rgba(64, 48, 27, .07); }
.panel-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.panel-icon { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 11px; background: #f4eee0; color: #9a7425; font-size: 19px; font-weight: 700; }
.search-icon { font-size: 27px; }
.panel-heading h2 { margin: 0; color: #2b261f; font-size: 17px; }
.panel-heading p { margin: 4px 0 0; color: #81796d; font-size: 12px; }
.catalog-title { flex: 1; }
.reindex-btn { padding: 8px 10px; border: 1px solid #e6d7b7; border-radius: 8px; background: #fffefa; color: #8a6929; font-size: 11px; cursor: pointer; }
.reindex-btn:disabled { opacity: .5; cursor: wait; }
form label { display: block; margin: 14px 0 6px; color: #554d41; font-size: 12px; font-weight: 700; }
input:not([type=radio]), textarea { width: 100%; box-sizing: border-box; border: 1px solid #ded5c5; border-radius: 9px; background: #fffefa; color: #28241e; font: inherit; font-size: 13px; padding: 10px 12px; outline: none; }
input:focus, textarea:focus { border-color: #b28b3f; box-shadow: 0 0 0 3px rgba(178, 139, 63, .12); }
textarea { resize: vertical; min-height: 190px; line-height: 1.7; }
.form-foot { display: flex; justify-content: space-between; gap: 8px; margin-top: 7px; color: #8b8377; font-size: 11px; }
.primary-btn { min-height: 40px; padding: 0 17px; border: 0; border-radius: 9px; background: #9f302d; color: white; font-weight: 700; cursor: pointer; }
.add-panel .primary-btn { width: 100%; margin-top: 15px; }
.primary-btn:disabled { opacity: .55; cursor: wait; }
.search-form { display: flex; gap: 8px; }
.search-form input { flex: 1; min-width: 0; }
.search-form .primary-btn { flex-shrink: 0; }
.answer-card { margin-top: 16px; padding: 16px; border: 1px solid #ead9b7; border-radius: 11px; background: #fff8e9; }
.answer-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #583f17; font-size: 13px; }
.answer-heading span { color: #887759; font-size: 10px; }
.answer-card p { margin: 10px 0 0; color: #443d32; font-size: 13px; line-height: 1.8; white-space: pre-wrap; }
.search-hint, .empty-results { padding: 24px 14px; color: #877f73; font-size: 13px; line-height: 1.7; text-align: center; }
.results-list { display: grid; gap: 11px; margin-top: 18px; }
.result-card { padding: 14px; border: 1px solid #eee6d9; border-radius: 11px; background: #fffefa; }
.result-meta { display: flex; align-items: center; gap: 9px; }
.result-meta strong { flex: 1; color: #383127; font-size: 13px; }
.result-number { color: #aa3731; font-size: 11px; font-weight: 800; }
.similarity { color: #8b7550; font-size: 10px; white-space: nowrap; }
.result-card p { margin: 9px 0 7px; color: #595348; font-size: 12px; line-height: 1.75; white-space: pre-wrap; }
.result-card small { color: #92897b; font-size: 10px; }
.error { color: #b42318; font-size: 12px; line-height: 1.6; }
.documents-panel { margin-top: 18px; }
.documents-list { display: grid; }
.document-row { display: flex; align-items: center; gap: 12px; padding: 12px 2px; border-top: 1px solid #eee8dd; }
.doc-mark { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid #e6d7b7; color: #9a7425; font-size: 14px; }
.doc-info { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 4px; }
.doc-info strong { overflow: hidden; color: #352f26; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.doc-info small { color: #898174; font-size: 11px; }
.delete-btn { border: 1px solid #ecd6d3; border-radius: 7px; background: #fff; color: #a93632; padding: 6px 10px; font-size: 11px; cursor: pointer; }
.delete-btn:disabled { opacity: .5; }
.storage-note { margin: 14px 0 0; color: #8b8377; font-size: 11px; line-height: 1.7; }
@media (max-width: 760px) { .knowledge-page { padding: 24px 14px 40px; } .page-header { align-items: flex-start; } .workspace-grid { grid-template-columns: 1fr; } .panel { padding: 17px; } }
</style>
