<!--
  宝藏导航 + 账号密码（恢复旧版展示）
  ============================================================
  交互约定：
   1. 卡片【可点击跳转】：站外链接新窗口打开，站内工具走路由。
   2. 只有「优途核心系统」下 4 个站点显示账号密码（恢复旧版样式：
      账号明文 + 复制，密码圆点隐藏 + 眼睛切换 + 复制）；其他站点不显示。
   3. 账号密码按用户要求硬编码在本文件，仅这 4 个站点；不上传云端。
   4. 云端 navigator_sites 表只存名称/网址/分类/图标/描述/分组/排序。
      未登录云同步时用内置清单，登录后从云端读，密码始终来自本文件映射。
-->
<template>
  <div class="page-container">
    <header class="page-header">
      <div class="header-text">
        <h1 class="title">工作与生活台</h1>
        <p class="subtitle">你的私人极客资源库与密码箱</p>
      </div>

      <div class="search-box app-card">
        <span class="icon">🔍</span>
        <input type="text" v-model="keyword" placeholder="搜索你收藏的网站..." />
      </div>
    </header>

    <div class="sync-note">
      <span class="sync-dot" :class="{ on: cloudOn }"></span>
      {{ cloudOn ? '已从云端同步站点清单' : '当前使用内置清单（登录右上角「云同步」可多端同步网址）' }}
    </div>

    <!-- 分类 tab -->
    <nav class="cat-tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="cat-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
        <em v-if="tab.key !== 'all'">{{ siteCountOf(tab.key) }}</em>
      </button>
    </nav>

    <!-- 分类导航区 -->
    <section v-for="section in filteredSections" :key="section.key" class="category-section">
      <h2 class="section-title">
        <span class="section-icon">{{ section.icon }}</span>
        {{ section.title }}
        <span class="section-count">{{ siteCountOf(section) }} 个站点</span>
      </h2>

      <div v-for="category in section.categories" :key="category.title" class="category-group">
        <h3 class="category-title">{{ category.title }}</h3>
        <div class="links-grid">
          <!-- 站外链接新窗口打开；站内工具走路由；整张卡片可点击 -->
          <component
            :is="site.internal ? 'router-link' : 'a'"
            v-for="site in category.sites"
            :key="site.name"
            :to="site.internal ? site.url : undefined"
            :href="site.internal ? undefined : site.url"
            :target="site.internal ? undefined : '_blank'"
            class="site-card app-card hover-lift"
          >
            <div class="site-icon">{{ site.icon }}</div>
            <div class="site-info">
              <h3 class="site-name">{{ site.name }}</h3>
              <p class="site-desc">{{ site.description || site.desc }}</p>

              <!-- 账号密码：仅「优途核心系统」的 4 个站点显示，点击区不触发跳转 -->
              <div v-if="secretOf(site)" class="site-secrets" @click.prevent.stop>
                <div class="secret-row" v-if="secretOf(site).account">
                  <span class="secret-label">账号:</span>
                  <span class="secret-val">{{ secretOf(site).account }}</span>
                  <button type="button" class="copy-btn" title="复制账号" @click.stop="copyText(secretOf(site).account)">📋</button>
                </div>
                <div class="secret-row" v-if="secretOf(site).password">
                  <span class="secret-label">密码:</span>
                  <span class="secret-val">
                    {{ showPasswords[site.name] ? secretOf(site).password : '••••••••' }}
                  </span>
                  <button type="button" class="eye-btn" title="显示/隐藏密码" @click.stop="togglePassword(site.name)">
                    {{ showPasswords[site.name] ? '🙈' : '👁️' }}
                  </button>
                  <button type="button" class="copy-btn" title="复制密码" @click.stop="copyText(secretOf(site).password)">📋</button>
                </div>
              </div>
            </div>
          </component>
        </div>
      </div>
    </section>

    <div v-if="!filteredSections.length" class="empty-nav app-card">
      没有匹配的站点，换个关键词试试。
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { isCloudReady, listRows } from '@/utils/cloudDb'

const keyword = ref('')
const cloudOn = ref(false)

// =========================================
// 账号密码（仅这 4 个站点，按用户要求恢复旧版明文展示；不上传云端）
// =========================================
const SECRETS = {
  '优途教育-后台管理(新)': { account: 'yuanhuiadmin', password: 'yuanhui@2021#' },
  '优途教育-后台管理': { account: 'yuanhuiadmin', password: 'yuanhui@2021#' },
  '发送短信': { account: 'gzjsy', password: 'gzjsy@0711' },
  '新订单管理系统': { account: 'zhaowenbin', password: 'yuanhui2024' },
  '优途后台管理平台': { account: 'yhadmin', password: '123456' }
}
const secretOf = (site) => SECRETS[site.name] || null

// 记录哪些站点的密码被点击显示出来了（默认隐藏）
const showPasswords = reactive({})
const togglePassword = (siteName) => {
  showPasswords[siteName] = !showPasswords[siteName]
}

// 复制到剪贴板
const copyText = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert(`已复制: ${text}`)
  } catch {
    alert('复制失败，请手动复制')
  }
}

// =========================================
// 内置站点清单（仅网址/名称/分类，账号密码见上方 SECRETS）
// 云端有数据时以云端为准，未登录云同步时用这份兜底
// =========================================
const SECTIONS = [
  {
    key: 'work', icon: '💼', title: '工作专区',
    categories: [
      {
        title: '优途核心系统',
        sites: [
          { name: '优途教育-后台管理(新)', icon: '🏫', description: 'newwcii20 优途教育系统(新后台)', url: 'http://newwcii20.ytowin.com/02ko5qp6/Admin/Default' },
          { name: '优途教育-后台管理', icon: '🏫', description: 'wcii20 优途教育系统(旧后台)', url: 'https://wcii20.ytowin.com/02ko5qp6/login/Admincpc78' },
          { name: '发送短信', icon: '✉️', description: '内部短信发送平台', url: 'http://8.134.208.23:8888/loginBlue.html' },
          { name: '新订单管理系统', icon: '🛒', description: 'qecode 订单系统', url: 'http://qecode.uwii.com.cn/' },
          { name: '优途后台管理平台', icon: '💻', description: 'admin.iutowin 统一后台', url: 'https://admin.iutowin.com/login' }
        ]
      },
      {
        title: '业务与支付',
        sites: [
          { name: '微信商户平台', icon: '💳', description: '处理投诉与支付业务', url: 'https://pay.weixin.qq.com/' }
        ]
      }
    ]
  },
  {
    key: 'tools', icon: '🛠️', title: '工具箱',
    categories: [
      {
        title: '开发小工具',
        sites: [
          { name: '图片转 Base64', icon: '🖼️', description: '图片转 64 编码工具', url: 'https://www.jyshare.com/front-end/59/' },
          { name: '随机 GUID 生成', icon: '🆔', description: '随机生成用户 ID', url: 'http://tool.pfan.cn/guidgen' },
          { name: 'PDF24 工具', icon: '📄', description: '免费好用的 PDF 处理神器', url: 'https://tools.pdf24.org/zh/merge-pdf' }
        ]
      },
      {
        title: '表格与公式',
        sites: [
          { name: 'FormulaEase', icon: '🧮', description: 'Excel 公式生成、解释与报错修复', url: 'https://formulaease.com/' },
          { name: '公式助手（本站）', icon: '✨', description: '用 AI 写公式，支持 Excel/WPS/表格', url: '/formula', internal: true }
        ]
      },
      {
        title: '生活与记账',
        sites: [
          { name: '月度收支登记（本站）', icon: '💰', description: '固定支出与收入登记，出图导出', url: '/bills', internal: true }
        ]
      }
    ]
  },
  {
    key: 'personal', icon: '🏠', title: '个人专区',
    categories: [
      {
        title: 'AI 与网络',
        sites: [
          { name: 'ChatGPT', icon: '🤖', description: '地表最强 AI 对话助手', url: 'https://chatgpt.com/' },
          { name: '专属网络', icon: '🚀', description: '极速稳定的网络节点', url: 'https://hniko.top/#/plan' }
        ]
      },
      {
        title: '学习与生活',
        sites: [
          { name: '全栈知识库', icon: '📚', description: 'Easy-Vibe 开发工具指南', url: 'https://datawhalechina.github.io/easy-vibe/zh-cn/appendix/2-development-tools/ide-basics.html' },
          { name: '人生指南', icon: '🧭', description: '如何更好地生活与思考', url: 'https://eternity4719.github.io/HowToLiveBetter/#/e-1-23' }
        ]
      }
    ]
  }
]

// 运行时数据源：默认内置，云端可用时替换
const navigatorData = ref(SECTIONS)

// 把云端扁平行还原成 section -> category -> sites 结构
function rowsToSections(rows) {
  const sectionMeta = {
    work: { icon: '💼', title: '工作专区' },
    tools: { icon: '🛠️', title: '工具箱' },
    personal: { icon: '🏠', title: '个人专区' }
  }
  const sectionMap = new Map()
  for (const row of rows) {
    const sKey = row.section || 'work'
    if (!sectionMap.has(sKey)) {
      const meta = sectionMeta[sKey] || { icon: '🔗', title: sKey }
      sectionMap.set(sKey, { key: sKey, icon: meta.icon, title: meta.title, catMap: new Map() })
    }
    const sec = sectionMap.get(sKey)
    const catTitle = row.category || '未分类'
    if (!sec.catMap.has(catTitle)) sec.catMap.set(catTitle, { title: catTitle, sites: [] })
    sec.catMap.get(catTitle).sites.push({
      name: row.name,
      url: row.url,
      icon: row.icon || '🔗',
      description: row.description || '',
      internal: !!row.internal,
      _id: row.id
    })
  }
  return [...sectionMap.values()].map((sec) => ({
    key: sec.key,
    icon: sec.icon,
    title: sec.title,
    categories: [...sec.catMap.values()].map((cat) => ({
      title: cat.title,
      sites: cat.sites.sort((a, b) => (a._id || '').localeCompare(b._id || ''))
    }))
  }))
}

async function loadSites() {
  const ready = await isCloudReady()
  cloudOn.value = ready
  if (!ready) { navigatorData.value = SECTIONS; return }
  const res = await listRows('navigator_sites')
  if (res.ok && Array.isArray(res.data) && res.data.length) {
    navigatorData.value = rowsToSections(res.data)
  } else {
    navigatorData.value = SECTIONS
  }
}

onMounted(() => {
  loadSites()
  window.addEventListener('cloud-auth-changed', loadSites)
})

// =========================================
// 过滤逻辑
// =========================================
const activeTab = ref('all')
const tabs = computed(() => [
  { key: 'all', icon: '🗂️', label: '全部' },
  ...navigatorData.value.map(s => ({ key: s.key, icon: s.icon, label: s.title }))
])
const siteCountOf = (target) => {
  const section = typeof target === 'string'
    ? navigatorData.value.find(s => s.key === target)
    : target
  return section ? section.categories.reduce((sum, c) => sum + c.sites.length, 0) : 0
}

const filteredSections = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return navigatorData.value
    .filter(section => activeTab.value === 'all' || activeTab.value === section.key)
    .map(section => {
      if (!kw) return section
      const categories = section.categories
        .map(cat => ({
          ...cat,
          sites: cat.sites.filter(site =>
            site.name.toLowerCase().includes(kw) ||
            (site.description || '').toLowerCase().includes(kw) ||
            site.url.toLowerCase().includes(kw)
          )
        }))
        .filter(cat => cat.sites.length > 0)
      return { ...section, categories }
    })
    .filter(section => section.categories.length > 0)
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 20px; }
.title { font-size: 32px; font-weight: 800; color: var(--text-main); margin: 0 0 8px 0; }
.subtitle { color: var(--text-secondary); font-size: 15px; }
.search-box { display: flex; align-items: center; padding: 10px 20px; width: 300px; background: #fff; border-radius: 100px; }
.search-box .icon { font-size: 18px; color: #888; margin-right: 10px; }
.search-box input { border: none; outline: none; background: transparent; font-size: 15px; color: var(--text-main); width: 100%; }

.sync-note { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); margin-bottom: 24px; }
.sync-dot { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; }
.sync-dot.on { background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.15); }

.cat-tabs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 32px; }
.cat-tab {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 18px; border: 1px solid var(--border-color); border-radius: 999px;
  background: #fff; color: var(--text-secondary); font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all .2s;
}
.cat-tab:hover { border-color: var(--primary-color); color: var(--primary-color); }
.cat-tab.active { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }
.cat-tab .tab-icon { font-size: 15px; }
.cat-tab em { font-style: normal; padding: 1px 8px; border-radius: 999px; background: #f0f4f8; color: var(--text-secondary); font-size: 11px; font-weight: 700; }
.cat-tab.active em { background: rgba(255,255,255,.25); color: #fff; }

.category-section { margin-bottom: 44px; }
.section-title { display: flex; align-items: center; gap: 10px; margin: 0 0 22px; font-size: 21px; font-weight: 800; color: var(--text-main); }
.section-icon { font-size: 22px; }
.section-count { margin-left: auto; color: var(--text-secondary); font-size: 12px; font-weight: 600; }
.category-group { margin-bottom: 26px; }
.category-title { font-size: 14.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 14px; padding-left: 10px; border-left: 3px solid var(--primary-color); }
.empty-nav { text-align: center; padding: 46px 20px; color: var(--text-secondary); font-size: 14px; }
.links-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }

/* 卡片可点击：链接去除默认样式，保留悬浮反馈 */
.site-card {
  display: flex; align-items: flex-start; gap: 16px; padding: 20px;
  text-decoration: none; color: inherit; background: #ffffff;
  border: 1px solid var(--border-color); border-radius: 12px;
  transition: box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
}
.site-card:hover { box-shadow: 0 10px 25px rgba(0,0,0,0.05); border-color: var(--primary-color); }
.hover-lift:hover { transform: translateY(-2px); }
.site-icon { width: 48px; height: 48px; background: #f0f4f8; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 24px; flex-shrink: 0; }
.site-info { flex: 1; overflow: hidden; display: flex; flex-direction: column; gap: 4px; }
.site-name { font-size: 16px; font-weight: 600; color: var(--text-main); margin: 0; }
.site-desc { font-size: 13px; color: var(--text-secondary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 8px; }

/* 卡片内部密码区（旧版样式） */
.site-secrets {
  margin-top: 6px; padding-top: 10px; border-top: 1px dashed #e2e8f0;
  display: flex; flex-direction: column; gap: 6px;
  background: #f8fafc; padding: 10px; border-radius: 8px;
}
.secret-row { display: flex; align-items: center; font-size: 13px; gap: 6px; }
.secret-label { color: #64748b; min-width: 36px; }
.secret-val { font-family: monospace; color: #0f172a; font-weight: 600; flex: 1; user-select: all; }
.copy-btn, .eye-btn {
  background: none; border: none; cursor: pointer; font-size: 14px;
  padding: 4px; border-radius: 4px; opacity: 0.6; transition: 0.2s;
}
.copy-btn:hover, .eye-btn:hover { opacity: 1; background: #e2e8f0; }
</style>
