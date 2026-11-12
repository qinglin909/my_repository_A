// 图表通用坐标、刻度与路径工具（纯函数，供 ScoreConverter/charts 下各图共用）
export const CHART_BOX = { width: 720, height: 340, left: 58, right: 700, top: 22, bottom: 272 }
export const PLOT_W = CHART_BOX.right - CHART_BOX.left
export const PLOT_H = CHART_BOX.bottom - CHART_BOX.top

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const scaleLinear = (domain, range) => {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0 || 1
  return (value) => r0 + ((value - d0) / span) * (r1 - r0)
}

export const invertLinear = (domain, range, pixel) => {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = r1 - r0 || 1
  return d0 + ((pixel - r0) / span) * (d1 - d0)
}

export function niceTicks(min, max, count = 6) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return []
  const raw = (max - min) / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag
  const ticks = []
  for (let value = Math.ceil(min / step) * step; value <= max + step * 0.0001; value += step) {
    ticks.push(Number(value.toFixed(6)))
  }
  return ticks
}

export const linePath = (points) =>
  points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')

export const fmtNum = (value, digits = 0) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return String(Number(number.toFixed(digits)))
}

export const signed = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return `${number >= 0 ? '+' : ''}${fmtNum(number, 1)}`
}

// 把鼠标事件换算成 viewBox 内的 x 坐标（SVG 用 width:100% 自适应，需要按实际宽度还原）
export const svgX = (event, svgEl) => {
  if (!svgEl) return null
  const rect = svgEl.getBoundingClientRect()
  if (!rect.width) return null
  return ((event.clientX - rect.left) / rect.width) * CHART_BOX.width
}
