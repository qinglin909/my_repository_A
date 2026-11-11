// 本地存储统一入口：所有读写都带 try/catch，避免隐私模式、配额耗尽、
// 存储被禁用等场景直接抛错把页面打挂。调用方拿到的永远是「值」或兜底值。

export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  NOTES: 'my_workspace_notes_v2',
  VAULT_LOCKED_UNTIL: 'vault_locked_until'
}

function getArea(session = false) {
  try {
    return session ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

/** 读取原始字符串；不存在或不可用时返回 null */
export function readRaw(key, { session = false } = {}) {
  try {
    return getArea(session)?.getItem(key) ?? null
  } catch {
    return null
  }
}

/** 写入原始字符串；返回是否成功 */
export function writeRaw(key, value, { session = false } = {}) {
  try {
    getArea(session)?.setItem(key, value)
    return true
  } catch {
    return false
  }
}

/** 删除一个键；静默失败 */
export function removeRaw(key, { session = false } = {}) {
  try {
    getArea(session)?.removeItem(key)
  } catch {
    // 忽略：存储不可用时无需向上冒泡
  }
}

/** 读取并按 JSON 解析；缺失、空串、坏数据一律返回 fallback */
export function readJSON(key, fallback = null, options = {}) {
  const text = readRaw(key, options)
  if (text === null || text === '') return fallback
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

/** 序列化后写入；返回是否成功 */
export function writeJSON(key, value, options = {}) {
  return writeRaw(key, JSON.stringify(value), options)
}

// ---- 登录凭证：全站统一从这里取，避免各处硬编码 key ----
export const getToken = () => readRaw(STORAGE_KEYS.USER_TOKEN) || ''
export const setToken = (token) => writeRaw(STORAGE_KEYS.USER_TOKEN, token)
export const clearToken = () => removeRaw(STORAGE_KEYS.USER_TOKEN)
