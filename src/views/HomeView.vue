<template>
  <div class="home-page">
    <!-- 全宽 Hero：动态壁纸背景 + 标题文案 -->
    <header class="hero">
      <video
        ref="heroVideo"
        class="hero-video"
        src="/media/hero-motion.mp4"
        poster="/media/hero-poster.jpg"
        loop
        muted
        playsinline
        preload="metadata"
        aria-hidden="true"
      ></video>
      <div class="hero-decor" aria-hidden="true">
        <i class="blob blob-a"></i>
        <i class="blob blob-b"></i>
        <i class="blob blob-c"></i>
      </div>
      <p class="hero-kicker">{{ dateLabel }} · {{ weekday }}</p>
      <h1 class="hero-title">大明的记忆终端</h1>
      <p class="hero-sub">正在同步生活、技术与灵感的片段</p>
      <p class="hero-welcome">{{ greeting }}，{{ userStore.username || '朋友' }}。愿今日所做，皆有回响。</p>
      <button v-if="motionAllowed" type="button" class="hero-motion-toggle" :aria-label="motionOn ? '暂停背景动画' : '播放背景动画'" @click="toggleMotion">
        {{ motionOn ? '❚❚' : '▶' }}
      </button>
    </header>

    <div class="layout">
      <!-- 左栏：个人资料 + 最近在做 -->
      <aside class="col col-side">
        <section class="side-card profile-card" aria-labelledby="profile-name">
          <div class="avatar" aria-hidden="true">明</div>
          <h2 id="profile-name">大明</h2>
          <p class="motto">以器载道 · 慢慢打磨</p>
          <div class="profile-stats">
            <div><strong>{{ tools.length }}</strong><span>工具</span></div>
            <div><strong>{{ skills.length }}</strong><span>技艺</span></div>
            <div><strong>{{ daysOnline }}</strong><span>在站天数</span></div>
          </div>
          <RouterLink to="/profile" class="profile-btn">进入个人中心</RouterLink>
        </section>

        <section class="side-card" aria-labelledby="doing-heading">
          <h3 class="side-title" id="doing-heading">✍ 最近在做</h3>
          <ul class="doing-list">
            <li v-for="item in doingItems" :key="item.title">
              <RouterLink :to="item.path">
                <b>{{ item.title }}</b>
                <span>{{ item.desc }}</span>
              </RouterLink>
            </li>
          </ul>
        </section>
      </aside>

      <!-- 中栏：工具卡片流 + 河图洛书 -->
      <main class="col col-main">
        <section class="section" aria-labelledby="tools-heading">
          <h2 id="tools-heading" class="section-title">常 用 工 具</h2>
          <div class="tool-cards">
            <RouterLink v-for="tool in tools" :key="tool.path" :to="tool.path" class="tool-card">
              <span class="tool-mark" :class="tool.tone" aria-hidden="true">{{ tool.mark }}</span>
              <span class="tool-copy">
                <span class="tool-name">
                  {{ tool.name }}
                  <em v-if="tool.vipOnly" class="vip-tag">VIP</em>
                </span>
                <span class="tool-desc">{{ tool.description }}</span>
              </span>
              <span class="tool-arrow" aria-hidden="true">→</span>
            </RouterLink>
          </div>
        </section>

        <section class="section htls-section" aria-labelledby="htls-heading">
          <h2 id="htls-heading" class="section-title">河 图 洛 书</h2>
          <HeTuLuoShu />
        </section>
      </main>

      <!-- 右栏：站点统计 + 标签云 -->
      <aside class="col col-side">
        <section class="side-card" aria-labelledby="stats-heading">
          <h3 class="side-title" id="stats-heading">📊 站点统计</h3>
          <ul class="stats-list">
            <li><span>🧰 工具</span><strong>{{ tools.length }}</strong></li>
            <li><span>🗂 分区</span><strong>4</strong></li>
            <li><span>🛠 技艺</span><strong>{{ skills.length }}</strong></li>
            <li><span>🏷 标签</span><strong>{{ skills.length }}</strong></li>
            <li><span>📅 运行天数</span><strong>{{ daysOnline }}</strong></li>
          </ul>
        </section>

        <section class="side-card" aria-labelledby="tags-heading">
          <h3 class="side-title" id="tags-heading">🏷 标签云</h3>
          <div class="tag-cloud">
            <span v-for="skill in skills" :key="skill">{{ skill }}</span>
          </div>
        </section>
      </aside>
    </div>

    <footer class="home-footer">
      <p>© {{ year }} 大明</p>
      <span class="footer-mark" aria-hidden="true">✦</span>
      <p>以器载道 · 慢慢打磨</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user'
import HeTuLuoShu from '@/components/HeTuLuoShu.vue'
import { formatLongDate, formatWeekday, getGreeting } from '@/utils/date'

const userStore = useUserStore()
const now = new Date()
const dateLabel = formatLongDate(now)
const weekday = formatWeekday(now)
const year = now.getFullYear()
const greeting = computed(() => getGreeting())

// Hero 背景视频：尊重「减少动态」偏好，窄屏与省流模式下只显示 poster 静帧
const heroVideo = ref(null)
const motionOn = ref(false)
const motionAllowed = ref(false)

function startMotion() {
  if (!motionAllowed.value) return
  heroVideo.value?.play().then(() => { motionOn.value = true }).catch(() => { motionOn.value = false })
}
function stopMotion() {
  heroVideo.value?.pause()
  motionOn.value = false
}
function toggleMotion() {
  motionOn.value ? stopMotion() : startMotion()
}
onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const wide = window.matchMedia('(min-width: 761px)').matches
  const saveData = navigator.connection?.saveData === true
  motionAllowed.value = !reduced && wide && !saveData
  startMotion()
})
onBeforeUnmount(stopMotion)

// 建站日期：用于「在站天数」，可改成真实日期
const SITE_BIRTH = '2026-08-01'
const daysOnline = Math.max(1, Math.ceil((Date.now() - new Date(SITE_BIRTH).getTime()) / 86400000))

const allTools = [
  { path: '/notes', mark: '札', name: '随心笔记', description: '记录想法，整理所学', tone: 'tone-blue' },
  { path: '/ranking', mark: '算', name: '成绩换算', description: '导入成绩，查看参考位次', tone: 'tone-green' },
  { path: '/same-scope-ranking', mark: '衡', name: '同范围定位', description: '按科类与参测范围换算', tone: 'tone-purple' },
  { path: '/character', mark: '字', name: '繁体解字', description: '看字形、字义与繁简差异', tone: 'tone-orange' },
  { path: '/trends', mark: '闻', name: '全网热榜', description: '浏览各平台热点', tone: 'tone-red' },
  { path: '/products', mark: '物', name: '商品目录', description: '搜索与整理商品', tone: 'tone-cyan' },
  { path: '/navigator', mark: '藏', name: '宝藏导航', description: '打开常用网站与收藏', tone: 'tone-gold', vipOnly: true },
  { path: '/profile', mark: '身', name: '个人中心', description: '管理账号资料与会员', tone: 'tone-slate' }
]

// 非 VIP 用户看不到会员专属入口
const tools = computed(() => allTools.filter((tool) => (tool.vipOnly ? userStore.isVip : true)))

const doingItems = [
  { title: '成绩换算 · 图表分析', desc: '曲线、分布与位次三视图', path: '/ranking' },
  { title: '把想法落成笔记', desc: '记录今天值得留下的念头', path: '/notes' },
  { title: '读一个繁体字', desc: '从字形与含义开始', path: '/character' }
]

const skills = ['Vue 3', 'JavaScript', 'Vite', 'Node.js', '笔记整理', '数据分析']
</script>

<style scoped>
.home-page {
  --ink: #2c3a4f;
  --smoke: #7d8aa0;
  --line: #e5ecf6;
  --blue: #4f7ef7;
  --blue-soft: #eef3fe;
  min-height: calc(100vh - 60px);
  background: linear-gradient(180deg, #f2f6fd 0%, #f6f8fc 60%, #eff3fa 100%);
  color: var(--ink);
  font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif;
}

/* ---------- Hero ---------- */
.hero {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: clamp(300px, 40vh, 420px);
  padding: 46px 20px;
  background: #191430;
  color: #fff;
  border-radius: 0 0 26px 26px;
  box-shadow: 0 18px 40px rgba(30, 30, 70, .3);
}
.hero-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 28%;
}
/* 视频上的暗化遮罩：保证标题可读 */
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(18, 14, 40, .38) 0%, rgba(18, 14, 40, .18) 45%, rgba(18, 14, 40, .52) 100%);
  pointer-events: none;
}
.hero-decor { position: absolute; inset: 0; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(2px); opacity: .5; }
.blob-a { width: 260px; height: 260px; left: -70px; top: -90px; background: radial-gradient(circle, rgba(255,255,255,.34), transparent 70%); }
.blob-b { width: 340px; height: 340px; right: -110px; bottom: -160px; background: radial-gradient(circle, rgba(255,255,255,.26), transparent 70%); }
.blob-c { width: 130px; height: 130px; right: 18%; top: 12%; background: radial-gradient(circle, rgba(255,255,255,.2), transparent 70%); }
.hero-kicker { position: relative; z-index: 2; margin: 0 0 14px; font-size: 12px; letter-spacing: .22em; opacity: .85; }
.hero-title { position: relative; z-index: 2; margin: 0; font-size: clamp(34px, 6vw, 56px); font-weight: 900; letter-spacing: .12em; text-shadow: 0 4px 18px rgba(10, 8, 30, .55); }
.hero-sub { position: relative; z-index: 2; margin: 12px 0 0; font-size: 14px; letter-spacing: .18em; opacity: .92; text-shadow: 0 2px 10px rgba(10, 8, 30, .5); }
.hero-welcome { position: relative; z-index: 2; margin: 14px 0 0; padding: 7px 16px; border-radius: 999px; background: rgba(255, 255, 255, .14); backdrop-filter: blur(5px); font-size: 12.5px; }
.hero-motion-toggle {
  position: absolute; z-index: 3;
  right: 16px; bottom: 14px;
  width: 34px; height: 34px;
  display: grid; place-items: center;
  border: 1px solid rgba(255, 255, 255, .35);
  border-radius: 50%;
  background: rgba(20, 16, 44, .4);
  color: rgba(255, 255, 255, .85);
  font-size: 11px;
  backdrop-filter: blur(4px);
  cursor: pointer;
  transition: background .2s, transform .2s;
}
.hero-motion-toggle:hover { background: rgba(20, 16, 44, .65); transform: scale(1.08); }

/* ---------- 三栏布局 ---------- */
.layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr) 250px;
  gap: 18px;
  width: min(100%, 1180px);
  margin: 24px auto 0;
  padding: 0 18px;
  align-items: start;
}
.col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.col-main { gap: 34px; }
.col-side { position: sticky; top: 74px; }

/* ---------- 侧栏卡片 ---------- */
.side-card {
  padding: 20px 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 8px 22px rgba(84, 110, 170, .07);
}
.side-title { margin: 0 0 14px; font-size: 14.5px; font-weight: 700; }
.profile-card { text-align: center; }
.avatar {
  width: 84px; height: 84px;
  display: grid; place-items: center;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6d8ff8, #9db7fb);
  color: #fff; font-size: 34px; font-weight: 800;
  box-shadow: 0 10px 22px rgba(93, 124, 236, .35), inset 0 0 0 4px rgba(255,255,255,.35);
}
.profile-card h2 { margin: 0; font-size: 19px; }
.motto { margin: 7px 0 0; color: var(--smoke); font-size: 12.5px; }
.profile-stats { display: flex; justify-content: center; gap: 22px; margin: 16px 0; }
.profile-stats div { display: flex; flex-direction: column; gap: 2px; }
.profile-stats strong { color: var(--ink); font-size: 17px; font-weight: 800; }
.profile-stats span { color: var(--smoke); font-size: 11.5px; }
.profile-btn {
  display: block; padding: 10px 0;
  border-radius: 11px;
  background: linear-gradient(135deg, #5c82f6, #7d9ffb);
  color: #fff; font-size: 13.5px; font-weight: 700; text-decoration: none;
  transition: transform .2s, box-shadow .2s;
}
.profile-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(76, 110, 220, .3); }
.doing-list { display: flex; flex-direction: column; gap: 4px; margin: 0; padding: 0; list-style: none; }
.doing-list a {
  display: flex; flex-direction: column; gap: 3px;
  padding: 9px 10px; border-radius: 11px;
  color: inherit; text-decoration: none;
  transition: background .18s;
}
.doing-list a:hover { background: var(--blue-soft); }
.doing-list b { font-size: 13.5px; }
.doing-list span { color: var(--smoke); font-size: 11.5px; }

/* ---------- 中栏 ---------- */
.section-title {
  display: flex; align-items: center; gap: 12px;
  margin: 0 0 16px;
  color: #3a4a63; font-size: 15.5px; font-weight: 700; letter-spacing: .34em; padding-left: .34em;
}
.section-title::before { content: ''; width: 4px; height: 16px; border-radius: 2px; background: linear-gradient(180deg, #5c82f6, #9db7fb); }
.tool-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.tool-card {
  position: relative;
  display: flex; align-items: center; gap: 13px;
  padding: 16px 15px;
  border: 1px solid var(--line); border-radius: 16px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(84, 110, 170, .06);
  color: inherit; text-decoration: none;
  transition: transform .2s, box-shadow .2s, border-color .2s;
}
.tool-card:hover { transform: translateY(-3px); border-color: #c3d4fd; box-shadow: 0 12px 26px rgba(76, 110, 220, .14); }
.tool-mark {
  flex: 0 0 46px; height: 46px;
  display: grid; place-items: center;
  border-radius: 13px;
  color: #fff; font-size: 20px; font-weight: 700;
  box-shadow: inset 0 0 0 3px rgba(255,255,255,.28);
}
.tone-blue { background: linear-gradient(135deg, #5c82f6, #8fb0fb); }
.tone-green { background: linear-gradient(135deg, #2fb380, #6fd3ab); }
.tone-purple { background: linear-gradient(135deg, #8a6cf0, #b49bfa); }
.tone-orange { background: linear-gradient(135deg, #f09a4a, #f7c186); }
.tone-red { background: linear-gradient(135deg, #ef6a6a, #f99f9f); }
.tone-cyan { background: linear-gradient(135deg, #38b6d8, #82d6ea); }
.tone-gold { background: linear-gradient(135deg, #d8a13c, #eec27e); }
.tone-slate { background: linear-gradient(135deg, #64748b, #93a5bd); }
.tool-copy { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.tool-name { display: flex; align-items: center; gap: 7px; font-size: 14.5px; font-weight: 700; }
.vip-tag { padding: 1px 7px; border-radius: 999px; background: #fff3e0; color: #c07a1d; font-size: 10.5px; font-style: normal; font-weight: 700; }
.tool-desc { color: var(--smoke); font-size: 12px; line-height: 1.6; }
.tool-arrow { margin-left: auto; color: #b8c4da; font-size: 15px; transition: transform .2s, color .2s; }
.tool-card:hover .tool-arrow { transform: translateX(4px); color: var(--blue); }
.htls-section :deep(.htls) { background: #fff; border: 1px solid var(--line); border-radius: 18px; box-shadow: 0 8px 22px rgba(84, 110, 170, .07); }

/* ---------- 右栏 ---------- */
.stats-list { display: flex; flex-direction: column; gap: 11px; margin: 0; padding: 0; list-style: none; }
.stats-list li { display: flex; align-items: center; justify-content: space-between; color: #4a5872; font-size: 13px; }
.stats-list strong { color: var(--ink); font-size: 15px; font-weight: 800; }
.tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
.tag-cloud span {
  padding: 6px 12px; border-radius: 999px;
  background: var(--blue-soft); color: #4a6cd4;
  font-size: 12px; font-weight: 600;
  transition: background .18s, color .18s;
  cursor: default;
}
.tag-cloud span:hover { background: #dfe9fd; color: #2f56c2; }

/* ---------- 页脚 ---------- */
.home-footer {
  display: flex; justify-content: center; align-items: center; gap: 14px;
  width: min(700px, 100%); margin: 46px auto 0; padding: 20px 18px 30px;
  border-top: 1px solid var(--line);
  color: var(--smoke); font-size: 11.5px; letter-spacing: .1em;
}
.home-footer p { margin: 0; }
.footer-mark { color: var(--blue); font-size: 12px; }

/* ---------- 响应式 ---------- */
@media (max-width: 1080px) {
  .layout { grid-template-columns: 230px minmax(0, 1fr); }
  .layout > .col-side:last-of-type { grid-column: 1 / -1; position: static; display: grid; grid-template-columns: 1fr 1fr; }
}
@media (max-width: 760px) {
  .hero { min-height: 264px; padding: 36px 16px; border-radius: 0 0 20px 20px; }
  .hero-motion-toggle { right: 12px; bottom: 10px; }
  .hero-title { letter-spacing: .08em; }
  .layout { grid-template-columns: 1fr; gap: 14px; padding: 0 12px; margin-top: 16px; }
  .col-side { position: static; }
  .layout > .col-side:last-of-type { grid-template-columns: 1fr; }
  .tool-cards { grid-template-columns: 1fr; gap: 10px; }
  .section-title { letter-spacing: .22em; padding-left: .22em; font-size: 14.5px; }
  .col-main { gap: 26px; }
}
@media (prefers-reduced-motion: reduce) { .tool-card, .tool-arrow, .profile-btn, .doing-list a, .tag-cloud span, .hero-motion-toggle { transition: none; } }
</style>
