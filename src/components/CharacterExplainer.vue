<template>
  <div class="explainer-card">
    <div class="header">
      <h3>📖 繁体字源与字形剖析工具</h3>
      <p>输入单字，解析字形结构、字源演变、本义与繁简差异</p>
    </div>

    <!-- 搜索区 -->
    <div class="search-row">
      <input 
        type="text" 
        v-model="charInput" 
        maxlength="1" 
        placeholder="请输入要查询的汉字" 
        @keyup.enter="explainChar"
        class="char-input"
      />
      <button class="primary-btn" @click="explainChar" :disabled="!charInput">深度解字</button>
    </div>

    <!-- 结果展示区 -->
    <div v-if="result" class="result-box">
      
      <!-- 头部：大字与基本信息 -->
      <div class="char-header">
        <div class="main-char">{{ result.char }}</div>
        <div class="basic-info">
          <div class="info-tag">繁体：{{ result.traditional }}</div>
          <div class="info-tag">部首：{{ result.radical }}</div>
          <div class="info-tag">笔画：{{ result.strokes }}画</div>
          <div class="info-tag">结构：{{ result.structure }}</div>
        </div>
      </div>

      <!-- 1. 字形拆解 -->
      <div class="section-box">
        <h4>🧩 字形拆解</h4>
        <p>{{ result.decomposition }}</p>
      </div>

      <!-- 2. 字源演变 -->
      <div class="section-box">
        <h4>🏺 字源演变</h4>
        <p>{{ result.evolution }}</p>
      </div>

      <!-- 3. 本义与引申义 -->
      <div class="section-box">
        <h4>📚 本义与引申义</h4>
        <div class="meaning-item">
          <span class="badge">本义</span>
          <p>{{ result.originalMeaning }}</p>
        </div>
        <div class="meaning-item">
          <span class="badge outline">引申</span>
          <p>{{ result.extendedMeaning }}</p>
        </div>
      </div>

      <!-- 4. 读音与异体 -->
      <div class="section-box">
        <h4>🗣️ 读音与异体字</h4>
        <p>{{ result.pronunciation }}</p>
      </div>

      <!-- 5. 繁简差异 -->
      <div class="section-box tip-box" v-if="result.diffNote">
        <h4>⚠️ 繁简差异说明</h4>
        <p>{{ result.diffNote }}</p>
      </div>

    </div>

    <div v-else-if="searched && !result" class="empty-box">
      未找到该字的深度解析数据，请尝试换一个常见字。
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { lookupChar } from '@/data/charDictionary'

const charInput = ref('')
const searched = ref(false)
const result = ref(null)

const explainChar = () => {
  const char = charInput.value.trim()
  if (!char) return
  searched.value = true
  result.value = lookupChar(char)
}
</script>

<style scoped>
.explainer-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
  margin-top: 24px;
}
.header { margin-bottom: 20px; }
.header h3 { margin: 0 0 8px 0; font-size: 18px; color: #1e293b; }
.header p { margin: 0; font-size: 13px; color: #64748b; }

/* 搜索区 */
.search-row { display: flex; gap: 12px; margin-bottom: 20px; }
.char-input {
  flex: 1; padding: 10px 14px; font-size: 16px;
  border: 1px solid #cbd5e1; border-radius: 8px; outline: none;
}
.char-input:focus { border-color: #1e88e5; }
.primary-btn { padding: 0 24px; font-size: 15px; font-weight: 600; color: #fff; background-color: #1e88e5; border: none; border-radius: 8px; cursor: pointer; }
.primary-btn:disabled { background-color: #9ca3af; cursor: not-allowed; }

/* 结果区 */
.result-box { display: flex; flex-direction: column; gap: 20px; }

.char-header { display: flex; align-items: center; gap: 24px; background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; }
.main-char { font-size: 72px; font-weight: bold; color: #1e293b; line-height: 1; }
.basic-info { display: flex; flex-wrap: wrap; gap: 8px; }
.info-tag { background: #fff; border: 1px solid #cbd5e1; padding: 4px 12px; border-radius: 6px; font-size: 13px; color: #475569; font-weight: 600; }

/* 解析模块 */
.section-box { background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
.section-box h4 { margin: 0 0 12px 0; font-size: 15px; color: #1e293b; display: flex; align-items: center; gap: 6px; }
.section-box p { margin: 0; font-size: 14px; color: #334155; line-height: 1.6; }

.meaning-item { display: flex; gap: 12px; margin-bottom: 12px; }
.meaning-item:last-child { margin-bottom: 0; }
.badge { background: #1e88e5; color: #fff; font-size: 12px; padding: 2px 8px; border-radius: 4px; height: fit-content; }
.badge.outline { background: #eff6ff; color: #1e88e5; border: 1px solid #bfdbfe; }

.tip-box { background: #fffbeb; border-color: #fde68a; }
.tip-box h4 { color: #d97706; }
.tip-box p { color: #92400e; }

.empty-box { text-align: center; padding: 40px; color: #94a3b8; background: #f8fafc; border-radius: 12px; font-size: 14px; }
</style>