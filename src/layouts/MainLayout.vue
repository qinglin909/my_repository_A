<template>
  <div class="layout-container">
    <!-- 顶部导航栏 -->
    <header class="navbar">
      <div class="logo">
        <span class="logo-text">阴阳师</span>
      </div>
      <nav class="nav-menu">
        <router-link to="/home">官网首页</router-link>
        <router-link to="/products">精选商品</router-link>
      </nav>

      <!-- 右侧用户操作区 (带下拉) -->
      <div class="user-action">
        
        <!-- 未登录状态 -->
        <div class="user-dropdown" v-if="!isLoggedIn">
          <div class="user-trigger">
            <!-- SVG 小人头图标 -->
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>登录 / 注册</span>
          </div>
          
          <!-- 悬浮弹出的下拉框 -->
          <div class="dropdown-menu">
            <div class="dropdown-content">
              <p class="tip">欢迎来到阴阳师</p>
              <button class="dropdown-login-btn" @click="goToLogin">立即登录</button>
            </div>
          </div>
        </div>

        <!-- 已登录状态 -->
        <div class="user-dropdown" v-else>
          <div class="user-trigger logged-in">
            <div class="avatar">👤</div>
            <span class="welcome-text">{{ username }}</span>
          </div>
          
          <div class="dropdown-menu">
            <div class="dropdown-content">
              <p class="tip">欢迎回来，大人</p>
              <button class="dropdown-logout-btn" @click="logout">退出登录</button>
            </div>
          </div>
        </div>
        
      </div>
    </header>

    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoggedIn = ref(false)
const username = ref('')

onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem('userToken')
  username.value = localStorage.getItem('username') || '大人'
})

const goToLogin = () => router.push('/login')
const logout = () => {
  localStorage.removeItem('userToken')
  localStorage.removeItem('username')
  isLoggedIn.value = false
  router.push('/login')
}
</script>

<style scoped>
/* 基础布局 */
.layout-container { min-height: 100vh; background-color: #1a1a1a; display: flex; flex-direction: column; }
.navbar {
  position: fixed; top: 0; left: 0; width: 100%; height: 64px;
  background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(10px);
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 40px; box-sizing: border-box; z-index: 100;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.logo-text { color: #d4af37; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
.nav-menu { display: flex; gap: 30px; }
.nav-menu a { color: #ccc; text-decoration: none; font-size: 15px; transition: 0.3s; white-space: nowrap; }
.nav-menu a:hover, .nav-menu a.router-link-active { color: #d4af37; }
.main-content { flex: 1; }

/* =========================================
   高级悬浮下拉菜单逻辑
   ========================================= */
.user-action { position: relative; }

.user-dropdown {
  position: relative;
  padding: 10px 0; /* 给上方留点空间，方便鼠标滑入 */
}

/* 触发器（鼠标放在上面的区域） */
.user-trigger {
  display: flex; align-items: center; gap: 8px;
  color: #d4af37; font-size: 15px; cursor: pointer;
  transition: opacity 0.3s;
}
.user-trigger:hover { opacity: 0.8; }

.logged-in .avatar {
  width: 28px; height: 28px; background: #333;
  border-radius: 50%; display: flex; justify-content: center; align-items: center;
  border: 1px solid #d4af37; font-size: 14px;
}
.welcome-text { color: #eee; font-size: 14px; }

/* 下拉菜单面板（默认隐藏） */
.dropdown-menu {
  position: absolute; top: 100%; right: 0;
  width: 200px; padding-top: 10px;
  opacity: 0; visibility: hidden;
  transform: translateY(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 200;
}

/* 鼠标悬浮时显示下拉菜单 */
.user-dropdown:hover .dropdown-menu {
  opacity: 1; visibility: visible; transform: translateY(0);
}

/* 下拉框内部样式（深色磨砂玻璃） */
.dropdown-content {
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid #444;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.tip { color: #aaa; font-size: 13px; margin: 0 0 12px 0; text-align: center; }

.dropdown-login-btn {
  width: 100%; padding: 10px; background: #d4af37; color: #000;
  border: none; border-radius: 6px; font-weight: bold; cursor: pointer;
  transition: 0.2s;
}
.dropdown-login-btn:hover { background: #f7ce46; }

.dropdown-logout-btn {
  width: 100%; padding: 10px; background: transparent; color: #ef4444;
  border: 1px solid #ef4444; border-radius: 6px; font-weight: bold; cursor: pointer;
  transition: 0.2s;
}
.dropdown-logout-btn:hover { background: rgba(239, 68, 68, 0.1); }

/* 手机端适配 */
@media (max-width: 768px) {
  .navbar { height: auto; padding: 15px 20px; flex-direction: column; gap: 15px; }
  .nav-menu { gap: 15px; flex-wrap: wrap; justify-content: center; }
  .main-content { padding-top: 120px; }
  .dropdown-menu { right: 50%; transform: translateX(50%) translateY(10px); }
  .user-dropdown:hover .dropdown-menu { transform: translateX(50%) translateY(0); }
}
</style>