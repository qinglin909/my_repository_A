// ============================================================
// 统一云数据访问层
// 所有视图都通过这里读写 Supabase，不直接碰 supabase.from()。
// 设计要点：
//   1. 云同步账号（Supabase Auth）与站点原有自建登录【互不干扰】。
//      只有用邮箱登录了「云同步账号」，数据才会上传云端；否则走本地回退。
//   2. 每条记录自动注入 owner_id = 当前用户 uid，配合 RLS 做到账号隔离。
//   3. 表未建好 / 未登录 / 网络异常时统一降级，返回 offline 标记，
//      调用方据此回退到 localStorage，页面永不崩。
// ============================================================
import { supabase } from './supabase'

// ---------- 云登录状态 ----------
export async function getCloudUser() {
  try {
    const { data } = await supabase.auth.getUser()
    return data?.user || null
  } catch {
    return null
  }
}

export async function isCloudReady() {
  return !!(await getCloudUser())
}

// 云同步账号的注册 / 登录 / 退出
export async function signUpCloud(email, password) {
  return supabase.auth.signUp({ email, password })
}

export async function signInCloud(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOutCloud() {
  return supabase.auth.signOut()
}

// 订阅登录状态变化：cb(user | null)
export function onCloudAuthChange(cb) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session?.user || null)
  })
  return () => subscription.unsubscribe()
}

// 判断一个错误是否属于「可以安全降级」的类型
function isDegradable(error) {
  if (!error) return false
  const code = String(error.code || '')
  const msg = String(error.message || '')
  // 42P01 = 表不存在；42501 = RLS 拒绝；PGRST205 = 找不到表
  return ['42P01', '42501', 'PGRST205', 'PGRST116'].includes(code)
    || /relation .* does not exist|schema cache|row-level security|not found/i.test(msg)
}

function offlineResult(reason) {
  return { ok: false, offline: true, data: null, error: reason }
}

async function withOwner(fn) {
  const user = await getCloudUser()
  if (!user) return { __offline: true }
  try {
    return await fn(user.id)
  } catch (err) {
    if (isDegradable(err)) return { __offline: true }
    return { __error: err }
  }
}

// ---------- 通用 CRUD ----------
/** 读取某表的全部行（按 owner 隔离由 RLS 保证，这里仍显式过滤以便未开 RLS 时安全） */
export async function listRows(table, columns = '*') {
  const r = await withOwner(async (uid) => {
    const { data, error } = await supabase.from(table).select(columns).eq('owner_id', uid)
    if (error) throw error
    return data || []
  })
  if (r.__offline) return offlineResult('offline')
  if (r.__error) return { ok: false, offline: false, data: null, error: r.__error }
  return { ok: true, offline: false, data: r, error: null }
}

/** 批量/单条插入或更新（upsert），自动注入 owner_id */
export async function upsertRows(table, rows, { onConflict } = {}) {
  const arr = Array.isArray(rows) ? rows : [rows]
  if (!arr.length) return { ok: true, offline: false, data: [], error: null }
  const r = await withOwner(async (uid) => {
    const withOwnerId = arr.map((row) => ({ ...row, owner_id: uid }))
    const { data, error } = await supabase
      .from(table)
      .upsert(withOwnerId, onConflict ? { onConflict } : undefined)
      .select()
    if (error) throw error
    return data || []
  })
  if (r.__offline) return offlineResult('offline')
  if (r.__error) return { ok: false, offline: false, data: null, error: r.__error }
  return { ok: true, offline: false, data: r, error: null }
}

/** 按 id 删除 */
export async function deleteRow(table, id) {
  const r = await withOwner(async (uid) => {
    const { error } = await supabase.from(table).delete().eq('id', id).eq('owner_id', uid)
    if (error) throw error
    return true
  })
  if (r.__offline) return offlineResult('offline')
  if (r.__error) return { ok: false, offline: false, data: null, error: r.__error }
  return { ok: true, offline: false, data: true, error: null }
}

// ---------- 单人单份配置（score_rules / rank_tables 用 owner_id 作主键）----------
export async function readConfig(table) {
  const r = await withOwner(async (uid) => {
    const { data, error } = await supabase.from(table).select('payload').eq('owner_id', uid).maybeSingle()
    if (error) throw error
    return data?.payload ?? null
  })
  if (r.__offline) return offlineResult('offline')
  if (r.__error) return { ok: false, offline: false, data: null, error: r.__error }
  return { ok: true, offline: false, data: r, error: null }
}

export async function writeConfig(table, payload) {
  const r = await withOwner(async (uid) => {
    const { error } = await supabase
      .from(table)
      .upsert({ owner_id: uid, payload, updated_at: new Date().toISOString() }, { onConflict: 'owner_id' })
    if (error) throw error
    return true
  })
  if (r.__offline) return offlineResult('offline')
  if (r.__error) return { ok: false, offline: false, data: null, error: r.__error }
  return { ok: true, offline: false, data: true, error: null }
}

// ---------- 用户资料 / VIP ----------
/** 读取当前云账号的资料（含 vip / role）。未登录或表不存在返回 null。 */
export async function getMyProfile() {
  const user = await getCloudUser()
  if (!user) return null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, username, role, vip, vip_expires_at, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
    if (error) return null
    return data
  } catch {
    return null
  }
}

// ---------- 顶层状态：供 UI 显示「云同步」在线/离线 ----------
export const cloudState = {
  ready: false,
  email: ''
}

export async function refreshCloudState() {
  const user = await getCloudUser()
  cloudState.ready = !!user
  cloudState.email = user?.email || ''
  return user
}
