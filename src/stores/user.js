import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const username = ref('')
  const role = ref('user') // user 或 admin
  const vip = ref(false)
  const vipExpiresAt = ref(null)

  const isLoggedIn = computed(() => !!token.value)

  // 会员判定：永久会员标记 || 未过期的会员时间 || root 兜底。
  // root 兜底是为了线上后端还没升级、登录接口不返回 vip 字段时，站点所有者依旧能进会员模块。
  const isVip = computed(() => {
    if (vip.value === true) return true
    if (vipExpiresAt.value) {
      const expiresAt = Date.parse(vipExpiresAt.value)
      if (Number.isFinite(expiresAt) && expiresAt > Date.now()) return true
    }
    return username.value === 'root'
  })

  const login = (userToken, userName, userRole = 'user', membership = {}) => {
    token.value = userToken
    username.value = userName
    role.value = userRole
    vip.value = membership.vip === true
    vipExpiresAt.value = membership.vipExpiresAt || null
  }

  const logout = () => {
    token.value = ''
    username.value = ''
    role.value = 'user'
    vip.value = false
    vipExpiresAt.value = null
  }

  return { token, username, role, vip, vipExpiresAt, isLoggedIn, isVip, login, logout }
}, {
  // 🚨 自动持久化：这样刷新页面状态也不会丢
  persist: true
})
