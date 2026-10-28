<template>
  <div class="home-page">
    <!-- 全屏华丽海报 -->
    <div class="hero-banner" style="background-image: url('https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2000&auto=format&fit=crop');">
      <div class="banner-content">
        <h1>全新 SP 式神降临</h1>
        <p>神代终局，破晓而生</p>
      </div>
    </div>

    <!-- 底部新闻栏 (去掉了绝对定位，让它跟在图片下面自然排列) -->
    <div class="news-section">
      <div class="news-card" v-for="i in 4" :key="i">
        <h4>新闻 | 《阴阳师》全新SP阶式神...</h4>
        <p>全新SP式神神绘世花鸟卷CG展卷，快来一探究竟！</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  padding-top: 64px; /* 留出导航栏高度 */
  background: #111;
}

.hero-banner {
  width: 100%;
  height: 60vh; /* 改成 60vh，适配不同的屏幕高度 */
  min-height: 400px;
  background-size: cover;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.banner-content {
  text-align: center;
  color: white;
  text-shadow: 0 2px 10px rgba(0,0,0,0.8);
  padding: 0 20px;
}
.banner-content h1 { font-size: 48px; margin-bottom: 10px; }
.banner-content p { font-size: 20px; letter-spacing: 2px; }

/* 新闻区域：使用 Grid 网格布局，自动折行 */
.news-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 30px 40px;
  background: #111;
}

.news-card {
  background: #fff;
  padding: 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}
.news-card:hover { transform: translateY(-5px); }
.news-card h4 { margin: 0 0 10px 0; font-size: 15px; color: #333; }
.news-card p { margin: 0; font-size: 13px; color: #777; }

/* 📱 手机端适配 */
@media (max-width: 768px) {
  .home-page { padding-top: 120px; } /* 适配手机上导航栏的高度 */
  .hero-banner { height: 40vh; min-height: 300px; }
  .banner-content h1 { font-size: 28px; }
  .banner-content p { font-size: 16px; }
  .news-section { padding: 20px; grid-template-columns: 1fr; } /* 手机上变成单列 */
}
</style>