import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import userRoutes from './modules/user' // 🚨 引入刚才写的模块路由
import trendsRoutes from './modules/trends'
import toolsRoutes from './modules/tools'
import { useUserStore } from '@/stores/user'
import { clearToken } from '@/utils/storage'
import { apiFetch } from '@/utils/apiClient'

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

// 启动后静默校验一次 token：过期/失效就清掉登录态，避免页面处于半登录状态
let sessionChecked = false

router.beforeEach(async (to) => {
  const userStore = useUserStore()

  if (userStore.isLoggedIn && !sessionChecked) {
    sessionChecked = true
    try {
      const response = await apiFetch('/api/me', {
        token: userStore.token,
        signal: AbortSignal.timeout(5000)
      })
      if (response.ok) {
        userStore.applyMembership((await response.json()).user)
      } else if (response.status === 401 || response.status === 403) {
        // token 失效：清掉本地登录态，回到登录页
        userStore.logout()
        clearToken()
      }
    } catch {
      // 网络异常时保留本地登录态，不强制退出
    }
  }

  // 已登录还访问登录页：直接回首页（root 长期免登录的体验核心）
  if (to.name === 'Login' && userStore.isLoggedIn) return { path: '/home' }

  // 会员专属路由：非 VIP 直接跳到商品页并给出提示
  if (to.meta?.requiresVip && !userStore.isVip) {
    return { path: '/products', query: { vip: 'required' } }
  }

  return true
})

export default router