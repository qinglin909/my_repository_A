import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  
  // 🚀 1. 依赖预构建优化：把常用库和智谱相关的请求库提前打包，提升冷启动速度
  optimizeDeps: {
    include: [
      'vue', 
      'vue-router', 
      'pinia', 
      // 如果你在项目里用了 axios 或 fetch 相关的库，也可以加在这里，例如 'axios'
    ] 
  },

  server: {
    // 🚀 2. 预加载核心文件，让页面秒开
    warmup: {
      clientFiles: [
        './src/main.js',
        './src/App.vue',
        './src/layouts/MainLayout.vue',
        './src/router/index.js'
      ]
    },
    
    // 🔮 3. 代理配置
    proxy: {
      // 原有的智谱 AI 代理
      '/zhipu': {
        target: 'https://open.bigmodel.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zhipu/, '')
      },
      // 🚨 新增：本地 Node 后端代理
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // 如果你的后端代码里路由本身带有 /api，这里不需要 rewrite
        // 如果后端代码是 app.post('/hello') 而不是 '/api/hello'，则需要加上：
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})