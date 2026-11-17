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
          <!-- 站外链接新窗口打开；站内工具走路由 -->
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
              <p class="site-desc">{{ site.desc }}</p>
              
              <!-- 卡片内的账号密码展示区 (只有配置了 secret 才会显示) -->
              <div v-if="site.secret" class="site-secrets" @click.prevent.stop>
                <div class="secret-row" v-if="site.secret.account">
                  <span class="secret-label">账号:</span>
                  <span class="secret-val">{{ site.secret.account }}</span>
                  <button class="copy-btn" @click="copyText(site.secret.account)" title="复制账号">📋</button>
                </div>
                <div class="secret-row" v-if="site.secret.password">
                  <span class="secret-label">密码:</span>
                  <span class="secret-val">
                    {{ showPasswords[site.name] ? site.secret.password : '••••••••' }}
                  </span>
                  <button class="eye-btn" @click="togglePassword(site.name)" title="显示/隐藏密码">
                    {{ showPasswords[site.name] ? '🙈' : '👁️' }}
                  </button>
                  <button class="copy-btn" @click="copyText(site.secret.password)" title="复制密码">📋</button>
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
import { ref, computed, reactive } from 'vue'

const keyword = ref('')

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
  } catch (err) {
    alert('复制失败，请手动复制')
  }
}

// =========================================
// 导航数据（优化了数据结构，去掉了微信的密码）
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
          { 
            name: '优途教育-后台管理', 
            icon: '🏫', 
            desc: 'wcii20 优途教育系统', 
            url: 'https://wcii20.ytowin.com/02ko5qp6/login/Adminpc78',
            secret: { account: 'yuanhuiadmin', password: 'yuanhui@2021#' }
          },
          { 
            name: '发送短信', 
            icon: '✉️', 
            desc: '内部短信发送平台', 
            url: 'http://8.134.208.23:8888/loginBlue.html',
            secret: { account: 'gzjsy', password: 'gzjsy@0711' }
          },
          { 
            name: '新订单管理系统', 
            icon: '🛒', 
            desc: 'qecode 订单系统', 
            url: 'http://qecode.uwii.com.cn/',
            secret: { account: 'zhaowenbin', password: 'yuanhui2024' }
          },
          { 
            name: '优途后台管理平台', 
            icon: '💻', 
            desc: 'admin.iutowin 统一后台', 
            url: 'https://admin.iutowin.com/login',
            secret: { account: 'yhadmin', password: '123456' }
          }
        ]
      },
      {
        title: '业务与支付',
        sites: [
          // 微信商户平台无需密码，直接不写 secret 字段，卡片会自动隐藏密码区
          { 
            name: '微信商户平台', 
            icon: '💳', 
            desc: '处理投诉与支付业务', 
            url: 'https://pay.weixin.qq.com/' 
          }
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
      },
      {
        title: '表格与公式',
        sites: [
          { name: 'FormulaEase', icon: '🧮', desc: 'Excel 公式生成、解释与报错修复', url: 'https://formulaease.com/' },
          { name: '公式助手（本站）', icon: '✨', desc: '用 AI 写公式，支持 Excel/WPS/表格', url: '/formula', internal: true }
        ]
      },
      {
        title: '生活与记账',
        sites: [
          { name: '月度收支登记（本站）', icon: '💰', desc: '固定支出与收入登记，出图导出', url: '/bills', internal: true }
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
// 导航过滤逻辑
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
</script>

<style scoped>
/* 原有导航样式保持不变 */
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; }
.title { font-size: 32px; font-weight: 800; color: var(--text-main); margin: 0 0 8px 0; }
.subtitle { color: var(--text-secondary); font-size: 15px; }
.search-box { display: flex; align-items: center; padding: 10px 20px; width: 300px; background: #fff; border-radius: 100px; }
.search-box .icon { font-size: 18px; color: #888; margin-right: 10px; }
.search-box input { border: none; outline: none; background: transparent; font-size: 15px; color: var(--text-main); width: 100%; }

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

/* 卡片及密码区样式重构 */
.site-card { 
  display: flex; align-items: flex-start; gap: 16px; padding: 20px; 
  text-decoration: none; background: #ffffff; 
  border: 1px solid var(--border-color); border-radius: 12px;
  transition: all 0.3s ease;
}
.site-card:hover {
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  border-color: var(--primary-color);
}
.site-icon { width: 48px; height: 48px; background: #f0f4f8; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 24px; flex-shrink: 0; }
.site-info { flex: 1; overflow: hidden; display: flex; flex-direction: column; gap: 4px; }
.site-name { font-size: 16px; font-weight: 600; color: var(--text-main); margin: 0; }
.site-desc { font-size: 13px; color: var(--text-secondary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 8px;}

/* 卡片内部密码区 */
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

.hover-lift:hover { transform: translateY(-2px); }
</style>