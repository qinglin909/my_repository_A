import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const username = ref('')
  const role = ref('user') // user 或 admin

  const isLoggedIn = computed(() => !!token.value)

  const login = (userToken, userName, userRole = 'user') => {
    token.value = userToken
    username.value = userName
    role.value = userRole
  }

  const logout = () => {
    token.value = ''
    username.value = ''
    role.value = 'user'
  }

  return { token, username, role, isLoggedIn, login, logout }
}, {
  // 🚨 自动持久化：这样刷新页面状态也不会丢
  persist: true
})