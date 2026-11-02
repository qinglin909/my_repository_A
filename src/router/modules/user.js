// src/router/modules/user.js
export default [
  { path: 'home', name: 'Home', component: () => import('@/views/HomeView.vue') },
  { path: 'products', name: 'Products', component: () => import('@/views/ProductsView.vue') },
  { path: 'profile', name: 'Profile', component: () => import('@/views/ProfileView.vue') },
  { path: 'admin', name: 'Admin', component: () => import('@/views/AdminView.vue') }
]