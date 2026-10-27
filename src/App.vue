<script setup>
import { ref, onMounted } from 'vue'

const msg = ref('加载中...')

onMounted(async () => {
  try {
    // 这里直接写相对路径 /api/hello，Vercel 会自动去 api 文件夹里找
    const res = await fetch('/api/hello')
    const data = await res.json()
    msg.value = data.message
  } catch (error) {
    msg.value = '请求后端失败啦！'
  }
})
</script>

<template>
  <div style="text-align: center; margin-top: 50px;">
    <h1>我的全栈网站</h1>
    <p>后端返回的消息：<strong>{{ msg }}</strong></p>
  </div>
</template>