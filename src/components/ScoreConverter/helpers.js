// 与状态无关的纯函数
export const fmt = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return Number.isInteger(number) ? String(number) : number.toFixed(1)
}

export const diffClass = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number) || number === 0) return 'neutral'
  return number > 0 ? 'positive' : 'negative'
}

export const inferSubjectFromText = (text) => {
  const value = String(text || '')
  if (/物理|理科|理工/.test(value)) return 'physics'
  if (/历史|文科/.test(value)) return 'history'
  return null
}
