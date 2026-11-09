<!-- 全网热搜聚合：直连 Cloudflare Worker，极致丝滑防抖版 -->
<template>
  <div class="page-container">
    <header class="page-header">
      <h1 class="title">全网热榜聚合</h1>
      <p class="subtitle">打破信息差，一屏尽览全网热点</p>
    </header>

    <div class="trends-layout">
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

      <main class="hot-list-container app-card">
        <div class="list-header">
          <h2>{{ currentPlatformName }} 实时热榜</h2>
          <span class="update-time">{{ loading ? '加载中...' : '刚刚更新' }}</span>
        </div>

        <div v-if="loading && currentList.length === 0" class="skeleton-list">
          <div v-for="i in 5" :key="i" class="skeleton-item"></div>
        </div>

        <div v-else-if="errorMsg" class="empty-state">
          <p>{{ errorMsg }}</p>
          <button class="retry-btn" @click="fetchData(currentPlatform, true)">重试</button>
        </div>

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
import { useRouter } from 'vue-router'

const router = useRouter()
const API_BASE = 'https://60s.3450934729.workers.dev/v2'

const platforms = [
  { id: 'weibo', name: '微博热搜', icon: '🔥', api: `${API_BASE}/weibo` },
  { id: 'zhihu', name: '知乎热榜', icon: '💡', api: `${API_BASE}/zhihu` },
  { id: 'douyin', name: '抖音热点', icon: '🎵', api: `${API_BASE}/douyin` },
  { id: 'baidu', name: '百度热搜', icon: '🔍', api: `${API_BASE}/baidu/hot` },
  { id: 'toutiao', name: '头条热榜', icon: '📰', api: `${API_BASE}/toutiao` }
]

const currentPlatform = ref('weibo')
const currentList = ref([])
const loading = ref(false)
const errorMsg = ref('')
const cacheData = ref({})
let abortController = null

const currentPlatformName = computed(() => {
  return platforms.find(p => p.id === currentPlatform.value)?.name || ''
})

const fetchData = async (platformId, forceRefresh = false) => {
  if (!forceRefresh && cacheData.value[platformId]) {
    currentList.value = cacheData.value[platformId]
    errorMsg.value = ''
    return
  }
  const platform = platforms.find(p => p.id === platformId)
  if (!platform?.api) return
  if (abortController) abortController.abort()
  abortController = new AbortController()
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch(platform.api, { signal: abortController.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const rawList = (json.data || []).slice(0, 10)
    const parsedList = rawList.map(item => ({
      title: item.title || item.name || item.word || '无标题',
      hot: item.hot || item.hot_value || item.score || '',
      url: item.url || item.link || '#'
    }))
    cacheData.value[platformId] = parsedList
    currentList.value = parsedList
  } catch (err) {
    if (err.name === 'AbortError') return
    errorMsg.value = '数据加载失败，请检查网络'
    currentList.value = []
  } finally {
    if (abortController?.signal.reason !== 'abort') loading.value = false
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

const openLink = (url) => { if (url && url !== '#') window.open(url, '_blank') }

onMounted(() => {
  fetchData('weibo')
})
</script>

<style scoped>
.page-header { margin-bottom: 30px; }
.title { font-size: 32px; font-weight: 800; margin: 0 0 8px 0; }
.subtitle { color: #666; font-size: 15px; }
.trends-layout { display: flex; gap: 24px; align-items: flex-start; }
.platform-nav { width: 220px; padding: 10px; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
.platform-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 6px; cursor: pointer; transition: all 0.2s; color: #666; font-weight: 500; }
.platform-item:hover { background: #f5f7fa; color: #333; }
.platform-item.active { background: #1e88e5; color: #fff; }
.hot-list-container { flex: 1; padding: 24px; min-width: 0; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #eee; }
.list-header h2 { font-size: 20px; font-weight: 700; margin: 0; }
.update-time { font-size: 13px; color: #999; }
.hot-item { display: flex; align-items: center; padding: 16px 8px; border-bottom: 1px solid #f8f9fa; cursor: pointer; border-radius: 6px; }
.hot-item:hover { background: #f8f9fa; }
.rank { width: 28px; font-size: 18px; font-weight: 800; color: #999; text-align: center; margin-right: 16px; }
.rank-1 { color: #ef4444; }
.rank-2 { color: #f97316; }
.rank-3 { color: #eab308; }
.content { flex: 1; display: flex; align-items: center; gap: 8px; overflow: hidden; }
.hot-title { font-size: 16px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.heat { font-size: 13px; color: #999; margin-left: 10px; }
.skeleton-item { height: 50px; background: #f0f0f0; border-radius: 6px; margin-bottom: 12px; }
</style>