import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'

// 1. 引入组件（文件名是 Login.vue，所以用大写 Login 接收）
import Login from './views/Login.vue'
import Todo from './views/Todo.vue'

// 引入粒子特效插件
import Particles from "@tsparticles/vue3"
import { loadSlim } from "@tsparticles/slim"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 2. 路径全部用小写（这是规矩）
    { path: '/', redirect: '/login' }, 
    { path: '/login', component: Login }, // 这里路径用小写，但后面赋值的组件是大写的 Login
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