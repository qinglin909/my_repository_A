// 金额格式化。两个函数入参单位不同，不能混用：
// formatYuan 收「分」（套餐数据），formatPrice 收「元」（商品接口返回值）。

/** 分 → ¥元，两位小数；非法值显示破折号 */
export function formatYuan(cents) {
  const value = Number(cents)
  if (!Number.isFinite(value)) return '—'
  return `¥${(value / 100).toFixed(2)}`
}

/** 元 → ¥元，两位小数；非法值提示补充价格 */
export function formatPrice(price) {
  const amount = Number(price)
  return Number.isFinite(amount) ? `¥${amount.toFixed(2)}` : '价格待补充'
}
