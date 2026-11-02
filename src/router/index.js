import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import userRoutes from './modules/user' // 🚨 引入刚才写的模块路由
import trendsRoutes from './modules/trends'
import toolsRoutes from './modules/tools'

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

export default router