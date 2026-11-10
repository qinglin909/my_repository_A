<!-- 个人中心：包含头像裁剪上传和配置菜单 -->
<template>
  <div class="page-container">
    <div class="bg-glow top-left"></div>
    <div class="bg-glow bottom-right"></div>

    <div class="profile-content">
      <!-- 头部卡片（复用全局 liquid-glass） -->
      <div class="liquid-glass header-card">
        <div class="avatar-wrapper" @click="handleAvatarClick">
          <div class="avatar">
            <img v-if="userStore.avatarUrl" :src="userStore.avatarUrl" alt="avatar" />
            <span v-else>👤</span>
          </div>
          <div class="edit-badge">📷</div>
        </div>

        <div class="user-info">
          <h1 class="username">{{ userStore.username || '晴明大人' }}</h1>
          <p class="user-title">
            <span class="badge">VIP {{ userStore.role === 'admin' ? '管理员' : '阴阳师' }}</span>
            <span class="uid">UID: 88239102</span>
          </p>
        </div>
      </div>

      <!-- 数据面板（复用全局 liquid-glass） -->
      <div class="liquid-glass stats-panel">
        <div class="stat-item">
          <span class="stat-value">128</span>
          <span class="stat-label">签到天数</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">36</span>
          <span class="stat-label">收集式神</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">9,500</span>
          <span class="stat-label">勾玉余额</span>
        </div>
      </div>

      <!-- 菜单列表（复用全局 liquid-glass） -->
      <div class="liquid-glass menu-list">
        <div class="menu-item">
          <div class="menu-left"><span class="icon">🎁</span><span class="text">我的福利</span></div>
          <span class="arrow">></span>
        </div>
        <button type="button" class="menu-item settings-menu-item" @click="openPasswordModal">
          <span class="menu-left"><span class="icon">⚙️</span><span class="text">账号设置 · 修改密码</span></span>
          <span class="arrow">›</span>
        </button>
        <div class="menu-item danger-item" @click="logout">
          <div class="menu-left"><span class="icon">🚪</span><span class="text">退出登录</span></div>
          <span class="arrow">></span>
        </div>
      </div>
    </div>

    <div v-if="showPasswordModal" class="settings-overlay" @click.self="closePasswordModal">
      <section class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
        <button class="settings-close" type="button" aria-label="关闭" @click="closePasswordModal">×</button>
        <span class="settings-kicker">账号安全</span>
        <h2 id="password-modal-title">修改登录密码</h2>
        <p class="settings-description">验证当前密码后更新密码；更新成功后需要重新登录。</p>
        <form @submit.prevent="changePassword">
          <label for="current-password">当前密码</label>
          <input id="current-password" v-model="passwordForm.currentPassword" type="password" autocomplete="current-password" required />
          <label for="new-password">新密码</label>
          <input id="new-password" v-model="passwordForm.newPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required />
          <label for="confirm-password">确认新密码</label>
          <input id="confirm-password" v-model="passwordForm.confirmPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required />
          <p v-if="passwordError" class="password-error" role="alert">{{ passwordError }}</p>
          <p v-if="passwordMessage" class="password-success" role="status">{{ passwordMessage }}</p>
          <div class="settings-actions">
            <button class="settings-cancel" type="button" @click="closePasswordModal">取消</button>
            <button class="settings-save" type="submit" :disabled="passwordLoading">{{ passwordLoading ? '提交中…' : '确认修改' }}</button>
          </div>
        </form>
      </section>
    </div>

    <ImageUploader ref="uploaderRef" @success="handleUploadSuccess" />
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ImageUploader from '@/components/ImageUploader.vue'

const router = useRouter()
const userStore = useUserStore()
const uploaderRef = ref(null)
const showPasswordModal = ref(false)
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordMessage = ref('')
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })

const openPasswordModal = () => {
  passwordError.value = ''
  passwordMessage.value = ''
  showPasswordModal.value = true
}
const closePasswordModal = () => {
  showPasswordModal.value = false
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordError.value = ''
}
const changePassword = async () => {
  passwordError.value = ''
  passwordMessage.value = ''
  if (passwordForm.newPassword.length < 8) {
    passwordError.value = '新密码至少需要 8 个字符。'
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = '两次输入的新密码不一致。'
    return
  }
  passwordLoading.value = true
  try {
    const token = userStore.token || localStorage.getItem('userToken')
    const response = await fetch('/api/account/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
    })
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/html')) throw new Error('API 返回了网页而不是 JSON：线上后端尚未部署改密接口，请先更新 API 服务器。')
    let result
    try { result = await response.json() } catch { throw new Error(`服务器返回格式异常 (${response.status})，请检查 API 后端部署。`) }
    if (!response.ok) throw new Error(result.message || '密码修改失败')
    passwordMessage.value = result.message || '密码更新成功。'
    userStore.logout()
    localStorage.removeItem('userToken')
    window.setTimeout(() => {
      closePasswordModal()
      router.replace('/login')
    }, 900)
  } catch (error) {
    passwordError.value = error.message || '密码修改失败，请稍后重试。'
  } finally {
    passwordLoading.value = false
  }
}

const handleAvatarClick = () => {
  if (uploaderRef.value) uploaderRef.value.triggerUpload()
}
const handleUploadSuccess = (newUrl) => {
  userStore.avatarUrl = newUrl
}
const logout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
/* 背景光晕保留 */
.bg-glow { position: absolute; width: 500px; height: 500px; border-radius: 50%; filter: blur(80px); z-index: 0; opacity: 0.6; }
.top-left { top: -100px; left: -150px; background: rgba(212, 175, 55, 0.15); }
.bottom-right { bottom: -100px; right: -150px; background: rgba(255, 182, 193, 0.15); }

/* 只需要管内容区，卡片直接使用了全局的 liquid-glass */
.profile-content { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

/* 头部 */
.header-card { display: flex; align-items: center; gap: 24px; padding: 30px; }
.avatar-wrapper { position: relative; width: 88px; height: 88px; border-radius: 50%; padding: 3px; background: linear-gradient(135deg, #f3e5ab, #d4af37, #b8860b); box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2); cursor: pointer; transition: transform 0.2s; }
.avatar-wrapper:hover { transform: scale(1.05); }
.avatar { width: 100%; height: 100%; border-radius: 50%; background: #fff; display: flex; justify-content: center; align-items: center; font-size: 40px; border: 2px solid #fff; overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.edit-badge { position: absolute; bottom: 0; right: 0; background: #d4af37; border-radius: 50%; width: 26px; height: 26px; display: flex; justify-content: center; align-items: center; font-size: 14px; border: 2px solid #fff; z-index: 2; }

.user-info { flex: 1; }
.username { color: #2c2c2c; font-size: 28px; font-weight: 600; margin: 0 0 10px 0; }
.user-title { display: flex; align-items: center; gap: 12px; margin: 0; }
.badge { background: linear-gradient(135deg, #f9f3df, #ecd38a); color: #8a6d1c; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.uid { color: #999; font-size: 13px; }

/* 数据面板 */
.stats-panel { display: flex; justify-content: space-between; align-items: center; padding: 24px; }
.stat-item { display: flex; flex-direction: column; align-items: center; flex: 1; }
.stat-value { color: #d4af37; font-size: 26px; font-weight: 700; margin-bottom: 6px; }
.stat-label { color: #888; font-size: 13px; font-weight: 500; }
.stat-divider { width: 1px; height: 36px; background: rgba(0, 0, 0, 0.06); }

/* 菜单 */
.menu-list { padding: 10px 0; }
.menu-item { display: flex; width: 100%; justify-content: space-between; align-items: center; padding: 20px 30px; border: 0; background: transparent; text-align: left; cursor: pointer; transition: all 0.2s; font: inherit; }
.menu-item:hover { background: rgba(0, 0, 0, 0.02); }
.menu-left { display: flex; align-items: center; gap: 16px; }
.menu-left .icon { font-size: 20px; }
.menu-left .text { color: #333; font-size: 16px; font-weight: 500; }
.arrow { color: #ccc; font-size: 16px; transition: transform 0.2s; }
.menu-item:hover .arrow { transform: translateX(4px); color: #d4af37; }
.danger-item .text { color: #ef4444; }
.settings-overlay { position: fixed; inset: 0; z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 20px; background: rgba(24, 20, 16, .48); backdrop-filter: blur(5px); }
.settings-modal { position: relative; width: min(440px, 100%); padding: 30px; border: 1px solid #eee3cc; border-radius: 18px; background: #fffdf8; box-shadow: 0 24px 70px rgba(37, 29, 18, .22); }
.settings-close { position: absolute; top: 12px; right: 15px; border: 0; background: transparent; color: #83796a; font-size: 26px; cursor: pointer; }
.settings-kicker { color: #a0782b; font-size: 11px; font-weight: 800; letter-spacing: .14em; }
.settings-modal h2 { margin: 7px 0; color: #2b261f; font-size: 22px; }
.settings-description { margin: 0 0 20px; color: #766e62; font-size: 13px; line-height: 1.65; }
.settings-modal label { display: block; margin: 13px 0 6px; color: #4e473d; font-size: 12px; font-weight: 700; }
.settings-modal input { width: 100%; box-sizing: border-box; padding: 11px 12px; border: 1px solid #ded7ca; border-radius: 8px; background: white; font: inherit; font-size: 14px; }
.settings-modal input:focus { outline: 3px solid rgba(174, 137, 61, .15); border-color: #aa873f; }
.password-error, .password-success { margin: 12px 0 0; font-size: 12px; line-height: 1.5; }
.password-error { color: #b42318; }
.password-success { color: #027a48; }
.settings-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 22px; }
.settings-cancel, .settings-save { padding: 10px 16px; border: 0; border-radius: 8px; font-weight: 700; cursor: pointer; }
.settings-cancel { background: #f1eee8; color: #514b41; }
.settings-save { background: #9a7425; color: white; }
.settings-save:disabled { opacity: .55; cursor: wait; }
</style>