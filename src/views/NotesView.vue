<template>
  <div class="notes-container">
    <!-- 左侧：笔记列表 -->
    <aside class="sidebar app-card">
      <div class="sidebar-header">
        <div class="header-top">
          <h2>我的文档</h2>
        </div>
        
        <div class="action-buttons">
          <button class="add-btn" @click="createNote">
            <span>+</span> 新建文档
          </button>
          
          <input 
            type="file" ref="fileInputRef" accept=".docx" multiple style="display: none" 
            @change="handleBatchWordImport" 
          />
          <button class="import-all-btn" @click="triggerImport" :disabled="isImporting">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            {{ isImporting ? '解析中...' : '批量导入 Word' }}
          </button>
        </div>
      </div>

      <div class="note-list">
        <div 
          v-for="note in notes" :key="note.id" class="note-item"
          :class="{ active: currentNoteId === note.id }" @click="selectNote(note.id)"
        >
          <div class="note-info">
            <div class="note-title">{{ note.title || '无标题文档' }}</div>
            <div class="note-time">{{ formatDate(note.updatedAt) }}</div>
          </div>
          <button class="delete-btn" @click.stop="deleteNote(note.id)" title="删除文档">
            🗑️
          </button>
        </div>
      </div>
    </aside>

    <!-- 右侧：编辑器 -->
    <main class="editor-layout app-card">
      <template v-if="currentNote">
        <!-- 工具栏 -->
        <div class="toolbar">
          <div class="tool-group">
            <button @click="formatDoc('bold')" title="加粗"><b>B</b></button>
            <button @click="formatDoc('formatBlock', '<h1>')" title="大标题">H1</button>
            <button @click="formatDoc('formatBlock', '<p>')" title="正文">正文</button>
          </div>
          <div class="divider"></div>
          <div class="tool-group">
            <button class="ai-btn" @click="generateAI" :disabled="aiLoading">
              {{ aiLoading ? '分析中...' : '✨ AI 智能总结' }}
            </button>
          </div>
          <div class="spacer"></div>
          <div class="export-dropdown">
            <button class="export-btn">📥 导出文档 ▾</button>
            <div class="dropdown-content">
              <button @click="exportAsMarkdown">导出为 Markdown</button>
              <button @click="exportAsPDF">导出为 PDF</button>
            </div>
          </div>
        </div>

        <!-- 工作区 -->
        <div class="workspace-bg">
          <div class="paper-wrapper">
            <h1 class="print-only-title">{{ currentNote.title }}</h1>
            <input 
              v-model="currentNote.title" class="title-input" 
              placeholder="请输入文档标题..." @input="saveNotes" 
            />
            <div 
              ref="editorRef" class="paper-content" contenteditable="true"
              @input="handleContentInput" v-html="currentNote.content"
              data-placeholder="开始记录你的灵感..."
            ></div>
          </div>
        </div>

        <!-- AI 面板 -->
        <transition name="slide">
          <div class="ai-panel app-card" v-if="showAIPanel">
            <div class="ai-header">
              <h3>✨ AI 分析结果</h3>
              <button class="close-btn" @click="showAIPanel = false">✕</button>
            </div>
            <div class="ai-body">
              <div class="ai-section">
                <h4>📌 重点总结</h4>
                <p class="ai-text">{{ aiResult.summary }}</p>
              </div>
              <div class="ai-section">
                <div class="chart-header">
                  <div class="chart-tabs">
                    <button :class="{ active: currentChart === 'flow' }" @click="switchChart('flow')">流程图</button>
                    <button :class="{ active: currentChart === 'sequence' }" @click="switchChart('sequence')">时序图</button>
                  </div>
                  <button class="download-chart-btn" @click="downloadChartImage">📥 下载图</button>
                </div>
                <div class="chart-wrapper" ref="chartWrapperRef">
                  <div ref="mermaidRef" class="mermaid-container"></div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </template>
      
      <div v-else class="empty-state">
        <div class="empty-icon">📝</div>
        <p>选择左侧文档，或新建一个开始记录</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import mermaid from 'mermaid'
import mammoth from 'mammoth'

// 🚨 请务必替换为你自己刚申请的智谱 API Key
const ZHIPU_API_KEY = 'dda7adde5ccc4c88920e0da8cdaa6531.8rdf5mTz54EWU8X5'

mermaid.initialize({ startOnLoad: false, theme: 'neutral', flowchart: { curve: 'basis' } })

const notes = ref([])
const currentNoteId = ref(null)
const editorRef = ref(null)
const mermaidRef = ref(null)
const chartWrapperRef = ref(null)
const fileInputRef = ref(null)
const isImporting = ref(false)
const showAIPanel = ref(false)
const aiLoading = ref(false)
const currentChart = ref('flow')
const aiResult = ref({ summary: '', flowCode: '', sequenceCode: '' })
const currentNote = computed(() => notes.value.find(n => n.id === currentNoteId.value) || null)

onMounted(() => {
  const saved = localStorage.getItem('my_workspace_notes_v2')
  if (saved) notes.value = JSON.parse(saved)
  if (notes.value.length > 0) currentNoteId.value = notes.value[0].id
})

const createNote = () => {
  const newNote = { id: Date.now(), title: '无标题文档', content: '<p><br></p>', updatedAt: Date.now() }
  notes.value.unshift(newNote)
  currentNoteId.value = newNote.id
  saveNotes()
}

const deleteNote = (id) => {
  if (confirm('确定要删除这篇文档吗？删除后不可恢复。')) {
    notes.value = notes.value.filter(n => n.id !== id)
    if (currentNoteId.value === id && notes.value.length > 0) {
      currentNoteId.value = notes.value[0].id
    } else if (notes.value.length === 0) {
      currentNoteId.value = null
    }
    saveNotes()
  }
}

const selectNote = (id) => { currentNoteId.value = id }
const formatDoc = (cmd, value = null) => {
  if (editorRef.value) editorRef.value.focus()
  document.execCommand(cmd, false, value)
  handleContentInput()
}
const handleContentInput = () => {
  if (editorRef.value && currentNote.value) {
    currentNote.value.content = editorRef.value.innerHTML
    saveNotes()
  }
}
const saveNotes = () => {
  if (currentNote.value) currentNote.value.updatedAt = Date.now()
  localStorage.setItem('my_workspace_notes_v2', JSON.stringify(notes.value))
}
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const triggerImport = () => fileInputRef.value.click()

const handleBatchWordImport = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  isImporting.value = true
  let successCount = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file.name.endsWith('.docx')) continue

    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      const fileName = file.name.replace('.docx', '')
      let htmlContent = result.value || '<p>文档为空</p>'
      const regex = new RegExp(`<h[1-3]>\\s*${fileName}\\s*</h[1-3]>`, 'i')
      htmlContent = htmlContent.replace(regex, '')
      
      const newNote = {
        id: Date.now() + i,
        title: fileName,
        content: htmlContent,
        updatedAt: Date.now()
      }
      
      notes.value.unshift(newNote)
      if (i === 0) currentNoteId.value = newNote.id
      successCount++
    } catch (error) {
      console.error(`解析 ${file.name} 失败:`, error)
    }
  }

  saveNotes()
  isImporting.value = false
  event.target.value = ''
  if (successCount > 0) alert(`成功批量导入 ${successCount} 篇文档！`)
}

const switchChart = async (type) => {
  currentChart.value = type
  await renderMermaid()
}

// 🚨 真实智谱 AI 调用逻辑
const generateAI = async () => {
  if (!currentNote.value || !editorRef.value) return
  const plainText = editorRef.value.innerText
  if (plainText.trim().length < 10) {
    alert('文章太短啦，多写几句 AI 才能分析出东西哦~')
    return
  }

  showAIPanel.value = true
  aiLoading.value = true
  aiResult.value = { summary: '智谱 AI 正在阅读并分析中...', flowCode: '', sequenceCode: '' }

  try {
		const res = await fetch('/zhipu/api/paas/v4/chat/completions', {
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${ZHIPU_API_KEY}`
		  },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          {
            role: 'system',
			content: '你是一个专业的文档分析助手。请阅读用户的文章，严格按照以下 JSON 格式返回，不要包含任何额外的话：{"summary": "用一句话总结文章的核心重点", "flowChart": "用 Mermaid 语法的 graph TD 格式画出文章的逻辑流程", "sequenceChart": "用 Mermaid 语法的 sequenceDiagram 格式画出可能存在的交互时序（如果没有交互则画整体流程）"}。注意：Mermaid 代码必须语法绝对规范，每个节点和 end 必须独立换行，不能有多余的中文标点。'          
			},
          { role: 'user', content: plainText }
        ]
      })
    })

    if (!res.ok) {
      throw new Error(`网络请求失败: HTTP ${res.status}`)
    }

    const json = await res.json()
    const content = json.choices[0].message.content
    
    try {
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleanJson)
      aiResult.value = {
        summary: parsed.summary || '未能提取出总结',
        flowCode: parsed.flowChart || 'graph TD\nA[无法生成]',
        sequenceCode: parsed.sequenceChart || 'sequenceDiagram\nA->>B: 无法生成'
      }
    } catch (e) {
      aiResult.value.summary = content
    }

    await nextTick()
    await renderMermaid()

  } catch (error) {
    console.error('AI 请求失败:', error)
    aiResult.value.summary = `请求失败：${error.message}`
    aiResult.value.flowCode = 'graph TD\nA[网络异常]'
    aiResult.value.sequenceCode = 'sequenceDiagram\nA->>B: 网络异常'
    await nextTick()
    await renderMermaid()
  } finally {
    aiLoading.value = false
  }
}

const renderMermaid = async () => {
  if (!mermaidRef.value) return
  mermaidRef.value.innerHTML = ''
  
  let code = currentChart.value === 'flow' ? aiResult.value.flowCode : aiResult.value.sequenceCode
  try {
    const { svg } = await mermaid.render('mermaid-graph-' + Date.now(), code)
    mermaidRef.value.innerHTML = svg
  } catch (error) {
    console.error('图表渲染失败:', error)
    mermaidRef.value.innerHTML = '<p style="color:red;font-size:12px;">图表解析失败，AI 可能输出了不规范的语法</p>'
  }
}

const downloadChartImage = () => {
  if (!mermaidRef.value) return
  const svgElement = mermaidRef.value.querySelector('svg')
  if (!svgElement) return

  const bbox = svgElement.getBoundingClientRect()
  const width = bbox.width || 800
  const height = bbox.height || 600

  const svgString = new XMLSerializer().serializeToString(svgElement)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  const canvas = document.createElement('canvas')
  const scale = 2
  canvas.width = width * scale
  canvas.height = height * scale
  
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.scale(scale, scale)

  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height)
    URL.revokeObjectURL(url)
    const pngUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = pngUrl
    a.download = `${currentChart.value === 'flow' ? '流程图' : '时序图'}_${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  img.src = url
}

const exportAsPDF = () => window.print()

const exportAsMarkdown = () => {
  if (!currentNote.value || !editorRef.value) return
  let text = editorRef.value.innerHTML
  text = text.replace(/<br\s*\/?>/gi, '\n')
             .replace(/<\/p>/gi, '\n\n')
             .replace(/<h[1-6]>/gi, (match) => {
                const level = match.match(/h([1-6])/)[1]
                return '#'.repeat(Number(level)) + ' '
             })
             .replace(/<\/h[1-6]>/gi, '\n\n')
             .replace(/<[^>]+>/g, '')
             .replace(/&nbsp;/g, ' ')
  
  const mdContent = `# ${currentNote.value.title}\n\n${text}`
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${currentNote.value.title || '未命名文档'}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
/* 为了保证不出错，直接复用上面一版无懈可击的 CSS 代码即可，不需要改动 */
.notes-container { display: flex; gap: 24px; height: calc(100vh - 120px); }
.sidebar { width: 280px; display: flex; flex-direction: column; padding: 24px 20px; flex-shrink: 0; }
.sidebar-header { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
.header-top h2 { margin: 0; font-size: 18px; font-weight: 800; color: var(--text-main); }
.action-buttons { display: flex; flex-direction: column; gap: 10px; }
.add-btn { width: 100%; background: #1a1a1a; color: #fff; border: none; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; justify-content: center; align-items: center; gap: 6px; }
.add-btn:hover { background: #333; }
.import-all-btn { width: 100%; background: #fff; color: #1a1a1a; border: 1px solid #e2e8f0; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; justify-content: center; align-items: center; gap: 6px; }
.import-all-btn:hover:not(:disabled) { background: #f8f9fb; border-color: #cbd5e1; }
.import-all-btn:disabled { opacity: 0.6; cursor: not-allowed; background: #f1f5f9; }
.note-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
.note-item { position: relative; display: flex; justify-content: space-between; align-items: center; padding: 14px; border-radius: 10px; cursor: pointer; border: 1px solid transparent; transition: 0.2s;}
.note-item:hover { background: #f8f9fb; }
.note-item.active { background: #fff; border-color: var(--primary-color); box-shadow: 0 4px 12px rgba(25,137,250,0.08); }
.note-info { flex: 1; overflow: hidden; }
.note-title { font-size: 15px; font-weight: 600; color: var(--text-main); margin-bottom: 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;}
.note-time { font-size: 12px; color: var(--text-muted); }
.delete-btn { opacity: 0; background: transparent; border: none; font-size: 16px; cursor: pointer; transition: 0.2s; padding: 4px; border-radius: 4px; color: #999; }
.note-item:hover .delete-btn { opacity: 1; }
.delete-btn:hover { background: #fee2e2; color: #ef4444; }
.editor-layout { flex: 1; display: flex; flex-direction: column; background: #f8f9fb; min-width: 0; position: relative; overflow: hidden;}
.toolbar { display: flex; align-items: center; padding: 12px 20px; background: #fff; border-bottom: 1px solid var(--border-color); gap: 12px; z-index: 10; }
.tool-group { display: flex; gap: 4px; }
.toolbar button { background: transparent; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: 0.2s;}
.toolbar button:hover { background: #f0f2f5; }
.divider { width: 1px; height: 16px; background: #ddd; }
.spacer { flex: 1; }
.ai-btn { background: linear-gradient(135deg, #1989fa, #8a2be2) !important; color: #fff !important; font-weight: bold; padding: 6px 16px !important; border-radius: 20px !important; }
.export-dropdown { position: relative; }
.export-btn { background: #f0f4f8; border: 1px solid #e2e8f0; font-weight: 600; color: #555; }
.dropdown-content { display: none; position: absolute; right: 0; top: 100%; background-color: white; min-width: 160px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 8px; z-index: 10; overflow: hidden; margin-top: 8px; border: 1px solid #eee;}
.export-dropdown:hover .dropdown-content { display: block; }
.dropdown-content button { color: #333; padding: 12px 16px; display: block; width: 100%; text-align: left; font-size: 13px; border:none; background:transparent; cursor: pointer;}
.dropdown-content button:hover { background-color: #f5f7fa; color: var(--primary-color); }
.workspace-bg { flex: 1; overflow-y: auto; background-color: #f4f5f7; padding: 40px 20px; display: flex; justify-content: center; }
.paper-wrapper { width: 100%; max-width: 850px; background: #fff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.06); padding: 60px 80px; min-height: 100%; display: flex; flex-direction: column;}
.title-input { width: 100%; border: none; outline: none; font-size: 36px; font-weight: 800; color: #1a1a1a; margin-bottom: 30px; background: transparent; font-family: 'Times New Roman', SimSun, serif;}
.paper-content { flex: 1; outline: none; font-family: 'Times New Roman', SimSun, serif; font-size: 17px; line-height: 1.9; color: #333; overflow-x: hidden; }
.paper-content:empty::before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
.paper-content :deep(h1) { font-size: 26px; font-weight: bold; text-align: center; margin: 40px 0 20px; }
.paper-content :deep(p) { text-indent: 2em; margin-bottom: 20px; text-align: justify; }
.paper-content :deep(p:has(img)) { text-indent: 0; text-align: center; }
.paper-content :deep(img) { max-width: 100% !important; height: auto !important; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin: 10px auto; display: block; }
.ai-panel { position: absolute; right: 24px; top: 70px; bottom: 24px; width: 400px; background: #fff; border-left: 1px solid var(--border-color); display: flex; flex-direction: column; z-index: 100; box-shadow: -10px 10px 40px rgba(0,0,0,0.08); border-radius: 12px;}
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); opacity: 0; }
.ai-header { display: flex; justify-content: space-between; padding: 20px; border-bottom: 1px solid #eee; background: #f8faff; border-radius: 12px 12px 0 0;}
.ai-header h3 { margin: 0; color: #1989fa; font-size: 16px; }
.close-btn { background: none; border: none; cursor: pointer; font-size: 16px; color: #999; }
.ai-body { padding: 20px; overflow-y: auto; flex: 1; }
.ai-section { margin-bottom: 30px; }
.ai-section h4 { margin: 0 0 12px 0; font-size: 15px; color: #333; border-left: 3px solid #1989fa; padding-left: 8px; }
.ai-text { font-size: 14px; line-height: 1.6; color: #555; background: #f9f9f9; padding: 12px; border-radius: 8px; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.chart-tabs { display: flex; gap: 8px; }
.chart-tabs button { background: #f0f2f5; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: 0.2s; }
.chart-tabs button.active { background: #1989fa; color: #fff; }
.download-chart-btn { background: #fff; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #555; transition: 0.2s; }
.download-chart-btn:hover { background: #f5f7fa; color: #1989fa; border-color: #1989fa; }
.chart-wrapper { background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #eee; display: flex; justify-content: center; overflow-x: auto; }
.mermaid-container { display: flex; justify-content: center; }
.empty-state { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #9ca3af; }
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
@media print {
  .sidebar, .toolbar, .ai-panel { display: none !important; }
  .notes-container, .editor-layout, .workspace-bg, .paper-wrapper { display: block !important; height: auto !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; background: #fff !important; border: none !important; box-shadow: none !important; max-width: none !important; }
  .print-only-title { display: block; text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 30px; font-family: 'Times New Roman', SimSun, serif; }
  .title-input { display: none; }
  .paper-content { box-shadow: none !important; padding: 0 !important; min-height: auto !important; }
}
</style>