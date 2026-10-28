import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'

// 引入页面组件
import Login from './views/Login.vue'
import MainLayout from './layouts/MainLayout.vue'
import Home from './views/Home.vue'
import Characters from './views/Characters.vue'

// 🚨 引入粒子特效插件 (千万别漏了这两行)
import Particles from "@tsparticles/vue3"
import { loadSlim } from "@tsparticles/slim"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: 'home', component: Home },
        { path: 'characters', component: Characters }
      ]
    }
  ]
})
router.beforeEach((to, from, next) => {
  // 1. 检查用户本地有没有登录凭证 Token
  const token = localStorage.getItem('userToken')

  // 2. 如果去的页面不是登录页，并且没有 Token
  if (to.path !== '/login' && !token) {
    // 直接拦截，强制跳转到登录页
    next('/login')
  } 
  // 3. 如果已经有 Token 了，还试图去登录页
  else if (to.path === '/login' && token) {
    // 那就别让他看登录页了，直接放行去首页
    next('/home')
  } 
  // 4. 其他情况正常放行
  else {
    next()
  }
})
const app = createApp(App)
app.use(router)

// 🚨 全局注册粒子特效插件 (千万别漏了这一段)
app.use(Particles, {
  init: async engine => {
    await loadSlim(engine);
  },
})

app.mount('#app')