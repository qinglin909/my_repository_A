// 日期展示纯函数集中地。
// 注意：项目里原来有两个同名 formatDate 但语义不同，这里按用途分别命名，
// 调用处可用 `import { formatDateKey as formatDate }` 保持模板零改动。

/** YYYY-MM-DD，用作日期键 / 接口参数（日历页） */
export function formatDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** M月D日，用于笔记列表的时间标签 */
export function formatShortDate(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

/** 2026年11月11日 形式 */
export function formatLongDate(date = new Date()) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
}

/** 星期几，中文长格式 */
export function formatWeekday(date = new Date()) {
  return new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(date)
}

/** 按当前小时返回问候语 */
export function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 6) return '夜深了'
  if (hour < 11) return '早安'
  if (hour < 14) return '午安'
  if (hour < 18) return '下午好'
  return '晚上好'
}
