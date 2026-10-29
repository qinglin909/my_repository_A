import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'

// 引入组件 (把 Characters 换成 Products)
import Login from './views/Login.vue'
import MainLayout from './layouts/MainLayout.vue'
import Home from './views/Home.vue'
import Products from './views/Products.vue'

// 引入粒子特效
import Particles from "@tsparticles/vue3"
import { loadSlim } from "@tsparticles/slim"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 🚨 核心改动：默认直接进首页，游客也能看
    { path: '/', redirect: '/home' }, 
    
    // 登录页独立在外面（不需要公共导航栏）
    { path: '/login', component: Login },
    
    // 带有公共导航栏的主布局
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: 'home', component: Home },
        { path: 'products', component: Products }
      ]
    },
    
    // 容错：乱输网址自动回首页
    { path: '/:pathMatch(.*)*', redirect: '/home' }
  ]
})

// =========================================
// 🚨 核心改动：路由守卫（改成放行游客）
// =========================================
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login' // 直接返回目标路径
  }
  // 不需要拦截的话，什么都不用写，或者写 return true
})

const app = createApp(App)
app.use(router)

app.use(Particles, {
  init: async engine => {
    await loadSlim(engine);
  },
})

app.mount('#app')