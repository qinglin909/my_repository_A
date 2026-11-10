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

const charInput = ref('')
const searched = ref(false)
const result = ref(null)

// 内置深度解析字典（应对日常最容易混淆的繁简字）
const dictionary = {
  '爱': {
    char: '爱', traditional: '愛', radical: '爫', strokes: 10, structure: '上下结构',
    decomposition: '上为「爫」（爪），中为「冖」（覆盖），下为「心」与「夂」。',
    evolution: '「愛」在甲骨文和金文中，形似一个人双手捧心，表示内心深处的感情。小篆定型为「旡」在「心」上，后加「夂」表示行走，意为感情在心里流淌。',
    originalMeaning: '深厚的感情、喜爱。',
    extendedMeaning: '引申为对人或事物有深挚的感情；也指容易发生某种变化（如：铁爱生锈）。',
    pronunciation: '读音：ài。',
    diffNote: '简体字「爱」将中间的「心」变成了「友」的省形，但保留了「爫」和「冖」。注意：简体「爱」失去了「心」的意象，但在传统造字中，「爱」是必须用「心」的。'
  },
  '后': {
    char: '后', traditional: '後', radical: '口', strokes: 6, structure: '半包围结构',
    decomposition: '「后」上部为「厂」形（或说为「人」的变形），下部为「口」。',
    evolution: '「后」在甲骨文中像一个妇女生孩子，本义就是女性首领（如：王后）。后来简化时，把表示时间/方位的「後」（从彳，表示行走）合并到了「后」字中。',
    originalMeaning: '君主、帝王的正妻（如：皇后）。',
    extendedMeaning: '后被借用表示“时间在后的”、“方位在后的”（如：后天、后面），这一含义原本属于「後」字。',
    pronunciation: '读音：hòu。',
    diffNote: '【极易错】在古代，表示“君主妻子”只能用「后」（如：皇后）；表示“先后”只能用「後」（如：後來）。简体字统用「后」，但当你写繁体文时，绝不能把“皇后”写成“皇後”。'
  },
  '发': {
    char: '发', traditional: '發 / 髮', radical: '又 / 髟', strokes: 5, structure: '独体字',
    decomposition: '简体「发」是一个简化符号，无法直接拆解。繁体「發」上为「癶」（两足），下为「弓」「殳」。繁体「髮」上为「髟」（长发），下为「拔」音。',
    evolution: '「發」表示拉弓射箭，引申为出发、发生。「髮」在甲骨文中像人的头发飘逸。',
    originalMeaning: '发送、发射（發）；人的头发（髮）。',
    extendedMeaning: '引申为发生、发展、发达（發）；也指毛发相关（髮）。',
    pronunciation: '读音：fā（发出）；fà（头发）。',
    diffNote: '【简繁同形不同义】简体一个「发」，对应两个完全不同的繁体字。「发送」对应「發」；「头发」对应「髮」。写繁体时如果写“头發”就是错的。'
  },
  '干': {
    char: '干', traditional: '乾 / 幹 / 干', radical: '干', strokes: 3, structure: '独体字',
    decomposition: '甲骨文「干」像带有丫杈的木棍，是古代武器。繁体「乾」从乙、倝声；「幹」从木、倝声。',
    evolution: '「干」本义是盾牌（如：大动干戈）。后来被借用作多个繁体字的简化字。',
    originalMeaning: '盾牌，引申为触犯、干涉。',
    extendedMeaning: '（乾）表示干燥、干枯（如：乾燥）。（幹）表示树干、做事（如：幹活）。',
    pronunciation: '读音：gān（干燥、干涉）；gàn（干活）。',
    diffNote: '【三个字合并】干燥的「乾」（gān）、干活的「幹」（gàn）、干涉的「干」（gān），在简化字中全部合并为「干」。'
  }
}

const explainChar = () => {
  const char = charInput.value.trim()
  if (!char) return
  searched.value = true

  if (dictionary[char]) {
    result.value = dictionary[char]
  } else {
    // 兜底：如果没有收录
    result.value = {
      char: char,
      traditional: '暂无收录',
      radical: '未知',
      strokes: '-',
      structure: '未知',
      decomposition: '该字的高级字源数据暂未录入本地库。',
      evolution: '暂无字源演变信息。',
      originalMeaning: '暂无解析。',
      extendedMeaning: '暂无解析。',
      pronunciation: '暂无解析。',
      diffNote: '暂无繁简差异说明。如需完整字典库，建议后期接入“汉典”或“国学大师”API。'
    }
  }
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