import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'

// 引入组件（注意：Login 必须是首字母大写）
import Login from './views/Login.vue'
import Todo from './views/Todo.vue'

// 引入粒子特效插件
import Particles from "@tsparticles/vue3"
import { loadSlim } from "@tsparticles/slim"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/Login' },
    { path: '/Login', component: Login }, // 这里也必须是大写
    { path: '/todo', component: Todo }
  ]
})

const app = createApp(App)
app.use(router)

// 注册粒子特效
app.use(Particles, {
  init: async engine => {
    await loadSlim(engine);
  },
})

app.mount('#app')