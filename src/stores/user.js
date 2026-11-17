import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const username = ref('')
  const role = ref('user') // user 或 admin
  const vip = ref(false)
  const vipExpiresAt = ref(null)

  // 云同步账号（Supabase Auth）的会员信息；与自建登录并存，互不覆盖
  const cloudVip = ref(false)
  const cloudVipExpiresAt = ref(null)
  const cloudEmail = ref('')
  const cloudRole = ref('user')

  const isLoggedIn = computed(() => !!token.value)
  const isCloudLoggedIn = computed(() => !!cloudEmail.value)

  // 会员判定：永久会员标记 || 未过期的会员时间 || root 兜底。
  // root 兜底是为了线上后端还没升级、登录接口不返回 vip 字段时，站点所有者依旧能进会员模块。
  const notExpired = (value) => {
    if (!value) return false
    const t = Date.parse(value)
    return Number.isFinite(t) && t > Date.now()
  }
  const isVip = computed(() => {
    // 自建登录会员
    if (vip.value === true || notExpired(vipExpiresAt.value)) return true
    // 云同步账号会员
    if (cloudVip.value === true || notExpired(cloudVipExpiresAt.value)) return true
    return username.value === 'root'
  })

  const login = (userToken, userName, userRole = 'user', membership = {}) => {
    token.value = userToken
    username.value = userName
    role.value = userRole
    vip.value = membership.vip === true
    vipExpiresAt.value = membership.vipExpiresAt || null
  }

  // 静默校验 /api/me 后同步最新会员信息
  const applyMembership = (user = {}) => {
    if (user.username) username.value = user.username
    if (user.role) role.value = user.role
    if (typeof user.vip === 'boolean') vip.value = user.vip
    vipExpiresAt.value = user.vipExpiresAt || null
  }

  // 同步云账号资料（注册/登录/资料变化时调用）
  const applyCloudProfile = (profile = {}) => {
    cloudEmail.value = profile.email || ''
    cloudRole.value = profile.role || 'user'
    cloudVip.value = profile.vip === true
    cloudVipExpiresAt.value = profile.vip_expires_at || null
  }

  const clearCloudProfile = () => {
    cloudEmail.value = ''
    cloudRole.value = 'user'
    cloudVip.value = false
    cloudVipExpiresAt.value = null
  }

  const logout = () => {
    token.value = ''
    username.value = ''
    role.value = 'user'
    vip.value = false
    vipExpiresAt.value = null
  }

  return {
    token, username, role, vip, vipExpiresAt,
    cloudVip, cloudVipExpiresAt, cloudEmail, cloudRole,
    isLoggedIn, isCloudLoggedIn, isVip,
    login, logout, applyMembership, applyCloudProfile, clearCloudProfile
  }
}, {
  // 🚨 自动持久化：这样刷新页面状态也不会丢
  persist: true
})
