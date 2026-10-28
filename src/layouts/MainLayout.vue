<template>
  <div class="layout-container">
    <!-- 顶部导航栏 -->
    <header class="navbar">
      <div class="logo">
        <span class="logo-text">阴阳师</span>
      </div>
      <nav class="nav-menu">
        <router-link to="/home">官网首页</router-link>
        <router-link to="/characters">式神录</router-link>
        <router-link to="/news">新闻资讯</router-link>
      </nav>
      <div class="user-action">
        <button v-if="!isLoggedIn" class="login-btn" @click="goToLogin">登录 / 注册</button>
        <template v-else>
          <span class="welcome-text">欢迎回来，大人</span>
          <button class="logout-btn" @click="logout">退出登录</button>
        </template>
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

onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem('userToken')
})

const goToLogin = () => router.push('/login')
const logout = () => {
  localStorage.removeItem('userToken')
  isLoggedIn.value = false
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
}

.navbar {
  position: fixed;
  top: 0; left: 0; width: 100%;
  height: 64px;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  box-sizing: border-box;
  z-index: 100;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.logo-text {
  color: #d4af37;
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 2px;
}

.nav-menu { display: flex; gap: 30px; }
.nav-menu a {
  color: #ccc; text-decoration: none; font-size: 15px; transition: 0.3s;
  white-space: nowrap; /* 防止文字换行 */
}
.nav-menu a:hover, .nav-menu a.router-link-active { color: #d4af37; }

.user-action { display: flex; align-items: center; gap: 15px; }
.login-btn {
  background: #d4af37; color: #000; border: none; padding: 8px 20px;
  border-radius: 4px; font-weight: bold; cursor: pointer; white-space: nowrap;
}
.welcome-text { color: #d4af37; font-size: 14px; white-space: nowrap; }
.logout-btn {
  background: transparent; border: 1px solid #555; color: #ccc;
  padding: 6px 12px; border-radius: 4px; cursor: pointer;
}

.main-content { flex: 1; }

/* 📱 手机端适配：导航栏自动变成上下排布，防止挤压 */
@media (max-width: 768px) {
  .navbar {
    height: auto;
    padding: 15px 20px;
    flex-direction: column;
    gap: 15px;
  }
  .nav-menu { gap: 15px; flex-wrap: wrap; justify-content: center; }
  .main-content { padding-top: 120px; } /* 给变高的导航栏留出空间 */
}
</style>