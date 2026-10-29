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
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('userToken')

  // 如果游客想直接访问 /login，放行
  if (to.path === '/login') {
    // 但如果他已经登录了，就别看登录页了，去首页
    if (token) return next('/home')
    return next()
  }

  // 如果你想访问其他“受保护”的页面（比如以后的“个人中心”、“后台”）
  // 可以在下面加判断，目前 Home 和 Products 游客都能看，所以全放行
  next()
})

const app = createApp(App)
app.use(router)

app.use(Particles, {
  init: async engine => {
    await loadSlim(engine);
  },
})

app.mount('#app')