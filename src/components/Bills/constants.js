// 月度收支登记：类别、预设、配色与格式化工具

export const EXPENSE_CATEGORIES = [
  '通讯网络', '生活缴费', '订阅会员', '居住房租', '交通出行',
  '保险', '学习教育', '债务还款', '娱乐', '其他支出'
]

export const INCOME_CATEGORIES = ['主职收入', '副业兼职', '投资理财', '租金收入', '其他收入']

export const TYPE_OPTIONS = [
  { value: 'expense', label: '支出' },
  { value: 'income', label: '收入' }
]

export const PRESETS = [
  { name: '宽带', amount: 79, category: '通讯网络', dayOfMonth: 1 },
  { name: '电话卡', amount: 29, category: '通讯网络', dayOfMonth: 5 },
  { name: '视频会员', amount: 25, category: '订阅会员', dayOfMonth: 12 }
]

export const PALETTE = [
  '#9b2028', '#c9535a', '#e8948f', '#f2c1bb', '#b4762a', '#d8a24e',
  '#3d6b52', '#6c9a82', '#3a5a8c', '#7c93c4', '#6b4f8c', '#9a7cc4'
]

export function categoriesOf(type) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

export function money(value) {
  const num = Number(value) || 0
  const text = Math.abs(num) % 1 === 0 ? Math.abs(num).toFixed(0) : Math.abs(num).toFixed(2)
  return (num < 0 ? '-' : '') + '¥' + text
}
