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
    
    // 🔮 3. 保留你的智谱 API 代理配置
    proxy: {
      '/zhipu': {
        target: 'https://open.bigmodel.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zhipu/, '')
      }
    }
  }
})