import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import userRoutes from './modules/user' // 🚨 引入刚才写的模块路由
import trendsRoutes from './modules/trends'
import toolsRoutes from './modules/tools'
import { useUserStore } from '@/stores/user'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue') },
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/home' },
      ...userRoutes, // 🚨 把用户模块的路由展开
	  ...trendsRoutes,
	  ...toolsRoutes
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/home' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 会员专属路由：非 VIP 直接跳到商品页并给出提示
router.beforeEach((to) => {
  if (!to.meta?.requiresVip) return true
  if (useUserStore().isVip) return true
  return { path: '/products', query: { vip: 'required' } }
})

export default router