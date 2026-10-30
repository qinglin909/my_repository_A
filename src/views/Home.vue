<template>
  <div class="page-container">
    <!-- 顶部欢迎区 -->
    <header class="hero-section">
      <div class="text-content">
        <h1 class="title">早安，<span class="highlight">{{ userStore.username || '开发者' }}</span></h1>
        <p class="subtitle">今天也是充满动力的一天，准备好开始了吗？</p>
      </div>
      <div class="app-card date-box">
        <span class="day">{{ currentDate.day }}</span>
        <span class="month">{{ currentDate.month }}</span>
      </div>
    </header>

    <!-- 数据总览面板 -->
    <section class="stats-grid">
      <div class="app-card hover-lift stat-card">
        <div class="stat-icon blue">📦</div>
        <div class="stat-info">
          <span class="stat-value">128</span>
          <span class="stat-label">追踪商品</span>
        </div>
      </div>
      <div class="app-card hover-lift stat-card">
        <div class="stat-icon green">✅</div>
        <div class="stat-info">
          <span class="stat-value">5</span>
          <span class="stat-label">待办计划</span>
        </div>
      </div>
      <div class="app-card hover-lift stat-card">
        <div class="stat-icon orange">📝</div>
        <div class="stat-info">
          <span class="stat-value">24</span>
          <span class="stat-label">已写笔记</span>
        </div>
      </div>
    </section>

    <!-- 下方模块卡片区 -->
    <section>
      <div class="section-title">快捷操作</div>
      <div class="modules-grid">
        <!-- 模块 1 -->
        <div class="app-card hover-lift module-card" @click="$router.push('/products')">
          <div class="card-header">
            <h3>商品查询</h3>
            <span class="arrow">→</span>
          </div>
          <p>前往全网搜索、比价与追踪心仪的商品。</p>
        </div>
        <!-- 模块 2 -->
        <div class="app-card hover-lift module-card" @click="$router.push('/plans')">
          <div class="card-header">
            <h3>计划表</h3>
            <span class="arrow">→</span>
          </div>
          <p>查看今日任务，管理你的日程与长期目标。</p>
        </div>
        <!-- 模块 3 -->
        <div class="app-card hover-lift module-card" @click="$router.push('/notes')">
          <div class="card-header">
            <h3>随心笔记</h3>
            <span class="arrow">→</span>
          </div>
          <p>记录突然迸发的灵感，整理知识体系。</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// ... 保持原有的 JS 逻辑不变 ...
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
const currentDate = ref({ day: '', month: '' })
onMounted(() => {
  const date = new Date()
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  currentDate.value = { day: days[date.getDay()], month: `${date.getMonth() + 1}月${date.getDate()}日` }
})
</script>

<style scoped>
/* 只保留布局相关的特有样式，彻底去掉了背景色、阴影、圆角 */
.hero-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
.title { font-size: 36px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
.highlight { color: var(--primary-color); }
.subtitle { font-size: 16px; color: var(--text-secondary); }

.date-box { display: flex; flex-direction: column; align-items: flex-end; padding: 12px 20px; }
.day { font-size: 18px; font-weight: 700; color: var(--text-main); }
.month { font-size: 14px; color: var(--text-muted); }

/* 网格布局 */
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 50px; }
.stat-card { padding: 24px; display: flex; align-items: center; gap: 20px; }
.stat-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; justify-content: center; align-items: center; font-size: 24px; }
.stat-icon.blue { background: #eef6ff; }
.stat-icon.green { background: #eefaf3; }
.stat-icon.orange { background: #fff5ee; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 24px; font-weight: 800; color: var(--text-main); line-height: 1.2; }
.stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

/* 模块卡片区 */
.modules-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.module-card { padding: 30px; cursor: pointer; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.card-header h3 { font-size: 20px; font-weight: 600; color: var(--text-main); margin: 0; }
.card-header .arrow { font-size: 20px; color: #ccc; transition: transform 0.3s; }
.module-card:hover .card-header .arrow { color: var(--primary-color); transform: translateX(5px); }
.module-card p { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin: 0; }

@media (max-width: 768px) {
  .stats-grid, .modules-grid { grid-template-columns: 1fr; }
  .hero-section { flex-direction: column; align-items: flex-start; gap: 20px; }
}
</style>