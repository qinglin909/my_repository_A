import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import Login from './views/Login.vue'
import Todo from './views/Todo.vue'

// 引入粒子特效
import Particles from "@tsparticles/vue3"
import { loadSlim } from "@tsparticles/slim"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    { path: '/todo', component: Todo }
  ]
})

const app = createApp(App)
app.use(router)

// 配置并启用粒子库
app.use(Particles, {
  init: async engine => {
    await loadSlim(engine);
  },
})

app.mount('#app')