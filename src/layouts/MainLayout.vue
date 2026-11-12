<!-- 全局导航框架：包含顶部悬浮导航栏和用户下拉菜单 -->
<template>
  <div class="layout-container">
    <!-- 悬浮胶囊导航栏 -->
    <header class="navbar-wrapper">
      <div class="floating-pill">
        <!-- 左侧：Logo -->
        <div class="logo" @click="$router.push('/home')">
          <div class="logo-icon"></div>
          <span class="logo-text">My Workspace</span>
        </div>

        <!-- 中间：带折叠下拉的菜单 -->
        <nav class="nav-menu">
          <router-link to="/home" class="nav-item" active-class="route-active" exact-active-class="route-active">首页</router-link>
          
          <!-- 下拉菜单：商品查询 -->
          <div class="nav-dropdown" @click.stop="toggleDropdown('products')">
            <div class="nav-item" :class="{ active: activeDropdown === 'products', 'route-active': isRouteActive('/products') }">
              商品查询 
              <svg class="chevron" :class="{ rotate: activeDropdown === 'products' }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <transition name="spring-dropdown">
              <div class="dropdown-panel liquid-glass" v-if="activeDropdown === 'products'">
                <router-link to="/products" class="dropdown-item" active-class="route-active">
                  <span class="item-icon">🔍</span>
                  <div class="item-text"><span class="title">全网商品搜索</span><span class="desc">搜索海量商品信息</span></div>
                </router-link>
                <router-link to="/products" class="dropdown-item">
                  <span class="item-icon">📈</span>
                  <div class="item-text"><span class="title">价格历史追踪</span><span class="desc">查看价格波动趋势</span></div>
                </router-link>
              </div>
            </transition>
          </div>
          
          <!-- 🚨 热搜入口：加上 hide-on-mobile 类，手机端隐藏 -->
          <router-link to="/trends" class="nav-item hide-on-mobile" active-class="route-active">全网热搜</router-link>
          
          <router-link v-if="userStore.isVip" to="/navigator" class="nav-item" active-class="route-active">宝藏导航</router-link>
          <router-link to="/ranking" class="nav-item" active-class="route-active">分数转换</router-link>
          <router-link to="/character" class="nav-item" active-class="route-active">繁体解字</router-link>
          
          <!-- 下拉菜单：效率工具 -->
          <div class="nav-dropdown" @click.stop="toggleDropdown('tools')">
            <div class="nav-item" :class="{ active: activeDropdown === 'tools', 'route-active': isToolsRouteActive }">
              效率工具 
              <svg class="chevron" :class="{ rotate: activeDropdown === 'tools' }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <transition name="spring-dropdown">
              <div class="dropdown-panel liquid-glass" v-if="activeDropdown === 'tools'">
                <router-link to="/plans" class="dropdown-item" active-class="route-active">
                  <span class="item-icon">📅</span>
                  <div class="item-text"><span class="title">我的计划表</span><span class="desc">管理每日待办与目标</span></div>
                </router-link>
                <router-link to="/notes" class="dropdown-item" active-class="route-active">
                  <span class="item-icon">📝</span>
                  <div class="item-text"><span class="title">随心笔记</span><span class="desc">记录灵感与知识</span></div>
                </router-link>
                <router-link to="/formula" class="dropdown-item" active-class="route-active">
                  <span class="item-icon">🧮</span>
                  <div class="item-text"><span class="title">公式助手</span><span class="desc">表格公式生成、解释与修错</span></div>
                </router-link>
                <router-link to="/bills" class="dropdown-item" active-class="route-active">
                  <span class="item-icon">💰</span>
                  <div class="item-text"><span class="title">月度收支</span><span class="desc">固定支出与收入登记</span></div>
                </router-link>
                <router-link to="/knowledge" class="dropdown-item" active-class="route-active">
                  <span class="item-icon">🧠</span>
                  <div class="item-text"><span class="title">知识向量库</span><span class="desc">存资料、分块并检索原文</span></div>
                </router-link>
              </div>
            </transition>
          </div>
        </nav>

        <!-- 右侧：用户操作区 -->
        <div class="user-action">
          <div class="user-dropdown" v-if="!userStore.isLoggedIn">
            <button type="button" class="login-btn" @click="goToLogin">登录 / 注册</button>
          </div>
          
          <div class="user-dropdown" v-else>
            <div class="user-trigger" @click.stop="toggleUserMenu">
              <div class="avatar">
                <img v-if="userStore.avatarUrl" :src="userStore.avatarUrl" alt="avatar" />
                <span v-else>👤</span>
              </div>
              <span class="welcome-text">{{ userStore.username }}</span>
              <svg class="chevron" :class="{ rotate: showUserMenu }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            
            <transition name="spring-dropdown">
              <div class="dropdown-panel user-dropdown-menu liquid-glass" v-if="showUserMenu">
                <div class="dropdown-header">
                  <p class="welcome-msg">你好，{{ userStore.username }}</p>
                  <p class="email-msg">已登录工作台</p>
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" @click="goToProfile">
                  <span class="item-icon">👤</span><div class="item-text"><span class="title">个人中心</span></div>
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item danger" @click="logout">
                  <span class="item-icon">🚪</span><div class="item-text"><span class="title">退出登录</span></div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-view></router-view>
    </main>

    <!-- 🔥 挂载大明日历悬浮挂件 -->
    <CalendarView />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import CalendarView from '@/views/CalendarView.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const isToolsRouteActive = computed(() => ['/plans', '/notes', '/knowledge'].includes(route.path))
const isRouteActive = (path) => route.path === path || route.path.startsWith(`${path}/`)

const activeDropdown = ref(null)
const showUserMenu = ref(false)

const toggleDropdown = (name) => {
  activeDropdown.value = activeDropdown.value === name ? null : name
  showUserMenu.value = false 
}
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
  activeDropdown.value = null 
}
const closeMenus = () => {
  activeDropdown.value = null
  showUserMenu.value = false
}

onMounted(() => document.addEventListener('click', closeMenus))
onUnmounted(() => document.removeEventListener('click', closeMenus))

const goToLogin = () => router.push('/login')
const goToProfile = () => { closeMenus(); router.push('/profile') }
const logout = () => { closeMenus(); userStore.logout(); router.push('/login') }
</script>

<style scoped>
/* 页面骨架 */
.layout-container { min-height: 100vh; display: flex; flex-direction: column; }
.main-content { flex: 1; padding-top: 100px; }

/* 悬浮胶囊 */
.navbar-wrapper {
  position: fixed; top: 24px; left: 0; width: 100%;
  display: flex; justify-content: center; z-index: 1000;
  pointer-events: none;
}
.floating-pill {
  pointer-events: auto;
  display: flex; align-items: center; justify-content: space-between; gap: 32px;
  padding: 8px 12px 8px 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
}

/* Logo */
.logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.logo-icon { width: 22px; height: 22px; background: linear-gradient(135deg, var(--primary-color), #8a2be2); border-radius: 6px; flex-shrink: 0; }
.logo-text { font-size: 17px; font-weight: 800; color: var(--text-main); letter-spacing: -0.5px;}

/* 菜单交互 */
.nav-menu { display: flex; gap: 4px; align-items: center; }
.nav-item {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 16px; border-radius: var(--radius-lg);
  font-size: 14px; font-weight: 600; color: #555; cursor: pointer;
  transition: all 0.2s ease; white-space: nowrap;
}
.nav-item:hover, .nav-item.active { color: var(--text-main); background: rgba(0, 0, 0, 0.04); }
.nav-item.route-active { color: #8f1d24; background: linear-gradient(135deg, rgba(193, 39, 45, .12), rgba(212, 175, 55, .12)); box-shadow: inset 0 -2px 0 #c1272d; }
.nav-dropdown > .nav-item.route-active { border-radius: var(--radius-lg); }
.dropdown-item.route-active { background: rgba(193, 39, 45, .08); }
.dropdown-item.route-active .item-icon, .dropdown-item.route-active .item-text .title { color: #9b2028; }

.chevron { transition: transform 0.3s var(--spring-ease); color: var(--text-muted); }
.chevron.rotate { transform: rotate(180deg); color: var(--text-main); }

/* 下拉面板定位 */
.nav-dropdown { position: relative; }
.dropdown-panel {
  position: absolute; top: calc(100% + 12px); left: 50%;
  transform: translateX(-50%);
  min-width: 260px;
  padding: 8px;
  display: flex; flex-direction: column; gap: 2px;
}

/* 下拉项 */
.dropdown-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 14px; border-radius: var(--radius-sm);
  text-decoration: none; cursor: pointer;
  transition: background 0.2s;
}
.dropdown-item:hover { background: rgba(0, 0, 0, 0.03); }
.item-icon { font-size: 18px; margin-top: 2px; }
.item-text { display: flex; flex-direction: column; gap: 2px; }
.item-text .title { font-size: 14px; font-weight: 600; color: var(--text-main); }
.item-text .desc { font-size: 12px; color: var(--text-muted); }

/* 右侧用户区 */
.user-dropdown { position: relative; }
.user-trigger {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  padding: 4px 12px 4px 4px; border-radius: var(--radius-lg);
  transition: background 0.2s;
}
.user-trigger:hover { background: rgba(0, 0, 0, 0.04); }
.avatar { width: 30px; height: 30px; background: #eef2f6; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 14px; overflow: hidden; flex-shrink: 0; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.welcome-text { font-weight: 600; color: var(--text-main); font-size: 14px; }

/* 用户菜单特殊排版 */
.user-dropdown-menu { left: auto; right: 0; transform: none; min-width: 240px; }
.dropdown-header { padding: 10px 14px; }
.welcome-msg { font-size: 14px; font-weight: 700; color: var(--text-main); margin: 0 0 2px 0; }
.email-msg { font-size: 12px; color: var(--text-muted); margin: 0; }
.dropdown-divider { height: 1px; background: var(--border-color); margin: 6px 8px; }
.dropdown-item.danger .title { color: #ef4444; }
.dropdown-item.danger:hover { background: rgba(239, 68, 68, 0.08); }

/* 登录按钮 */
.login-btn {
  padding: 8px 20px; border-radius: var(--radius-lg); background: #1a1a1a; color: #fff;
  border: none; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.login-btn:hover { background: #333; }

/* 修正用户菜单的动画位移 */
.user-dropdown-menu.spring-dropdown-enter-from,
.user-dropdown-menu.spring-dropdown-leave-to {
  transform: translateY(-10px) scale(0.95);
}

/* =========================================
   手机端适配 (Media Queries)
   ========================================= */
@media (max-width: 768px) {
  .main-content { padding-top: 80px; }
  .navbar-wrapper { top: 0; padding: 0; }
  
  .floating-pill {
    width: 100%; border-radius: 0; padding: 10px 16px; gap: 10px; justify-content: space-between;
  }
  
  .nav-menu {
    overflow-x: auto; white-space: nowrap; justify-content: flex-start; padding-bottom: 4px; flex: 1; -webkit-overflow-scrolling: touch;
  }
  .nav-menu::-webkit-scrollbar { display: none; }
  .nav-item { padding: 8px 12px; font-size: 13px; }
  
  .logo-text { display: none; }
  .welcome-text { display: none; }
  
  .dropdown-panel {
    position: fixed; top: 60px; left: 50%; transform: translateX(-50%); width: calc(100vw - 32px);
  }

  /* 🚨 手机端隐藏热搜按钮 */
  .hide-on-mobile {
    display: none !important;
  }
}
</style>