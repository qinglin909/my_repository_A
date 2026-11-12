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

    <!-- 分类 tab：一键切换分区，不用长滚 -->
    <nav class="cat-tabs" role="tablist" aria-label="导航分类">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.key"
        class="cat-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
        <em v-if="tab.key !== 'all'">{{ siteCountOf(tab.key) }}</em>
      </button>
    </nav>

    <!-- 分类导航区：大类 → 子分类 → 站点 -->
    <section v-for="section in filteredSections" :key="section.key" class="category-section">
      <h2 class="section-title">
        <span class="section-icon">{{ section.icon }}</span>
        {{ section.title }}
        <span class="section-count">{{ siteCountOf(section) }} 个站点</span>
      </h2>

      <div v-for="category in section.categories" :key="category.title" class="category-group">
        <h3 class="category-title">{{ category.title }}</h3>
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
    </section>

    <div v-if="!filteredSections.length" class="empty-nav app-card">
      没有匹配的站点，换个关键词试试。
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
      
      <div v-if="vaultState !== 'unlocked'" class="vault-lock">
        <div class="lock-mark">🔒</div>
        <p v-if="vaultState === 'setup' && hasLegacyVault" class="legacy-warning">检测到旧密码箱记录。首次设置主密码时会尝试迁移并加密；请在原浏览器完成迁移。若迁移失败，原记录会保留。</p>
        <h3>{{ vaultState === 'setup' ? '设置密码箱主密码' : '密码箱已锁定' }}</h3>
        <p>{{ vaultState === 'setup' ? '主密码用于加密本机保存的密码数据，忘记后无法恢复。' : '输入主密码解锁；连续输错会短暂锁定。' }}</p>
        <form class="unlock-form" @submit.prevent="unlockVault">
          <input v-model="masterPassword" type="password" autocomplete="current-password" :placeholder="vaultState === 'setup' ? '设置至少 8 位主密码' : '输入主密码'" required />
          <input v-if="vaultState === 'setup'" v-model="confirmMasterPassword" type="password" autocomplete="new-password" placeholder="再次输入主密码" required />
          <p v-if="vaultError" class="vault-error" role="alert">{{ vaultError }}</p>
          <button class="btn-save" type="submit" :disabled="vaultBusy || isLockedOut">{{ vaultBusy ? '处理中…' : vaultState === 'setup' ? '设置并解锁' : isLockedOut ? `请稍候 ${lockoutSeconds} 秒` : '解锁密码箱' }}</button>
        </form>
      </div>

      <div v-else class="vault-list">
        <div class="vault-toolbar">
          <span class="vault-unlocked">🔓 已解锁 · 本机加密</span>
          <button class="action-btn" type="button" @click="lockVault">立即锁定</button>
        </div>
        <div v-if="secrets.length === 0" class="empty-vault">暂无密码记录，点击右上角添加</div>
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
    <div class="modal-overlay" v-if="showModal && vaultState === 'unlocked'" @click.self="closeModal">
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const keyword = ref('')

// =========================================
// 1. 导航数据：三大分区 → 子分类 → 站点
// =========================================
const navigatorData = [
  {
    key: 'work',
    icon: '💼',
    title: '工作专区',
    categories: [
      {
        title: '优途核心系统',
        sites: [
          { name: '新订单管理系统', icon: '🛒', desc: '优途新订单管理系统使用指引', url: 'http://qecode.uwii.com.cn/' },
          { name: '优途后台系统', icon: '⚙️', desc: 'new wcii20 优途后台', url: 'http://newwcii20.ytowin.com/02ko5qp6/Admin/Default' },
          { name: '后台管理平台', icon: '💻', desc: '优途后台管理平台', url: 'https://admin.iutowin.com/login' }
        ]
      },
      {
        title: '业务与支付',
        sites: [
          { name: '微信商户平台', icon: '💳', desc: '处理投诉与支付业务', url: 'https://pay.weixin.qq.com/' }
        ]
      }
    ]
  },
  {
    key: 'tools',
    icon: '🛠️',
    title: '工具箱',
    categories: [
      {
        title: '开发小工具',
        sites: [
          { name: '图片转 Base64', icon: '🖼️', desc: '图片转 64 编码工具', url: 'https://www.jyshare.com/front-end/59/' },
          { name: '随机 GUID 生成', icon: '🆔', desc: '随机生成用户 ID', url: 'http://tool.pfan.cn/guidgen' },
          { name: 'PDF24 工具', icon: '📄', desc: '免费好用的 PDF 处理神器', url: 'https://tools.pdf24.org/zh/merge-pdf#s=1791965135442' }
        ]
      }
    ]
  },
  {
    key: 'personal',
    icon: '🏠',
    title: '个人专区',
    categories: [
      {
        title: 'AI 与网络',
        sites: [
          { name: 'ChatGPT', icon: '🤖', desc: '地表最强 AI 对话助手', url: 'https://chatgpt.com/' },
          { name: '专属网络', icon: '🚀', desc: '极速稳定的网络节点', url: 'https://hniko.top/#/plan' }
        ]
      },
      {
        title: '学习与生活',
        sites: [
          { name: '全栈知识库', icon: '📚', desc: 'Easy-Vibe 开发工具指南', url: 'https://datawhalechina.github.io/easy-vibe/zh-cn/appendix/2-development-tools/ide-basics.html' },
          { name: '人生指南', icon: '🧭', desc: '如何更好地生活与思考', url: 'https://eternity4719.github.io/HowToLiveBetter/#/e-1-23' }
        ]
      }
    ]
  }
]

// =========================================
// 1.1 分类 tab：只显示所选分区，搜索叠加过滤
// =========================================
const activeTab = ref('all')
const tabs = computed(() => [
  { key: 'all', icon: '🗂️', label: '全部' },
  ...navigatorData.map(section => ({ key: section.key, icon: section.icon, label: section.title }))
])
const siteCountOf = (target) => {
  const section = typeof target === 'string' ? navigatorData.find(s => s.key === target) : target
  return section ? section.categories.reduce((sum, category) => sum + category.sites.length, 0) : 0
}

const filteredSections = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return navigatorData
    .filter(section => activeTab.value === 'all' || activeTab.value === section.key)
    .map(section => {
      if (!kw) return section
      const categories = section.categories
        .map(category => ({
          ...category,
          sites: category.sites.filter(site =>
            site.name.toLowerCase().includes(kw) || site.desc.toLowerCase().includes(kw)
          )
        }))
        .filter(category => category.sites.length > 0)
      return { ...section, categories }
    })
    .filter(section => section.categories.length > 0)
})


// =========================================
// 2. 秘密管理箱逻辑（带简单混淆加密）
// =========================================
const secrets = ref([])
const showModal = ref(false)
const isEditing = ref(false)
const formData = ref({ id: null, name: '', account: '', password: '' })
const vaultState = ref('locked')
const masterPassword = ref('')
const confirmMasterPassword = ref('')
const vaultError = ref('')
const vaultBusy = ref(false)
const failedAttempts = ref(0)
const lockedUntil = ref(0)
const lockoutSeconds = ref(0)
const isLockedOut = computed(() => lockoutSeconds.value > 0)
const VAULT_KEY = 'my_workspace_vault'
const VAULT_META_KEY = 'my_workspace_vault_meta'
const hasLegacyVault = ref(false)
const PBKDF2_ITERATIONS = 310000
let vaultCryptoKey = null
let lockoutTimer = null
let autoLockTimer = null

const bytesToBase64 = (bytes) => {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}
const base64ToBytes = (value) => Uint8Array.from(atob(value), char => char.charCodeAt(0))
const deriveVaultKey = async (password, salt) => {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}
const encryptVaultData = async (data, key) => {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(data))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return JSON.stringify({ version: 2, iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) })
}
const decryptVaultData = async (serialized, key) => {
  const envelope = JSON.parse(serialized)
  if (envelope.version !== 2 || !envelope.iv || !envelope.ciphertext) throw new Error('密码箱数据格式无效')
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(envelope.iv) }, key, base64ToBytes(envelope.ciphertext))
  return JSON.parse(new TextDecoder().decode(plaintext))
}
const updateLockoutCountdown = () => {
  const remaining = Math.max(0, Math.ceil((lockedUntil.value - Date.now()) / 1000))
  lockoutSeconds.value = remaining
  if (!remaining) {
    clearInterval(lockoutTimer)
    lockoutTimer = null
  }
}

onMounted(() => {
  vaultState.value = localStorage.getItem(VAULT_META_KEY) ? 'locked' : 'setup'
  hasLegacyVault.value = vaultState.value === 'setup' && Boolean(localStorage.getItem(VAULT_KEY))
  if (vaultState.value === 'locked') refreshLockout()
  window.addEventListener('storage', handleVaultStorage)
  for (const eventName of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(eventName, registerActivity, { passive: true })
})

onBeforeUnmount(() => {
  clearTimeout(autoLockTimer)
  clearInterval(lockoutTimer)
  window.removeEventListener('storage', handleVaultStorage)
  for (const eventName of ['pointerdown', 'keydown', 'touchstart']) window.removeEventListener(eventName, registerActivity)
})

const handleVaultStorage = (event) => {
  if (event.key === VAULT_KEY || event.key === VAULT_META_KEY) lockVault()
}
const refreshLockout = () => {
  try {
    lockedUntil.value = Number(sessionStorage.getItem('vault_locked_until') || 0)
  } catch {
    lockedUntil.value = 0
  }
  updateLockoutCountdown()
  if (lockoutSeconds.value && !lockoutTimer) lockoutTimer = window.setInterval(updateLockoutCountdown, 1000)
}
const registerActivity = () => {
  clearTimeout(autoLockTimer)
  if (vaultState.value === 'unlocked') autoLockTimer = window.setTimeout(lockVault, 5 * 60 * 1000)
}
const lockVault = () => {
  clearTimeout(autoLockTimer)
  autoLockTimer = null
  vaultCryptoKey = null
  secrets.value = []
  showModal.value = false
  masterPassword.value = ''
  confirmMasterPassword.value = ''
  vaultError.value = ''
  vaultState.value = localStorage.getItem(VAULT_META_KEY) ? 'locked' : 'setup'
}

const unlockVault = async () => {
  vaultError.value = ''
  if (isLockedOut.value) return
  if (!crypto?.subtle) {
    vaultError.value = '当前浏览器不支持安全加密，请使用 HTTPS 或 localhost 打开。'
    return
  }
  if (vaultState.value === 'setup' && masterPassword.value.length < 8) {
    vaultError.value = '主密码至少需要 8 个字符。'
    return
  }
  if (vaultState.value === 'setup' && masterPassword.value !== confirmMasterPassword.value) {
    vaultError.value = '两次输入的主密码不一致。'
    return
  }

  vaultBusy.value = true
  try {
    const metaText = localStorage.getItem(VAULT_META_KEY)
    let salt
    let key
    if (!metaText) {
      salt = crypto.getRandomValues(new Uint8Array(16))
      key = await deriveVaultKey(masterPassword.value, salt)
      const legacyText = localStorage.getItem(VAULT_KEY)
      let legacyRecords = []
      if (legacyText) {
        const parsed = JSON.parse(legacyText)
        if (!Array.isArray(parsed)) throw new Error('检测到旧密码数据格式异常，原数据已保留。')
        legacyRecords = parsed.map(item => ({ ...item, password: decodeURIComponent(atob(item.password)) }))
      }
      const encryptedLegacy = await encryptVaultData(legacyRecords, key)
      localStorage.setItem(VAULT_META_KEY, JSON.stringify({ version: 2, salt: bytesToBase64(salt), iterations: PBKDF2_ITERATIONS }))
      localStorage.setItem(VAULT_KEY, encryptedLegacy)
      hasLegacyVault.value = false
      secrets.value = legacyRecords
      vaultCryptoKey = key
      vaultState.value = 'unlocked'
      failedAttempts.value = 0
      registerActivity()
      return
    }

    const meta = JSON.parse(metaText)
    salt = base64ToBytes(meta.salt)
    key = await deriveVaultKey(masterPassword.value, salt)
    const serialized = localStorage.getItem(VAULT_KEY)
    if (!serialized) throw new Error('找不到加密密码箱数据。')
    const records = await decryptVaultData(serialized, key)
    if (!Array.isArray(records)) throw new Error('密码箱数据格式无效。')
    secrets.value = records
    vaultCryptoKey = key
    vaultState.value = 'unlocked'
    failedAttempts.value = 0
    lockedUntil.value = 0
    sessionStorage.removeItem('vault_locked_until')
    registerActivity()
  } catch (error) {
    failedAttempts.value += 1
    if (vaultState.value === 'setup') {
      vaultError.value = error.message || '旧密码迁移失败；旧数据保持不变，请确认旧密码箱数据未损坏。'
    } else {
      vaultError.value = '主密码错误，或密码箱数据无法解密。'
      if (failedAttempts.value >= 5) {
        lockedUntil.value = Date.now() + 30_000
        try { sessionStorage.setItem('vault_locked_until', String(lockedUntil.value)) } catch {}
        refreshLockout()
      }
    }
  } finally {
    vaultBusy.value = false
  }
}

const saveToLocal = async () => {
  if (!vaultCryptoKey) throw new Error('密码箱已锁定，请重新解锁。')
  localStorage.setItem(VAULT_KEY, await encryptVaultData(secrets.value, vaultCryptoKey))
  registerActivity()
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

const saveSecret = async () => {
  if (!formData.value.name || !formData.value.password || !vaultCryptoKey) return

  const previous = [...secrets.value]
  if (isEditing.value) {
    const index = secrets.value.findIndex(s => s.id === formData.value.id)
    if (index !== -1) secrets.value[index] = { ...formData.value }
  } else {
    secrets.value.unshift({ ...formData.value })
  }
  try {
    await saveToLocal()
    closeModal()
  } catch {
    secrets.value = previous
    alert('加密保存失败，修改未保存。')
  }
}

const deleteSecret = async (id) => {
  if (!confirm('确定要删除这条密码吗？') || !vaultCryptoKey) return
  const previous = [...secrets.value]
  secrets.value = secrets.value.filter(s => s.id !== id)
  try {
    await saveToLocal()
  } catch {
    secrets.value = previous
    alert('删除保存失败，记录已恢复。')
  }
}

const copySecret = async (text) => {
  registerActivity()
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

/* 分类 tab：切换分区，不用长滚 */
.cat-tabs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 32px; }
.cat-tab {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 18px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: #fff;
  color: var(--text-secondary);
  font-size: 14px; font-weight: 600;
  cursor: pointer;
  transition: all .2s;
}
.cat-tab:hover { border-color: var(--primary-color); color: var(--primary-color); }
.cat-tab.active { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }
.cat-tab .tab-icon { font-size: 15px; }
.cat-tab em {
  font-style: normal;
  padding: 1px 8px; border-radius: 999px;
  background: #f0f4f8; color: var(--text-secondary);
  font-size: 11px; font-weight: 700;
}
.cat-tab.active em { background: rgba(255,255,255,.25); color: #fff; }

.category-section { margin-bottom: 44px; }
.section-title {
  display: flex; align-items: center; gap: 10px;
  margin: 0 0 22px;
  font-size: 21px; font-weight: 800; color: var(--text-main);
}
.section-icon { font-size: 22px; }
.section-count { margin-left: auto; color: var(--text-secondary); font-size: 12px; font-weight: 600; }
.category-group { margin-bottom: 26px; }
.category-title {
  font-size: 14.5px; font-weight: 700; color: var(--text-secondary);
  margin-bottom: 14px; padding-left: 10px;
  border-left: 3px solid var(--primary-color);
}
.empty-nav { text-align: center; padding: 46px 20px; color: var(--text-secondary); font-size: 14px; }
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
.vault-lock { max-width: 480px; margin: 0 auto; padding: 32px 20px; text-align: center; }
.lock-mark { margin-bottom: 10px; font-size: 34px; }
.vault-lock h3 { margin: 0 0 8px; color: var(--text-main); font-size: 20px; }
.vault-lock > p { color: var(--text-secondary); font-size: 13px; line-height: 1.7; }
.vault-lock .unlock-form { margin-top: 18px; text-align: left; }
.unlock-form input { width: 100%; margin: 6px 0; padding: 12px 14px; border: 1px solid #d8dee8; border-radius: 9px; font-size: 15px; }
.unlock-form .btn-save { width: 100%; margin-top: 10px; }
.unlock-form .btn-save:disabled { opacity: .55; cursor: wait; }
.vault-error { color: #b42318 !important; font-size: 12px !important; }
.legacy-warning { padding: 10px 12px; border: 1px solid #f3d08a; border-radius: 9px; background: #fffaeb; color: #8a4b08 !important; font-size: 12px !important; }
.vault-toolbar { display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid var(--border-color); }
.vault-unlocked { color: #027a48; font-size: 12px; font-weight: 700; }
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