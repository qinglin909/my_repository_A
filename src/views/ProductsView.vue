<template>
  <section class="products-page">
    <header class="header-area">
      <div>
        <p class="eyebrow">商品发现</p>
        <h1>全网商品搜索</h1>
        <p class="subtitle">搜索本地商品目录，或直接前往淘宝查看实时商品。</p>
      </div>
    </header>

    <VipPlanCard v-if="showVip" />

    <form class="search-form" @submit.prevent="searchProducts">
      <label class="sr-only" for="product-search">搜索商品</label>
      <input
        id="product-search"
        v-model="keyword"
        type="search"
        maxlength="100"
        placeholder="输入商品名称或关键词"
      />
      <button class="search-btn" type="submit" :disabled="loading">搜索</button>
      <a
        v-if="keyword.trim()"
        class="taobao-btn"
        :href="taobaoSearchUrl"
        target="_blank"
        rel="noopener noreferrer"
      >在淘宝搜索 ↗</a>
    </form>

    <div class="result-meta" aria-live="polite">
      <span>{{ total ? `本地目录找到 ${total} 件商品` : '本地商品目录' }}</span>
      <button v-if="keyword" class="clear-btn" type="button" @click="clearSearch">清除搜索</button>
    </div>

    <div v-if="vipNotice" class="vip-notice" role="status">
      宝藏导航是会员专属模块。你当前不是 VIP，可以在上方会员专区开通后访问。
    </div>

    <div v-if="errorMessage" class="notice error-notice" role="alert">
      {{ errorMessage }}
      <button type="button" @click="loadProducts(true)">重试</button>
    </div>

    <div v-else-if="loading && products.length === 0" class="notice" aria-live="polite">
      正在搜索商品…
    </div>

    <div v-else-if="products.length === 0" class="empty-state">
      <div class="empty-icon" aria-hidden="true">🛍️</div>
      <h2>{{ keyword ? '本地目录暂时没有匹配商品' : '商品目录还没有数据' }}</h2>
      <p>这里不会展示随机生成的假商品。可以输入关键词后跳转淘宝搜索，或稍后接入有授权的商品数据源。</p>
      <a
        v-if="keyword.trim()"
        class="taobao-btn empty-taobao-btn"
        :href="taobaoSearchUrl"
        target="_blank"
        rel="noopener noreferrer"
      >前往淘宝搜索「{{ keyword.trim() }}」↗</a>
    </div>

    <template v-else>
      <div class="product-grid">
        <article v-for="product in products" :key="product.id" class="product-card">
          <a
            v-if="product.url"
            class="product-link"
            :href="safeProductUrl(product.url)"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="image-wrapper">
              <img
                v-if="product.cover_image || product.image"
                :src="product.cover_image || product.image"
                :alt="product.title || product.name || '商品图片'"
                loading="lazy"
                @error="hideBrokenImage"
              />
              <span v-else class="image-placeholder">暂无图片</span>
              <span v-if="product.tag" class="tag">{{ product.tag }}</span>
            </div>
            <div class="info-wrapper">
              <h2 class="product-title">{{ product.title || product.name }}</h2>
              <p v-if="product.description" class="description">{{ product.description }}</p>
              <div class="bottom-row">
                <span class="price">{{ formatPrice(product.price) }}</span>
                <span class="view-btn">查看商品 ↗</span>
              </div>
            </div>
          </a>
          <div v-else class="product-link">
            <div class="image-wrapper">
              <img
                v-if="product.cover_image || product.image"
                :src="product.cover_image || product.image"
                :alt="product.title || product.name || '商品图片'"
                loading="lazy"
                @error="hideBrokenImage"
              />
              <span v-else class="image-placeholder">暂无图片</span>
              <span v-if="product.tag" class="tag">{{ product.tag }}</span>
            </div>
            <div class="info-wrapper">
              <h2 class="product-title">{{ product.title || product.name }}</h2>
              <p v-if="product.description" class="description">{{ product.description }}</p>
              <div class="bottom-row">
                <span class="price">{{ formatPrice(product.price) }}</span>
                <span class="unavailable">暂无商品链接</span>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div v-if="hasMore" class="load-more-row">
        <button class="load-more-btn" type="button" :disabled="loading" @click="loadProducts()">
          {{ loading ? '正在加载…' : '加载更多' }}
        </button>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import VipPlanCard from '@/components/VipPlanCard.vue'

const products = ref([])
const keyword = ref('')
const loading = ref(false)
const hasMore = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 24
const errorMessage = ref('')
const route = useRoute()
const vipNotice = computed(() => route.query.vip === 'required')
let activeRequest

const showVip = computed(() => keyword.value.trim() === '')

const taobaoSearchUrl = computed(() =>
  `https://s.taobao.com/search?q=${encodeURIComponent(keyword.value.trim())}`
)

const loadProducts = async (replace = false) => {
  if (loading.value) return
  if (replace) {
    activeRequest?.abort()
    page.value = 1
    products.value = []
    hasMore.value = false
  }

  loading.value = true
  errorMessage.value = ''
  activeRequest = new AbortController()

  try {
    const params = new URLSearchParams({
      page: String(page.value),
      pageSize: String(pageSize),
      q: keyword.value.trim()
    })
    const response = await fetch(`/api/products?${params}`, { signal: activeRequest.signal })
    if (!response.ok) throw new Error(`商品接口响应异常 (${response.status})`)

    const payload = await response.json()
    const items = Array.isArray(payload) ? payload : payload.items
    if (!Array.isArray(items)) throw new Error('商品接口返回格式不正确')

    products.value = replace ? items : [...products.value, ...items]
    total.value = Number.isFinite(payload.total) ? payload.total : products.value.length
    hasMore.value = typeof payload.hasMore === 'boolean'
      ? payload.hasMore
      : items.length === pageSize
    page.value += 1
  } catch (error) {
    if (error.name !== 'AbortError') {
      errorMessage.value = error.message || '商品加载失败，请稍后重试。'
    }
  } finally {
    loading.value = false
  }
}

const searchProducts = () => loadProducts(true)

const clearSearch = () => {
  keyword.value = ''
  loadProducts(true)
}

const safeProductUrl = (value) => {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}

const formatPrice = (price) => {
  const amount = Number(price)
  return Number.isFinite(amount) ? `¥${amount.toFixed(2)}` : '价格待补充'
}

const hideBrokenImage = (event) => {
  event.target.hidden = true
}

onMounted(() => loadProducts(true))
</script>

<style scoped>
.products-page { min-height: calc(100vh - 80px); box-sizing: border-box; padding: 32px clamp(16px, 5vw, 64px) 56px; background: #f7f8fa; }
.header-area { max-width: 1200px; margin: 0 auto 24px; }
.eyebrow { margin: 0 0 8px; color: #2563eb; font-size: 13px; font-weight: 700; letter-spacing: .08em; }
.header-area h1 { margin: 0; color: #172033; font-size: clamp(26px, 4vw, 36px); }
.subtitle { margin: 10px 0 0; color: #667085; font-size: 15px; }
.search-form { display: flex; align-items: center; gap: 10px; max-width: 1200px; margin: 0 auto; padding: 12px; border: 1px solid #e5e7eb; border-radius: 16px; background: #fff; box-shadow: 0 8px 26px #1018280a; }
.search-form input { flex: 1; min-width: 0; border: 0; outline: 0; padding: 10px 12px; color: #172033; font-size: 16px; }
.search-btn, .taobao-btn, .load-more-btn { display: inline-flex; justify-content: center; align-items: center; min-height: 42px; padding: 0 18px; border: 0; border-radius: 10px; background: #2563eb; color: white; font-size: 14px; font-weight: 700; text-decoration: none; cursor: pointer; white-space: nowrap; }
.search-btn:disabled, .load-more-btn:disabled { opacity: .6; cursor: wait; }
.taobao-btn { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.result-meta { display: flex; justify-content: space-between; max-width: 1200px; margin: 20px auto 14px; color: #667085; font-size: 14px; }
.clear-btn { border: 0; background: transparent; color: #2563eb; cursor: pointer; }
.vip-notice { max-width: 1200px; margin: 0 auto 18px; padding: 14px 18px; border: 1px solid #fde3c8; border-radius: 14px; background: #fff8ef; color: #b45309; font-size: 14px; line-height: 1.6; }
.notice, .empty-state { max-width: 1200px; margin: 0 auto; padding: 48px 20px; border: 1px solid #e5e7eb; border-radius: 18px; background: white; text-align: center; color: #667085; }
.error-notice { display: flex; justify-content: center; align-items: center; gap: 12px; color: #b42318; }
.error-notice button { border: 0; color: #2563eb; background: transparent; cursor: pointer; }
.empty-icon { font-size: 42px; }
.empty-state h2 { margin: 12px 0 8px; color: #172033; font-size: 20px; }
.empty-state p { max-width: 620px; margin: 0 auto 20px; line-height: 1.7; }
.empty-taobao-btn { display: inline-flex; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; max-width: 1200px; margin: 0 auto; }
.product-card { overflow: hidden; border: 1px solid #eaecf0; border-radius: 16px; background: white; transition: transform .18s ease, box-shadow .18s ease; }
.product-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px #10182814; }
.product-link { display: flex; height: 100%; flex-direction: column; color: inherit; text-decoration: none; }
.image-wrapper { position: relative; display: grid; place-items: center; height: 210px; overflow: hidden; background: #f2f4f7; }
.image-wrapper img { width: 100%; height: 100%; object-fit: cover; }
.image-placeholder { color: #98a2b3; font-size: 13px; }
.tag { position: absolute; top: 12px; left: 12px; padding: 4px 9px; border-radius: 999px; background: #f04438; color: white; font-size: 12px; }
.info-wrapper { display: flex; flex: 1; flex-direction: column; gap: 12px; padding: 14px; }
.product-title { display: -webkit-box; overflow: hidden; margin: 0; color: #1d2939; font-size: 15px; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.description { margin: 0; color: #667085; font-size: 13px; }
.bottom-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; }
.price { color: #e5484d; font-size: 19px; font-weight: 800; }
.view-btn { color: #2563eb; font-size: 13px; }
.unavailable { color: #98a2b3; font-size: 12px; }
.load-more-row { padding: 28px 0; text-align: center; }
.load-more-btn { min-width: 140px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 600px) { .products-page { padding: 24px 14px 40px; } .search-form { flex-wrap: wrap; } .search-form input { flex-basis: 100%; } .search-btn, .taobao-btn { flex: 1; } .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .image-wrapper { height: 150px; } .info-wrapper { padding: 10px; } .bottom-row { align-items: flex-start; flex-direction: column; } .error-notice { flex-wrap: wrap; } }
</style>
