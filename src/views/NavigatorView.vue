<!-- 宝藏导航 + 秘密管理箱 -->
<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-text">
        <h1 class="title">工作与生活台</h1>
        <p class="subtitle">你的私人极客资源库与密码箱</p>
      </div>
      
      <!-- 全局搜索框 -->
      <div class="search-box app-card">
        <span class="icon">🔍</span>
        <input type="text" v-model="keyword" placeholder="搜索你收藏的网站..." />
      </div>
    </header>

    <!-- 上半部分：分类导航区 -->
    <div v-for="category in filteredData" :key="category.title" class="category-section">
      <h2 class="category-title">{{ category.title }}</h2>
      
      <div class="links-grid">
        <a 
          v-for="site in category.sites" 
          :key="site.name" 
          :href="site.url" 
          target="_blank"
          class="site-card app-card hover-lift"
        >
          <div class="site-icon">{{ site.icon }}</div>
          <div class="site-info">
            <h3 class="site-name">{{ site.name }}</h3>
            <p class="site-desc">{{ site.desc }}</p>
          </div>
        </a>
      </div>
    </div>

    <!-- 下半部分：秘密管理箱 -->
    <div class="vault-section app-card">
      <div class="vault-header">
        <div class="vault-title">
          <span class="icon">🔐</span>
          <h2>秘密管理箱</h2>
        </div>
        <button class="add-secret-btn" @click="openSecretModal()">+ 添加密码</button>
      </div>
      
      <div class="vault-list">
        <div v-if="secrets.length === 0" class="empty-vault">
          暂未保存任何密码，点击右上角添加
        </div>
        
        <div v-for="secret in secrets" :key="secret.id" class="secret-item">
          <div class="secret-info">
            <div class="secret-name">{{ secret.name }}</div>
            <div class="secret-account">{{ secret.account }}</div>
          </div>
          <div class="secret-actions">
            <button class="action-btn" @click="copySecret(secret.password)">📋 复制</button>
            <button class="action-btn" @click="openSecretModal(secret)">✏️ 编辑</button>
            <button class="action-btn danger" @click="deleteSecret(secret.id)">🗑️ 删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗：新增/编辑密码 -->
    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal-content app-card">
        <h3>{{ isEditing ? '编辑密码' : '添加新密码' }}</h3>
        <div class="form-group">
          <label>平台/名称</label>
          <input v-model="formData.name" placeholder="如：GitHub, 邮箱" />
        </div>
        <div class="form-group">
          <label>账号/邮箱</label>
          <input v-model="formData.account" placeholder="输入账号" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="formData.password" placeholder="输入密码" />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeModal">取消</button>
          <button class="btn-save" @click="saveSecret">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const keyword = ref('')

// =========================================
// 1. 导航数据（已去掉你不需要的项）
// =========================================
const navigatorData = [
  {
    title: '💼 工作专区 - 优途核心系统',
    sites: [
      { name: '新订单管理系统', icon: '🛒', desc: '优途新订单管理系统使用指引', url: 'http://qecode.uwii.com.cn/' },
      { name: '优途后台系统', icon: '⚙️', desc: 'new wcii20 优途后台', url: 'http://newwcii20.ytowin.com/02ko5qp6/Admin/Default' },
      { name: '后台管理平台', icon: '💻', desc: '优途后台管理平台', url: 'https://admin.iutowin.com/login' }
    ]
  },
  {
    title: '💼 工作专区 - 业务处理',
    sites: [
      { name: '微信商户平台', icon: '💳', desc: '处理投诉与支付业务', url: 'https://pay.weixin.qq.com/' },
      { name: '图片转 Base64', icon: '🖼️', desc: '图片转 64 编码工具', url: 'https://www.jyshare.com/front-end/59/' },
      { name: '随机 GUID 生成', icon: '🆔', desc: '随机生成用户 ID', url: 'http://tool.pfan.cn/guidgen' }
    ]
  },
  {
    title: '🏠 个人专区 - 极客与知识库',
    sites: [
      { name: '全栈知识库', icon: '📚', desc: 'Easy-Vibe 开发工具指南', url: 'https://datawhalechina.github.io/easy-vibe/zh-cn/appendix/2-development-tools/ide-basics.html' },
      { name: '人生指南', icon: '🧭', desc: '如何更好地生活与思考', url: 'https://eternity4719.github.io/HowToLiveBetter/#/e-1-23' },
      { name: 'PDF24 工具', icon: '📄', desc: '免费好用的 PDF 处理神器', url: 'https://tools.pdf24.org/zh/merge-pdf#s=1791965135442' }
    ]
  },
  {
    title: '🏠 个人专区 - 网络与资源',
    sites: [
      { name: '专属网络', icon: '🚀', desc: '极速稳定的网络节点', url: 'https://hniko.top/#/plan' },
	  { name: 'ChatGPT', icon: '🤖', desc: '地表最强 AI 对话助手', url: 'https://chatgpt.com/' }
    ]
  }
]

const filteredData = computed(() => {
  if (!keyword.value.trim()) return navigatorData
  const kw = keyword.value.toLowerCase()
  return navigatorData.map(category => {
    const matchedSites = category.sites.filter(site => 
      site.name.toLowerCase().includes(kw) || site.desc.toLowerCase().includes(kw)
    )
    return { title: category.title, sites: matchedSites }
  }).filter(category => category.sites.length > 0)
})


// =========================================
// 2. 秘密管理箱逻辑（带简单混淆加密）
// =========================================
const secrets = ref([])
const showModal = ref(false)
const isEditing = ref(false)
const formData = ref({ id: null, name: '', account: '', password: '' })

// 简单的本地数据混淆（防止明文直接暴露在 localStorage）
const encrypt = (text) => btoa(encodeURIComponent(text))
const decrypt = (text) => decodeURIComponent(atob(text))

onMounted(() => {
  const saved = localStorage.getItem('my_workspace_vault')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      // 解密所有密码
      secrets.value = parsed.map(item => ({
        ...item,
        password: decrypt(item.password)
      }))
    } catch (e) {
      console.error('读取密码本失败')
    }
  }
})

const saveToLocal = () => {
  // 存储前对密码进行加密
  const toStore = secrets.value.map(item => ({
    ...item,
    password: encrypt(item.password)
  }))
  localStorage.setItem('my_workspace_vault', JSON.stringify(toStore))
}

const openSecretModal = (secret = null) => {
  if (secret) {
    isEditing.value = true
    formData.value = { ...secret }
  } else {
    isEditing.value = false
    formData.value = { id: Date.now(), name: '', account: '', password: '' }
  }
  showModal.value = true
}

const closeModal = () => showModal.value = false

const saveSecret = () => {
  if (!formData.value.name || !formData.value.password) return
  
  if (isEditing.value) {
    const index = secrets.value.findIndex(s => s.id === formData.value.id)
    if (index !== -1) secrets.value[index] = { ...formData.value }
  } else {
    secrets.value.unshift({ ...formData.value })
  }
  saveToLocal()
  closeModal()
}

const deleteSecret = (id) => {
  if (confirm('确定要删除这条密码吗？')) {
    secrets.value = secrets.value.filter(s => s.id !== id)
    saveToLocal()
  }
}

const copySecret = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('密码已复制到剪贴板！')
  } catch (err) {
    alert('复制失败，请手动选择复制')
  }
}
</script>

<style scoped>
/* 保持原有的导航样式 */
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; }
.title { font-size: 32px; font-weight: 800; color: var(--text-main); margin: 0 0 8px 0; }
.subtitle { color: var(--text-secondary); font-size: 15px; }
.search-box { display: flex; align-items: center; padding: 10px 20px; width: 300px; background: #fff; border-radius: 100px; }
.search-box .icon { font-size: 18px; color: #888; margin-right: 10px; }
.search-box input { border: none; outline: none; background: transparent; font-size: 15px; color: var(--text-main); width: 100%; }

.category-section { margin-bottom: 40px; }
.category-title { font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 20px; padding-left: 10px; border-left: 4px solid var(--primary-color); }
.links-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.site-card { display: flex; align-items: center; gap: 16px; padding: 20px; text-decoration: none; background: #ffffff; }
.site-icon { width: 48px; height: 48px; background: #f0f4f8; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 24px; flex-shrink: 0; }
.site-info { flex: 1; overflow: hidden; }
.site-name { font-size: 16px; font-weight: 600; color: var(--text-main); margin: 0 0 4px 0; }
.site-desc { font-size: 13px; color: var(--text-secondary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* =========================================
   秘密管理箱样式
   ========================================= */
.vault-section {
  margin-top: 60px;
  padding: 30px;
  background: #ffffff;
  border: 1px solid var(--border-color);
}

.vault-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0; }
.vault-title { display: flex; align-items: center; gap: 12px; }
.vault-title h2 { margin: 0; font-size: 20px; color: var(--text-main); }
.vault-title .icon { font-size: 24px; }
.add-secret-btn { background: #1a1a1a; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.add-secret-btn:hover { background: #333; }

.vault-list { display: flex; flex-direction: column; gap: 12px; }
.empty-vault { color: #999; text-align: center; padding: 40px 0; font-size: 14px; }

.secret-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #f9f9f9; border-radius: 10px; transition: 0.2s; }
.secret-item:hover { background: #f0f4f8; }
.secret-info { display: flex; flex-direction: column; gap: 6px; }
.secret-name { font-size: 16px; font-weight: 600; color: var(--text-main); }
.secret-account { font-size: 13px; color: #666; font-family: monospace; }

.secret-actions { display: flex; gap: 10px; }
.action-btn { background: #fff; border: 1px solid #ddd; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #555; transition: 0.2s; }
.action-btn:hover { background: #e2e8f0; color: var(--text-main); }
.action-btn.danger { color: #ef4444; border-color: #fca5a5; }
.action-btn.danger:hover { background: #fef2f2; }

/* 弹窗样式 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 9999; }
.modal-content { background: #fff; width: 400px; padding: 30px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
.modal-content h3 { margin-top: 0; margin-bottom: 24px; font-size: 20px; color: var(--text-main); }

.form-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
.form-group input { padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px; outline: none; transition: 0.2s; }
.form-group input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 2px rgba(25,137,250,0.1); }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 30px; }
.btn-cancel { background: #f1f5f9; color: #475569; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-save { background: var(--primary-color); color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-save:hover { background: #1072d6; }
</style>