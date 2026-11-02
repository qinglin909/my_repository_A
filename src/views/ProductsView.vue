<template>
  <div class="products-page">
    <div class="header-area">
      <h2>精选好物 (无限滚动)</h2>
      <p>已加载 {{ products.length }} 条数据</p>
    </div>
    
    <!-- 原生滚动容器 -->
    <div class="scroll-container" ref="scrollRef" @scroll="handleScroll">
      <div class="grid-wrapper">
        <div class="product-card" v-for="item in products" :key="item.id">
          <div class="image-wrapper">
            <img :src="item.cover_image" :alt="item.title" />
            <span class="tag" v-if="item.tag">{{ item.tag }}</span>
          </div>
          <div class="info-wrapper">
            <h3 class="title">{{ item.title }}</h3>
            <div class="bottom-row">
              <span class="price"><small>¥</small>{{ item.price }}</span>
              <button class="buy-btn">加入购物车</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部加载提示 -->
      <div class="loading-bar" v-if="loading">正在加载更多商品...</div>
      <div class="no-more" v-else-if="products.length >= 10000">没有更多数据了</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const products = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const scrollRef = ref(null)

// 模拟数据接口
const fetchData = (pageNum) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = []
      const images = [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
        'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80',
        'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&q=80',
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'
      ]
      for (let i = 1; i <= pageSize; i++) {
        const id = (pageNum - 1) * pageSize + i
        mockData.push({
          id: id,
          title: `极品商品 编号 ${id}`,
          price: (Math.random() * 1000).toFixed(2),
          cover_image: images[id % 4],
          tag: id % 5 === 0 ? '热销' : ''
        })
      }
      resolve(mockData)
    }, 800)
  })
}

// 触底加载核心逻辑
const loadMore = async () => {
  if (loading.value) return
  loading.value = true
  page.value++
  
  const newData = await fetchData(page.value)
  products.value = [...products.value, ...newData]
  
  loading.value = false
}

// 监听滚动事件
const handleScroll = () => {
  if (!scrollRef.value) return
  const { scrollTop, scrollHeight, clientHeight } = scrollRef.value
  
  // 距离底部还有 100px 时触发加载
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadMore()
  }
}

// 初始加载
onMounted(async () => {
  products.value = await fetchData(1)
})
</script>

<style scoped>
.products-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  padding-top: 64px; /* 给顶部导航留空间 */
  box-sizing: border-box;
}

.header-area { text-align: center; margin: 20px 0; }
.header-area h2 { font-size: 32px; color: #1f2937; margin: 0 0 10px 0; }
.header-area p { color: #6b7280; font-size: 14px; }

/* 滚动容器 */
.scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 40px;
}

/* 网格布局 */
.grid-wrapper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.product-card {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.product-card:hover { 
  transform: translateY(-5px); 
  box-shadow: 0 10px 30px rgba(0,0,0,0.12); 
}

.image-wrapper { width: 100%; height: 200px; position: relative; background: #eee; }
.image-wrapper img { width: 100%; height: 100%; object-fit: cover; }
.tag { position: absolute; top: 10px; left: 10px; background: #ef4444; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; }

.info-wrapper { padding: 15px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.title { margin: 0; font-size: 15px; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bottom-row { display: flex; justify-content: space-between; align-items: center; }
.price { color: #ef4444; font-size: 20px; font-weight: bold; }
.buy-btn { background: #111827; color: white; border: none; border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
.buy-btn:hover { background: #3b82f6; }

.loading-bar { text-align: center; padding: 20px; color: #3b82f6; font-size: 16px; }
.no-more { text-align: center; padding: 20px; color: #9ca3af; font-size: 14px; }

@media (max-width: 768px) {
  .grid-wrapper { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .image-wrapper { height: 140px; }
  .info-wrapper { padding: 10px; }
  .title { font-size: 14px; }
  .price { font-size: 16px; }
  .scroll-container { padding: 10px 20px; }
}
</style>