<!-- 全网热搜聚合：接入自有服务器代理，彻底解决跨域与超时 -->
<template>
  <div class="page-container">
    <header class="page-header">
      <h1 class="title">全网热榜聚合</h1>
      <p class="subtitle">打破信息差，一屏尽览全网热点</p>
    </header>

    <div class="trends-layout">
      <!-- 左侧：平台切换菜单 -->
      <aside class="platform-nav app-card">
        <div 
          v-for="platform in platforms" 
          :key="platform.id"
          class="platform-item"
          :class="{ active: currentPlatform === platform.id }"
          @click="switchPlatform(platform.id)"
        >
          <span class="icon">{{ platform.icon }}</span>
          <span class="name">{{ platform.name }}</span>
        </div>
      </aside>

      <!-- 右侧：热搜列表区 -->
      <main class="hot-list-container app-card">
        <div class="list-header">
          <h2>{{ currentPlatformName }} 实时热榜</h2>
          <span class="update-time">{{ loading ? '加载中...' : '刚刚更新' }}</span>
        </div>

        <!-- 骨架屏加载 -->
        <div v-if="loading && currentList.length === 0" class="skeleton-list">
          <div v-for="i in 5" :key="i" class="skeleton-item"></div>
        </div>

        <!-- 错误提示 -->
        <div v-else-if="errorMsg" class="empty-state">
          <p>{{ errorMsg }}</p>
          <button class="retry-btn" @click="fetchData(currentPlatform, true)">重试</button>
        </div>

        <!-- 真实数据列表 -->
        <div v-else class="hot-list">
          <div 
            v-for="(item, index) in currentList" 
            :key="index" 
            class="hot-item"
            @click="openLink(item.url)"
          >
            <div class="rank" :class="getRankClass(index)">{{ index + 1 }}</div>
            <div class="content">
              <span class="hot-title">{{ item.title }}</span>
            </div>
            <div class="heat" v-if="item.hot">{{ item.hot }}</div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 🚨 注意：这里去掉了原来的 API_BASE，因为现在统一请求我们自己的 /api
const platforms = [
  { id: 'weibo', name: '微博热搜', icon: '🔥' },
  { id: 'zhihu', name: '知乎热榜', icon: '💡' },
  { id: 'douyin', name: '抖音热点', icon: '🎵' },
  { id: 'baidu', name: '百度热搜', icon: '🔍' },
  { id: 'toutiao', name: '头条热榜', icon: '📰' }
]

const currentPlatform = ref('weibo')
const currentList = ref([])
const loading = ref(false)
const errorMsg = ref('')

// 缓存与请求控制器
const cacheData = ref({})
let abortController = null

const currentPlatformName = computed(() => {
  return platforms.find(p => p.id === currentPlatform.value)?.name || ''
})

const fetchData = async (platformId, forceRefresh = false) => {
  // 1. 命中缓存且不是强制刷新，直接返回
  if (!forceRefresh && cacheData.value[platformId]) {
    currentList.value = cacheData.value[platformId]
    errorMsg.value = ''
    return
  }

  // 2. 如果有上一个未完成的请求，直接掐断它（防抖核心）
  if (abortController) {
    abortController.abort()
  }
  abortController = new AbortController()

  loading.value = true
  errorMsg.value = ''

  try {
    // 🚨 核心修改：请求我们自己的后端代理接口，不再直连第三方
    // Vite 本地开发时会转发给 localhost:3000，线上 Vercel 会转发给你的阿里云
    const res = await fetch(`/api/trends?platform=${platformId}`, { 
      signal: abortController.signal 
    })
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    
    const json = await res.json()
    const rawList = (json.data || []).slice(0, 10)
    
    const parsedList = rawList.map(item => ({
      title: item.title || item.name || item.word || '无标题',
      hot: item.hot || item.hot_value || item.score || '',
      url: item.url || item.link || '#'
    }))
    
    // 3. 请求成功，写入缓存并更新视图
    cacheData.value[platformId] = parsedList
    currentList.value = parsedList
    
  } catch (err) {
    // 如果是被 abort 掐断的，不要报错
    if (err.name === 'AbortError') {
      console.log('请求被安全取消')
      return
    }
    console.error(`${currentPlatformName.value} 请求失败:`, err)
    errorMsg.value = '数据加载失败，请稍后重试'
    currentList.value = []
  } finally {
    // 只有当前请求是最后发起的那个，才关掉 loading
    if (abortController?.signal.reason !== 'abort') {
      loading.value = false
    }
  }
}

const switchPlatform = (id) => {
  if (currentPlatform.value === id) return
  currentPlatform.value = id
  fetchData(id)
}

const getRankClass = (index) => {
  if (index === 0) return 'rank-1'
  if (index === 1) return 'rank-2'
  if (index === 2) return 'rank-3'
  return ''
}

const openLink = (url) => {
  if (url && url !== '#') {
    window.open(url, '_blank')
  }
}

onMounted(() => {
  fetchData('weibo')
})
</script>

<style scoped>
/* 样式完全复用你原来的 */
.page-header { margin-bottom: 30px; }
.title { font-size: 32px; font-weight: 800; color: var(--text-main); margin: 0 0 8px 0; }
.subtitle { color: var(--text-secondary); font-size: 15px; }

.trends-layout { display: flex; gap: 24px; align-items: flex-start; }
.platform-nav { width: 220px; padding: 10px; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
.platform-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s; color: var(--text-secondary); font-weight: 500; white-space: nowrap; }
.platform-item:hover { background: #f5f7fa; color: var(--text-main); }
.platform-item.active { background: var(--primary-color); color: #fff; box-shadow: 0 4px 12px rgba(25, 137, 250, 0.2); }

.hot-list-container { flex: 1; padding: 24px; min-width: 0; }
.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color); }
.list-header h2 { font-size: 20px; font-weight: 700; margin: 0; color: var(--text-main); }
.update-time { font-size: 13px; color: var(--text-muted); }

.hot-item { display: flex; align-items: center; padding: 16px 8px; border-bottom: 1px solid #f8f9fa; cursor: pointer; transition: background 0.2s; border-radius: var(--radius-sm); }
.hot-item:hover { background: #f8f9fa; }

.rank { width: 28px; font-size: 18px; font-weight: 800; color: var(--text-muted); text-align: center; margin-right: 16px; flex-shrink: 0;}
.rank-1 { color: #ef4444; }
.rank-2 { color: #f97316; }
.rank-3 { color: #eab308; }

.content { flex: 1; display: flex; align-items: center; gap: 8px; overflow: hidden;}
.hot-title { font-size: 16px; color: var(--text-main); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}
.heat { font-size: 13px; color: var(--text-muted); font-weight: 500; flex-shrink: 0; margin-left: 10px;}

.skeleton-item { height: 50px; background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: skeleton 1.5s infinite; border-radius: var(--radius-sm); margin-bottom: 12px; }
@keyframes skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
.retry-btn { margin-top: 16px; padding: 10px 24px; border-radius: 8px; background: var(--primary-color); color: #fff; border: none; cursor: pointer; font-weight: 600; }

@media (max-width: 768px) {
  .trends-layout { flex-direction: column; }
  .platform-nav { width: 100%; flex-direction: row; overflow-x: auto; }
  .platform-item { flex-shrink: 0; }
}
</style>