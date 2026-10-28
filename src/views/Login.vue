<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const mode = ref(0) 
const form = reactive({ username: '', password: '', confirmPassword: '' })
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const isFocused = ref('')

// 粒子特效配置 - 调整为深色粒子适配浅色背景
const particlesOptions = {
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  interactivity: {
    events: {
      onHover: { enable: true, mode: "grab" },
      onClick: { enable: true, mode: "push" },
    },
    modes: {
      grab: { distance: 140, links: { opacity: 0.5 } },
      push: { quantity: 3 },
    },
  },
  particles: {
    color: { value: "#6366f1" }, // 粒子颜色改为品牌色
    links: {
      color: "#6366f1", // 连线颜色改为品牌色
      distance: 150,
      enable: true,
      opacity: 0.1,
      width: 1,
    },
    move: {
      enable: true,
      speed: 1.5,
      direction: "none",
      random: false,
      straight: false,
      outModes: { default: "bounce" },
    },
    number: { density: { enable: true, area: 800 }, value: 40 },
    opacity: { value: 0.3 },
    shape: { type: "circle" },
    size: { value: { min: 1, max: 3 } },
  },
  detectRetina: true,
}

const toggleMode = () => {
  mode.value = mode.value === 0 ? 1 : 0
  form.username = ''
  form.password = ''
  form.confirmPassword = ''
  errorMsg.value = ''
}

const handleSubmit = async () => {
  errorMsg.value = ''
  if (form.username.length < 3) return errorMsg.value = '用户名至少需要3个字符'
  if (form.password.length < 6) return errorMsg.value = '密码不能少于6位'
  if (mode.value === 1 && form.password !== form.confirmPassword) return errorMsg.value = '两次输入的密码不一致'

  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 800)) 
    localStorage.setItem('userToken', 'fake-jwt-token-12345')
    router.push('/todo')
  } catch (err) {
    errorMsg.value = '网络错误，请稍后再试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="premium-container">
    <!-- 动态极光背景 -->
    <div class="aurora-bg">
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>
      <div class="glow glow-3"></div>
    </div>

    <!-- 粒子特效 -->
    <vue-particles id="tsparticles" :options="particlesOptions" class="particles-layer" />

    <!-- 毛玻璃登录框 -->
    <div class="login-box">
      <div class="header">
        <div class="logo-icon">✦</div>
        <h2>{{ mode === 0 ? '欢迎回来' : '创建账号' }}</h2>
        <p class="subtitle">{{ mode === 0 ? '输入您的凭据以继续' : '注册以开启您的专属空间' }}</p>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="input-group">
          <label>用户名</label>
          <div class="input-wrapper" :class="{ active: isFocused === 'user' }">
            <input 
              v-model="form.username" 
              type="text" 
              placeholder="请输入用户名"
              @focus="isFocused = 'user'"
              @blur="isFocused = ''"
            />
          </div>
        </div>

        <div class="input-group">
          <label>密码</label>
          <div class="input-wrapper" :class="{ active: isFocused === 'pwd' }">
            <input 
              v-model="form.password" 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="请输入密码"
              @focus="isFocused = 'pwd'"
              @blur="isFocused = ''"
            />
            <span class="eye-icon" @click="showPassword = !showPassword">
              {{ showPassword ? '隐藏' : '显示' }}
            </span>
          </div>
        </div>

        <div v-if="mode === 1" class="input-group">
          <label>确认密码</label>
          <div class="input-wrapper" :class="{ active: isFocused === 'confirm' }">
            <input 
              v-model="form.confirmPassword" 
              type="password" 
              placeholder="请再次输入密码"
              @focus="isFocused = 'confirm'"
              @blur="isFocused = ''"
            />
          </div>
        </div>

        <div class="error-container" :class="{ show: errorMsg }">
          <div class="error-msg">{{ errorMsg }}</div>
        </div>

        <button type="submit" :disabled="loading" class="submit-btn">
          <span v-if="loading" class="loader"></span>
          <span>{{ loading ? '请稍候...' : (mode === 0 ? '登 录' : '注 册') }}</span>
        </button>
      </form>

      <div class="switch-mode">
        <span @click="toggleMode">{{ mode === 0 ? '没有账号？创建一个' : '已有账号？去登录' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.premium-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  /* 背景改为清爽的浅蓝白渐变 */
  background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* 极光背景层 */
.aurora-bg {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  overflow: hidden;
  z-index: 1;
}

/* 粒子特效层 */
.particles-layer {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 2;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px); /* 稍微增加模糊度，让光晕更柔和 */
  opacity: 0.5; /* 降低一点透明度，避免在浅色背景上太突兀 */
  animation: float 12s infinite ease-in-out alternate;
}

/* 极光颜色调整为更清新的色调 */
.glow-1 { width: 500px; height: 500px; background: #a5b4fc; top: -10%; left: -10%; }
.glow-2 { width: 400px; height: 400px; background: #fbcfe8; bottom: -10%; right: -10%; animation-duration: 15s; animation-delay: -5s; }
.glow-3 { width: 300px; height: 300px; background: #bae6fd; top: 40%; left: 40%; animation-duration: 10s; animation-delay: -2s; }

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(50px, 30px) scale(1.1); }
  100% { transform: translate(-30px, 60px) scale(0.9); }
}

/* 毛玻璃登录框 - 改为浅色毛玻璃 */
.login-box {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 48px 40px;
  border-radius: 24px;
  /* 背景改为半透明白色 */
  background: rgba(255, 255, 255, 0.75); 
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  /* 边框改为浅色 */
  border: 1px solid rgba(255, 255, 255, 0.6);
  /* 阴影改为柔和的深色阴影，增加层次感 */
  box-shadow: 0 30px 60px -12px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.header { text-align: center; margin-bottom: 36px; }
.logo-icon { 
  font-size: 32px; 
  color: #6366f1; /* Logo图标改为品牌色 */
  margin-bottom: 12px; 
  text-shadow: 0 0 20px rgba(99, 102, 241, 0.3); 
}
h2 { 
  margin: 0 0 8px 0; 
  color: #1e293b; /* 标题改为深灰黑色 */
  font-size: 28px; 
  font-weight: 600; 
  letter-spacing: -0.5px; 
}
.subtitle { 
  color: #64748b; /* 副标题改为中灰色 */
  font-size: 14px; 
  margin: 0; 
}

.input-group { margin-bottom: 20px; }
.input-group label { 
  display: block; 
  margin-bottom: 8px; 
  color: #475569; /* 标签改为深灰色 */
  font-size: 13px; 
  font-weight: 500; 
}

.input-wrapper {
  position: relative;
  border-radius: 12px;
  /* 边框改为浅灰色 */
  border: 1px solid #e2e8f0;
  /* 背景改为极浅的灰白色 */
  background: #f8fafc;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-wrapper.active {
  border-color: #6366f1;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.input-wrapper input {
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: none;
  /* 输入文字改为深黑色 */
  color: #0f172a;
  font-size: 15px;
  outline: none;
  border-radius: 12px;
  box-sizing: border-box;
}

.input-wrapper input::placeholder { 
  color: #94a3b8; /* 占位符改为浅灰色 */
}

.eye-icon {
  position: absolute;
  right: 16px; top: 50%; transform: translateY(-50%);
  cursor: pointer; 
  font-size: 13px; 
  color: #94a3b8; /* 眼睛图标改为中灰色 */
  user-select: none; 
  transition: color 0.2s;
}
.eye-icon:hover { color: #6366f1; }

.error-container {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out, margin-bottom 0.3s;
  margin-bottom: 0;
}
.error-container.show { max-height: 40px; margin-bottom: 15px; }
.error-msg {
  color: #ef4444; 
  font-size: 13px; 
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.08); 
  border-radius: 8px; 
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.submit-btn {
  position: relative; 
  width: 100%; 
  padding: 14px; 
  border-radius: 12px; 
  border: none;
  color: white; 
  font-size: 16px; 
  font-weight: 600; 
  cursor: pointer; 
  overflow: hidden;
  display: flex; 
  justify-content: center; 
  align-items: center; 
  gap: 8px;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  background-size: 200% 200%;
  transition: 0.3s, transform 0.1s;
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3);
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(168, 85, 247, 0.4); }
.submit-btn:active:not(:disabled) { transform: translateY(0); }
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; animation: none; }

.loader {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.switch-mode { text-align: center; margin-top: 24px; }
.switch-mode span { 
  color: #64748b; /* 切换文字改为中灰色 */
  cursor: pointer; 
  font-size: 14px; 
  transition: color 0.2s; 
}
.switch-mode span:hover { 
  color: #6366f1; /* hover时变为品牌色 */
  text-decoration: underline; 
}
</style>