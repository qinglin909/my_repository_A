import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 引入 Pinia 及持久化插件
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 引入粒子特效
import Particles from "@tsparticles/vue3"
import { loadSlim } from "@tsparticles/slim"

// 🚨 关键：直接引入你写好的路由文件
import router from './router/index.js' 

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)

app.use(Particles, {
  init: async engine => {
    await loadSlim(engine);
  },
})

app.mount('#app')