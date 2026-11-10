// 会员账号（VIP）套餐档位。
// 金额统一用「分」存整数，避免浮点误差；展示时再换算成元。
// 规则：月付档 = 每月单价 × 月数；日体验档为固定总价。
export const VIP_PLANS = [
  {
    id: '2y',
    label: '2 年',
    months: 24,
    unitPriceCents: 990,
    badge: '最划算'
  },
  {
    id: '1y',
    label: '1 年',
    months: 12,
    unitPriceCents: 1990
  },
  {
    id: '3m',
    label: '3 个月',
    months: 3,
    unitPriceCents: 2990
  },
  {
    id: '1m',
    label: '1 个月',
    months: 1,
    unitPriceCents: 3990
  },
  {
    id: '1d',
    label: '1 日体验',
    days: 1,
    priceCents: 300
  }
].map((plan) => {
  const totalCents = plan.priceCents ?? plan.unitPriceCents * plan.months
  return {
    ...plan,
    totalCents,
    // 日体验没有“每月单价”，这里给 null，UI 直接展示总价
    unitPriceCents: plan.unitPriceCents ?? null,
    summary: plan.days
      ? `${plan.days} 天 · 一次性体验价`
      : `${plan.months} 个月 · 折合 ${formatYuan(plan.unitPriceCents)}/月`
  }
})

export const VIP_PRODUCT = {
  id: 'vip-account',
  title: '账号 VIP',
  tag: '会员',
  description: '解锁全部会员功能，按月计费，买得越久单价越低。',
  plans: VIP_PLANS
}

export function formatYuan(cents) {
  const value = Number(cents)
  if (!Number.isFinite(value)) return '—'
  return `¥${(value / 100).toFixed(2)}`
}

export function getPlan(id) {
  return VIP_PLANS.find((plan) => plan.id === id) || VIP_PLANS[0]
}
