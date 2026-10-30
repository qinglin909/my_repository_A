import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') },  
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/home' },
      { path: 'home', name: 'Home', component: () => import('@/views/Home.vue') },
      // 🚨 个人中心路由
      { path: 'profile', name: 'Profile', component: () => import('@/views/Profile.vue') },
      { path: 'products', name: 'Products', component: () => import('@/views/Products.vue') },
      { path: 'admin', name: 'Admin', component: () => import('@/views/Admin.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/home' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router