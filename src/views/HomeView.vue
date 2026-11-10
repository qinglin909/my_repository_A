<template>
  <div class="home-page">
    <div class="page-frame">
      <div class="seal" aria-label="明">明</div>

      <header class="hero">
        <p class="hero-kicker">{{ dateLabel }} · {{ weekday }}</p>
        <h1 class="hero-title">{{ displayName }}</h1>
        <div class="title-divider" aria-hidden="true"><span class="diamond"></span></div>
        <p class="hero-subtitle">个人工作台 <span>·</span> 工具、灵感与日常</p>
        <p class="hero-welcome">{{ greeting }}，{{ userStore.username || '朋友' }}。愿今日所做，皆有回响。</p>
      </header>

      <main class="main-content">
        <section class="section" aria-labelledby="tools-heading">
          <h2 id="tools-heading" class="section-title">常 用 工 具</h2>
          <div class="tools-grid">
            <RouterLink v-for="tool in tools" :key="tool.path" :to="tool.path" class="tool-card">
              <span class="tool-mark" aria-hidden="true">{{ tool.mark }}</span>
              <span class="tool-name">{{ tool.name }}</span>
              <span class="tool-desc">{{ tool.description }}</span>
              <span class="tool-arrow" aria-hidden="true">↗</span>
            </RouterLink>
          </div>
        </section>

        <section class="section craft-section" aria-labelledby="craft-heading">
          <h2 id="craft-heading" class="section-title">手 边 事</h2>
          <div class="craft-list">
            <article v-for="item in craftItems" :key="item.title" class="craft-item">
              <span class="craft-index">{{ item.index }}</span>
              <div class="craft-copy">
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
              </div>
              <RouterLink :to="item.path" class="craft-link" :aria-label="`前往${item.title}`">进入 <span aria-hidden="true">→</span></RouterLink>
            </article>
          </div>
        </section>

        <section class="section skills-section" aria-labelledby="skills-heading">
          <h2 id="skills-heading" class="section-title">所 用 技 艺</h2>
          <div class="skills-row">
            <span v-for="skill in skills" :key="skill">{{ skill }}</span>
          </div>
        </section>
      </main>

      <footer class="home-footer">
        <p>© {{ year }} {{ displayName }}</p>
        <span class="footer-mark" aria-hidden="true">✦</span>
        <p>以器载道 · 慢慢打磨</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const now = new Date()
const displayName = '大明'
const dateLabel = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(now)
const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(now)
const year = now.getFullYear()
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 11) return '早安'
  if (hour < 14) return '午安'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const allTools = [
  { path: '/notes', mark: '札', name: '随心笔记', description: '记录想法，整理所学' },
  { path: '/ranking', mark: '算', name: '成绩换算', description: '导入成绩，查看参考位次' },
  { path: '/same-scope-ranking', mark: '衡', name: '同范围定位', description: '按科类与参测范围换算' },
  { path: '/character', mark: '字', name: '繁体解字', description: '看字形、字义与繁简差异' },
  { path: '/trends', mark: '闻', name: '全网热榜', description: '浏览各平台热点' },
  { path: '/products', mark: '物', name: '商品目录', description: '搜索与整理商品' },
  { path: '/navigator', mark: '藏', name: '宝藏导航', description: '打开常用网站与收藏', vipOnly: true },
  { path: '/profile', mark: '身', name: '个人中心', description: '管理头像与账号资料' }
]

// 非 VIP 用户看不到会员专属入口
const tools = computed(() => allTools.filter((tool) => (tool.vipOnly ? userStore.isVip : true)))

const craftItems = [
  { index: '壹', title: '把想法落成笔记', description: '新建一篇文档，记录今天值得留下的念头。', path: '/notes' },
  { index: '贰', title: '核对一次成绩定位', description: '用同科类、同范围数据做参考，不把估算当作承诺。', path: '/same-scope-ranking' },
  { index: '叁', title: '读一个繁体字', description: '从字形与常见含义开始，慢慢了解文字来历。', path: '/character' }
]

const skills = ['Vue 3', 'JavaScript', 'Vite', 'Node.js', '笔记整理', '数据分析']
</script>

<style scoped>
.home-page {
  --home-bg: #f3eee4;
  --paper: #302a22;
  --smoke: #71695d;
  --red: #a93632;
  --gold: #9a7425;
  --gold-line: rgba(139, 105, 36, .24);
  min-height: calc(100vh - 100px);
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(193, 39, 45, .07), transparent 48%),
    linear-gradient(180deg, #fbf8f1 0%, var(--home-bg) 55%, #eee7d9 100%);
  color: var(--paper);
  font-family: "Noto Serif SC", "Songti SC", "SimSun", serif;
}
.page-frame { width: min(100%, 980px); margin: 0 auto; padding: 48px 28px 34px; display: flex; flex-direction: column; align-items: center; }
.seal { width: 42px; height: 42px; display: grid; place-items: center; margin-bottom: 25px; background: var(--red); color: #170f0d; font-size: 22px; font-weight: 900; border-radius: 4px; clip-path: polygon(2% 0, 98% 2%, 100% 98%, 0 100%); box-shadow: 0 0 22px #c1272d55; }
.hero { width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 65px; }
.hero-kicker { margin: 0 0 18px; color: var(--smoke); font-size: 12px; letter-spacing: .25em; }
.hero-title { margin: 0; color: var(--paper); font-size: clamp(54px, 10vw, 88px); font-weight: 900; letter-spacing: .42em; padding-left: .42em; line-height: 1.2; text-shadow: 0 3px 14px rgba(70, 48, 20, .12); }
.title-divider { width: min(560px, 80%); display: flex; align-items: center; margin: 22px 0 18px; }
.title-divider::before, .title-divider::after { content: ''; height: 1px; flex: 1; background: linear-gradient(90deg, transparent, var(--gold), transparent); }
.diamond { width: 8px; height: 8px; flex: 0 0 auto; margin: 0 18px; transform: rotate(45deg); background: var(--gold); box-shadow: 0 0 10px var(--gold); }
.hero-subtitle { margin: 0; color: var(--gold); font-size: 14px; letter-spacing: .36em; padding-left: .36em; }
.hero-subtitle span { padding: 0 6px; color: var(--red); }
.hero-welcome { margin: 17px 0 0; color: var(--smoke); font-size: 13px; letter-spacing: .08em; }
.main-content { width: 100%; display: flex; flex-direction: column; gap: 58px; }
.section { width: 100%; display: flex; flex-direction: column; align-items: center; }
.section-title { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 0 0 26px; color: var(--gold); font-size: 17px; font-weight: 600; letter-spacing: .48em; padding-left: .48em; }
.section-title::before, .section-title::after { content: '❖'; color: var(--red); font-size: 10px; letter-spacing: 0; }
.tools-grid { width: 100%; max-width: 800px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.tool-card { min-height: 146px; display: flex; flex-direction: column; align-items: flex-start; padding: 18px 17px 15px; border: 1px solid var(--gold-line); border-radius: 4px; background: rgba(255, 253, 248, .72); box-shadow: 0 4px 16px rgba(74, 54, 25, .045); color: var(--paper); text-decoration: none; position: relative; transition: border-color .25s, background .25s, transform .25s, box-shadow .25s; }
.tool-card::before, .tool-card::after { content: ''; width: 5px; height: 5px; position: absolute; background: var(--gold); opacity: .55; }
.tool-card::before { top: 5px; left: 5px; }
.tool-card::after { right: 5px; bottom: 5px; }
.tool-card:hover, .tool-card:focus-visible { transform: translateY(-3px); border-color: var(--red); background: #fffdf8; box-shadow: 0 10px 24px rgba(74, 54, 25, .12); outline: none; }
.tool-mark { width: 30px; height: 30px; display: grid; place-items: center; margin-bottom: 10px; border: 1px solid #d4af3760; color: var(--gold); font-size: 15px; }
.tool-name { font-size: 14px; letter-spacing: .12em; }
.tool-desc { margin-top: 5px; color: var(--smoke); font-size: 11px; line-height: 1.6; }
.tool-arrow { position: absolute; top: 15px; right: 15px; color: var(--red); font-size: 14px; opacity: .8; }
.craft-list { width: 100%; max-width: 720px; border-top: 1px solid var(--gold-line); }
.craft-item { display: flex; align-items: center; gap: 18px; padding: 18px 10px; border-bottom: 1px solid var(--gold-line); transition: background .2s; }
.craft-item:hover { background: #d4af3708; }
.craft-index { flex: 0 0 34px; color: var(--red); font-size: 15px; }
.craft-copy { flex: 1; min-width: 0; }
.craft-copy h3 { margin: 0 0 4px; color: var(--paper); font-size: 15px; font-weight: 600; letter-spacing: .1em; }
.craft-copy p { margin: 0; color: var(--smoke); font-size: 12px; line-height: 1.6; }
.craft-link { color: var(--gold); font-size: 12px; white-space: nowrap; text-decoration: none; }
.craft-link span { display: inline-block; padding-left: 5px; transition: transform .2s; }
.craft-link:hover span { transform: translateX(4px); }
.skills-row { display: flex; justify-content: center; flex-wrap: wrap; gap: 9px; }
.skills-row span { padding: 7px 13px; border: 1px solid var(--gold-line); border-radius: 2px; background: rgba(255, 253, 248, .5); color: #5c5140; font-size: 11px; letter-spacing: .08em; }
.home-footer { width: min(700px, 100%); display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 65px; padding-top: 20px; border-top: 1px solid var(--gold-line); color: var(--smoke); font-size: 11px; letter-spacing: .12em; }
.home-footer p { margin: 0; }
.footer-mark { color: var(--red); font-size: 12px; }
@media (max-width: 760px) {
  .page-frame { padding: 32px 18px 28px; }
  .hero { margin-bottom: 48px; }
  .hero-title { font-size: clamp(46px, 14vw, 68px); letter-spacing: .3em; padding-left: .3em; }
  .hero-subtitle { font-size: 12px; letter-spacing: .2em; padding-left: .2em; }
  .main-content { gap: 44px; }
  .tools-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
  .tool-card { min-height: 132px; padding: 14px 12px; }
  .section-title { margin-bottom: 20px; font-size: 15px; }
  .craft-item { gap: 11px; padding: 15px 4px; }
  .craft-copy h3 { font-size: 13px; }
  .craft-copy p { font-size: 11px; }
  .home-footer { flex-wrap: wrap; gap: 8px 12px; font-size: 10px; }
}
@media (prefers-reduced-motion: reduce) { .tool-card, .craft-item, .craft-link span { transition: none; } }
</style>
