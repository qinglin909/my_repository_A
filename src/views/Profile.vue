<template>
  <div class="page-container">
    <div class="bg-glow top-left"></div>
    <div class="bg-glow bottom-right"></div>

    <div class="profile-content">
      <!-- 头部卡片（复用全局 liquid-glass） -->
      <div class="liquid-glass header-card">
        <div class="avatar-wrapper" @click="handleAvatarClick">
          <div class="avatar">
            <img v-if="userStore.avatarUrl" :src="userStore.avatarUrl" alt="avatar" />
            <span v-else>👤</span>
          </div>
          <div class="edit-badge">📷</div>
        </div>

        <div class="user-info">
          <h1 class="username">{{ userStore.username || '晴明大人' }}</h1>
          <p class="user-title">
            <span class="badge">VIP {{ userStore.role === 'admin' ? '管理员' : '阴阳师' }}</span>
            <span class="uid">UID: 88239102</span>
          </p>
        </div>
      </div>

      <!-- 数据面板（复用全局 liquid-glass） -->
      <div class="liquid-glass stats-panel">
        <div class="stat-item">
          <span class="stat-value">128</span>
          <span class="stat-label">签到天数</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">36</span>
          <span class="stat-label">收集式神</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">9,500</span>
          <span class="stat-label">勾玉余额</span>
        </div>
      </div>

      <!-- 菜单列表（复用全局 liquid-glass） -->
      <div class="liquid-glass menu-list">
        <div class="menu-item">
          <div class="menu-left"><span class="icon">🎁</span><span class="text">我的福利</span></div>
          <span class="arrow">></span>
        </div>
        <div class="menu-item">
          <div class="menu-left"><span class="icon">⚙️</span><span class="text">账号设置</span></div>
          <span class="arrow">></span>
        </div>
        <div class="menu-item danger-item" @click="logout">
          <div class="menu-left"><span class="icon">🚪</span><span class="text">退出登录</span></div>
          <span class="arrow">></span>
        </div>
      </div>
    </div>

    <ImageUploader ref="uploaderRef" @success="handleUploadSuccess" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ImageUploader from '@/components/ImageUploader.vue'

const router = useRouter()
const userStore = useUserStore()
const uploaderRef = ref(null)

const handleAvatarClick = () => {
  if (uploaderRef.value) uploaderRef.value.triggerUpload()
}
const handleUploadSuccess = (newUrl) => {
  userStore.avatarUrl = newUrl
}
const logout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
/* 背景光晕保留 */
.bg-glow { position: absolute; width: 500px; height: 500px; border-radius: 50%; filter: blur(80px); z-index: 0; opacity: 0.6; }
.top-left { top: -100px; left: -150px; background: rgba(212, 175, 55, 0.15); }
.bottom-right { bottom: -100px; right: -150px; background: rgba(255, 182, 193, 0.15); }

/* 只需要管内容区，卡片直接使用了全局的 liquid-glass */
.profile-content { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

/* 头部 */
.header-card { display: flex; align-items: center; gap: 24px; padding: 30px; }
.avatar-wrapper { position: relative; width: 88px; height: 88px; border-radius: 50%; padding: 3px; background: linear-gradient(135deg, #f3e5ab, #d4af37, #b8860b); box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2); cursor: pointer; transition: transform 0.2s; }
.avatar-wrapper:hover { transform: scale(1.05); }
.avatar { width: 100%; height: 100%; border-radius: 50%; background: #fff; display: flex; justify-content: center; align-items: center; font-size: 40px; border: 2px solid #fff; overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.edit-badge { position: absolute; bottom: 0; right: 0; background: #d4af37; border-radius: 50%; width: 26px; height: 26px; display: flex; justify-content: center; align-items: center; font-size: 14px; border: 2px solid #fff; z-index: 2; }

.user-info { flex: 1; }
.username { color: #2c2c2c; font-size: 28px; font-weight: 600; margin: 0 0 10px 0; }
.user-title { display: flex; align-items: center; gap: 12px; margin: 0; }
.badge { background: linear-gradient(135deg, #f9f3df, #ecd38a); color: #8a6d1c; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.uid { color: #999; font-size: 13px; }

/* 数据面板 */
.stats-panel { display: flex; justify-content: space-between; align-items: center; padding: 24px; }
.stat-item { display: flex; flex-direction: column; align-items: center; flex: 1; }
.stat-value { color: #d4af37; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
.stat-label { color: #888; font-size: 13px; font-weight: 500; }
.stat-divider { width: 1px; height: 36px; background: rgba(0, 0, 0, 0.06); }

/* 菜单 */
.menu-list { padding: 10px 0; }
.menu-item { display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; cursor: pointer; transition: all 0.2s; }
.menu-item:hover { background: rgba(0, 0, 0, 0.02); }
.menu-left { display: flex; align-items: center; gap: 16px; }
.menu-left .icon { font-size: 20px; }
.menu-left .text { color: #333; font-size: 16px; font-weight: 500; }
.arrow { color: #ccc; font-size: 16px; transition: transform 0.2s; }
.menu-item:hover .arrow { transform: translateX(4px); color: #d4af37; }
.danger-item .text { color: #ef4444; }
</style>