<!--
  云同步账号入口：放在顶部导航栏，管理 Supabase Auth 登录态。
  与站点原有的「自建登录」相互独立：
    - 自建登录：控制站内模块访问（VIP、账单 API 等），照旧不变。
    - 云同步登录：只决定数据是否收发到 Supabase，没登录就全部走本地。
-->
<template>
  <div class="cloud-badge-wrap" @click.stop>
    <button
      type="button"
      class="cloud-badge"
      :class="{ online: cloudUser, offline: !cloudUser }"
      @click="open = !open"
      :title="cloudUser ? `云同步已开启：${cloudUser.email}` : '云同步未开启（数据仅存本机）'"
    >
      <span class="dot"></span>
      <span class="label">{{ cloudUser ? '云同步' : '仅本机' }}</span>
    </button>

    <transition name="fade">
      <div class="cloud-panel liquid-glass" v-if="open">
        <template v-if="cloudUser">
          <div class="panel-head">
            <span class="panel-icon">☁️</span>
            <div>
              <p class="panel-title">云同步已开启</p>
              <p class="panel-email">{{ cloudUser.email }}</p>
            </div>
          </div>
          <p class="panel-tip">笔记、导航、账单、分数规则会自动在多设备间同步。</p>
          <button type="button" class="panel-btn ghost" @click="doSignOut">关闭云同步</button>
        </template>

        <template v-else>
          <div class="panel-head">
            <span class="panel-icon">☁️</span>
            <div>
              <p class="panel-title">开启云同步</p>
              <p class="panel-email">登录后可换设备继续使用数据</p>
            </div>
          </div>
          <p class="panel-tip">用邮箱注册一个云同步账号。数据按账号隔离，只有你自己能读。</p>

          <form @submit.prevent="submit" class="cloud-form">
            <input v-model="email" type="email" placeholder="邮箱" autocomplete="email" required />
            <input v-model="password" type="password" :placeholder="mode === 'up' ? '设置密码（至少6位）' : '密码'" autocomplete="current-password" required />
            <p v-if="err" class="err">{{ err }}</p>
            <p v-if="info" class="info">{{ info }}</p>
            <button type="submit" class="panel-btn solid" :disabled="loading">
              {{ loading ? '请稍候…' : (mode === 'up' ? '注册并开启' : '登录并开启') }}
            </button>
          </form>
          <button type="button" class="switch-mode" @click="switchMode">
            {{ mode === 'up' ? '已有账号？登录' : '没有账号？注册' }}
          </button>
        </template>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import {
  getCloudUser, getMyProfile, signInCloud, signUpCloud, signOutCloud, onCloudAuthChange
} from '@/utils/cloudDb'

const userStore = useUserStore()

const cloudUser = ref(null)
const open = ref(false)
const mode = ref('in') // in = 登录, up = 注册
const email = ref('')
const password = ref('')
const loading = ref(false)
const err = ref('')
const info = ref('')

let unsubscribe = null

async function syncProfile() {
  const profile = await getMyProfile()
  if (profile) userStore.applyCloudProfile(profile)
  else userStore.clearCloudProfile()
}

onMounted(async () => {
  cloudUser.value = await getCloudUser()
  if (cloudUser.value) await syncProfile()
  unsubscribe = onCloudAuthChange(async (user) => {
    cloudUser.value = user
    if (user) await syncProfile()
    else userStore.clearCloudProfile()
  })
})

const switchMode = () => {
  mode.value = mode.value === 'in' ? 'up' : 'in'
  err.value = ''
  info.value = ''
}

const submit = async () => {
  err.value = ''
  info.value = ''
  if (password.value.length < 6) {
    err.value = '密码至少 6 位'
    return
  }
  loading.value = true
  try {
    if (mode.value === 'up') {
      const { data, error } = await signUpCloud(email.value.trim(), password.value)
      if (error) throw error
      // 若项目开启了邮箱验证，session 为空，需提示去邮箱确认
      if (!data.session) {
        info.value = '注册成功！请先去邮箱点击确认链接，再回来登录。'
        mode.value = 'in'
        return
      }
      cloudUser.value = data.user
    } else {
      const { data, error } = await signInCloud(email.value.trim(), password.value)
      if (error) throw error
      cloudUser.value = data.user
    }
    open.value = false
    password.value = ''
    await syncProfile()
    // 通知各页面重新从云端拉取数据
    window.dispatchEvent(new CustomEvent('cloud-auth-changed'))
  } catch (e) {
    err.value = e?.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}

const doSignOut = async () => {
  await signOutCloud()
  cloudUser.value = null
  userStore.clearCloudProfile()
  open.value = false
  window.dispatchEvent(new CustomEvent('cloud-auth-changed'))
}
</script>

<style scoped>
.cloud-badge-wrap { position: relative; }
.cloud-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 12px; border-radius: 999px; cursor: pointer;
  font-size: 12px; font-weight: 700; border: 1px solid var(--border-color);
  background: #fff; color: #64748b; transition: all .2s;
}
.cloud-badge .dot { width: 7px; height: 7px; border-radius: 50%; background: #cbd5e1; }
.cloud-badge.online { color: #0f8a5f; border-color: #a7e8cb; background: #ecfdf5; }
.cloud-badge.online .dot { background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.15); }
.cloud-badge:hover { border-color: var(--primary-color); }

.cloud-panel {
  position: absolute; right: 0; top: calc(100% + 12px);
  width: 290px; padding: 18px; border-radius: 14px; z-index: 2000;
  box-shadow: 0 12px 40px rgba(0,0,0,.12); border: 1px solid rgba(255,255,255,.7);
  background: rgba(255,255,255,.96); backdrop-filter: blur(20px);
}
.panel-head { display: flex; gap: 12px; align-items: center; margin-bottom: 10px; }
.panel-icon { font-size: 26px; }
.panel-title { margin: 0 0 2px; font-weight: 800; font-size: 15px; color: var(--text-main); }
.panel-email { margin: 0; font-size: 12px; color: var(--text-secondary); word-break: break-all; }
.panel-tip { font-size: 12px; line-height: 1.6; color: var(--text-secondary); margin: 0 0 14px; }
.cloud-form { display: flex; flex-direction: column; gap: 9px; }
.cloud-form input {
  padding: 10px 12px; border: 1px solid #dbe1e8; border-radius: 9px;
  font-size: 13px; outline: none; background: #fff;
}
.cloud-form input:focus { border-color: var(--primary-color); }
.panel-btn { width: 100%; padding: 10px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; }
.panel-btn.solid { background: var(--primary-color); color: #fff; }
.panel-btn.solid:disabled { opacity: .6; }
.panel-btn.ghost { background: #f1f5f9; color: #475569; }
.switch-mode { display: block; width: 100%; text-align: center; background: none; border: none; color: var(--primary-color); font-size: 12px; cursor: pointer; margin-top: 12px; }
.err { color: #dc2626; font-size: 12px; margin: 0; }
.info { color: #0f8a5f; font-size: 12px; margin: 0; line-height: 1.5; }
.fade-enter-active, .fade-leave-active { transition: opacity .18s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@media (max-width: 768px) { .cloud-badge .label { display: none; } .cloud-panel { right: -10px; } }
</style>
