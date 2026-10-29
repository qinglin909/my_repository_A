<template>
  <div class="characters-page">
    <h2>式神录</h2>
    <div class="grid">
      <div class="char-card" v-for="i in 12" :key="i">
        <div class="avatar"></div>
        <span>神秘式神 {{ i }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.characters-page {
  padding: 100px 40px 40px;
  color: white;
  min-height: 100vh;
  background: #1a1a1a;
}

h2 {
  border-left: 4px solid #d4af37;
  padding-left: 10px;
  margin: 0 0 20px 0;
  font-size: 24px;
}

/* 网格布局：最小 120px 宽，自动铺满整行 */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.char-card {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s;
  overflow: hidden;
}
.char-card:hover { background: #3a3a3a; }

.avatar {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(135deg, #444, #222);
  border-radius: 4px;
  margin-bottom: 8px;
}

.char-card span {
  font-size: 13px;
  color: #ddd;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 如果文字太长，自动显示省略号 */
}

/* 📱 手机端适配 */
@media (max-width: 768px) {
  .characters-page { padding: 140px 20px 20px; } /* 留出手机导航栏高度 */
  .grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 10px; }
}
</style>