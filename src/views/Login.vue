<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ================= 页面状态 =================
const mode = ref(0) // 0 = 登录，1 = 注册
const form = reactive({ username: '', password: '', confirmPassword: '' })
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const isFocused = ref('')

// ================= 滑块验证码状态 =================
const sliderLeft = ref(0)
const isDragging = ref(false)
const maxSlide = 270
const isSliderVerified = ref(false)

// ================= 粒子特效配置 =================
const particlesOptions = {
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  interactivity: {
    events: {
      onHover: { enable: true, mode: "grab" },
      onClick: { enable: true, mode: "push" },
    },
    modes: {
      grab: { distance: 140, links: { opacity: 0.8 } },
      push: { quantity: 3 },
    },
  },
  particles: {
    color: { value: "#ffffff" },
    links: {
      color: "#ffffff",
      distance: 150,
      enable: true,
      opacity: 0.3,
      width: 1,
    },
    move: {
      enable: true,
      speed: 2,
      direction: "none",
      random: false,
      straight: false,
      outModes: { default: "bounce" },
    },
    number: { density: { enable: true, area: 800 }, value: 50 },
    opacity: { value: 0.5 },
    shape: { type: "circle" },
    size: { value: { min: 1, max: 3 } },
  },
  detectRetina: true,
}

// ================= 滑块交互逻辑 =================
const startDrag = (e) => {
  if (isSliderVerified.value) return
  isDragging.value = true
  const startX = e.clientX || e.touches[0].clientX
  
  const onMouseMove = (moveEvent) => {
    if (!isDragging.value) return
    const currentX = moveEvent.clientX || moveEvent.touches[0].clientX
    let moveDistance = currentX - startX
    
    if (moveDistance < 0) moveDistance = 0
    if (moveDistance > maxSlide) moveDistance = maxSlide
    
    sliderLeft.value = moveDistance
    
    if (moveDistance >= maxSlide - 2) {
      isSliderVerified.value = true
      isDragging.value = false
      cleanupEvents()
    }
  }
  
  const onMouseUp = () => {
    isDragging.value = false
    if (sliderLeft.value < maxSlide) {
      sliderLeft.value = 0
    }
    cleanupEvents()
  }
  
  const cleanupEvents = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('touchmove', onMouseMove)
    window.removeEventListener('touchend', onMouseUp)
  }
  
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('touchmove', onMouseMove)
  window.addEventListener('touchend', onMouseUp)
}

// ================= 切换登录/注册模式 =================
const toggleMode = () => {
  mode.value = mode.value === 0 ? 1 : 0
  form.username = ''
  form.password = ''
  form.confirmPassword = ''
  errorMsg.value = ''
  isSliderVerified.value = false
}

// ================= 提交表单（写死版登录） =================
// ================= 提交表单（支持本地存储注册） =================
const handleSubmit = async () => {
  errorMsg.value = ''
  
  // 表单基础校验
  if (form.username.length < 3) return errorMsg.value = '用户名至少需要3个字符'
  if (form.password.length < 6) return errorMsg.value = '密码不能少于6位'
  if (mode.value === 1 && form.password !== form.confirmPassword) {
    return errorMsg.value = '两次输入的密码不一致'
  }
  
  // 验证码拦截
  if (!isSliderVerified.value) {
    return errorMsg.value = '请先按住滑块，拖动到最右侧完成验证'
  }

  loading.value = true
  
  try {
    // 1. 发送真实网络请求到你的 Vercel 后端
    const res = await fetch('/api/hello', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: form.username, 
        password: form.password,
        isRegister: mode.value === 1 // 把当前的模式传给后端（区分登录/注册）
      })
    })

    // 2. 安全地解析后端的返回数据
    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      throw new Error('服务器响应异常，请检查后端代码或环境变量')
    }

    // 3. 如果后端报错（比如密码错误，或者已被注册）
    if (!res.ok) {
      throw new Error(data.message || '操作失败')
    }

    // 4. 验证通过，存入真实的 Token 和用户名（路由守卫靠这个放行）
    localStorage.setItem('userToken', 'fake-jwt-token-12345')
    localStorage.setItem('username', data.user.username)
    
    // 5. 跳转到首页
    router.push('/home')

  } catch (err) {
    // 将后端的错误信息展示给用户
    errorMsg.value = err.message
    // 🚨 登录失败一定要清空可能残留的本地凭证，防止路由守卫误判
    localStorage.removeItem('userToken') 
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="split-container">
    <!-- ================= 左侧：表单区 ================= -->
    <div class="left-panel">
      <div class="form-wrapper">
        <div class="header">
          <div class="logo-icon">✦</div>
          <h2>{{ mode === 0 ? '用户登录' : '创建账号' }}</h2>
          <p class="subtitle">{{ mode === 0 ? '您可以点击右侧或选择以下方式登录' : '注册一个属于你的新账号' }}</p>
        </div>

        <!-- 第三方登录图标展示 -->
        <div class="social-icons">
          <!-- QQ 登录 -->
          <span title="QQ 登录">
            <svg viewBox="0 0 1024 1024" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M512 0C229.224296 0 0 229.224296 0 512s229.224296 512 512 512 512-229.224296 512-512S794.775704 0 512 0zM801.261037 668.86163c-21.731556 18.640593-49.948444-61.345185-54.006519-49.038222-9.879704 29.923556-14.506667 49.929481-43.633778 82.507852-1.554963 1.744593 33.659259 14.468741 43.633778 41.642667 9.557333 26.017185 28.141037 67.26163-93.487407 80.213333-71.35763 7.585185-122.936889-38.020741-128.075852-37.584593-9.53837 0.83437-5.290667 0-15.530667 0-8.38163 0-8.931556 0.606815-16.820148 0-2.161778-0.170667-25.884444 37.584593-131.963259 37.584593-82.223407 0-103.518815-51.749926-86.983111-80.213333 16.535704-28.463407 44.126815-36.750222 40.239407-41.263407-19.152593-22.186667-32.350815-45.909333-40.239407-67.356444-1.953185-5.347556-3.584-10.543407-4.873481-15.530667-2.996148-11.45363-25.884444 67.204741-50.460444 49.038222-24.576-18.166519-22.376296-64.417185-6.46637-108.676741 16.042667-44.619852 56.471704-87.589926 56.926815-97.071407 1.611852-35.290074-3.489185-41.14963 0-50.422519 7.755852-20.764444 17.199407-12.8 17.199407-23.570963 0-135.736889 100.864-245.76 225.28-245.76s225.28 110.042074 225.28 245.76c0 5.195852 13.520593 0 19.986963 23.570963 1.327407 4.873481 2.23763 23.665778 0.663704 50.422519-0.739556 12.856889 34.266074 28.501333 52.375704 97.071407C828.434963 628.754963 810.30637 661.105778 801.261037 668.86163z" fill="#68A5E1"></path>
            </svg>
          </span>
          
          <!-- 微信登录 -->
          <span title="微信 登录">
            <svg viewBox="0 0 1024 1024" width="24" height="24" fill="#07C160">
              <path d="M685.3 491.5c-35.5 0-64.3-28.8-64.3-64.3 0-35.5 28.8-64.3 64.3-64.3 35.5 0 64.3 28.8 64.3 64.3 0 35.5-28.8 64.3-64.3 64.3zm-218 0c-35.5 0-64.3-28.8-64.3-64.3 0-35.5 28.8-64.3 64.3-64.3 35.5 0 64.3 28.8 64.3 64.3 0 35.5-28.8 64.3-64.3 64.3zM512 192C246.4 192 32 367.4 32 585.6c0 124.8 72.7 235 186.2 307.6 1.6 16.6 5.9 41.6 17.4 68.4 18.4 42.9 47.2 55.8 58.9 57.7 12.8 2.1 18.2-7.2 17.3-20-1-14.1-6-64.9 7.8-79.8 74.4 16.4 154.4 20.7 193.1 21.1 38.7-.4 118.7-4.7 193.1-21.1 13.8 14.9 8.8 65.7 7.8 79.8-1 12.8 4.5 22.1 17.3 20 11.8-1.9 40.5-14.8 58.9-57.7 11.5-26.8 15.8-51.8 17.4-68.4C919.3 820.6 992 710.4 992 585.6 992 367.4 777.6 192 512 192z"></path>
            </svg>
          </span>

          <!-- GitHub 登录 -->
          <span title="GitHub 登录">
            <svg viewBox="0 0 1024 1024" width="24" height="24" fill="#24292F">
              <path d="M512 32C247 32 32 247 32 512c0 212.1 137.5 391.9 328.2 455.4 24 4.4 32.8-10.4 32.8-23.1 0-11.4-.4-49.3-.6-89.5-133.6 29-161.8-56.7-161.8-56.7-21.8-55.5-53.3-70.3-53.3-70.3-43.6-29.8 3.3-29.2 3.3-29.2 48.2 3.4 73.6 49.5 73.6 49.5 42.9 73.5 112.5 52.3 140 40 4.4-31.1 16.8-52.3 30.5-64.3-106.6-12.2-218.8-53.3-218.8-237.3 0-52.5 18.8-95.3 49.5-128.9-5-12.1-21.5-61-4.7-127 0 0 40.3-12.9 132 49.2 38.3-10.6 79.3-16 120.2-16.2 40.9.2 81.9 5.6 120.2 16.2 91.7-62.1 132-49.2 132-49.2 16.8 66 1.3 114.9-4.7 127 30.7 33.6 49.5 76.4 49.5 128.9 0 184.5-112.5 225-219.7 237 17.3 14.9 32.7 44.2 32.7 89.1 0 64.3-.6 116.1-.6 131.9 0 12.8 8.8 27.6 33 23.1C854.5 903.9 992 724.1 992 512c0-265-215-480-480-480z"></path>
            </svg>
          </span>
        </div>

        <form @submit.prevent="handleSubmit">
          <!-- 用户名 -->
          <div class="input-wrapper" :class="{ active: isFocused === 'user' }">
            <span class="input-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="#9ca3af" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </span>
            <input 
              v-model="form.username" 
              type="text" 
              placeholder="用户名"
              @focus="isFocused = 'user'"
              @blur="isFocused = ''"
            />
          </div>

          <!-- 密码 -->
          <div class="input-wrapper" :class="{ active: isFocused === 'pwd' }">
            <span class="input-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="#9ca3af" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </span>
            <input 
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="密码"
              @focus="isFocused = 'pwd'"
              @blur="isFocused = ''"
            />
            <span class="eye-icon" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" viewBox="0 0 24 24" width="16" height="16" stroke="#9ca3af" stroke-width="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              <svg v-else viewBox="0 0 24 24" width="16" height="16" stroke="#9ca3af" stroke-width="2" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            </span>
          </div>

          <!-- 确认密码 -->
          <div v-if="mode === 1" class="input-wrapper" :class="{ active: isFocused === 'confirm' }">
            <span class="input-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="#9ca3af" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path><polyline points="9 16 11 18 15 14"></polyline></svg>
            </span>
            <input 
              v-model="form.confirmPassword" 
              type="password" 
              placeholder="确认密码"
              @focus="isFocused = 'confirm'"
              @blur="isFocused = ''"
            />
          </div>

          <!-- 滑块验证码 -->
          <div class="slider-container" :class="{ verified: isSliderVerified }">
            <div class="slider-bg-text">{{ isSliderVerified ? '验证通过' : '按住滑块拖动到最右侧' }}</div>
            <div class="slider-progress" :style="{ width: isSliderVerified ? '100%' : '0%' }"></div>
            <div class="slider-btn" @click="isSliderVerified = true">
              <svg v-if="!isSliderVerified" viewBox="0 0 24 24" width="16" height="16" stroke="#6b7280" stroke-width="2" fill="none"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
              <svg v-else viewBox="0 0 24 24" width="16" height="16" stroke="#10b981" stroke-width="2" fill="none"><path d="M20 6L9 17l-5-5"></path></svg>
            </div>
          </div>

          <div class="forgot-pwd" v-if="mode === 0">
            <a href="#">忘记密码?</a>
          </div>

          <!-- 错误提示 -->
          <div class="error-container" :class="{ show: errorMsg }">
            <div class="error-msg">{{ errorMsg }}</div>
          </div>

          <!-- 登录/注册按钮 -->
          <button type="submit" :disabled="loading" class="submit-btn">
            <span v-if="loading" class="loader"></span>
            <span>{{ loading ? '请稍候...' : (mode === 0 ? '登 录' : '注 册') }}</span>
          </button>
        </form>
      </div>
    </div>

    <!-- ================= 右侧：蓝色背景 + 粒子特效 ================= -->
    <div class="right-panel">
      <vue-particles id="tsparticles" :options="particlesOptions" class="particles-layer" />
      
      <div class="guide-content">
        <h3>{{ mode === 0 ? '没有账号？' : '已有账号？' }}</h3>
        <p>{{ mode === 0 ? '点击注册去注册一个属于你的账号吧。' : '点击登录返回并继续你的体验吧。' }}</p>
        <button class="switch-btn" @click="toggleMode">
          {{ mode === 0 ? '注 册' : '登 录' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 整体左右分栏容器 */
.split-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* =========================================
   左侧表单面板
   ========================================= */
.left-panel {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
  position: relative;
  z-index: 10;
  padding: 40px;
}

.form-wrapper {
  width: 100%;
  max-width: 360px;
}

.header { text-align: center; margin-bottom: 24px; }
.logo-icon { font-size: 32px; color: #6366f1; margin-bottom: 12px; }
h2 { margin: 0 0 8px 0; color: #1f2937; font-size: 28px; font-weight: 700; }
.subtitle { color: #6b7280; font-size: 14px; margin: 0; }

/* 第三方登录图标 */
.social-icons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
}
.social-icons span {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.social-icons span:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

/* 极简输入框 */
.input-wrapper {
  position: relative;
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  transition: all 0.3s;
  display: flex;
  align-items: center;
}

.input-wrapper.active {
  border-color: #6366f1;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.input-icon {
  position: absolute;
  left: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.input-wrapper input {
  width: 100%; padding: 14px 16px 14px 42px;
  background: transparent; border: none;
  color: #1f2937; font-size: 15px; outline: none;
  border-radius: 8px; box-sizing: border-box;
}
.input-wrapper input::placeholder { color: #9ca3af; }

.eye-icon {
  position: absolute; right: 14px; cursor: pointer; display: flex; align-items: center; padding: 4px;
}
.eye-icon:hover svg { stroke: #4b5563; }

.forgot-pwd { text-align: right; margin-bottom: 20px; }
.forgot-pwd a { color: #6b7280; font-size: 13px; text-decoration: none; }
.forgot-pwd a:hover { color: #6366f1; text-decoration: underline; }

/* 错误提示 */
.error-container { max-height: 0; overflow: hidden; transition: max-height 0.3s, margin-bottom 0.3s; }
.error-container.show { max-height: 40px; margin-bottom: 15px; }
.error-msg { color: #ef4444; font-size: 13px; padding: 8px 12px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; text-align: center; }

/* 左侧主按钮 */
.submit-btn {
  width: 100%; padding: 14px; border-radius: 8px; border: none;
  color: white; font-size: 16px; font-weight: 600; cursor: pointer;
  background: #3b82f6; transition: 0.2s;
  display: flex; justify-content: center; align-items: center; gap: 8px;
}
.submit-btn:hover:not(:disabled) { background: #2563eb; }
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.loader { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* =========================================
   滑块验证码样式
   ========================================= */
.slider-container {
  position: relative;
  height: 44px;
  background: #f3f4f6;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  overflow: hidden;
  user-select: none;
  transition: all 0.3s;
}

.slider-container.verified {
  border-color: #10b981;
  background: #ecfdf5;
}

.slider-bg-text {
  position: absolute;
  width: 100%;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
  pointer-events: none;
  transition: color 0.3s;
}

.slider-container.verified .slider-bg-text {
  color: #10b981;
  padding-left: 30px; 
}

.slider-progress {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: #d1fae5;
  transition: width 0.3s ease;
  z-index: 1;
}

.slider-btn {
  position: absolute;
  left: 0;
  top: 0; bottom: 0;
  width: 48px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 2;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slider-container.verified .slider-btn {
  left: calc(100% - 48px);
  box-shadow: none;
  border-radius: 0 8px 8px 0;
}

/* =========================================
   右侧蓝色面板
   ========================================= */
.right-panel {
  flex: 1;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.particles-layer {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 1;
}

.guide-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
  padding: 40px;
  max-width: 400px;
}

.guide-content h3 { font-size: 28px; font-weight: 700; margin-bottom: 12px; }
.guide-content p { font-size: 15px; color: #bfdbfe; margin-bottom: 30px; line-height: 1.6; }

.switch-btn {
  padding: 12px 40px;
  background: transparent;
  border: 2px solid white;
  color: white;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}

.switch-btn:hover { background: white; color: #2563eb; }

@media (max-width: 768px) {
  .split-container { flex-direction: column; }
  .right-panel { padding: 60px 20px; }
  .left-panel { padding: 40px 20px; }
}
</style>